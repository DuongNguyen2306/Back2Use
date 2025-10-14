import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const { width: screenWidth } = Dimensions.get('window');

// Mock data
const mockVouchers = [
  {
    id: 'v1',
    name: '20% Coffee Discount',
    description: 'Get 20% off on coffee orders at participating stores',
    discountPercent: 20,
    requiredPoints: 100,
    category: 'beverage',
    icon: 'cafe',
    isAvailable: true,
  },
  {
    id: 'v2',
    name: '50% Food Discount',
    description: 'Get 50% off on food at partner restaurants',
    discountPercent: 50,
    requiredPoints: 200,
    category: 'food',
    icon: 'restaurant',
    isAvailable: true,
  },
  {
    id: 'v3',
    name: 'Free Delivery',
    description: 'Free delivery for your next order',
    discountPercent: 100,
    requiredPoints: 150,
    category: 'general',
    icon: 'car',
    isAvailable: false,
  },
];

const mockMyVouchers = [
  {
    id: 'cv1',
    voucherId: 'v1',
    code: 'CAFE20-ABC123',
    status: 'available',
    redeemedAt: new Date('2024-01-20'),
    expiresAt: new Date('2024-12-31'),
    voucher: mockVouchers[0],
  },
  {
    id: 'cv2',
    voucherId: 'v2',
    code: 'FOOD50-XYZ789',
    status: 'used',
    redeemedAt: new Date('2024-01-15'),
    usedAt: new Date('2024-01-18'),
    expiresAt: new Date('2024-12-31'),
    voucher: mockVouchers[1],
  },
];

const mockHistory = [
  {
    id: 'h1',
    points: 50,
    description: 'Returned coffee cup on time',
    date: '2024-01-20',
    type: 'earn',
  },
  {
    id: 'h2',
    points: -100,
    description: 'Redeemed 20% coffee discount voucher',
    date: '2024-01-20',
    type: 'redeem',
  },
  {
    id: 'h3',
    points: 30,
    description: 'Returned food container on time',
    date: '2024-01-18',
    type: 'earn',
  },
];

export default function RewardsScreen() {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [userPoints, setUserPoints] = useState(1250);
  const [userRank, setUserRank] = useState(8);
  const [myVouchers, setMyVouchers] = useState(mockMyVouchers);

  const handleRedeemVoucher = (voucher: any) => {
    if (userPoints >= voucher.requiredPoints) {
      const newVoucher = {
        id: `cv${Date.now()}`,
        voucherId: voucher.id,
        code: `${voucher.name.replace(/\s+/g, '').toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'available',
        redeemedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        voucher: voucher,
      };
      
      setMyVouchers(prev => [...prev, newVoucher]);
      setUserPoints(prev => prev - voucher.requiredPoints);
    }
  };

  const getVoucherIcon = (category: string) => {
    switch (category) {
      case 'beverage': return 'cafe';
      case 'food': return 'restaurant';
      case 'general': return 'gift';
      default: return 'gift';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'used': return '#6B7280';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'used': return 'Used';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>Rewards</Text>
          </View>
            <View style={styles.avatarLg}>
              <Ionicons name="gift" size={24} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Full Screen Points & Ranking */}
        <View style={styles.fullStatsCard}>
          <View style={styles.fullStatsContent}>
            {/* Experience Points - Full Width */}
            <View style={styles.fullStatItem}>
              <View style={styles.fullStatIcon}>
                <Ionicons name="star" size={20} color="#FF6B35" />
              </View>
              <View style={styles.fullStatContent}>
                <Text style={styles.fullStatNumber}>2300</Text>
                <Text style={styles.fullStatLabel}>Exp. Points</Text>
              </View>
            </View>
            
            {/* Ranking - Full Width */}
            <View style={styles.fullStatItem}>
              <View style={styles.fullStatIcon}>
                <Ionicons name="trophy" size={32} color="#FF6B35" />
              </View>
              <View style={styles.fullStatContent}>
                <Text style={styles.fullStatNumber}>8</Text>
                <Text style={styles.fullStatLabel}>Ranking</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vouchers' && styles.activeTab]}
            onPress={() => setActiveTab('vouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'vouchers' && styles.activeTabText]}>
              Vouchers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myVouchers' && styles.activeTab]}
            onPress={() => setActiveTab('myVouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'myVouchers' && styles.activeTabText]}>
              My Vouchers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'vouchers' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Available Vouchers</Text>
            {mockVouchers.map((voucher) => (
              <View key={voucher.id} style={styles.ticketCard}>
                <View style={styles.ticketContent}>
                  {/* Left Side - Logo */}
                  <View style={styles.ticketLeft}>
                    <View style={styles.ticketLogo}>
                      <Ionicons 
                        name={getVoucherIcon(voucher.category)} 
                        size={32} 
                        color="#000000" 
                      />
                    </View>
                  </View>
                  
                  {/* Dashed Line Separator */}
                  <View style={styles.ticketDashedLine} />
                  
                  {/* Right Side - Details */}
                  <View style={styles.ticketRight}>
                    <Text style={styles.ticketBrand}>{voucher.name.split(' ')[0].toUpperCase()}</Text>
                    <Text style={styles.ticketOffer}>
                      {voucher.discountPercent === 100 ? 'BUY 1 GET 1 FREE' : `${voucher.discountPercent}% OFF`}
                    </Text>
                    <Text style={styles.ticketValid}>Valid until 31 Dec 2024</Text>
                    
                    <View style={styles.ticketFooter}>
                      <View style={styles.pointsContainer}>
                        <Ionicons name="star" size={14} color="#FF6B35" />
                        <Text style={styles.pointsText}>{voucher.requiredPoints} points</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.redeemButton,
                          userPoints < voucher.requiredPoints && styles.disabledButton
                        ]}
                        disabled={userPoints < voucher.requiredPoints}
                        onPress={() => handleRedeemVoucher(voucher)}
                      >
                        <Text style={[
                          styles.redeemButtonText,
                          userPoints < voucher.requiredPoints && styles.disabledText
                        ]}>
                          {userPoints >= voucher.requiredPoints ? 'Redeem' : 'Insufficient'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {activeTab === 'myVouchers' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>My Vouchers</Text>
            {myVouchers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No vouchers yet</Text>
                <Text style={styles.emptyDescription}>Redeem points to get discount vouchers</Text>
              </View>
            ) : (
              myVouchers.map((voucher) => (
                <View key={voucher.id} style={styles.ticketCard}>
                  <View style={styles.ticketContent}>
                    {/* Left Side - Logo */}
                    <View style={styles.ticketLeft}>
                      <View style={styles.ticketLogo}>
                        <Ionicons 
                          name={getVoucherIcon(voucher.voucher.category)} 
                          size={32} 
                          color="#000000" 
                        />
                      </View>
                    </View>
                    
                    {/* Dashed Line Separator */}
                    <View style={styles.ticketDashedLine} />
                    
                    {/* Right Side - Details */}
                    <View style={styles.ticketRight}>
                      <Text style={styles.ticketBrand}>{voucher.voucher.name.split(' ')[0].toUpperCase()}</Text>
                      <Text style={styles.ticketOffer}>
                        {voucher.voucher.discountPercent === 100 ? 'BUY 1 GET 1 FREE' : `${voucher.voucher.discountPercent}% OFF`}
                      </Text>
                      <Text style={styles.ticketValid}>Valid until {voucher.expiresAt.toLocaleDateString('en-US')}</Text>
                      
                      <View style={styles.ticketFooter}>
                        <View style={styles.statusContainer}>
                          <View style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(voucher.status) }
                          ]} />
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(voucher.status) }
                          ]}>
                            {getStatusText(voucher.status)}
                          </Text>
                        </View>
                        <View style={styles.codeContainer}>
                          <Text style={styles.codeText}>{voucher.code}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Points History</Text>
            {mockHistory.map((item) => (
              <View key={item.id} style={styles.ticketCard}>
                <View style={styles.ticketContent}>
                  {/* Left Side - Logo */}
                  <View style={styles.ticketLeft}>
                    <View style={styles.ticketLogo}>
                      <Ionicons 
                        name={item.type === 'earn' ? 'add-circle' : 'remove-circle'} 
                        size={32} 
                        color="#000000" 
                      />
                    </View>
                  </View>
                  
                  {/* Dashed Line Separator */}
                  <View style={styles.ticketDashedLine} />
                  
                  {/* Right Side - Details */}
                  <View style={styles.ticketRight}>
                    <Text style={styles.ticketBrand}>{item.type === 'earn' ? 'EARNED' : 'REDEEMED'}</Text>
                    <Text style={styles.ticketOffer}>{item.description}</Text>
                    <Text style={styles.ticketValid}>{item.date}</Text>
                    
                    <View style={styles.ticketFooter}>
                      <View style={styles.pointsContainer}>
                        <Ionicons name="star" size={14} color="#FF6B35" />
                        <Text style={styles.pointsText}>{item.points > 0 ? '+' : ''}{item.points} points</Text>
                      </View>
                      <View style={[
                        styles.redeemButton,
                        { 
                          backgroundColor: item.type === 'earn' ? '#10B981' : '#EF4444',
                          borderRadius: 50,
                          overflow: 'hidden'
                        }
                      ]}>
                        <Text style={styles.redeemButtonText}>
                          {item.points > 0 ? '+' : ''}{item.points}
                        </Text>
                      </View>
                    </View>
                  </View>
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
    backgroundColor: '#F8FAFC',
  },
  heroHeaderArea: { backgroundColor: '#00704A', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandTitle: { color: '#fff', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  iconGhost: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 },
  greetingName: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarLg: { height: 56, width: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullStatsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FF6B35',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fullStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  fullStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  fullStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fullStatContent: {
    flex: 1,
  },
  fullStatNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
    flexShrink: 0,
  },
  fullStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    flexShrink: 0,
  },
  pointsContent: {
    padding: 20,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#92400E',
  },
  progressBar: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FF6B35',
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  // Ticket styles - giống vé thật
  ticketCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ticketLeft: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  ticketDashedLine: {
    width: 1,
    height: 60,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 16,
  },
  ticketRight: {
    flex: 1,
    paddingLeft: 8,
  },
  ticketBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  ticketOffer: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  ticketValid: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  redeemButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    minHeight: 40,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  codeContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  pointsChangeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // History styles - đẹp hơn
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  historyLeft: {
    marginRight: 16,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  historyRight: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  historyPointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyPointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  historyTypeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  voucherContent: {
    padding: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  voucherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  voucherDiscount: {
    alignItems: 'center',
  },
  discountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F59E0B',
  },
  offText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  redeemButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  // My Vouchers styles
  myVoucherCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  myVoucherContent: {
    padding: 16,
  },
  myVoucherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  myVoucherIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  myVoucherInfo: {
    flex: 1,
    marginRight: 12,
  },
  myVoucherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  myVoucherDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  voucherCodeContainer: {
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  voucherDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // History styles
  historyCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  historyContent: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  pointsChangeContainer: {
    alignItems: 'flex-end',
  },
  pointsChange: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsLabelText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
