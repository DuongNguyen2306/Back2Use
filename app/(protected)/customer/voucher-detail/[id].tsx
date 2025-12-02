import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../../context/AuthProvider';
import { voucherApi } from '../../../../src/services/api/voucherService';

const { width } = Dimensions.get('window');

interface VoucherDetail {
  _id: string;
  voucherId?: string;
  voucherType?: string;
  businessId?: string;
  redeemedBy?: string;
  fullCode?: string;
  status?: string;
  redeemedAt?: string;
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
  voucherInfo?: {
    _id: string;
    customName: string;
    customDescription: string;
    discountPercent: number;
    baseCode: string;
    rewardPointCost?: number;
    maxUsage?: number;
    redeemedCount?: number;
    startDate: string;
    endDate: string;
    status: string;
  };
  businessInfo?: {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    openTime?: string;
    closeTime?: string;
    businessLogoUrl?: string;
  };
}

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoucherDetail();
  }, [id]);

  const loadVoucherDetail = async () => {
    try {
      setLoading(true);
      // Get my vouchers and find the one with matching ID
      const response = await voucherApi.getMy({ page: 1, limit: 100 });
      
      if (response.statusCode === 200) {
        let vouchersArray: any[] = [];
        if (Array.isArray(response.data)) {
          vouchersArray = response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          vouchersArray = response.data.items;
        }
        
        const foundVoucher = vouchersArray.find((v: any) => v._id === id || v.voucherId === id);
        if (foundVoucher) {
          setVoucher(foundVoucher);
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy voucher');
          router.back();
        }
      }
    } catch (error: any) {
      // Silently handle errors
      Alert.alert('Lỗi', 'Không thể tải thông tin voucher');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'redeemed':
        return 'Đã nhận';
      case 'used':
        return 'Đã sử dụng';
      case 'expired':
        return 'Đã hết hạn';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'redeemed':
        return '#10B981';
      case 'used':
        return '#6B7280';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết Voucher</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (!voucher || !voucher.voucherInfo) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết Voucher</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Không tìm thấy voucher</Text>
        </View>
      </View>
    );
  }

  const voucherInfo = voucher.voucherInfo;
  const businessInfo = voucher.businessInfo;
  const gradientColor = '#FF6B35'; // Default gradient color

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết Voucher</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Voucher Card */}
        <View style={[styles.voucherCard, { backgroundColor: gradientColor }]}>
          {/* Watermark */}
          <View style={styles.watermarkContainer}>
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>%</Text>
              <View style={styles.watermarkDots}>
                <View style={styles.watermarkDot} />
                <View style={styles.watermarkDot} />
              </View>
            </View>
          </View>

          <View style={styles.voucherCardContent}>
            <Text style={styles.voucherCardTitle}>Up to</Text>
            <Text style={styles.voucherCardDiscount}>{voucherInfo.discountPercent}% OFF</Text>
            <Text style={styles.voucherCardDescription}>{voucherInfo.customDescription}</Text>
            
            <View style={styles.voucherCodeContainer}>
              <Text style={styles.voucherCodeLabel}>Mã voucher</Text>
              <Text style={styles.voucherCode}>{voucher.fullCode || voucherInfo.baseCode}</Text>
            </View>

            <View style={styles.voucherCardFooter}>
              <View>
                <Text style={styles.validUntilLabel}>Hạn sử dụng</Text>
                <Text style={styles.validUntil}>{formatDate(voucherInfo.endDate)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(voucher.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(voucher.status) }]}>
                  {getStatusText(voucher.status)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        {voucher.qrCode && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="qr-code-outline" size={24} color="#00704A" />
              <Text style={styles.sectionTitle}>Mã QR</Text>
            </View>
            <View style={styles.qrCodeContainer}>
              <Image source={{ uri: voucher.qrCode }} style={styles.qrCodeImage} />
              <Text style={styles.qrCodeHint}>Hiển thị mã QR này khi sử dụng voucher</Text>
            </View>
          </View>
        )}

        {/* Business Info Section */}
        {businessInfo && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront-outline" size={24} color="#00704A" />
              <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>
            </View>
            <View style={styles.businessCard}>
              {businessInfo.businessLogoUrl && (
                <Image source={{ uri: businessInfo.businessLogoUrl }} style={styles.businessLogo} />
              )}
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{businessInfo.businessName}</Text>
                {businessInfo.businessAddress && (
                  <View style={styles.businessRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.businessText}>{businessInfo.businessAddress}</Text>
                  </View>
                )}
                {businessInfo.businessPhone && (
                  <View style={styles.businessRow}>
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                    <Text style={styles.businessText}>{businessInfo.businessPhone}</Text>
                  </View>
                )}
                {businessInfo.openTime && businessInfo.closeTime && (
                  <View style={styles.businessRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.businessText}>
                      {businessInfo.openTime} - {businessInfo.closeTime}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Voucher Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#00704A" />
            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          </View>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tên voucher</Text>
              <Text style={styles.detailValue}>{voucherInfo.customName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Giảm giá</Text>
              <Text style={styles.detailValue}>{voucherInfo.discountPercent}%</Text>
            </View>
            {voucherInfo.rewardPointCost && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Điểm đổi</Text>
                <Text style={styles.detailValue}>{voucherInfo.rewardPointCost} điểm</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày bắt đầu</Text>
              <Text style={styles.detailValue}>{formatDate(voucherInfo.startDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngày hết hạn</Text>
              <Text style={styles.detailValue}>{formatDate(voucherInfo.endDate)}</Text>
            </View>
            {voucher.redeemedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ngày nhận</Text>
                <Text style={styles.detailValue}>{formatDate(voucher.redeemedAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color="#00704A" />
            <Text style={styles.sectionTitle}>Điều kiện sử dụng</Text>
          </View>
          <View style={styles.termsCard}>
            <Text style={styles.termsText}>
              • Voucher chỉ có hiệu lực trong thời gian quy định{'\n'}
              • Mỗi voucher chỉ được sử dụng một lần{'\n'}
              • Voucher không thể hoàn tiền hoặc chuyển nhượng{'\n'}
              • Áp dụng theo điều kiện của cửa hàng
            </Text>
          </View>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  voucherCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
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
    fontSize: 64,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  watermarkDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  watermarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  voucherCardContent: {
    zIndex: 1,
  },
  voucherCardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  voucherCardDiscount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  voucherCardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    lineHeight: 22,
  },
  voucherCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  voucherCodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  voucherCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validUntilLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  validUntil: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrCodeHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  businessText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  termsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
});





