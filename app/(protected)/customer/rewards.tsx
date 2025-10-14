import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
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

const { width: screenWidth } = Dimensions.get('window');

// Mock data
const mockVouchers = [
  {
    id: 'v1',
    name: 'Giảm 20% Cà phê',
    description: 'Giảm 20% cho đơn hàng cà phê tại các cửa hàng tham gia',
    discountPercent: 20,
    requiredPoints: 100,
    category: 'beverage',
    icon: 'cafe',
    isAvailable: true,
  },
  {
    id: 'v2',
    name: 'Giảm 50% Đồ ăn',
    description: 'Giảm 50% cho đồ ăn tại các nhà hàng đối tác',
    discountPercent: 50,
    requiredPoints: 200,
    category: 'food',
    icon: 'restaurant',
    isAvailable: true,
  },
  {
    id: 'v3',
    name: 'Miễn phí vận chuyển',
    description: 'Miễn phí vận chuyển cho đơn hàng tiếp theo',
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
    description: 'Trả cốc cà phê đúng hạn',
    date: '2024-01-20',
    type: 'earn',
  },
  {
    id: 'h2',
    points: -100,
    description: 'Đổi voucher giảm 20% cà phê',
    date: '2024-01-20',
    type: 'redeem',
  },
  {
    id: 'h3',
    points: 30,
    description: 'Trả hộp đựng thức ăn đúng hạn',
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
      case 'available': return 'Có thể sử dụng';
      case 'used': return 'Đã sử dụng';
      case 'expired': return 'Hết hạn';
      default: return 'Không xác định';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconGhost}>
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.brandTitle}>BACK2USE</Text>
            <TouchableOpacity style={styles.iconGhost}>
              <Ionicons name="menu" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>Good Morning,</Text>
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
        {/* Points Card */}
        <Card style={styles.pointsCard}>
          <CardContent style={styles.pointsContent}>
            <View style={styles.pointsHeader}>
              <View style={styles.pointsIcon}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
              </View>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsLabel}>Điểm của bạn</Text>
                <Text style={styles.pointsValue}>{userPoints}</Text>
              </View>
            </View>
            <Progress value={(userPoints / 2000) * 100} style={styles.progressBar} />
            <Text style={styles.progressText}>
              Còn {2000 - userPoints} điểm để đạt cấp độ tiếp theo
            </Text>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vouchers' && styles.activeTab]}
            onPress={() => setActiveTab('vouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'vouchers' && styles.activeTabText]}>
              Voucher
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myVouchers' && styles.activeTab]}
            onPress={() => setActiveTab('myVouchers')}
          >
            <Text style={[styles.tabText, activeTab === 'myVouchers' && styles.activeTabText]}>
              Voucher của tôi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Lịch sử
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'vouchers' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Voucher có sẵn</Text>
            {mockVouchers.map((voucher) => (
              <Card key={voucher.id} style={styles.voucherCard}>
                <CardContent style={styles.voucherContent}>
                  <View style={styles.voucherHeader}>
                    <View style={styles.voucherIconContainer}>
                      <Ionicons 
                        name={getVoucherIcon(voucher.category)} 
                        size={24} 
                        color="#F59E0B" 
                      />
                    </View>
                    <View style={styles.voucherInfo}>
                      <Text style={styles.voucherName}>{voucher.name}</Text>
                      <Text style={styles.voucherDescription}>{voucher.description}</Text>
                    </View>
                    <View style={styles.voucherDiscount}>
                      <Text style={styles.discountText}>{voucher.discountPercent}%</Text>
                      <Text style={styles.offText}>OFF</Text>
                    </View>
                  </View>
                  
                  <View style={styles.voucherFooter}>
                    <View style={styles.pointsContainer}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.pointsText}>{voucher.requiredPoints} điểm</Text>
                    </View>
                    <Button
                      variant={userPoints >= voucher.requiredPoints ? "eco" : "secondary"}
                      disabled={userPoints < voucher.requiredPoints}
                      onPress={() => handleRedeemVoucher(voucher)}
                      style={styles.redeemButton}
                    >
                      <Text style={[
                        styles.redeemButtonText,
                        userPoints < voucher.requiredPoints && styles.disabledText
                      ]}>
                        {userPoints >= voucher.requiredPoints ? 'Đổi ngay' : 'Không đủ điểm'}
                      </Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
        
        {activeTab === 'myVouchers' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Voucher của tôi</Text>
            {myVouchers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Chưa có voucher nào</Text>
                <Text style={styles.emptyDescription}>Đổi điểm để nhận voucher ưu đãi</Text>
              </View>
            ) : (
              myVouchers.map((voucher) => (
                <Card key={voucher.id} style={styles.myVoucherCard}>
                  <CardContent style={styles.myVoucherContent}>
                    <View style={styles.myVoucherHeader}>
                      <View style={styles.myVoucherIconContainer}>
                        <Ionicons 
                          name={getVoucherIcon(voucher.voucher.category)} 
                          size={20} 
                          color="#F59E0B" 
                        />
                      </View>
                      <View style={styles.myVoucherInfo}>
                        <Text style={styles.myVoucherName}>{voucher.voucher.name}</Text>
                        <Text style={styles.myVoucherDescription}>{voucher.voucher.description}</Text>
                      </View>
                      <Badge 
                        style={[
                          styles.statusBadge, 
                          { backgroundColor: getStatusColor(voucher.status) + '20' }
                        ]}
                      >
                        <Text style={[styles.statusText, { color: getStatusColor(voucher.status) }]}>
                          {getStatusText(voucher.status)}
                        </Text>
                      </Badge>
                    </View>
                    
                    <View style={styles.voucherCodeContainer}>
                      <Text style={styles.codeLabel}>Mã voucher:</Text>
                      <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{voucher.code}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.voucherDates}>
                      <Text style={styles.dateText}>
                        Đổi: {voucher.redeemedAt.toLocaleDateString('vi-VN')}
                      </Text>
                      <Text style={styles.dateText}>
                        Hết hạn: {voucher.expiresAt.toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}
        
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Lịch sử điểm</Text>
            {mockHistory.map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <CardContent style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyIconContainer}>
                      <Ionicons 
                        name={item.type === 'earn' ? 'add-circle' : 'remove-circle'} 
                        size={20} 
                        color={item.type === 'earn' ? '#10B981' : '#EF4444'} 
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDescription}>{item.description}</Text>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    <View style={styles.pointsChangeContainer}>
                      <Text style={[
                        styles.pointsChange,
                        { color: item.type === 'earn' ? '#10B981' : '#EF4444' }
                      ]}>
                        {item.points > 0 ? '+' : ''}{item.points}
                      </Text>
                      <Text style={styles.pointsLabelText}>điểm</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
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
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  },
  // Voucher styles
  voucherCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
