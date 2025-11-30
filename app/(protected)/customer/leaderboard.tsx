import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { getCurrentUserProfileWithAutoRefresh, leaderboardApi, LeaderboardEntry } from '../../../src/services/api/userService';

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
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'all'>('today');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load current user info
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUserProfileWithAutoRefresh();
        setCurrentUserId(user._id || null);
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
        // All Time = no month/year filter, get all
        // Or use current month as default
        params.month = now.getMonth() + 1;
        params.year = now.getFullYear();
      }

      console.log('📊 Loading leaderboard with params:', params);
      let response = await leaderboardApi.getMonthly(params);
      
      console.log('📊 Leaderboard response:', response);

      // Nếu tháng hiện tại không có dữ liệu, thử query tháng trước
      if (response.data.length === 0 && (filter === 'today' || filter === 'week')) {
        console.log('📊 No data for current month, trying previous month...');
        const prevMonth = params.month === 1 ? 12 : params.month - 1;
        const prevYear = params.month === 1 ? params.year - 1 : params.year;
        
        const prevParams = {
          ...params,
          month: prevMonth,
          year: prevYear,
        };
        
        console.log('📊 Loading previous month with params:', prevParams);
        response = await leaderboardApi.getMonthly(prevParams);
        console.log('📊 Previous month leaderboard response:', response);
      }

      // Generate realistic names from fullName or create from phone
      const generateRealisticName = (fullName: string | undefined, phone: string | undefined): string => {
        if (fullName && fullName.trim() && fullName !== 'Unknown User') {
          return fullName;
        }
        // Generate realistic name from phone number hash
        const names = ['Alex Smith', 'John Doe', 'Sarah Johnson', 'Mike Wilson', 'Emma Brown', 
                      'David Lee', 'Lisa Anderson', 'Chris Taylor', 'Anna Martinez', 'Tom White'];
        if (phone) {
          const hash = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return names[hash % names.length];
        }
        return names[Math.floor(Math.random() * names.length)];
      };

      // Generate avatar URL from name (using UI Avatars service)
      const generateAvatarUrl = (name: string): string => {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E2'];
        const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors[colorIndex]}&color=fff&size=128&bold=true`;
      };

      // Map API data to LeaderboardUser format
      const mappedData: LeaderboardUser[] = response.data.map((entry: LeaderboardEntry) => {
        const customer = entry.customerId;
        const isCurrentUser = currentUserId && customer._id === currentUserId;
        const realisticName = generateRealisticName(customer.fullName, customer.phone);
        
        // Get avatar from API if available, otherwise generate from name
        const avatarUrl = customer?.userId?.avatar 
          ? customer.userId.avatar 
          : generateAvatarUrl(realisticName);
        
        return {
          id: entry._id,
          name: realisticName,
          username: customer.phone || customer._id.substring(0, 8),
          avatar: avatarUrl, // Use API avatar if available, otherwise generate
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
        {/* Rank Number */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>#{user.rank}</Text>
        </View>
        
        {/* Avatar with border */}
        <View style={[
          styles.podiumAvatar,
          isFirst && styles.firstPlaceAvatar,
          isSecond && styles.secondPlaceAvatar,
          isThird && styles.thirdPlaceAvatar
        ]}>
          <Image 
            source={{ uri: user.avatar }} 
            style={styles.avatarImage}
            defaultSource={require('../../../assets/images/avatar.jpg')}
          />
          {isFirst && (
            <View style={styles.crownContainer}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
            </View>
          )}
        </View>
        
        <View style={styles.podiumUserInfo}>
          <Text style={[styles.podiumUserName, isFirst && styles.firstPlaceName]}>
            {user.name}
          </Text>
          <View style={styles.podiumScore}>
            <Ionicons name="star" size={16} color="#FF8C00" />
            <Text style={[styles.podiumScoreText, isFirst && styles.firstPlaceScore]}>
              {user.score.toLocaleString('en-US')} pts
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (user: LeaderboardUser) => {
    return (
      <View key={user.id} style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankNumber}>#{user.rank}</Text>
        </View>
        
        <View style={styles.userAvatar}>
          <Image 
            source={{ uri: user.avatar }} 
            style={styles.avatarImage}
            defaultSource={require('../../../assets/images/avatar.jpg')}
          />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={16} color="#FF8C00" />
          <Text style={styles.scoreText}>{user.score.toLocaleString('en-US')} pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Standard Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerSpacer} />
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
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
      <ScrollView 
        style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
              colors={['#00704A']}
              tintColor="#00704A"
          />
        }
      >
          {/* Podium Section (Top 3) */}
          {top3Users.length > 0 && (
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
          )}

          {/* Ranking List (Starting from Rank 4) */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Standard Header
  header: {
    backgroundColor: '#00704A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120, // Extra padding to prevent items from being hidden behind bottom nav
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 32,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeFilterTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#00704A',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#00704A',
    fontWeight: '700',
  },
  podiumSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
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
  rankBadge: {
    backgroundColor: '#00704A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  crownContainer: {
    position: 'absolute',
    top: -12,
    right: -12,
    zIndex: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  podiumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#C0C0C0', // Silver default
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  firstPlaceAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 5,
    borderColor: '#FFD700', // Gold
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondPlaceAvatar: {
    borderColor: '#C0C0C0', // Silver
    borderWidth: 4,
  },
  thirdPlaceAvatar: {
    borderColor: '#CD7F32', // Bronze
    borderWidth: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8C00',
    marginLeft: 4,
  },
  firstPlaceScore: {
    fontSize: 16,
    color: '#FF8C00',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    minWidth: 32,
  },
  leaderboardSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  leaderboardList: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rankContainer: {
    marginRight: 16,
    minWidth: 40,
  },
  userAvatar: {
    marginRight: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8C00',
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
