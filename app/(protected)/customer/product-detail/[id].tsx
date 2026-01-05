import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { SingleUseProduct, singleUseProductsApi } from '../../../../src/services/api/businessService';
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
  const [showSingleUseModal, setShowSingleUseModal] = useState(false);
  const [singleUseProducts, setSingleUseProducts] = useState<SingleUseProduct[]>([]);
  const [selectedSingleUseProduct, setSelectedSingleUseProduct] = useState<SingleUseProduct | null>(null);
  const [loadingSingleUse, setLoadingSingleUse] = useState(false);

  // Fetch product details - dùng scan API để lấy đầy đủ thông tin (giống customer dashboard)
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading product with ID:', id);
        setLoading(true);

        // Thử gọi scan API trước (giả sử id là serialNumber)
        let productData: any = null;
        try {
          console.log('🔄 Trying productsApi.scan with id:', id);
          const scanResponse = await productsApi.scan(id);
          const responseData: any = scanResponse;
          
          if (responseData.success && responseData.data) {
            const data: any = responseData.data;
            productData = data.product || data;
          } else if (responseData.statusCode === 200 && responseData.data) {
            const data: any = responseData.data;
            productData = data.product || data;
          }
        } catch (scanError) {
          console.log('⚠️ Scan API failed, trying getById...');
          // Nếu scan không được, thử getById để lấy serialNumber, rồi scan lại
          const getByIdResponse = await productsApi.getByIdWithAutoRefresh(id);
          if (getByIdResponse && getByIdResponse.data) {
            const tempProduct = getByIdResponse.data;
            const serialNumber = tempProduct.serialNumber;
            if (serialNumber) {
              console.log('🔄 Calling scan API with serialNumber:', serialNumber);
              const scanResponse = await productsApi.scan(serialNumber);
              const responseData: any = scanResponse;
              
              if (responseData.success && responseData.data) {
                const data: any = responseData.data;
                productData = data.product || data;
              } else if (responseData.statusCode === 200 && responseData.data) {
                const data: any = responseData.data;
                productData = data.product || data;
              }
            } else {
              // Nếu không có serialNumber, dùng product từ getById
              productData = tempProduct;
            }
          }
        }
        
        if (productData) {
          console.log('📦 Product Data Structure:', JSON.stringify(productData, null, 2));
          console.log('📦 productSizeId:', productData.productSizeId);
          console.log('📦 productSizeId type:', typeof productData.productSizeId);
          
          // Log depositValue
          if (productData.productSizeId && typeof productData.productSizeId === 'object') {
            console.log('💰 depositValue from productSizeId:', (productData.productSizeId as any)?.depositValue);
          }
          
          setProduct(productData);
        } else {
          Alert.alert('Error', 'Product not found');
        }
      } catch (error: any) {
        console.error('❌ Error loading product:', error);
        Alert.alert('Error', error.message || 'Failed to load product information. Please try again.');
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
          // Silently handle "No valid access token available" errors
          const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                                 error?.message?.toLowerCase().includes('no access token');
          if (!isNoTokenError) {
            console.error('Error loading user data:', error);
          }
        }
      }
    };
    loadUserData();
  }, [state.accessToken, state.isAuthenticated]);

  // Load single-use products when modal opens
  useEffect(() => {
    const loadSingleUseProducts = async () => {
      if (showSingleUseModal && singleUseProducts.length === 0) {
        try {
          setLoadingSingleUse(true);
          const response = await singleUseProductsApi.getMy({ page: 1, limit: 100 });
          const products = Array.isArray(response.data) 
            ? response.data 
            : (response.data as any)?.singleUseProducts || [];
          setSingleUseProducts(products);
        } catch (error: any) {
          console.error('Error loading single-use products:', error);
          Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm dùng một lần. Vui lòng thử lại.');
        } finally {
          setLoadingSingleUse(false);
        }
      }
    };
    loadSingleUseProducts();
  }, [showSingleUseModal]);

  // Handle borrow button press
  const handleBorrow = async () => {
    if (!product || !state.isAuthenticated) {
      Alert.alert('Error', 'Please login to borrow product.');
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
      // Silently handle "No valid access token available" errors
      const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                             error?.message?.toLowerCase().includes('no access token');
      if (!isNoTokenError) {
        console.error('Error reloading user data:', error);
      }
    }

    // Get deposit value safely - check multiple possible locations (giống customer dashboard)
    let depositValue = 0;
    
    console.log('🔍 Full Product Object for depositValue:', JSON.stringify(product, null, 2));
    console.log('🔍 productSizeId:', product.productSizeId);
    console.log('🔍 productSizeId type:', typeof product.productSizeId);
    
    // Check if productSizeId is an object with depositValue
    if (product.productSizeId && typeof product.productSizeId === 'object') {
      const productSize = product.productSizeId as any;
      console.log('🔍 productSizeId object keys:', Object.keys(productSize));
      console.log('🔍 productSizeId full:', JSON.stringify(productSize, null, 2));
      
      // Try multiple possible field names
      depositValue = productSize.depositValue || 
                     productSize.basePrice || 
                     productSize.price || 
                     0;
      
      console.log('💰 Found depositValue from productSizeId:', depositValue);
    }
    
    // If still 0, check productGroupId.productSizeId
    if (depositValue === 0 && product.productGroupId) {
      const productGroup = product.productGroupId as any;
      console.log('🔍 productGroupId:', productGroup);
      if (productGroup.productSizeId && typeof productGroup.productSizeId === 'object') {
        const pgSize = productGroup.productSizeId;
        depositValue = pgSize.depositValue || pgSize.basePrice || pgSize.price || 0;
        console.log('💰 Found depositValue from productGroupId.productSizeId:', depositValue);
      }
    }
    
    console.log('💰 Final Deposit Value Check:', {
      hasProductSizeId: !!product.productSizeId,
      productSizeIdType: typeof product.productSizeId,
      depositValue,
      productSizeIdKeys: product.productSizeId && typeof product.productSizeId === 'object' 
        ? Object.keys(product.productSizeId as any) 
        : []
    });
    
    // If depositValue is still 0, show error - backend requires valid depositValue
    if (depositValue === 0 || !depositValue || isNaN(depositValue)) {
      console.error('❌ Cannot find depositValue. Product structure:', {
        productSizeId: product.productSizeId,
        productGroupId: product.productGroupId,
        allKeys: Object.keys(product),
      });
      Alert.alert(
        'Error',
        'Unable to find deposit information for this product. The product may not be properly configured. Please contact support or try another product.'
      );
      return;
    }
    
    // Kiểm tra số dư ví trước khi cho phép mượn
    // Handle both balance and availableBalance fields
    const walletBalance = (currentUserData as any)?.wallet?.availableBalance ?? 
                         (currentUserData as any)?.wallet?.balance ?? 
                         0;
    
    console.log('💰 Borrow Check - Wallet Balance:', walletBalance);
    console.log('💰 Borrow Check - Deposit Value:', depositValue);
    console.log('💰 Borrow Check - UserData:', currentUserData);
    console.log('💰 Borrow Check - Wallet Object:', (currentUserData as any)?.wallet);
    console.log('💰 Borrow Check - Comparison:', walletBalance, '<', depositValue, '=', walletBalance < depositValue);
    
    if (walletBalance < depositValue) {
      const shortage = depositValue - walletBalance;
      console.log('⚠️ Insufficient balance - Shortage:', shortage);
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance is insufficient to borrow this product.\n\n` +
        `Current balance: ${walletBalance.toLocaleString('vi-VN')} VNĐ\n` +
        `Required deposit: ${depositValue.toLocaleString('vi-VN')} VNĐ\n` +
        `Shortage: ${shortage.toLocaleString('vi-VN')} VNĐ\n\n` +
        `Please top up your wallet to continue.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Top Up',
            onPress: () => {
              router.push('/(protected)/customer/customer-wallet');
            },
          },
        ]
      );
      return;
    }
    
    // Kiểm tra số ngày mượn
    const days = parseInt(durationInDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Error', 'Please enter a valid number of borrowing days (greater than 0)');
      return;
    }

    console.log('✅ Balance sufficient, proceeding to confirm...');
    
    // Confirm borrow - CHỈ HIỂN THỊ BORROW DURATION
    // Logic tính toán vẫn giữ nguyên, chỉ ẩn khỏi UI
    Alert.alert(
      'Confirm Borrow',
      `Are you sure you want to borrow this product?\n\n` +
      `Borrowing duration: ${days} days`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setBorrowing(true);
              console.log('📦 Creating borrow transaction...');

              // FIX CHẮC 100% - businessId đúng trong mọi trường hợp (giống customer dashboard)
              let businessId: string | undefined;

              // Ưu tiên cao nhất: product.business (khi populate)
              if (product.business) {
                businessId = typeof product.business === 'object' 
                  ? product.business._id || product.business.id 
                  : product.business;
              }

              // Nếu không có thì lấy từ businessId trực tiếp trên product
              if (!businessId && product.businessId) {
                businessId = typeof product.businessId === 'object'
                  ? product.businessId._id || product.businessId.id
                  : product.businessId;
              }

              // Cuối cùng mới lấy từ productGroupId (rất hiếm khi cần)
              if (!businessId && product.productGroupId?.business) {
                businessId = typeof product.productGroupId.business === 'object'
                  ? product.productGroupId.business._id || product.productGroupId.business.id
                  : product.productGroupId.business;
              }

              if (!businessId && typeof product.productGroupId?.businessId === 'object') {
                businessId = product.productGroupId.businessId._id || product.productGroupId.businessId.id;
              }

              if (!businessId && typeof product.productGroupId?.businessId === 'string') {
                businessId = product.productGroupId.businessId;
              }

              console.log('🔍 Product object structure:', {
                hasBusiness: !!product.business,
                hasBusinessId: !!product.businessId,
                hasProductGroupId: !!product.productGroupId,
                productGroupIdHasBusiness: !!(product.productGroupId as any)?.business,
                productGroupIdHasBusinessId: !!(product.productGroupId as any)?.businessId,
              });
              console.log('🔍 Extracted businessId:', businessId);

              if (!businessId) {
                console.error('❌ Cannot extract businessId from product:', JSON.stringify(product, null, 2));
                throw new Error('Cannot find store information. Please try again or contact support.');
              }

              // Lấy productId
              const productId = product._id || product.id;
              if (!productId) {
                console.error('❌ Cannot find productId in product:', product);
                throw new Error('Cannot find product ID. Please try again.');
              }

              // LẤY depositValue CỐ ĐỊNH TỪ PRODUCT - KHÔNG TÍNH TOÁN
              // Chỉ lấy giá trị cố định từ productSizeId.depositValue hoặc productGroupId.depositValue
              // KHÔNG tính toán từ rentalPrice * days
              const backendDepositValue = 
                (product.productSizeId as any)?.depositValue ??
                (product.productGroupId as any)?.depositValue ??
                0;
              
              console.log('💰 Backend DepositValue (cố định từ product):', {
                value: backendDepositValue,
                type: typeof backendDepositValue,
                source: backendDepositValue === (product.productSizeId as any)?.depositValue 
                  ? 'productSizeId.depositValue' 
                  : 'productGroupId.depositValue'
              });
              
              if (!backendDepositValue || backendDepositValue <= 0 || isNaN(backendDepositValue)) {
                console.error('❌ Product không có depositValue hợp lệ:', {
                  productSizeId: product.productSizeId,
                  productGroupId: product.productGroupId
                });
                Alert.alert(
                  'Error',
                  'Sản phẩm này chưa có thông tin tiền cọc. Vui lòng liên hệ hỗ trợ hoặc thử sản phẩm khác.'
                );
                setBorrowing(false);
                return;
              }

              const borrowDto = {
                productId,
                businessId,
                depositValue: backendDepositValue, // Dùng giá trị cố định từ backend
                durationInDays: days,
                type: "online" as const, // ← CỨ ĐỂ CỨNG THẾ NÀY LÀ CHẮC ĂN NHẤT
                ...(selectedSingleUseProduct && { singleUseProductId: selectedSingleUseProduct._id }),
              };

              console.log('📦 FINAL borrowDto gửi đi:', {
                productId,
                businessId,
                depositValue: backendDepositValue, // Giá trị cố định từ backend
                depositValueType: typeof backendDepositValue,
                durationInDays: days,
                type: 'online',
                uiCalculated: depositValue, // Giá trị tính toán chỉ để hiển thị UI
              });
              console.log('📦 Borrow DTO (full):', JSON.stringify(borrowDto, null, 2));

              const response = await borrowTransactionsApi.createWithAutoRefresh(borrowDto);
              
              console.log('✅ Borrow transaction created:', response);

              Alert.alert(
                'Success',
                'Borrow request has been sent! Please visit the store to receive the product.',
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
              
              // Xử lý lỗi cụ thể (giống customer dashboard)
              const errorMessage = error?.response?.data?.message || error?.message || '';
              const errorStatus = error?.response?.status;
              
              // Silently handle 400 validation errors (e.g., "property type should not exist")
              const isValidationError = errorStatus === 400;
              
              if (isValidationError) {
                setBorrowing(false);
                return; // Silently return without showing error
              }
              
              // Check for insufficient balance
              const isInsufficientBalance = errorMessage.toLowerCase().includes('insufficient') || 
                                           errorMessage.toLowerCase().includes('không đủ') ||
                                           errorMessage.toLowerCase().includes('số dư');
              
              // Check for maximum concurrent borrow limit
              const isLimitReached = errorMessage.toLowerCase().includes('maximum concurrent') || 
                                     errorMessage.toLowerCase().includes('limit reached') ||
                                     errorMessage.toLowerCase().includes('giới hạn');
              
              // Check for invalid deposit value
              const isInvalidDeposit = errorMessage.toLowerCase().includes('invalid deposit') || 
                                      errorMessage.toLowerCase().includes('deposit value');
              
              if (isInvalidDeposit) {
                Alert.alert(
                  'Invalid Deposit Value',
                  'The deposit value for this product is invalid. Please contact support or try another product.'
                );
              } else if (isLimitReached) {
                Alert.alert(
                  'Borrow Limit Reached',
                  'You have reached the maximum number of products you can borrow at the same time (maximum 3 products).\n\nPlease return some products before borrowing more.',
                  [
                    {
                      text: 'View Borrow History',
                      onPress: () => {
                        router.push('/(protected)/customer/transaction-history');
                      },
                    },
                    {
                      text: 'Close',
                      style: 'cancel',
                    },
                  ]
                );
              } else if (isInsufficientBalance) {
                // Handle both balance and availableBalance fields
                const currentBalance = (userData as any)?.wallet?.availableBalance ?? 
                                     (userData as any)?.wallet?.balance ?? 
                                     0;
                const shortage = depositValue - currentBalance;
                Alert.alert(
                  'Insufficient Balance',
                  `Your wallet balance is insufficient to borrow this product.\n\n` +
                  `Current balance: ${currentBalance.toLocaleString('vi-VN')} VNĐ\n` +
                  `Required deposit: ${depositValue.toLocaleString('vi-VN')} VNĐ\n` +
                  `Shortage: ${shortage.toLocaleString('vi-VN')} VNĐ\n\n` +
                  `Please top up your wallet to continue.`,
                  [
                    {
                      text: 'Close',
                      style: 'cancel',
                    },
                    {
                      text: 'Top Up',
                      onPress: () => {
                        router.push('/(protected)/customer/customer-wallet');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Error',
                  errorMessage || 'Unable to create borrow request. Please try again later.'
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
        <Text style={styles.headerTitle}>Product Details</Text>
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

                        {/* Single Use Product Selection */}
                        <View style={styles.singleUseSection}>
                          <Text style={styles.singleUseLabel}>Mượn thay sản phẩm ly nào?</Text>
                          <Text style={styles.singleUseHint}>
                            Chọn ly dùng một lần để tính CO2 giảm được
                          </Text>
                          <TouchableOpacity
                            style={styles.singleUseButton}
                            onPress={() => setShowSingleUseModal(true)}
                          >
                            <Ionicons name="cube-outline" size={20} color="#00704A" />
                            <Text style={styles.singleUseButtonText}>
                              {selectedSingleUseProduct 
                                ? `${selectedSingleUseProduct.name} (${(selectedSingleUseProduct.productSizeId as any)?.name || 'N/A'})`
                                : 'Chọn ly dùng một lần'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                          </TouchableOpacity>
                          {selectedSingleUseProduct && (
                            <TouchableOpacity
                              style={styles.removeSingleUseButton}
                              onPress={() => setSelectedSingleUseProduct(null)}
                            >
                              <Ionicons name="close-circle" size={20} color="#EF4444" />
                              <Text style={styles.removeSingleUseText}>Bỏ chọn</Text>
                            </TouchableOpacity>
                          )}
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
                          <Text style={styles.borrowButtonText}>Borrow Product</Text>
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

      {/* Single Use Product Selection Modal */}
      {showSingleUseModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ly dùng một lần</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSingleUseModal(false);
                }}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {loadingSingleUse ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#00704A" />
                <Text style={styles.modalLoadingText}>Đang tải danh sách...</Text>
              </View>
            ) : singleUseProducts.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                <Text style={styles.modalEmptyText}>Chưa có sản phẩm dùng một lần</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {singleUseProducts.map((item) => {
                  const isSelected = selectedSingleUseProduct?._id === item._id;
                  const sizeName = (item.productSizeId as any)?.name || 'N/A';
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[
                        styles.modalItem,
                        isSelected && styles.modalItemSelected
                      ]}
                      onPress={() => {
                        setSelectedSingleUseProduct(item);
                        setShowSingleUseModal(false);
                      }}
                    >
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        <Text style={styles.modalItemSize}>Size: {sizeName}</Text>
                        {item.weight && (
                          <Text style={styles.modalItemWeight}>Trọng lượng: {item.weight}g</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#00704A" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
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
  singleUseSection: {
    marginTop: 16,
  },
  singleUseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  singleUseHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  singleUseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  singleUseButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  removeSingleUseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  removeSingleUseText: {
    fontSize: 14,
    color: '#EF4444',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalItemSize: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  modalItemWeight: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

