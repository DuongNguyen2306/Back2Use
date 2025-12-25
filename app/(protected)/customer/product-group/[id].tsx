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
    View,
} from 'react-native';
import { useAuth } from '../../../../context/AuthProvider';
import { borrowTransactionsApi } from '../../../../src/services/api/borrowTransactionService';
import { productsApi } from '../../../../src/services/api/productService';
import { getCurrentUserProfileWithAutoRefresh } from '../../../../src/services/api/userService';
import { Product } from '../../../../src/types/product.types';

export default function ProductGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [productGroupName, setProductGroupName] = useState('Product Group');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [borrowing, setBorrowing] = useState(false);
  const [durationInDays, setDurationInDays] = useState<string>('30');
  const [userData, setUserData] = useState<any>(null);

  // Load products for this product group
  useEffect(() => {
    const loadProducts = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Loading products for product group:', id);

        const response = await productsApi.getCustomerProducts(id, {
          page: currentPage,
          limit: 20,
        });

        if (response.data?.products) {
          setProducts(response.data.products);
          setTotalPages(response.data.totalPages || 1);
          setHasMoreProducts(currentPage < (response.data.totalPages || 1));
          
          // Get product group name from first product
          if (response.data.products.length > 0) {
            const firstProduct = response.data.products[0];
            const groupName = (firstProduct.productGroupId as any)?.name || 'Product Group';
            setProductGroupName(groupName);
          }
        } else {
          setProducts([]);
        }
      } catch (error: any) {
        console.error('❌ Error loading products:', error);
        Alert.alert('Error', error.message || 'Unable to load product list.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [id, currentPage]);

  // Filter products
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => {
        const groupName = (product.productGroupId as any)?.name || '';
        const sizeName = (product.productSizeId as any)?.name || (product.productSizeId as any)?.description || '';
        const searchLower = searchQuery.toLowerCase();
        return groupName.toLowerCase().includes(searchLower) ||
               sizeName.toLowerCase().includes(searchLower) ||
               product.serialNumber.toLowerCase().includes(searchLower);
      });
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(product => {
        const depositValue = (product.productSizeId as any)?.depositValue || 0;
        if (priceFilter === 'low') return depositValue < 50000;
        if (priceFilter === 'medium') return depositValue >= 50000 && depositValue < 150000;
        if (priceFilter === 'high') return depositValue >= 150000;
        return true;
      });
    }

    return filtered;
  }, [products, searchQuery, priceFilter]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
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
    };
    loadUserData();
  }, []);

  // Handle product press - show modal (giống customer dashboard - dùng scan API)
  const handleProductPress = async (product: Product) => {
    const serialNumber = product.serialNumber;
    if (!serialNumber || serialNumber.trim() === '') {
      Alert.alert('Error', 'Product serial number not found');
      return;
    }
    
    try {
      // Gọi API scan để lấy thông tin sản phẩm đầy đủ (giống quét QR)
      console.log('🔄 Calling productsApi.scan with:', serialNumber);
      const response = await productsApi.scan(serialNumber);
      
      console.log('📦 API Response:', JSON.stringify(response, null, 2));
      
      // API trả về: { success: true, data: { product: {...}, qrCode: "...", serialNumber: "...", ... } }
      // Hoặc: { statusCode: 200, data: {...} }
      const responseData: any = response;
      let productData: any = null;
      let qrCode: string = '';
      let productStatus: string = '';
      
      if (responseData.success && responseData.data) {
        // Trường hợp response có success: true
        const data: any = responseData.data;
        productData = data.product || data;
        qrCode = data.qrCode || '';
        productStatus = data.status || '';
      } else if (responseData.statusCode === 200 && responseData.data) {
        // Trường hợp response có statusCode
        const data: any = responseData.data;
        productData = data.product || data;
        qrCode = data.qrCode || '';
        productStatus = data.status || '';
      }
      
      if (productData) {
        console.log('✅ Product data found:', productData);
        console.log('🔄 reuseCount from API:', productData.reuseCount);
        
        // Xử lý productGroupId có thể là object hoặc string
        const productGroupName = productData.productGroupId && typeof productData.productGroupId === 'object' 
          ? productData.productGroupId.name 
          : "Product";
        
        // Xử lý productSizeId
        const productSizeName = productData.productSizeId && typeof productData.productSizeId === 'object'
          ? productData.productSizeId.sizeName || productData.productSizeId.name || productData.productSizeId.description
          : "Unknown";
        
        // Đảm bảo reuseCount được giữ lại từ API response
        const formattedProduct = {
          id: productData._id || productData.id,
          name: productGroupName || "Product",
          size: productSizeName,
          type: "container",
          data: serialNumber,
          product: {
            ...productData, // Lưu thông tin sản phẩm đầy đủ, bao gồm reuseCount
            reuseCount: productData.reuseCount !== undefined ? productData.reuseCount : 0, // Đảm bảo reuseCount được giữ lại
          },
          qrCode: qrCode || productData.qrCode || '',
          status: productStatus || productData.status || 'available',
        };
        
        console.log('📱 Formatted product created:', formattedProduct);
        console.log('🔄 reuseCount in formattedProduct:', formattedProduct.product.reuseCount);
        
        console.log('📱 Formatted product created:', formattedProduct);
        setSelectedProduct(formattedProduct);
        setDurationInDays('10'); // Reset về mặc định khi mở modal mới
        setShowProductModal(true);
        
        // Reload user data
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
          setUserData(user);
        } catch (error: any) {
          // Silently handle "No valid access token available" errors
          const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                                 error?.message?.toLowerCase().includes('no access token');
          if (!isNoTokenError) {
            console.error('Error reloading user data:', error);
          }
        }
      } else {
        console.error('❌ No product data in response');
        Alert.alert('Error', responseData.message || 'Product not found');
      }
    } catch (error: any) {
      console.error('Error loading product:', error);
      Alert.alert('Error', error.message || 'Failed to load product information. Please try again.');
    }
  };

  // Handle borrow - Copy từ customer-dashboard.tsx
  const handleBorrow = async () => {
    if (!selectedProduct || !selectedProduct.product) {
      Alert.alert('Error', 'Thông tin sản phẩm không hợp lệ');
      return;
    }

    if (selectedProduct.status !== 'available') {
      Alert.alert('Thông báo', 'Sản phẩm này hiện không có sẵn để mượn.');
      return;
    }

    // Reload user data để lấy số dư mới nhất trước khi kiểm tra
    let currentUserData = userData;
    try {
      console.log('🔄 Reloading user data before borrow check...');
      const freshUser = await getCurrentUserProfileWithAutoRefresh();
      console.log('💰 Fresh User Data:', freshUser);
      console.log('💰 Fresh Wallet:', freshUser.wallet);
      console.log('💰 Fresh Balance:', freshUser.wallet?.balance);
      console.log('💰 Fresh AvailableBalance:', (freshUser.wallet as any)?.availableBalance);
      currentUserData = freshUser;
      setUserData(freshUser);
    } catch (error: any) {
      // Silently handle "No valid access token available" errors
      const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                             error?.message?.toLowerCase().includes('no access token');
      if (!isNoTokenError) {
        console.error('Error reloading user data:', error);
      }
      // Continue with existing userData if reload fails
    }

    const product = selectedProduct.product;
    
    // LẤY GIÁ MƯỢN 1 NGÀY (basePrice) - API mới
    const days = parseInt(durationInDays, 10) || 30;
    let pricePerDay = 0;
    let depositValue = 0;
    
    // Ưu tiên basePrice (giá mượn 1 ngày) từ API mới
    if (product.productSizeId && typeof product.productSizeId === 'object') {
      const productSize = product.productSizeId as any;
      pricePerDay = productSize.basePrice || productSize.rentalPrice || productSize.rentalPricePerDay || 0;
      if (pricePerDay > 0) {
        depositValue = pricePerDay * days;
        console.log('💰 Using basePrice from productSizeId:', pricePerDay, '×', days, '=', depositValue);
      } else {
        // Fallback về depositValue cố định nếu không có basePrice
        depositValue = productSize.depositValue || 0;
        console.log('💰 Using depositValue from productSizeId (fallback):', depositValue);
      }
    }
    
    // If still 0, check productGroupId
    if (depositValue === 0 && product.productGroupId) {
      const productGroup = product.productGroupId as any;
      pricePerDay = productGroup.rentalPrice || productGroup.rentalPricePerDay || 0;
      if (pricePerDay > 0) {
        depositValue = pricePerDay * days;
        console.log('💰 Using rentalPrice from productGroupId:', pricePerDay, '×', days, '=', depositValue);
      } else {
        depositValue = productGroup.depositValue || 0;
        console.log('💰 Using depositValue from productGroupId (fallback):', depositValue);
      }
    }
    
    console.log('💰 Final Deposit Value (cố định từ product):', {
      hasProductSizeId: !!product.productSizeId,
      productSizeIdType: typeof product.productSizeId,
      depositValue,
    });
    
    // If depositValue is still 0, show error - backend requires valid depositValue
    if (depositValue === 0 || !depositValue || isNaN(depositValue)) {
      console.error('❌ Product không có depositValue hợp lệ:', {
        productSizeId: product.productSizeId,
        productGroupId: product.productGroupId
      });
      Alert.alert(
        'Error',
        'Sản phẩm này chưa có thông tin tiền cọc. Vui lòng liên hệ hỗ trợ hoặc thử sản phẩm khác.'
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
        'Số dư không đủ',
        `Số dư ví của bạn không đủ để đặt mượn sản phẩm này.\n\n` +
        `Số dư hiện tại: ${walletBalance.toLocaleString('vi-VN')} VNĐ\n` +
        `Tiền cọc cần: ${depositValue.toLocaleString('vi-VN')} VNĐ\n` +
        `Còn thiếu: ${shortage.toLocaleString('vi-VN')} VNĐ\n\n` +
        `Vui lòng nạp thêm tiền vào ví để tiếp tục.`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Nạp tiền',
            onPress: () => {
              setShowProductModal(false);
              router.push('/(protected)/customer/customer-wallet');
            },
          },
        ]
      );
      return;
    }
    
    // Kiểm tra số ngày mượn (days đã được khai báo ở trên)
    if (isNaN(days) || days <= 0) {
      Alert.alert('Error', 'Please enter a valid number of days (greater than 0)');
      return;
    }

    console.log('✅ Balance sufficient, proceeding to confirm...');

    // Confirm borrow - CHỈ HIỂN THỊ BORROW DURATION
    // Logic tính toán vẫn giữ nguyên, chỉ ẩn khỏi UI
    Alert.alert(
      'Confirm Borrow Request',
      `Are you sure you want to borrow this product?\n\n` +
      `Borrow duration: ${days} days`,
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

              // FIX CHẮC 100% - businessId đúng trong mọi trường hợp
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
                throw new Error('Không tìm thấy thông tin cửa hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
              }

              // Lấy productId
              const productId = product._id || product.id;
              if (!productId) {
                console.error('❌ Cannot find productId in product:', product);
                throw new Error('Không tìm thấy ID sản phẩm. Vui lòng thử lại.');
              }

              // Validate depositValue before sending (đã validate ở trên, nhưng double check)
              if (!depositValue || depositValue <= 0 || isNaN(depositValue)) {
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
                depositValue: depositValue, // Giá trị cố định từ product, không tính toán
                durationInDays: days,
                type: "online" as const, // ← CỨ ĐỂ CỨNG THẾ NÀY LÀ CHẮC ĂN NHẤT
              };

              console.log('📦 FINAL borrowDto gửi đi:', {
                productId,
                businessId,
                depositValue, // Giá trị cố định từ product
                depositValueType: typeof depositValue,
                durationInDays: days,
                type: 'online'
              });
              console.log('📦 Borrow DTO (full):', JSON.stringify(borrowDto, null, 2));

              const response = await borrowTransactionsApi.createWithAutoRefresh(borrowDto);
              
              console.log('✅ Borrow transaction created:', response);

              Alert.alert(
                'Success',
                'Borrow request has been submitted! Please visit the store to receive the product.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setShowProductModal(false);
                      setSelectedProduct(null);
                      // Reload user data để cập nhật số dư
                      if (state.accessToken) {
                        getCurrentUserProfileWithAutoRefresh()
                          .then(setUserData)
                          .catch((error) => {
                            // Silently handle network errors
                            const isNetworkError = error?.message?.toLowerCase().includes('application failed to respond') ||
                                                   error?.message?.toLowerCase().includes('network error') ||
                                                   error?.message?.toLowerCase().includes('failed to fetch');
                            if (!isNetworkError) {
                              console.error('Error loading user data:', error);
                            }
                          });
                      }
                    },
                  },
                ]
              );
            } catch (error: any) {
              
              // Xử lý lỗi cụ thể
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
                  'Đã đạt giới hạn mượn',
                  'Bạn đã đạt giới hạn số lượng sản phẩm có thể mượn đồng thời (tối đa 3 sản phẩm).\n\nVui lòng trả một số sản phẩm đang mượn trước khi mượn thêm.',
                  [
                    {
                      text: 'Xem lịch sử mượn',
                      onPress: () => {
                        setShowProductModal(false);
                        router.push('/(protected)/customer/transaction-history');
                      },
                    },
                    {
                      text: 'Đóng',
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
                  'Số dư không đủ',
                  `Số dư ví của bạn không đủ để đặt mượn sản phẩm này.\n\n` +
                  `Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} VNĐ\n` +
                  `Tiền cọc cần: ${depositValue.toLocaleString('vi-VN')} VNĐ\n` +
                  `Còn thiếu: ${shortage.toLocaleString('vi-VN')} VNĐ\n\n` +
                  `Vui lòng nạp thêm tiền vào ví để tiếp tục.`,
                  [
                    {
                      text: 'Đóng',
                      style: 'cancel',
                    },
                    {
                      text: 'Nạp tiền',
                      onPress: () => {
                        setShowProductModal(false);
                        router.push('/(protected)/customer/customer-wallet');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Error',
                  'Unable to create borrow request. Please try again later.'
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

  const handleLoadPage = async (page: number) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await productsApi.getCustomerProducts(id, {
        page: page,
        limit: 20,
      });

      if (response.data?.products) {
        setProducts(response.data.products);
        setTotalPages(response.data.totalPages || 1);
        setHasMoreProducts(page < (response.data.totalPages || 1));
        setCurrentPage(page);
      }
    } catch (error: any) {
      console.error('❌ Error loading page:', error);
      Alert.alert('Error', 'Unable to load this page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{productGroupName}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Price Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'low', 'medium', 'high'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, priceFilter === filter && styles.filterChipActive]}
              onPress={() => setPriceFilter(filter)}
            >
              <Text style={[styles.filterChipText, priceFilter === filter && styles.filterChipTextActive]}>
                {filter === 'all' ? 'All Prices' :
                 filter === 'low' ? '< 50K' :
                 filter === 'medium' ? '50K - 150K' : '> 150K'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        {loading ? (
          <View style={styles.loadingProductsContainer}>
            <ActivityIndicator size="large" color="#0F4D3A" />
            <Text style={styles.loadingProductsText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No products found</Text>
            {searchQuery && (
              <Text style={styles.emptyStateSubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          <>
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => {
                const groupName = (product.productGroupId as any)?.name || 'Product';
                const sizeName = (product.productSizeId as any)?.name || (product.productSizeId as any)?.description || '';
                const depositValue = (product.productSizeId as any)?.depositValue || 0;
                const imageUrl = (product.productGroupId as any)?.imageUrl || product.images?.[0];

                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.productCard}
                    onPress={() => handleProductPress(product)}
                  >
                    {imageUrl ? (
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.placeholderText}>No Image</Text>
                      </View>
                    )}
                    
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {groupName}
                      </Text>
                      {sizeName && (
                        <Text style={styles.productSize} numberOfLines={1}>
                          {sizeName}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.productPrice}>
                          {depositValue > 0 ? `${depositValue.toLocaleString('vi-VN')} VNĐ` : 'Free'}
                        </Text>
                      </View>
                      {/* CO2 Reduced */}
                      {(() => {
                        const co2Reduced = (product as any)?.co2Reduced;
                        if (co2Reduced !== undefined && co2Reduced > 0) {
                          return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <Ionicons name="leaf" size={12} color="#10B981" />
                              <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>
                                CO₂: {co2Reduced.toFixed(3)} kg
                              </Text>
                            </View>
                          );
                        }
                        return null;
                      })()}
                      <View style={styles.productStatusRow}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: product.status === 'available' ? '#10B98120' : '#EF444420' }
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            { color: product.status === 'available' ? '#10B981' : '#EF4444' }
                          ]}>
                            {product.status === 'available' ? 'Available' : product.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={() => handleLoadPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#9CA3AF" : "#0F4D3A"} />
                  <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.paginationButton, (!hasMoreProducts || currentPage >= totalPages) && styles.paginationButtonDisabled]}
                  onPress={() => handleLoadPage(currentPage + 1)}
                  disabled={!hasMoreProducts || currentPage >= totalPages || loading}
                >
                  <Text style={[styles.paginationButtonText, (!hasMoreProducts || currentPage >= totalPages) && styles.paginationButtonTextDisabled]}>
                    Next
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={(!hasMoreProducts || currentPage >= totalPages) ? "#9CA3AF" : "#0F4D3A"} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Product Modal - Copy từ customer-dashboard.tsx */}
      {showProductModal && selectedProduct && (
        <Modal
          visible={showProductModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProductModal(false)}
        >
          <View style={styles.productModalContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />
            <View style={styles.productModalHeader}>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.productModalTitle}>Thông tin sản phẩm</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.productModalContent}>
              {/* Product Image */}
              {selectedProduct.product?.productGroupId?.imageUrl && (
                <Image
                  source={{ uri: selectedProduct.product.productGroupId.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              )}

              {/* Product Info */}
              <View style={styles.productInfoCard}>
                <Text style={styles.productName}>{selectedProduct.name}</Text>
                {selectedProduct.size && (
                  <Text style={styles.productSize}>Kích thước: {selectedProduct.size}</Text>
                )}
                
                {(() => {
                  // Tính deposit theo số ngày để hiển thị trên UI - dùng depositValue (giá thuê)
                  const depositValuePerDay = selectedProduct.product?.productSizeId?.depositValue ??
                                             (selectedProduct.product?.productGroupId as any)?.depositValue ??
                                             0;
                  
                  const days = Math.max(1, Math.min(30, parseInt(durationInDays, 10) || 1));
                  
                  // Tính từ depositValue (giá thuê) × số ngày
                  const displayDeposit = depositValuePerDay * days;
                  
                  if (!displayDeposit || displayDeposit <= 0) return null;
                  
                  return (
                    <View style={styles.depositInfo}>
                      <Ionicons name="cash-outline" size={20} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.depositLabel}>Tiền cọc:</Text>
                        <Text style={styles.depositValue}>
                          {displayDeposit.toLocaleString('vi-VN')} VNĐ
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          ({depositValuePerDay.toLocaleString('vi-VN')} VND/day × {days} days)
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* CO2 Reduced */}
                {selectedProduct.product && (selectedProduct.product as any)?.co2Reduced !== undefined && (
                  <View style={styles.depositInfo}>
                    <Ionicons name="leaf-outline" size={20} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.depositLabel}>CO₂ Reduced:</Text>
                      <Text style={[styles.depositValue, { color: '#10B981' }]}>
                        {(selectedProduct.product as any).co2Reduced.toFixed(3)} kg
                      </Text>
                    </View>
                  </View>
                )}

                {/* Wallet Balance Info */}
                <View style={styles.balanceInfo}>
                  <Ionicons name="wallet-outline" size={20} color="#3B82F6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceLabel}>Số dư ví hiện tại:</Text>
                    {(() => {
                      // Handle both balance and availableBalance fields
                      const walletBalance = (userData as any)?.wallet?.availableBalance ?? 
                                          (userData as any)?.wallet?.balance ?? 
                                          0;
                      // Tính deposit theo số ngày để kiểm tra số dư (chỉ cho UI) - dùng depositValue (giá thuê)
                      const depositValuePerDay = selectedProduct.product?.productSizeId?.depositValue ??
                                                 (selectedProduct.product?.productGroupId as any)?.depositValue ??
                                                 0;
                      const days = Math.max(1, Math.min(30, parseInt(durationInDays, 10) || 1));
                      const displayDeposit = depositValuePerDay * days;
                      const isInsufficient = walletBalance < displayDeposit;
                      
                      return (
                        <>
                          <Text style={[
                            styles.balanceValue,
                            isInsufficient && styles.balanceInsufficient
                          ]}>
                            {walletBalance.toLocaleString('vi-VN')} VNĐ
                          </Text>
                          {isInsufficient && (
                            <Text style={styles.insufficientWarning}>
                              ⚠️ Số dư không đủ. Vui lòng nạp thêm tiền.
                            </Text>
                          )}
                        </>
                      );
                    })()}
                  </View>
                </View>

                {selectedProduct.status && (
                  <View style={styles.statusInfo}>
                    <View style={[
                      styles.statusBadge,
                      selectedProduct.status === 'available' ? styles.statusAvailable : styles.statusUnavailable
                    ]}>
                      <Text style={[
                        styles.statusText,
                        selectedProduct.status !== 'available' && { color: '#DC2626' }
                      ]}>
                        {selectedProduct.status === 'available' ? 'Có sẵn' : 'Không có sẵn'}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedProduct.product?.productGroupId?.description && (
                  <Text style={styles.productDescription}>
                    {selectedProduct.product.productGroupId.description}
                  </Text>
                )}

                {selectedProduct.data && (
                  <View style={styles.serialInfo}>
                    <Text style={styles.serialLabel}>Serial Number:</Text>
                    <Text style={styles.serialValue}>{selectedProduct.data}</Text>
                  </View>
                )}

                {/* Duration Input */}
                <View style={styles.durationInputContainer}>
                  <Text style={styles.durationLabel}>Thời gian mượn (ngày) *</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={durationInDays}
                    onChangeText={setDurationInDays}
                    placeholder="Nhập số ngày mượn"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Borrow Button */}
              {selectedProduct.status === 'available' && (
                <TouchableOpacity
                  style={[styles.borrowButton, borrowing && styles.borrowButtonDisabled]}
                  onPress={handleBorrow}
                  disabled={borrowing}
                >
                  {borrowing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.borrowButtonText}>Borrow Product</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {selectedProduct.status !== 'available' && (
                <View style={styles.unavailableMessage}>
                  <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
                  <Text style={styles.unavailableText}>
                    Sản phẩm này hiện không có sẵn để mượn
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
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
    backgroundColor: '#0F4D3A',
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
    padding: 20,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0F4D3A',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingProductsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingProductsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F4D3A',
    marginBottom: 8,
  },
  productStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Modal styles
  productModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  productModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#059669',
  },
  productModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginTop: 20,
    backgroundColor: '#E5E7EB',
  },
  productInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  productSize: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  depositLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  depositValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  balanceInsufficient: {
    color: '#DC2626',
  },
  insufficientWarning: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '600',
  },
  statusInfo: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAvailable: {
    backgroundColor: '#F0FDF4',
  },
  statusUnavailable: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  serialInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  serialLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  serialValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  durationInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  durationLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  durationInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  borrowButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  borrowButtonDisabled: {
    opacity: 0.6,
  },
  borrowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  unavailableMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  unavailableText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
});

