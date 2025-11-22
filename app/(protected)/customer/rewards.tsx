import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import CustomerHeader from '../../../components/CustomerHeader';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';
import { getCurrentUserProfileWithAutoRefresh } from '@/services/api/userService';
import { User } from '@/types/auth.types';

const { width } = Dimensions.get('window');

interface Voucher {
  id: string;
  title: string;
  discount: string;
  description: string;
  code: string;
  gradient: string[];
  validUntil: string;
  isUsed: boolean;
}

export default function Rewards() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'my-vouchers' | 'history'>('vouchers');

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUserProfileWithAutoRefresh();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

// Mock data
  const vouchers: Voucher[] = [
    {
      id: '1',
      title: 'Up to',
      discount: '25% OFF',
      description: 'Package discount coupon',
      code: 'ST-V2586',
      gradient: ['#FF6B35', '#F7931E'],
      validUntil: '2024-12-31',
      isUsed: false,
    },
    {
      id: '2',
      title: 'Get up to',
      discount: '40% OFF',
      description: 'Discount on first order',
      code: 'FO-404030',
      gradient: ['#0F4D3A', '#1F2937'],
      validUntil: '2024-11-30',
      isUsed: false,
    },
    {
      id: '3',
      title: 'FREE',
      discount: 'SHIPPING',
      description: 'Free delivery on orders over $50',
      code: 'FS-2024',
      gradient: ['#DC2626', '#7C2D12'],
      validUntil: '2024-10-15',
      isUsed: true,
    },
    {
      id: '4',
      title: 'Save',
      discount: '30% OFF',
      description: 'On new products only',
      code: 'NP-30OFF',
      gradient: ['#059669', '#0D9488'],
      validUntil: '2024-09-20',
      isUsed: false,
    },
  ];

  const userStats = {
    points: (user as any)?.rewardPoints || 0,
    ranking: 8, // Mock ranking for now
  };

  const renderVoucherCard = (voucher: Voucher) => (
    <TouchableOpacity key={voucher.id} style={[styles.voucherCard, voucher.isUsed && styles.usedVoucherCard]}>
      <View style={[
        styles.voucherGradient, 
        { backgroundColor: voucher.gradient[0] },
        voucher.isUsed && styles.usedVoucherGradient
      ]}>
        {/* Watermark Graphics */}
        <View style={styles.watermarkContainer}>
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>%</Text>
            <View style={styles.watermarkDots}>
              <View style={styles.watermarkDot} />
              <View style={styles.watermarkDot} />
            </View>
          </View>
        </View>
        
        <View style={styles.voucherContent}>
          <View style={styles.voucherHeader}>
            <Text style={[styles.voucherTitle, voucher.isUsed && styles.usedVoucherText]}>
              {voucher.title}
            </Text>
          </View>
          <Text style={[styles.voucherDiscount, voucher.isUsed && styles.usedVoucherText]}>
            {voucher.discount}
          </Text>
          <Text style={[styles.voucherDescription, voucher.isUsed && styles.usedVoucherText]}>
            {voucher.description}
          </Text>
          <View style={styles.voucherCodeContainer}>
            <Text style={styles.voucherCode}>{voucher.code}</Text>
          </View>
          <View style={styles.voucherFooter}>
            <Text style={[styles.validUntil, voucher.isUsed && styles.usedVoucherText]}>
              Valid until: {voucher.validUntil}
            </Text>
            {voucher.isUsed ? (
              <Text style={styles.usedLabel}>{t('rewards').used}</Text>
            ) : (
              <TouchableOpacity style={styles.useButton}>
                <Text style={styles.useButtonText}>{t('rewards').useNow}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomerHeader
          title="Loading..."
          user={user}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomerHeader
        title={getTimeBasedGreeting() + ", " + ((user as any)?.fullName || user?.name || "User")}
        subtitle="Rewards & Vouchers"
        user={user}
      />

      <ScrollView style={styles.scrollContent}>
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          </View>
          
        {/* User Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Text style={styles.statIconText}>⭐</Text>
              </View>
              <Text style={styles.statValue}>{userStats.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{t('rewards').expPoints}</Text>
            </View>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/(protected)/customer/leaderboard')}
            >
              <View style={styles.statIcon}>
                <Text style={styles.statIconText}>🏆</Text>
              </View>
              <Text style={styles.statValue}>{userStats.ranking}</Text>
              <Text style={styles.statLabel}>{t('rewards').ranking}</Text>
              <View style={styles.viewRankingContainer}>
                <Text style={styles.viewRankingText}>{t('rewards').viewRankings}</Text>
                <Ionicons name="chevron-forward" size={12} color="#0F4D3A" />
            </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vouchers' && styles.activeTab]}
            onPress={() => setActiveTab('vouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'vouchers' && styles.activeTabText]}>
              {t('rewards').vouchers}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-vouchers' && styles.activeTab]}
            onPress={() => setActiveTab('my-vouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'my-vouchers' && styles.activeTabText]}>
              {t('rewards').myVouchers}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              {t('rewards').history}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'vouchers' && (
          <View style={styles.voucherList}>
            {vouchers.map(renderVoucherCard)}
          </View>
        )}
        
        {activeTab === 'my-vouchers' && (
          <View style={styles.voucherList}>
            {vouchers.filter(v => !v.isUsed).map(renderVoucherCard)}
          </View>
        )}
        
        {activeTab === 'history' && (
          <View style={styles.historyList}>
            {vouchers.filter(v => v.isUsed).map((voucher) => (
              <View key={voucher.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>{voucher.title} - {voucher.discount}</Text>
                  <Text style={styles.historyDescription}>{voucher.description}</Text>
                  <Text style={styles.historyDate}>Used on: {voucher.validUntil}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    // Light gold gradient background
    backgroundColor: '#FEF3C7',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewRankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 77, 58, 0.1)',
    borderRadius: 12,
  },
  viewRankingText: {
    fontSize: 12,
    color: '#0F4D3A',
    fontWeight: '500',
    marginRight: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  voucherList: {
    gap: 16,
  },
  voucherCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  voucherGradient: {
    padding: 20,
    borderRadius: 16,
  },
  voucherContent: {
    flex: 1,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  usedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  voucherDiscount: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  voucherDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validUntil: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  useButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  useButtonText: {
    color: '#0F4D3A',
    fontSize: 12,
    fontWeight: '600',
  },
  usedVoucherCard: {
    opacity: 0.6,
  },
  usedVoucherGradient: {
    backgroundColor: '#9CA3AF',
  },
  usedVoucherText: {
    color: '#6B7280',
  },
  usedLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  watermarkContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.3,
  },
  watermark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  watermarkDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  watermarkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 2,
  },
  voucherCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  voucherCode: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
