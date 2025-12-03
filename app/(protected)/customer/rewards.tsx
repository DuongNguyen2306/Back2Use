import { getCurrentUserProfileWithAutoRefresh, leaderboardApi } from '@/services/api/userService';
import { voucherApi } from '@/services/api/voucherService';
import { getRoleFromToken } from '@/services/api/client';
import { User } from '@/types/auth.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import SimpleHeader from '../../../components/SimpleHeader';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';

const { width } = Dimensions.get('window');

// UI Voucher interface for display
interface UIVoucher {
  id: string;
  title: string;
  discount: string;
  description: string;
  code: string;
  gradient: string[];
  validUntil: string;
  isUsed: boolean;
  voucherId?: string; // For redeem
  status?: 'active' | 'inactive' | 'expired'; // Voucher status
  isActive?: boolean; // Legacy field for isActive
}

// Gradient colors for vouchers
const GRADIENT_COLORS = [
  ['#FF6B35', '#F7931E'],
  ['#0F4D3A', '#1F2937'],
  ['#DC2626', '#7C2D12'],
  ['#059669', '#0D9488'],
  ['#7C3AED', '#A855F7'],
  ['#EA580C', '#F97316'],
];

export default function Rewards() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'my-vouchers' | 'history'>('vouchers');
  const [availableVouchers, setAvailableVouchers] = useState<UIVoucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<UIVoucher[]>([]);
  const [usedVouchers, setUsedVouchers] = useState<UIVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Convert API voucher to UI format (handle both old and new API formats)
  const convertVoucherToUI = (voucher: any, index: number = 0): UIVoucher => {
    const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
    
    // Handle my vouchers format (from /customer/vouchers/my)
    // This format has voucherInfo nested inside
    if (voucher.voucherInfo) {
      const voucherInfo = voucher.voucherInfo;
      const discountPercent = voucherInfo.discountPercent || 0;
      const customName = voucherInfo.customName || 'Discount Voucher';
      const customDescription = voucherInfo.customDescription || voucherInfo.description || 'Special discount voucher';
      const fullCode = voucher.fullCode || voucherInfo.baseCode || 'N/A';
      const endDate = voucherInfo.endDate || voucherInfo.validUntil;
      
      // Determine if voucher is used based on status
      // status can be: "redeemed" (just redeemed, not used yet), "used", "expired"
      const isUsed = voucher.status === 'used' || voucher.status === 'expired';
      const isRedeemed = voucher.status === 'redeemed';

      return {
        id: voucher._id,
        voucherId: voucher.voucherId || voucher._id, // Use voucherId for redeem, _id for display
        title: 'Up to',
        discount: `${discountPercent}% OFF`,
        description: customDescription,
        code: fullCode,
        gradient,
        validUntil: endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'N/A',
        isUsed: isUsed,
      };
    }
    
    // Handle available vouchers format (from /customer/vouchers)
    // This format has voucher data directly
    if (voucher.customName || voucher.discountPercent !== undefined) {
      const discountPercent = voucher.discountPercent || 0;
      const customName = voucher.customName || 'Discount Voucher';
      const customDescription = voucher.customDescription || voucher.description || 'Special discount voucher';
      const baseCode = voucher.baseCode || voucher.code || 'N/A';
      const endDate = voucher.endDate || voucher.validUntil;
      const isUsed = voucher.isUsed || false;
      const isRedeemable = voucher.isRedeemable !== false; // Default to true if not specified
      
      // Get status from voucher (status field or isActive field)
      let status: 'active' | 'inactive' | 'expired' = 'active';
      if (voucher.status) {
        status = voucher.status as 'active' | 'inactive' | 'expired';
      } else if (voucher.isActive !== undefined) {
        status = voucher.isActive ? 'active' : 'inactive';
      }
      
      // Check if expired based on endDate
      if (endDate) {
        const endDateObj = new Date(endDate);
        const now = new Date();
        if (endDateObj < now) {
          status = 'expired';
        }
      }

      return {
        id: voucher._id,
        voucherId: voucher._id,
        title: 'Up to',
        discount: `${discountPercent}% OFF`,
        description: customDescription,
        code: baseCode,
        gradient,
        validUntil: endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'N/A',
        isUsed: isUsed,
        status: status,
        isActive: status === 'active',
      };
    }

    // Handle old API format (standard vouchers)
    const isMyVoucher = 'isUsed' in voucher;
    let discountText = '';
    if (voucher.discountType === 'percentage') {
      discountText = `${voucher.discountValue}% OFF`;
    } else {
      discountText = `${voucher.discountValue?.toLocaleString('vi-VN') || 0} VNĐ`;
    }

    let title = 'Up to';
    if (voucher.discountType === 'percentage' && voucher.discountValue >= 50) {
      title = 'Get up to';
    } else if (voucher.discountType === 'fixed') {
      title = 'Save';
    }

    return {
      id: voucher._id,
      voucherId: voucher._id,
      title: voucher.title || title,
      discount: discountText,
      description: voucher.description || 'Special discount voucher',
      code: voucher.code || 'N/A',
      gradient,
      validUntil: voucher.validUntil ? new Date(voucher.validUntil).toLocaleDateString('vi-VN') : 'N/A',
      isUsed: isMyVoucher ? voucher.isUsed : false,
    };
  };

  // Load user data and rank (silently handle errors)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getCurrentUserProfileWithAutoRefresh();
        setUser(userData);
        
        // Load user rank from leaderboard for current month
        try {
          const now = new Date();
          const leaderboardResponse = await leaderboardApi.getMonthly({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            page: 1,
            limit: 100,
          });
          
          // Find current user in leaderboard
          const currentUserEntry = leaderboardResponse.data.find((entry: any) => 
            entry.customerId._id === userData._id
          );
          
          if (currentUserEntry) {
            setUserRank(currentUserEntry.rank);
          } else {
            setUserRank(null);
          }
        } catch (rankError) {
          // Silently handle rank errors
          console.log('Could not load user rank:', rankError);
          setUserRank(null);
        }
      } catch (error: any) {
        // Silently handle all errors - don't show to user
        // Don't log "No valid access token" errors - they're expected during auth flow
        const isTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                            error?.message?.toLowerCase().includes('token');
        const is403Error = error?.response?.status === 403;
        
        // Only log unexpected errors in development, not to UI
        if (!isTokenError && !is403Error && __DEV__) {
          // Silent log for debugging only
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Load vouchers based on active tab
  const loadVouchers = useCallback(async (showLoading: boolean = true) => {
    if (!auth.state.isAuthenticated) {
      console.log('⚠️ Not authenticated, skipping voucher load');
      return;
    }

    // Kiểm tra role trong token
      try {
      const token = await AsyncStorage.getItem('ACCESS_TOKEN');
      if (token) {
        const role = getRoleFromToken(token);
        console.log('🔍 Token role:', role);
        console.log('🔍 Auth state role:', auth.state.role);
        
        if (role !== 'customer' && auth.state.role !== 'customer') {
          console.error('❌ Invalid role for customer vouchers:', { tokenRole: role, authRole: auth.state.role });
          Alert.alert(
            'Lỗi xác thực',
            'Bạn cần đăng nhập với tài khoản customer để xem voucher. Vui lòng đăng xuất và đăng nhập lại.',
            [{ text: 'OK' }]
          );
          return;
          }
        }
    } catch (error) {
      console.error('❌ Error checking token role:', error);
    }

    try {
      if (showLoading) setLoadingVouchers(true);
      console.log('🔄 Loading vouchers...');

      // Load my vouchers FIRST to get list of redeemed voucher IDs
      let redeemedVoucherIds = new Set<string>();
      try {
        console.log('📡 Calling voucherApi.getMy...');
        const myVouchersResponse = await voucherApi.getMy({ page: 1, limit: 100 });
        console.log('✅ My vouchers response:', {
          statusCode: myVouchersResponse.statusCode,
          hasData: !!myVouchersResponse.data,
          dataType: Array.isArray(myVouchersResponse.data) ? 'array' : typeof myVouchersResponse.data,
          dataLength: Array.isArray(myVouchersResponse.data) ? myVouchersResponse.data.length : 
                     (myVouchersResponse.data?.items ? myVouchersResponse.data.items.length : 0)
        });
        
        if (myVouchersResponse.statusCode === 200) {
          // Handle both formats: data as array or data.items
          let vouchersArray: any[] = [];
          if (Array.isArray(myVouchersResponse.data)) {
            vouchersArray = myVouchersResponse.data;
            console.log('✅ Using new format (array directly):', vouchersArray.length, 'vouchers');
          } else if (myVouchersResponse.data?.items && Array.isArray(myVouchersResponse.data.items)) {
            vouchersArray = myVouchersResponse.data.items;
            console.log('✅ Using old format (data.items):', vouchersArray.length, 'vouchers');
          } else {
            console.warn('⚠️ Unknown data format:', myVouchersResponse.data);
          }
          
          if (vouchersArray.length > 0) {
            const allMyVouchers = vouchersArray.map((v, i) => convertVoucherToUI(v, i));
            // Get IDs of vouchers that user has already redeemed
            redeemedVoucherIds = new Set(
              allMyVouchers.map(v => v.voucherId || v.id).filter(Boolean) as string[]
            );
            
            // Filter: "redeemed" status = not used yet (show in My Vouchers)
            // "used" or "expired" status = used (show in History)
            const notUsed = allMyVouchers.filter(v => !v.isUsed);
            const used = allMyVouchers.filter(v => v.isUsed);
            setMyVouchers(notUsed);
            setUsedVouchers(used);
            console.log('✅ Set my vouchers:', notUsed.length, 'not used,', used.length, 'used');
            console.log('✅ Redeemed voucher IDs:', Array.from(redeemedVoucherIds));
          } else {
            console.log('ℹ️ No my vouchers found');
            setMyVouchers([]);
            setUsedVouchers([]);
          }
        } else {
          console.warn('⚠️ Unexpected status code:', myVouchersResponse.statusCode);
          setMyVouchers([]);
          setUsedVouchers([]);
        }
      } catch (error: any) {
        console.error('❌ Error loading my vouchers:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data
        });
        
        // Xử lý lỗi "Access denied" - có thể do role không đúng
        if (error?.message?.includes('Access denied') || error?.message?.includes('Allowed roles')) {
          console.error('❌ Access denied - checking token role...');
          try {
            const token = await AsyncStorage.getItem('ACCESS_TOKEN');
            if (token) {
              const role = getRoleFromToken(token);
              console.error('❌ Current token role:', role);
              console.error('❌ Expected role: customer');
              
              if (role !== 'customer') {
                Alert.alert(
                  'Lỗi xác thực',
                  `Token của bạn có role "${role}" nhưng cần role "customer". Vui lòng đăng xuất và đăng nhập lại.`,
                  [{ text: 'OK' }]
                );
              }
            }
          } catch (e) {
            console.error('❌ Error checking token:', e);
        }
        }
        
        setMyVouchers([]);
        setUsedVouchers([]);
      }

      // Load available vouchers (for "vouchers" tab) - AFTER loading my vouchers
      try {
        console.log('📡 Calling voucherApi.getAll...');
        const allVouchersResponse = await voucherApi.getAll({ page: 1, limit: 100 });
        console.log('✅ Available vouchers response:', {
          statusCode: allVouchersResponse.statusCode,
          hasData: !!allVouchersResponse.data,
          dataType: Array.isArray(allVouchersResponse.data) ? 'array' : typeof allVouchersResponse.data,
          dataLength: Array.isArray(allVouchersResponse.data) ? allVouchersResponse.data.length : 
                     (allVouchersResponse.data?.items ? allVouchersResponse.data.items.length : 0)
        });
        
        if (allVouchersResponse.statusCode === 200) {
          // Handle both formats: data as array or data.items
          let vouchersArray: any[] = [];
          if (Array.isArray(allVouchersResponse.data)) {
            // New format: data is array directly
            vouchersArray = allVouchersResponse.data;
            console.log('✅ Using new format (array directly):', vouchersArray.length, 'vouchers');
          } else if (allVouchersResponse.data?.items && Array.isArray(allVouchersResponse.data.items)) {
            // Old format: data.items is array
            vouchersArray = allVouchersResponse.data.items;
            console.log('✅ Using old format (data.items):', vouchersArray.length, 'vouchers');
          } else {
            console.warn('⚠️ Unknown data format:', allVouchersResponse.data);
          }
          
          if (vouchersArray.length > 0) {
            const converted = vouchersArray.map((v, i) => convertVoucherToUI(v, i));
            // Filter out vouchers that user has already redeemed
            const filtered = converted.filter(v => {
              const voucherId = v.voucherId || v.id;
              return !redeemedVoucherIds.has(voucherId);
            });
            setAvailableVouchers(filtered);
            console.log('✅ Set available vouchers:', {
              total: converted.length,
              filtered: filtered.length,
              removed: converted.length - filtered.length
            });
          } else {
            console.log('ℹ️ No available vouchers found');
            setAvailableVouchers([]);
          }
        } else {
          console.warn('⚠️ Unexpected status code:', allVouchersResponse.statusCode);
          setAvailableVouchers([]);
        }
      } catch (error: any) {
        console.error('❌ Error loading available vouchers:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data
        });
        
        // Xử lý lỗi "Access denied" - có thể do role không đúng
        if (error?.message?.includes('Access denied') || error?.message?.includes('Allowed roles')) {
          console.error('❌ Access denied - checking token role...');
          try {
            const token = await AsyncStorage.getItem('ACCESS_TOKEN');
            if (token) {
              const role = getRoleFromToken(token);
              console.error('❌ Current token role:', role);
              console.error('❌ Expected role: customer');
              
              if (role !== 'customer') {
                Alert.alert(
                  'Lỗi xác thực',
                  `Token của bạn có role "${role}" nhưng cần role "customer". Vui lòng đăng xuất và đăng nhập lại.`,
                  [{ text: 'OK' }]
                );
              }
            }
          } catch (e) {
            console.error('❌ Error checking token:', e);
          }
        }
        
        setAvailableVouchers([]);
      }

    } catch (error) {
      console.error('❌ General error loading vouchers:', error);
    } finally {
      if (showLoading) setLoadingVouchers(false);
      console.log('✅ Finished loading vouchers');
    }
  }, [auth.state.isAuthenticated]);

  // Load vouchers when component mounts or tab changes
  useEffect(() => {
    if (auth.state.isAuthenticated && auth.state.isHydrated) {
      loadVouchers();
    }
  }, [auth.state.isAuthenticated, auth.state.isHydrated, activeTab, loadVouchers]);


  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVouchers(false);
    setRefreshing(false);
  }, [loadVouchers]);

  // Handle redeem voucher
  const handleRedeemVoucher = async (voucherId: string) => {
    if (redeemingId) return; // Prevent multiple clicks

    try {
      setRedeemingId(voucherId);
      const response = await voucherApi.redeem(voucherId);
      
      // If statusCode is 200, consider it successful
      if (response.statusCode === 200) {
        // Reload vouchers to reflect changes - switch to my-vouchers tab to see the new voucher
        await loadVouchers(false);
        // Switch to my-vouchers tab to show the newly redeemed voucher
        setActiveTab('my-vouchers');
        // Use API message if available, otherwise use default success message
        const successMessage = response.message && 
          (response.message.toLowerCase().includes('success') || 
           response.message.toLowerCase().includes('thành công') ||
           response.message.toLowerCase().includes('redeem'))
          ? response.message
          : 'Bạn đã nhận voucher thành công!';
        Alert.alert('Thành công', successMessage);
      } else {
        // Only show error if statusCode is not 200
        Alert.alert('Lỗi', response.message || 'Không thể nhận voucher. Vui lòng thử lại.');
      }
    } catch (error: any) {
      // Show user-friendly error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể nhận voucher. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setRedeemingId(null);
    }
  };

  const userStats = {
    points: (user as any)?.rewardPoints || 0,
    ranking: userRank !== null ? userRank : '10+', // Real rank from leaderboard or "10+" if not available
  };

  const renderLockedVoucherSlot = () => {
    const progress = 80; // 80% progress to unlock
    const gradientColors = ['#FF6B35', '#F7931E']; // Same vibrant gradient as active vouchers
    
    return (
      <View style={styles.lockedVoucherCard}>
        {/* Background Gradient Layer - Vibrant Orange to Red */}
        <View style={styles.lockedGradientContainer}>
          <View style={[styles.lockedGradientStart, { backgroundColor: gradientColors[0] }]} />
          <View style={[styles.lockedGradientEnd, { backgroundColor: gradientColors[1] }]} />
        </View>
        
        {/* Frosted Glass Overlay with Blur */}
        <BlurView intensity={80} tint="light" style={styles.lockedGlassOverlay}>
          <View style={styles.lockedVoucherContent}>
            {/* Large Lock Icon */}
            <View style={styles.lockedIconContainer}>
              <Ionicons name="lock-closed" size={48} color="rgba(255, 255, 255, 0.95)" />
            </View>
            
            {/* Description */}
            <Text style={styles.lockedDescription}>Voucher đang chờ</Text>
            
            {/* Status Text */}
            <View style={styles.lockedStatusBadge}>
              <Text style={styles.lockedStatusText}>Chưa kích hoạt</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
            
            {/* Unlock Button */}
            <TouchableOpacity 
              style={styles.unlockButton}
              disabled={true}
            >
              <Ionicons name="lock-closed" size={16} color="rgba(255, 255, 255, 0.95)" />
              <Text style={styles.unlockButtonText}>Mở khóa</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  };

  const renderVoucherCard = (voucher: UIVoucher, isAvailable: boolean = false) => {
    const isRedeeming = redeemingId === voucher.voucherId;
    const isActive = voucher.status === 'active' || (voucher.isActive !== false && !voucher.status);
    const isInactive = voucher.status === 'inactive';
    const isExpired = voucher.status === 'expired';
    const canRedeem = isAvailable && isActive && !voucher.isUsed;
    
    const getStatusText = () => {
      if (isExpired) return 'Hết hạn';
      if (voucher.isUsed) return 'Đã sử dụng';
      return null; // Không hiện "Chưa kích hoạt"
    };

    const getStatusColor = () => {
      if (isExpired) return '#EF4444';
      if (isInactive) return '#F59E0B';
      return '#10B981';
    };
    
    const handleCardPress = () => {
      // Navigate to voucher detail screen
      router.push({
        pathname: '/(protected)/customer/voucher-detail/[id]',
        params: { id: voucher.id }
      });
    };
    
    return (
      <TouchableOpacity 
        key={voucher.id} 
        style={[styles.voucherCard, voucher.isUsed && styles.usedVoucherCard]}
        disabled={isRedeeming}
        onPress={handleCardPress}
      >
      <View style={[
        styles.voucherGradient, 
        { backgroundColor: voucher.gradient[0] },
        voucher.isUsed && styles.usedVoucherGradient
        ]}>
          {/* Status Badge */}
          {getStatusText() && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          )}
          
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
                HSD: {voucher.validUntil}
            </Text>
            {voucher.isUsed ? (
              <Text style={styles.usedLabel}>{t('rewards').used}</Text>
              ) : isAvailable ? (
                <TouchableOpacity 
                  style={[
                    styles.useButton, 
                    (!canRedeem || isRedeeming) && styles.useButtonDisabled
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (canRedeem && voucher.voucherId) {
                      handleRedeemVoucher(voucher.voucherId);
                    } else if (!isActive) {
                      Alert.alert(
                        'Thông báo',
                        isInactive 
                          ? 'Voucher này chưa được kích hoạt. Vui lòng thử lại sau.' 
                          : 'Voucher này đã hết hạn.'
                      );
                    }
                  }}
                  disabled={!canRedeem || isRedeeming}
                >
                  {isRedeeming ? (
                    <ActivityIndicator size="small" color="#0F4D3A" />
                  ) : (
                    <Text style={styles.useButtonText}>
                      {isInactive ? 'Chưa phát hành' : 'Nhận ngay'}
                    </Text>
                  )}
              </TouchableOpacity>
              ) : (
                <Text style={styles.ownedLabel}>Đã nhận</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SimpleHeader title="Rewards" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Rewards</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => {
              // Navigate to history or show info
              setActiveTab('history');
            }}
          >
            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
          
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
              <Text style={styles.statValue}>
                {userStats.ranking === '10+' ? '10+' : userStats.ranking}
              </Text>
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
        {loadingVouchers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F4D3A" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <>
        {activeTab === 'vouchers' && (
          <View style={styles.voucherList}>
                {availableVouchers.length > 0 ? (
                  availableVouchers.map(v => renderVoucherCard(v, true))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>Không có voucher nào</Text>
                    <Text style={styles.emptyStateSubtext}>Vui lòng thử lại sau</Text>
                  </View>
                )}
          </View>
        )}
        
        {activeTab === 'my-vouchers' && (
          <View style={styles.voucherList}>
                {myVouchers.length > 0 ? (
                  myVouchers.map(v => renderVoucherCard(v, false))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>Bạn chưa có voucher nào</Text>
                    <Text style={styles.emptyStateSubtext}>Nhận voucher từ tab "Vouchers"</Text>
                  </View>
                )}
          </View>
        )}
        
        {activeTab === 'history' && (
          <View style={styles.historyList}>
                {usedVouchers.length > 0 ? (
                  usedVouchers.map((voucher) => (
              <View key={voucher.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>{voucher.title} - {voucher.discount}</Text>
                  <Text style={styles.historyDescription}>{voucher.description}</Text>
                        <Text style={styles.historyDate}>Mã: {voucher.code}</Text>
                </View>
              </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>Chưa có lịch sử</Text>
                    <Text style={styles.emptyStateSubtext}>Các voucher đã sử dụng sẽ hiển thị ở đây</Text>
          </View>
                )}
              </View>
            )}
          </>
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
  headerSafeArea: {
    backgroundColor: '#00704A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00704A',
    borderBottomLeftRadius: 20,
  },
  headerLeft: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    // Cream/Light Yellow background
    backgroundColor: '#FFF8E1',
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
    backgroundColor: '#FFD54F',
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
  ownedLabel: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  useButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Locked Voucher Slot Styles (Glassmorphism)
  lockedVoucherCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    minHeight: 200,
  },
  lockedGradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  lockedGradientStart: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  lockedGradientEnd: {
    flex: 1,
    backgroundColor: '#F7931E',
    opacity: 0.8,
  },
  lockedGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    justifyContent: 'center',
  },
  lockedVoucherContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  lockedDiscount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lockedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    opacity: 0.8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

