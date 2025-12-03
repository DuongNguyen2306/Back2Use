import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
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
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserPoints, setCurrentUserPoints] = useState<number | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('Bạn');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [hasNoData, setHasNoData] = useState(false);

  // Load current user info
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUserProfileWithAutoRefresh();
        setCurrentUserId(user._id || null);
        setCurrentUserName(user.fullName || user.name || 'Bạn');
        setCurrentUserAvatar(user.avatar || null);
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // Load leaderboard data - theo tháng và năm được chọn
  const loadLeaderboard = async (month?: number, year?: number) => {
    try {
      setLoading(true);
      setHasNoData(false);
      
      const monthToLoad = month ?? selectedMonth;
      const yearToLoad = year ?? selectedYear;
      
      const params: any = {
        page: 1,
        limit: 100,
        month: monthToLoad,
        year: yearToLoad,
      };

      console.log('📊 Loading leaderboard with params:', params);
      const response = await leaderboardApi.getMonthly(params);
      
      console.log('📊 Leaderboard response:', response);

      // Kiểm tra nếu không có dữ liệu
      if (response.data.length === 0) {
        setHasNoData(true);
        setLeaderboardData([]);
        setCurrentUserPoints(0);
        setCurrentUserRank(null);
        setLoading(false);
        return;
      }
      
      setHasNoData(false);

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
        
        // Lưu thông tin user hiện tại
        if (isCurrentUser) {
          setCurrentUserPoints(entry.rankingPoints);
          setCurrentUserRank(entry.rank);
        }
        
        return {
          id: entry._id,
          name: realisticName,
          username: customer.phone || customer._id.substring(0, 8),
          avatar: avatarUrl, // Use API avatar if available, otherwise generate
          score: entry.rankingPoints, // Điểm tháng này
          rank: entry.rank,
          trend: 'same' as const, // API doesn't provide trend, default to 'same'
          isCurrentUser: isCurrentUser || false,
        };
      });

      setLeaderboardData(mappedData);
      
      // Nếu user hiện tại không có trong leaderboard, set điểm về 0
      if (currentUserId && !mappedData.find(u => u.isCurrentUser)) {
        setCurrentUserPoints(0);
        setCurrentUserRank(null);
      }
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', error.message || 'Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when currentUserId or selected month/year changes
  useEffect(() => {
    if (currentUserId) {
      loadLeaderboard();
    }
  }, [currentUserId, selectedMonth, selectedYear]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years list (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Handle month selection
  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
  };

  // Handle year selection
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };


  const top3Users = leaderboardData.slice(0, 3);
  // Lọc ra user hiện tại khỏi danh sách để hiển thị riêng ở cuối
  const remainingUsers = leaderboardData.slice(3).filter(user => !user.isCurrentUser);
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

        {/* Filter Section - Chọn tháng và năm */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Select Month & Year</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowMonthPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#00704A" />
            <Text style={styles.filterButtonText}>
              {monthNames[selectedMonth - 1]}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowYearPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#00704A" />
            <Text style={styles.filterButtonText}>
              {selectedYear}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : hasNoData ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No data available for this month</Text>
          <Text style={styles.emptySubtext}>
            Please select a different month or year
          </Text>
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
          ) : !hasNoData && (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No leaderboard data available</Text>
            </View>
          )}
        </View>

        {/* Me Section - Hiển thị điểm của user hiện tại */}
        {currentUserId && (
          <View style={styles.meSection}>
            <View style={styles.meDivider}>
              <View style={styles.meDividerLine} />
              <Text style={styles.meDividerText}>Bạn</Text>
              <View style={styles.meDividerLine} />
            </View>
            <View style={styles.meCard}>
              <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>
                  {currentUserRank ? `#${currentUserRank}` : '-'}
                </Text>
              </View>
              
              <View style={styles.userAvatar}>
                {(currentUser?.avatar || currentUserAvatar) ? (
                  <Image 
                    source={{ uri: currentUser?.avatar || currentUserAvatar || '' }} 
                    style={styles.avatarImage}
                    defaultSource={require('../../../assets/images/avatar.jpg')}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#6B7280" />
                  </View>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentUserName}</Text>
              </View>
              
              <View style={styles.scoreContainer}>
                <Ionicons name="star" size={16} color="#FF8C00" />
                <Text style={styles.scoreText}>
                  {(currentUserPoints ?? 0).toLocaleString('vi-VN')} điểm
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      )}

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {monthNames.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerItem,
                    selectedMonth === index + 1 && styles.pickerItemSelected
                  ]}
                  onPress={() => handleMonthSelect(index + 1)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedMonth === index + 1 && styles.pickerItemTextSelected
                  ]}>
                    {month}
                  </Text>
                  {selectedMonth === index + 1 && (
                    <Ionicons name="checkmark" size={20} color="#00704A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    selectedYear === year && styles.pickerItemSelected
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedYear === year && styles.pickerItemTextSelected
                  ]}>
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <Ionicons name="checkmark" size={20} color="#00704A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#00704A',
    fontWeight: '600',
  },
  meSection: {
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  meDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  meDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  meDividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  meCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00704A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
