import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../../context/AuthProvider';
import { borrowTransactionsApi } from '../../../../src/services/api/borrowTransactionService';
import { productsApi } from '../../../../src/services/api/productService';
import { getCurrentUserProfileWithAutoRefresh } from '../../../../src/services/api/userService';
import { Product } from '../../../../src/types/product.types';

export default function CustomerProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [durationInDays, setDurationInDays] = useState<string>('30');
  const [userData, setUserData] = useState<any>(null);

  // Fetch product details
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading product with ID:', id);
        setLoading(true);

        const response = await productsApi.getByIdWithAutoRefresh(id);
        
        if (response && response.data) {
          setProduct(response.data);
        } else {
          Alert.alert('Lỗi', response?.message || 'Không tìm thấy sản phẩm.');
        }
      } catch (error: any) {
        console.error('❌ Error loading product:', error);
        Alert.alert('Lỗi', error.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadProduct();
    }, 100);

    return () => clearTimeout(timer);
  }, [id]);

  // Load user data to get wallet balance
  useEffect(() => {
    const loadUserData = async () => {
      if (state.accessToken && state.isAuthenticated) {
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
          setUserData(user);
        } catch (error: any) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [state.accessToken, state.isAuthenticated]);

  // Handle borrow button press
  const handleBorrow = async () => {
    if (!product || !state.isAuthenticated) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đặt mượn sản phẩm.');
      return;
    }

    if (product.status !== 'available') {
      Alert.alert('Thông báo', 'Sản phẩm này hiện không có sẵn để mượn.');
      return;
    }

    // Reload user data to get latest balance
    let currentUserData = userData;
    try {
      console.log('🔄 Reloading user data before borrow check...');
      currentUserData = await getCurrentUserProfileWithAutoRefresh();
      setUserData(currentUserData);
    } catch (error: any) {
      console.error('Error reloading user data:', error);
    }

    // Get deposit value safely
    const depositValue = (product.productSizeId as any)?.depositValue || 0;
    
    if (depositValue === 0) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin tiền cọc.');
      return;
    }

    // Parse duration from input
    const duration = parseInt(durationInDays) || 30;
    if (duration <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số ngày mượn hợp lệ (lớn hơn 0).');
      return;
    }

    // Get wallet balance
    const walletBalance = currentUserData?.wallet?.balance || 
                          (currentUserData?.wallet as any)?.availableBalance || 
                          0;
    const balanceAfterDeduction = walletBalance - depositValue;

    // Check if balance is sufficient
    if (balanceAfterDeduction < 0) {
      Alert.alert(
        'Số dư không đủ',
        `Số dư hiện tại của bạn không đủ để đặt mượn sản phẩm này.\n\nTiền cọc: ${depositValue.toLocaleString('vi-VN')} VNĐ\nSố dư hiện tại: ${walletBalance.toLocaleString('vi-VN')} VNĐ`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Nạp tiền',
            onPress: () => {
              router.push('/(protected)/customer/customer-wallet');
            },
          },
        ]
      );
      return;
    }
    
    // Confirm borrow with full details
    Alert.alert(
      'Xác nhận đặt mượn',
      `Bạn có chắc chắn muốn đặt mượn sản phẩm này?\n\nTiền cọc: ${depositValue.toLocaleString('vi-VN')} VNĐ\nSố dư hiện tại: ${walletBalance.toLocaleString('vi-VN')} VNĐ\nSố dư sau khi trừ: ${balanceAfterDeduction.toLocaleString('vi-VN')} VNĐ\nThời gian mượn: ${duration} ngày`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setBorrowing(true);
              console.log('📦 Creating borrow transaction...');

              // Extract businessId safely
              let businessId: string | undefined;
              if (!product.businessId) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin cửa hàng.');
                setBorrowing(false);
                return;
              }
              
              if (typeof product.businessId === 'string') {
                businessId = product.businessId;
              } else {
                businessId = (product.businessId as any)?._id || (product.businessId as any)?.id;
              }
              
              if (!businessId) {
                Alert.alert('Lỗi', 'Không tìm thấy ID cửa hàng.');
                setBorrowing(false);
                return;
              }

              const borrowDto = {
                productId: product._id,
                businessId: businessId,
                depositValue: depositValue,
                durationInDays: duration,
                type: 'online' as const,
              };

              const response = await borrowTransactionsApi.createWithAutoRefresh(borrowDto);
              
              console.log('✅ Borrow transaction created:', response);

              Alert.alert(
                'Thành công',
                'Yêu cầu mượn đã được gửi! Vui lòng đến cửa hàng để nhận sản phẩm.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/(protected)/customer');
                    },
                  },
                ]
              );
            } catch (error: any) {
              // Extract error message from multiple possible locations
              const errorMessage = 
                error?.response?.data?.message || 
                error?.message || 
                '';
              
              // Check for maximum concurrent borrow limit error (case-insensitive)
              const lowerErrorMessage = errorMessage.toLowerCase();
              if (lowerErrorMessage.includes('maximum concurrent') || 
                  lowerErrorMessage.includes('concurrent borrow limit') ||
                  lowerErrorMessage.includes('limit reached')) {
                Alert.alert(
                  'Đã đạt giới hạn mượn',
                  'Bạn đã đạt giới hạn số lượng sản phẩm có thể mượn đồng thời (tối đa 3 sản phẩm).\n\nVui lòng trả một số sản phẩm đang mượn trước khi mượn thêm.',
                  [
                    {
                      text: 'Xem lịch sử mượn',
                      onPress: () => {
                        router.push('/(protected)/customer/transaction-history');
                      },
                    },
                    {
                      text: 'Đóng',
                      style: 'cancel',
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Lỗi',
                  'Không thể tạo yêu cầu mượn. Vui lòng thử lại sau.'
                );
              }
            } finally {
              setBorrowing(false);
            }
          },
        },
      ]
    );
  };


  // Always show header, even when loading
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header - Always visible */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
        </View>
      ) : !product ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
          <Text style={styles.errorText}>Không tìm thấy thông tin sản phẩm</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      ) : product.productGroupId ? (
        <>
          {(() => {
            const businessName = !product.businessId
              ? 'Cửa hàng'
              : typeof product.businessId === 'string'
              ? 'Cửa hàng'
              : (product.businessId as any)?.businessName || 'Cửa hàng';
            
            const businessLogo = !product.businessId
              ? undefined
              : typeof product.businessId === 'string'
              ? undefined
              : (product.businessId as any)?.businessLogoUrl;

            const statusText = {
              available: 'Có sẵn',
              borrowed: 'Đã được mượn',
              maintenance: 'Đang bảo trì',
              retired: 'Đã ngừng hoạt động',
            }[product.status] || 'Không xác định';

            const statusColor = {
              available: '#10B981',
              borrowed: '#EF4444',
              maintenance: '#F59E0B',
              retired: '#6B7280',
            }[product.status] || '#6B7280';

            return (
              <>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                  {/* Product Image */}
                  {(() => {
                    // Try multiple image sources
                    const imageUrl = 
                      product.images?.[0] || 
                      (product.productGroupId as any)?.imageUrl ||
                      (product.productGroupId as any)?.image ||
                      null;
                    
                    return imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.placeholderImageText}>No Image</Text>
                      </View>
                    );
                  })()}

                  {/* Product Info */}
                  <View style={styles.content}>
                    <Text style={styles.productName}>
                      {(product.productGroupId as any)?.name || 'Sản phẩm'}
                    </Text>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusText}
                      </Text>
                    </View>

                    {/* Product Details */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
                      
                      <View style={styles.detailRow}>
                        <Ionicons name="cube" size={20} color="#6B7280" />
                        <Text style={styles.detailLabel}>Kích cỡ:</Text>
                        <Text style={styles.detailValue}>
                          {(product.productSizeId as any)?.name || (product.productSizeId as any)?.description || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="barcode" size={20} color="#6B7280" />
                        <Text style={styles.detailLabel}>Mã sản phẩm:</Text>
                        <Text style={styles.detailValue}>{product.serialNumber}</Text>
                      </View>

                      {product.condition && (
                        <View style={styles.detailRow}>
                          <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
                          <Text style={styles.detailLabel}>Tình trạng:</Text>
                          <Text style={styles.detailValue}>{product.condition}</Text>
                        </View>
                      )}
                    </View>

                    {/* Pricing Section */}
                    <View style={styles.pricingSection}>
                      <Text style={styles.sectionTitle}>Thông tin giá</Text>
                      
                      {(product.productSizeId as any)?.depositValue ? (
                        <View style={styles.priceRow}>
                          <Ionicons name="cash-outline" size={20} color="#0F4D3A" />
                          <View style={styles.priceInfo}>
                            <Text style={styles.priceLabel}>Tiền cọc:</Text>
                            <Text style={styles.priceValue}>
                              {((product.productSizeId as any).depositValue || 0).toLocaleString('vi-VN')} VNĐ
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.priceRow}>
                          <Ionicons name="cash-outline" size={20} color="#6B7280" />
                          <View style={styles.priceInfo}>
                            <Text style={styles.priceLabel}>Tiền cọc:</Text>
                            <Text style={styles.priceValue}>Chưa có thông tin</Text>
                          </View>
                        </View>
                      )}

                      {(product.productSizeId as any)?.rentalPrice && (
                        <View style={styles.priceRow}>
                          <Ionicons name="pricetag-outline" size={20} color="#0F4D3A" />
                          <View style={styles.priceInfo}>
                            <Text style={styles.priceLabel}>Giá thuê:</Text>
                            <Text style={styles.priceValue}>
                              {((product.productSizeId as any).rentalPrice || 0).toLocaleString('vi-VN')} VNĐ
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Business Info */}
                    <View style={styles.businessSection}>
                      <Text style={styles.sectionTitle}>Cửa hàng</Text>
                      
                      <View style={styles.businessRow}>
                        {businessLogo ? (
                          <Image
                            source={{ uri: businessLogo }}
                            style={styles.businessLogo}
                          />
                        ) : (
                          <View style={styles.businessLogoPlaceholder}>
                            <Ionicons name="storefront" size={24} color="#9CA3AF" />
                          </View>
                        )}
                        <Text style={styles.businessName}>{businessName}</Text>
                      </View>
                    </View>

                    {/* Description */}
                    {(product.productGroupId as any)?.description && (
                      <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Mô tả</Text>
                        <Text style={styles.descriptionText}>
                          {(product.productGroupId as any).description}
                        </Text>
                      </View>
                    )}

                    {/* Duration Input */}
                    {product.status === 'available' && (
                      <View style={styles.durationInputSection}>
                        <Text style={styles.sectionTitle}>Thông tin mượn</Text>
                        <View style={styles.durationInputContainer}>
                          <Text style={styles.durationLabel}>Thời gian mượn (ngày) *</Text>
                          <TextInput
                            style={styles.durationInput}
                            value={durationInDays}
                            onChangeText={(text) => {
                              // Only allow numbers
                              const numericValue = text.replace(/[^0-9]/g, '');
                              setDurationInDays(numericValue);
                            }}
                            placeholder="Nhập số ngày mượn"
                            keyboardType="numeric"
                            placeholderTextColor="#9CA3AF"
                          />
                          <Text style={styles.durationHint}>
                            Số ngày bạn muốn mượn sản phẩm này
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Action Button - Borrow Only */}
                {state.isAuthenticated && product.status === 'available' && (
                  <View style={styles.footer}>
                    <TouchableOpacity
                      style={[styles.borrowButton, borrowing && styles.buttonDisabled]}
                      onPress={handleBorrow}
                      disabled={borrowing}
                    >
                      {borrowing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="cube-outline" size={20} color="#fff" />
                          <Text style={styles.borrowButtonText}>Mượn sản phẩm</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {!state.isAuthenticated && (
                  <View style={styles.footer}>
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={() => router.push('/auth/login')}
                    >
                      <Text style={styles.loginButtonText}>Đăng nhập để đặt mượn</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            );
          })()}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Thông tin sản phẩm không đầy đủ</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#00704A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonHeader: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#00704A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  pricingSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00704A',
  },
  businessSection: {
    marginBottom: 24,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  businessLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  durationInputSection: {
    marginBottom: 24,
  },
  durationInputContainer: {
    marginTop: 12,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  durationInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  durationHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  borrowButton: {
    width: '100%',
    backgroundColor: '#0F4D3A',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  borrowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButton: {
    backgroundColor: '#00704A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

