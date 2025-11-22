import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthProvider';
import { productsApi } from '../../src/services/api/productService';
import { borrowTransactionsApi } from '../../src/services/api/borrowTransactionService';
import { Product } from '../../src/types/product.types';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);

  // Fetch product details
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // Wait for auth state to be hydrated
      if (!state.isHydrated) {
        return;
      }

      try {
        console.log('🔍 Loading product with ID:', id);
        setLoading(true);

        const response = await productsApi.getByIdWithAutoRefresh(id);
        
        if (response.data) {
          setProduct(response.data);
          console.log('✅ Product loaded:', response.data);
        } else {
          Alert.alert('Lỗi', response.message || 'Không tìm thấy sản phẩm.');
        }
      } catch (error: any) {
        console.error('❌ Error loading product:', error);
        Alert.alert(
          'Lỗi',
          error.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, state.isHydrated]);

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

    // Confirm borrow
    Alert.alert(
      'Xác nhận đặt mượn',
      `Bạn có chắc chắn muốn đặt mượn sản phẩm này?\n\nTiền cọc: ${product.productSizeId.depositValue.toLocaleString('vi-VN')} VNĐ\nThời gian mượn: 7 ngày`,
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

              const businessId = typeof product.businessId === 'string' 
                ? product.businessId 
                : product.businessId._id;

              const borrowDto = {
                productId: product._id,
                businessId: businessId,
                depositValue: product.productSizeId.depositValue,
                durationInDays: 7,
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
                      // Navigate to customer dashboard or transaction history
                      if (state.role === 'customer') {
                        router.replace('/(protected)/customer');
                      } else {
                        router.replace('/');
                      }
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Error creating borrow transaction:', error);
              Alert.alert(
                'Lỗi',
                error.message || 'Không thể tạo yêu cầu mượn. Vui lòng thử lại.'
              );
            } finally {
              setBorrowing(false);
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (!product) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
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
      </View>
    );
  }

  const businessName = typeof product.businessId === 'string'
    ? 'Cửa hàng'
    : product.businessId.businessName;
  
  const businessLogo = typeof product.businessId === 'string'
    ? undefined
    : product.businessId.businessLogoUrl;

  const statusText = {
    available: 'Có sẵn',
    borrowed: 'Đã được mượn',
    maintenance: 'Đang bảo trì',
    retired: 'Đã ngừng hoạt động',
  }[product.status];

  const statusColor = {
    available: '#10B981',
    borrowed: '#EF4444',
    maintenance: '#F59E0B',
    retired: '#6B7280',
  }[product.status];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header */}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          </View>
        )}

        {/* Product Info */}
        <View style={styles.content}>
          {/* Product Name */}
          <Text style={styles.productName}>{product.productGroupId.name}</Text>

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
              <Text style={styles.detailValue}>{product.productSizeId.name}</Text>
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
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tiền cọc:</Text>
              <Text style={styles.priceValue}>
                {product.productSizeId.depositValue.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>

            {product.productSizeId.rentalPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giá thuê:</Text>
                <Text style={styles.priceValue}>
                  {product.productSizeId.rentalPrice.toLocaleString('vi-VN')} VNĐ
                </Text>
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
          {product.productGroupId.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.descriptionText}>
                {product.productGroupId.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Borrow Button */}
      {state.isAuthenticated && product.status === 'available' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.borrowButton, borrowing && styles.borrowButtonDisabled]}
            onPress={handleBorrow}
            disabled={borrowing}
          >
            {borrowing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#fff" />
                <Text style={styles.borrowButtonText}>Đặt mượn sản phẩm này</Text>
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
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  borrowButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  borrowButtonDisabled: {
    opacity: 0.6,
  },
  borrowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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

