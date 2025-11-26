import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { leaderboardApi, LeaderboardEntry } from '../../../src/services/api/userService';
import { getCurrentUserProfileWithAutoRefresh } from '../../../src/services/api/userService';

const { width } = Dimensions.get('window');

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  trend: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

export default function Leaderboard() {
  const auth = useAuth();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'all'>('today');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('User');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);

  // Load current user info
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUserProfileWithAutoRefresh();
        setCurrentUserId(user._id || null);
        setCurrentUserName(user.fullName || user.name || 'User');
        setCurrentUserAvatar(user.avatar);
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // Load leaderboard data
  const loadLeaderboard = async (filter: 'today' | 'week' | 'all') => {
    try {
      setLoading(true);
      
      const now = new Date();
      let params: any = {
        page: 1,
        limit: 100,
      };

      // Map filter to API parameters
      if (filter === 'today') {
        // Today = current month
        params.month = now.getMonth() + 1; // 1-12
        params.year = now.getFullYear();
      } else if (filter === 'week') {
        // Week = current month (API doesn't have week filter, use current month)
        params.month = now.getMonth() + 1;
        params.year = now.getFullYear();
      } else {
        // All = no month/year filter, get all
        // Or use current month as default
        params.month = now.getMonth() + 1;
        params.year = now.getFullYear();
      }

      console.log('📊 Loading leaderboard with params:', params);
      const response = await leaderboardApi.getMonthly(params);
      
      console.log('📊 Leaderboard response:', response);

      // Map API data to LeaderboardUser format
      const mappedData: LeaderboardUser[] = response.data.map((entry: LeaderboardEntry) => {
        const customer = entry.customerId;
        const isCurrentUser = currentUserId && customer._id === currentUserId;
        
        return {
          id: entry._id,
          name: customer.fullName || 'Unknown User',
          username: customer.phone || customer._id.substring(0, 8),
          avatar: undefined, // API doesn't return avatar
          score: entry.rankingPoints,
          rank: entry.rank,
          trend: 'same' as const, // API doesn't provide trend, default to 'same'
          isCurrentUser: isCurrentUser || false,
        };
      });

      setLeaderboardData(mappedData);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', error.message || 'Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when filter changes
  useEffect(() => {
    loadLeaderboard(activeFilter);
  }, [activeFilter, currentUserId]);

  // Handle filter change
  const handleFilterChange = (filter: 'today' | 'week' | 'all') => {
    setActiveFilter(filter);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard(activeFilter);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const top3Users = leaderboardData.slice(0, 3);
  const remainingUsers = leaderboardData.slice(3);
  const currentUser = leaderboardData.find(user => user.isCurrentUser);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderPodiumUser = (user: LeaderboardUser, position: number) => {
    const isFirst = position === 0;
    const isSecond = position === 1;
    const isThird = position === 2;

    return (
      <View key={user.id} style={[styles.podiumUser, isFirst && styles.firstPlace]}>
        {/* Rank and Trend Indicator */}
        <View style={styles.rankTrend}>
          <Ionicons 
            name={getTrendIcon(user.trend)} 
            size={16} 
            color={getTrendColor(user.trend)} 
          />
          <Text style={styles.rankNumber}>{user.rank}</Text>
        </View>
        
        <View style={[styles.podiumAvatar, isFirst && styles.firstPlaceAvatar]}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(user?.name || "U").charAt(0)}</Text>
            </View>
          )}
          {isFirst && (
            <View style={styles.crownContainer}>
              <Text style={styles.crownIcon}>👑</Text>
            </View>
          )}
        </View>
        
        <View style={styles.podiumUserInfo}>
          <Text style={[styles.podiumUserName, isFirst && styles.firstPlaceName]}>
            {user.name}
          </Text>
          <Text style={styles.podiumUsername}>@{user.username}</Text>
          <View style={styles.podiumScore}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.podiumScoreText}>{user.score}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (user: LeaderboardUser) => {
    return (
      <View key={user.id} style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankNumber}>{user.rank}</Text>
          <Ionicons 
            name={getTrendIcon(user.trend)} 
            size={16} 
            color={getTrendColor(user.trend)} 
          />
        </View>
        
        <View style={styles.userAvatar}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{(user?.name || "U").charAt(0)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userUsername}>@{user.username}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.scoreText}>{user.score}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.heroHeaderArea}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.timeText}>{getCurrentTime()}</Text>
          <View style={styles.statusIcons}>
            <View style={styles.statusIcon}>
              <Ionicons name="arrow-up" size={12} color="#FFFFFF" />
            </View>
            <View style={styles.statusIcon}>
              <Text style={styles.signalText}>A</Text>
            </View>
          </View>
        </View>

        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>BACK2USE</Text>
        </View>
        
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
            <Text style={styles.greetingName}>{currentUserName}</Text>
          </View>
          <View style={styles.avatarLg}>
            {currentUserAvatar ? (
              <Image source={{ uri: currentUserAvatar }} style={styles.avatarLgImage} />
            ) : (
              <Text style={styles.avatarLgText}>{currentUserName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
        </View>

        {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'today' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('today')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'today' && styles.activeFilterTabText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'week' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('week')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'week' && styles.activeFilterTabText]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeFilterTabText]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0F4D3A']}
            tintColor="#0F4D3A"
          />
        }
      >
        {/* Podium Section */}
        <View style={styles.podiumSection}>
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            {top3Users[1] && renderPodiumUser(top3Users[1], 1)}
            
            {/* 1st Place */}
            {top3Users[0] && renderPodiumUser(top3Users[0], 0)}
            
            {/* 3rd Place */}
            {top3Users[2] && renderPodiumUser(top3Users[2], 2)}
          </View>
        </View>

        {/* Main Leaderboard List */}
        <View style={styles.leaderboardSection}>
          {remainingUsers.length > 0 ? (
            <View style={styles.leaderboardList}>
              {remainingUsers.map(user => renderLeaderboardItem(user))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No leaderboard data available</Text>
            </View>
          )}
        </View>
      </ScrollView>
      )}

      {/* Current User's Rank - Sticky Bottom */}
      {currentUser && (
        <View style={styles.currentUserCard}>
          <View style={styles.currentUserRank}>
            <Text style={styles.currentUserRankNumber}>#{currentUser.rank}</Text>
            <Ionicons 
              name={getTrendIcon(currentUser.trend)} 
              size={16} 
              color={getTrendColor(currentUser.trend)} 
            />
          </View>
          
          <View style={styles.currentUserAvatar}>
            {currentUser.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{(currentUser?.name || "U").charAt(0)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.currentUserInfo}>
            <Text style={styles.currentUserName}>{currentUser.name}</Text>
            <Text style={styles.currentUserUsername}>@{currentUser.username}</Text>
          </View>
          
          <View style={styles.currentUserScore}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.currentUserScoreText}>{currentUser.score}</Text>
          </View>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  heroHeaderArea: {
    backgroundColor: '#00704A',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  signalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSub: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarLg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLgText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00704A',
  },
  avatarLgImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 24,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0F4D3A',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#0F4D3A',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  podiumSection: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    position: 'relative',
  },
  podiumUser: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  firstPlace: {
    zIndex: 3,
  },
  crownContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  crownIcon: {
    fontSize: 16,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  firstPlaceAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#0F4D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  podiumUserInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  firstPlaceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  podiumUsername: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  podiumScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  podiumScoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  rankTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 4,
  },
  leaderboardSection: {
    marginBottom: 100,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  leaderboardList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  userAvatar: {
    marginRight: 12,
    width: 40,
    height: 40,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  currentUserCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3,
    borderTopColor: '#0F4D3A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  currentUserRank: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  currentUserRankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F4D3A',
    marginRight: 4,
  },
  currentUserAvatar: {
    marginRight: 12,
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  currentUserUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentUserScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
