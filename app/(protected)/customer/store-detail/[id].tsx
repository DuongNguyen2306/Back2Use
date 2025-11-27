import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { businessesApi } from '../../../../src/services/api/businessService';
import { productsApi } from '../../../../src/services/api/productService';
import { getCurrentUserProfileWithAutoRefresh } from '../../../../src/services/api/userService';
import { Business } from '../../../../src/types/business.types';
import { Product } from '../../../../src/types/product.types';

interface ProductGroup {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [store, setStore] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productGroups, setProductGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [productCount, setProductCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [displayedProductsCount, setDisplayedProductsCount] = useState(6); // Số sản phẩm hiển thị ban đầu
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [borrowing, setBorrowing] = useState(false);
  const [durationInDays, setDurationInDays] = useState<string>('30');
  const [userData, setUserData] = useState<any>(null);
  const [userBusinessProfile, setUserBusinessProfile] = useState<any>(null);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch store details and products
  useEffect(() => {
    const loadStoreData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Loading store with ID:', id);

        // Load store detail with product groups
        const storeDetailResponse = await businessesApi.getById(id);
        
        if (!storeDetailResponse.data?.business) {
          Alert.alert('Lỗi', 'Không tìm thấy cửa hàng.');
          setLoading(false);
          return;
        }

        const storeData = storeDetailResponse.data.business;
        setStore(storeData);

        // Load products from product groups
        const allGroups = storeDetailResponse.data.productGroups || [];
        console.log('📦 Found product groups in response:', allGroups.length);
        console.log('📦 Product groups data:', JSON.stringify(allGroups, null, 2));
        
        // Filter product groups by businessId to ensure they belong to this store
        const storeBusinessId = storeData._id;
        console.log('🔍 Store businessId:', storeBusinessId);
        
        const filteredGroups = allGroups.filter((group: any) => {
          // Lấy businessId từ group theo nhiều cách
          let groupBusinessId: string | undefined;
          
          if (typeof group.businessId === 'string') {
            groupBusinessId = group.businessId;
          } else if (group.businessId && typeof group.businessId === 'object') {
            groupBusinessId = group.businessId._id || group.businessId.id;
          }
          
          if (!groupBusinessId && group.business) {
            if (typeof group.business === 'string') {
              groupBusinessId = group.business;
            } else if (typeof group.business === 'object') {
              groupBusinessId = group.business._id || group.business.id;
            }
          }
          
          const matches = groupBusinessId === storeBusinessId;
          
          if (!matches) {
            console.log(`⚠️ Product group "${group.name}" does not belong to this store:`, {
              groupBusinessId,
              storeBusinessId,
              groupId: group._id
            });
          } else {
            console.log(`✅ Product group "${group.name}" belongs to store`);
          }
          
          return matches;
        });
        
        console.log(`✅ Filtered ${filteredGroups.length} product groups from ${allGroups.length} total for store ${storeBusinessId}`);
        
        // Nếu không có groups sau khi filter, thử dùng tất cả groups (có thể businessId không match đúng format)
        const groupsToUse = filteredGroups.length > 0 ? filteredGroups : allGroups;
        
        if (filteredGroups.length === 0 && allGroups.length > 0) {
          console.warn('⚠️ No groups matched businessId filter, using all groups as fallback');
        }
        
        setProductGroups(groupsToUse);
        await loadStoreProducts(storeBusinessId, groupsToUse, true);
      } catch (error: any) {
        console.error('❌ Error loading store:', error);
        Alert.alert('Lỗi', error.message || 'Không thể tải thông tin cửa hàng.');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [id]);

  // Load user data and business profile
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUserProfileWithAutoRefresh();
        setUserData(user);
        
        // Nếu user có role business, load business profile để kiểm tra ownership
        if (user.role === 'business' || state.role === 'business') {
          try {
            const businessProfileResponse = await businessesApi.getProfileWithAutoRefresh();
            if (businessProfileResponse.data?.business) {
              setUserBusinessProfile(businessProfileResponse.data.business);
            }
          } catch (error) {
            console.log('ℹ️ User is not a business owner or error loading business profile:', error);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, [state.role]);
  
  // Kiểm tra xem user có phải owner của store không
  useEffect(() => {
    if (store && (userBusinessProfile || state.user)) {
      const storeBusinessId = store._id;
      
      // Kiểm tra từ business profile
      let userBusinessId: string | null = null;
      if (userBusinessProfile) {
        userBusinessId = userBusinessProfile._id || userBusinessProfile.id;
      }
      
      // Hoặc kiểm tra từ user data nếu có businessId
      if (!userBusinessId && state.user) {
        const user = state.user as any;
        if (user.businessId) {
          userBusinessId = typeof user.businessId === 'string' 
            ? user.businessId 
            : (user.businessId._id || user.businessId.id);
        }
      }
      
      const isOwner = userBusinessId === storeBusinessId;
      setIsStoreOwner(isOwner);
      
      console.log('🔍 Store ownership check:', {
        storeBusinessId,
        userBusinessId,
        isOwner,
        userRole: state.user?.role || state.role
      });
    } else {
      setIsStoreOwner(false);
    }
  }, [store, userBusinessProfile, state.user, state.role]);

  const loadStoreProducts = async (businessId: string, productGroups: any[], reset: boolean = true) => {
    if (productGroups.length === 0) {
      console.log('⚠️ No product groups found for this store, trying to load products directly...');
      
      // Fallback: Thử load products trực tiếp từ store nếu không có product groups
      try {
        setProductsLoading(true);
        // Có thể thêm logic load products trực tiếp từ store API ở đây nếu có
        // Hiện tại chỉ log warning
        console.warn('⚠️ Cannot load products: No product groups available');
        if (reset) {
        setProducts([]);
        setProductCount(0);
          setDisplayedProductsCount(6);
          setHasMoreProducts(true);
        }
      } catch (error) {
        console.error('❌ Error in fallback product loading:', error);
      } finally {
        setProductsLoading(false);
      }
      return;
    }

    try {
      setProductsLoading(true);
      console.log('🔄 Loading ALL products for business:', businessId);
      console.log('📦 Product groups to process:', productGroups.length);

      let allProducts: Product[] = reset ? [] : [...products];

      // Load TẤT CẢ sản phẩm từ tất cả group (không phân trang server)
      for (const group of productGroups) {
        try {
          console.log(`🔄 Loading products from group: "${group.name}" (${group._id})`);
          
          // Load nhiều nhất có thể (limit cao)
          const res = await productsApi.getCustomerProducts(group._id, {
            limit: 100, // Load tối đa 100 sản phẩm mỗi group
            page: 1,
          });

          console.log(`📡 API Response for group "${group.name}":`, {
            totalProducts: res.data?.total,
            returnedProducts: res.data?.products?.length
          });

          if (res.data?.products && res.data.products.length > 0) {
            const validProducts = res.data.products.filter((p: any) => {
              // Lấy businessId từ product theo nhiều cách (linh hoạt hơn)
              let pBusinessId: string | undefined;
              
              // Ưu tiên 1: businessId trực tiếp trên product
              if (typeof p.businessId === 'string') {
                pBusinessId = p.businessId;
              } else if (p.businessId && typeof p.businessId === 'object') {
                pBusinessId = p.businessId._id || p.businessId.id;
              }
              
              // Ưu tiên 2: businessId từ productGroupId
              if (!pBusinessId && p.productGroupId) {
                const pg = typeof p.productGroupId === 'object' ? p.productGroupId : null;
                if (pg) {
                  if (pg.businessId) {
                    pBusinessId = typeof pg.businessId === 'string' 
                      ? pg.businessId 
                      : (pg.businessId._id || pg.businessId.id);
                  }
                  if (!pBusinessId && pg.business) {
                    pBusinessId = typeof pg.business === 'string' 
                      ? pg.business 
                      : (pg.business._id || pg.business.id);
                  }
                }
              }
              
              // Ưu tiên 3: businessId từ group hiện tại (nếu product không có businessId)
              if (!pBusinessId && group.businessId) {
                pBusinessId = typeof group.businessId === 'string'
                  ? group.businessId
                  : (group.businessId._id || group.businessId.id);
              }
              if (!pBusinessId && group.business) {
                pBusinessId = typeof group.business === 'string'
                  ? group.business
                  : (group.business._id || group.business.id);
              }

              const matches = pBusinessId === businessId;
              
              if (!matches) {
                console.log(`⚠️ Product ${p._id} businessId mismatch:`, {
                  productBusinessId: pBusinessId,
                  storeBusinessId: businessId,
                  productName: (p.productGroupId as any)?.name || 'Unknown'
                });
              }
              
              return matches;
            });

            console.log(`✅ Filtered ${validProducts.length} valid products from ${res.data.products.length} total in group "${group.name}"`);
            allProducts.push(...validProducts);
          } else {
            console.log(`ℹ️ No products found in group "${group.name}"`);
          }
        } catch (err: any) {
          console.error(`❌ Error loading group "${group.name}":`, err.message);
          console.error('Error details:', err);
        }
      }

      // Sắp xếp theo thời gian tạo (mới nhất trước)
      allProducts.sort((a, b) => {
        const aDate = (a as any).createdAt || '';
        const bDate = (b as any).createdAt || '';
        return bDate.localeCompare(aDate);
      });

      console.log('✅ Total products loaded:', allProducts.length);
      setProducts(allProducts);
      setProductCount(allProducts.length);
      if (reset) {
          setDisplayedProductsCount(6);
          setHasMoreProducts(true); // Reset về trang đầu tiên
      }
    } catch (error: any) {
      console.error('❌ Load products failed:', error);
      if (reset) {
        setProducts([]);
        setProductCount(0);
      }
    } finally {
      setProductsLoading(false);
    }
  };

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
        
        // Xử lý productGroupId có thể là object hoặc string
        const productGroupName = productData.productGroupId && typeof productData.productGroupId === 'object' 
          ? productData.productGroupId.name 
          : "Product";
        
        // Xử lý productSizeId
        const productSizeName = productData.productSizeId && typeof productData.productSizeId === 'object'
          ? productData.productSizeId.sizeName || productData.productSizeId.name || productData.productSizeId.description
          : "Unknown";
        
        const formattedProduct = {
          id: productData._id || productData.id,
          name: productGroupName || "Product",
          size: productSizeName,
          type: "container",
          data: serialNumber,
          product: productData, // Lưu thông tin sản phẩm đầy đủ từ scan API
          qrCode: qrCode || productData.qrCode || '',
          status: productStatus || productData.status || 'available',
        };
        
        console.log('📱 Formatted product created:', formattedProduct);
        setSelectedProduct(formattedProduct);
        setDurationInDays('30'); // Reset về mặc định khi mở modal mới
        setShowProductModal(true);
        
        // Reload user data
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
          setUserData(user);
        } catch (error) {
          console.error('Error reloading user data:', error);
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

    // Kiểm tra xem user có phải owner của store không
    if (isStoreOwner) {
      Alert.alert(
        'Thông báo',
        'Bạn không thể mượn sản phẩm của chính cửa hàng mình.'
      );
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
    } catch (error) {
      console.error('Error reloading user data:', error);
      // Continue with existing userData if reload fails
    }

    const product = selectedProduct.product;
    
    // Kiểm tra số ngày mượn trước
    const days = parseInt(durationInDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số ngày mượn hợp lệ (lớn hơn 0)');
      return;
    }
    
    // LẤY GIÁ CỌC 1 NGÀY - Ưu tiên rentalPrice vì đó là giá 1 ngày
    const pricePerDay = 
      (product.productSizeId as any)?.rentalPrice ??
      (product.productSizeId as any)?.rentalPricePerDay ??
      (product.productGroupId as any)?.rentalPrice ??
      (product.productGroupId as any)?.rentalPricePerDay ??
      (product.productSizeId as any)?.depositValue ??
      (product.productGroupId as any)?.depositValue ??
      3200; // fallback an toàn
    
    // TIỀN CỌC = GIÁ 1 NGÀY × SỐ NGÀY
    const depositValue = pricePerDay * days;
    
    console.log('💰 Deposit Calculation:', {
      pricePerDay,
      days,
      depositValue,
    });
    
    // If pricePerDay is still 0 or invalid, show error
    if (!pricePerDay || pricePerDay <= 0 || isNaN(pricePerDay)) {
      console.error('❌ Cannot find pricePerDay');
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
    
    console.log('✅ Balance sufficient, proceeding to confirm...');

    // TÍNH LẠI TIỀN CỌC REALTIME CHO ALERT (vì người dùng có thể gõ lại số ngày)
    // Ưu tiên rentalPrice vì đó là giá 1 ngày
    const realtimePricePerDay = 
      (product.productSizeId as any)?.rentalPrice ??
      (product.productSizeId as any)?.rentalPricePerDay ??
      (product.productGroupId as any)?.rentalPrice ??
      (product.productGroupId as any)?.rentalPricePerDay ??
      (product.productSizeId as any)?.depositValue ??
      (product.productGroupId as any)?.depositValue ??
      3200;

    const realtimeDays = parseInt(durationInDays, 10) || 30;
    const realtimeDeposit = realtimePricePerDay * realtimeDays;

    // Confirm borrow
    Alert.alert(
      'Xác nhận đặt mượn',
      `Bạn có chắc chắn muốn đặt mượn sản phẩm này?\n\n` +
      `Tiền cọc: ${realtimeDeposit.toLocaleString('vi-VN')} VNĐ\n` +
      `(= ${realtimePricePerDay.toLocaleString('vi-VN')} VNĐ/ngày × ${realtimeDays} ngày)\n\n` +
      `Số dư hiện tại: ${walletBalance.toLocaleString('vi-VN')} VNĐ\n` +
      `Số dư sau khi trừ: ${(walletBalance - realtimeDeposit).toLocaleString('vi-VN')} VNĐ\n` +
      `Thời gian mượn: ${realtimeDays} ngày`,
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

              // Kiểm tra xem user có phải owner của business này không
              let userBusinessId: string | null = null;
              
              // Kiểm tra từ userBusinessProfile
              if (userBusinessProfile) {
                userBusinessId = userBusinessProfile._id || userBusinessProfile.id;
              }
              
              // Hoặc kiểm tra từ user data nếu có businessId
              if (!userBusinessId && currentUserData) {
                const user = currentUserData as any;
                if (user.businessId) {
                  userBusinessId = typeof user.businessId === 'string' 
                    ? user.businessId 
                    : (user.businessId._id || user.businessId.id);
                }
              }
              
              // So sánh businessId của product với businessId của user
              if (userBusinessId && businessId === userBusinessId) {
                console.log('⚠️ User is trying to borrow from their own business:', {
                  productBusinessId: businessId,
                  userBusinessId: userBusinessId
                });
                Alert.alert(
                  'Cannot Borrow',
                  'This product belongs to your business. You cannot borrow products from your own business.'
                );
                setBorrowing(false);
                return;
              }

              // Lấy productId
              const productId = product._id || product.id;
              if (!productId) {
                console.error('❌ Cannot find productId in product:', product);
                throw new Error('Không tìm thấy ID sản phẩm. Vui lòng thử lại.');
              }

              // LẤY depositValue CỐ ĐỊNH TỪ BACKEND (không phải tính toán)
              // Logic tính toán chỉ dùng cho UI, API cần giá trị cố định từ backend
              const backendDepositValue = 
                (product.productSizeId as any)?.depositValue ??
                (product.productGroupId as any)?.depositValue ??
                0;
              
              if (!backendDepositValue || backendDepositValue <= 0 || isNaN(backendDepositValue)) {
                Alert.alert(
                  'Error',
                  'Invalid deposit value. Please contact support or try another product.'
                );
                setBorrowing(false);
                return;
              }

              const borrowDto = {
                productId,
                businessId,
                depositValue: backendDepositValue, // Dùng giá trị cố định từ backend
                durationInDays: realtimeDays,
                type: "online" as const, // ← CỨ ĐỂ CỨNG THẾ NÀY LÀ CHẮC ĂN NHẤT
              };

              console.log('📦 FINAL borrowDto gửi đi:', {
                productId,
                businessId,
                depositValue: backendDepositValue, // Giá trị cố định từ backend
                depositValueType: typeof backendDepositValue,
                durationInDays: realtimeDays,
                type: 'online',
                uiCalculated: realtimeDeposit, // Giá trị tính toán chỉ để hiển thị UI
                pricePerDay: realtimePricePerDay,
                days: realtimeDays
              });
              console.log('📦 Borrow DTO (full):', JSON.stringify(borrowDto, null, 2));

              const response = await borrowTransactionsApi.createWithAutoRefresh(borrowDto);
              
              console.log('✅ Borrow transaction created:', response);

              Alert.alert(
                'Thành công',
                'Yêu cầu mượn đã được gửi! Vui lòng đến cửa hàng để nhận sản phẩm.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setShowProductModal(false);
                      setSelectedProduct(null);
                      // Redirect tới lịch sử đơn hàng
                      router.replace('/(protected)/customer/transaction-history');
                    },
                  },
                ]
              );
            } catch (error: any) {
              // Xử lý lỗi cụ thể
              const errorMessage = error?.response?.data?.message || error?.message || '';
              
              // Comment log để tránh hiển thị error notification trên UI
              // console.log('❌ Borrow Error:', errorMessage);
              
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
              
              // Check for own business borrow attempt
              const isOwnBusiness = errorMessage.toLowerCase().includes('cannot borrow from your own business') ||
                                   errorMessage.toLowerCase().includes('own business') ||
                                   (error?.response?.data?.statusCode === 400 && 
                                    (errorMessage.toLowerCase().includes('business') || 
                                     errorMessage.toLowerCase().includes('cannot borrow')));
              
              if (isOwnBusiness) {
                Alert.alert(
                  'Cannot Borrow',
                  'This product belongs to your business. You cannot borrow products from your own business.'
                );
              } else if (isInvalidDeposit) {
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

  // Helper function to get icon for product group
  const getCategoryIcon = (categoryName: string): any => {
    const name = categoryName.toLowerCase();
    if (name.includes('coffee') || name.includes('cà phê') || name.includes('hot drink')) return 'cafe';
    if (name.includes('cold') || name.includes('lạnh') || name.includes('drink')) return 'water';
    if (name.includes('food') || name.includes('đồ ăn') || name.includes('meal')) return 'restaurant';
    if (name.includes('cup') || name.includes('ly') || name.includes('cốc')) return 'wine';
    if (name.includes('bottle') || name.includes('chai')) return 'flask';
    if (name.includes('bag') || name.includes('túi')) return 'bag';
    return 'cube-outline'; // Default icon
  };

  // Filter products
  // Logic: Lọc sản phẩm dựa trên category đã chọn (selectedCategory = _id của product group)
  // Mỗi product có productGroupId, so sánh với selectedCategory để filter
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    // Category filter - Lọc sản phẩm theo productGroupId đã chọn
    // selectedCategory là _id của product group từ category bar
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        // Lấy productGroupId từ product (có thể là object hoặc string)
        let productGroupId: string | undefined;
        
        if (product.productGroupId) {
          if (typeof product.productGroupId === 'object') {
            productGroupId = product.productGroupId._id || (product.productGroupId as any).id || product.productGroupId.toString();
          } else {
            productGroupId = product.productGroupId;
          }
        }
        
        // So sánh với selectedCategory (là _id của product group từ category bar)
        return productGroupId === selectedCategory;
      });
    }

    return filtered;
  }, [products, selectedCategory]);

  // Infinite Scroll: Chỉ hiển thị số sản phẩm đã load
  const displayedProducts = React.useMemo(() => {
    return filteredProducts.slice(0, displayedProductsCount);
  }, [filteredProducts, displayedProductsCount]);

  // Load more products when scrolling to end
  const loadMoreProducts = React.useCallback(() => {
    if (loadingMore || !hasMoreProducts || displayedProductsCount >= filteredProducts.length) {
      return;
    }

    setLoadingMore(true);
    
    // Simulate loading delay (remove in production if not needed)
    setTimeout(() => {
      const nextCount = Math.min(displayedProductsCount + 6, filteredProducts.length);
      setDisplayedProductsCount(nextCount);
      setHasMoreProducts(nextCount < filteredProducts.length);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMoreProducts, displayedProductsCount, filteredProducts.length]);

  // Reset displayed count when category changes
  useEffect(() => {
    setDisplayedProductsCount(6); // Reset về 6 sản phẩm đầu tiên
    setHasMoreProducts(true);
  }, [selectedCategory]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading store...</Text>
        </View>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
          <Text style={styles.errorText}>Store not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentHour = new Date().getHours();
  const openHour = parseInt(store.openTime.split(':')[0]);
  const closeHour = parseInt(store.closeTime.split(':')[0]);
  const isOpen = currentHour >= openHour && currentHour < closeHour;

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
        <Text style={styles.headerTitle}>Store Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main FlatList with ListHeaderComponent for infinite scroll */}
      <FlatList
        data={displayedProducts}
        numColumns={2}
        keyExtractor={(item) => item._id}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsListContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
        {/* Store Info Section */}
        <View style={styles.storeInfoSection}>
          {/* Store Logo & Name */}
          <View style={styles.storeHeader}>
            {store.businessLogoUrl ? (
              <Image 
                source={{ uri: store.businessLogoUrl }} 
                style={styles.storeLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.storeLogoPlaceholder}>
                <Ionicons name="storefront" size={48} color="#0F4D3A" />
              </View>
            )}
            <View style={styles.storeHeaderInfo}>
              <Text style={styles.storeName}>{store.businessName}</Text>
              <Text style={styles.storeType}>{store.businessType}</Text>
              <View style={styles.storeMeta}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>4.5</Text>
                  <Text style={styles.ratingCount}>(120)</Text>
                </View>
                <View style={styles.productsCountBadge}>
                  <Ionicons name="cube-outline" size={14} color="#0F4D3A" />
                  <Text style={styles.productsCountText}>{productCount} products</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Store Details */}
          <View style={styles.storeDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{store.businessAddress}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{store.businessPhone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#6B7280" />
              <Text style={styles.detailText}>
                {store.openTime} - {store.closeTime}
                    <Text style={[styles.storeStatusText, { color: isOpen ? '#10B981' : '#EF4444' }]}>
                  {' '}({isOpen ? 'Open' : 'Closed'})
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Product Groups Section - Horizontal Category Bar */}
        {/* Hiển thị danh sách categories từ productGroups và filter sản phẩm theo productGroupId */}
        {productGroups.length > 0 && (
          <View style={styles.productGroupsSection}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <FlatList
              data={[{ _id: 'all', name: 'All' }, ...productGroups]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryListContent}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item._id || (item._id === 'all' && selectedCategory === null);
                const iconName = item._id === 'all' ? 'grid' : getCategoryIcon(item.name);
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemActive
                    ]}
                    onPress={() => {
                      if (item._id === 'all') {
                        // Hiển thị tất cả sản phẩm
                        setSelectedCategory(null);
                      } else {
                        // Lưu _id của product group để filter sản phẩm
                        setSelectedCategory(item._id);
                      }
                    }}
                  >
                    <View style={[
                      styles.categoryIconBox,
                      isSelected && styles.categoryIconBoxActive
                    ]}>
                      <Ionicons 
                        name={iconName} 
                        size={24} 
                        color={isSelected ? '#006241' : '#B0B0B0'} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameActive
                    ]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

            {/* Products Section Header */}
            <View style={styles.productsSectionHeader}>
              <Text style={styles.sectionTitle}>Products ({filteredProducts.length})</Text>
            </View>

            {/* Loading State */}
            {productsLoading && filteredProducts.length === 0 && (
              <View style={styles.loadingProductsContainer}>
                <ActivityIndicator size="large" color="#006241" />
                <Text style={styles.loadingProductsText}>Loading products...</Text>
              </View>
            )}

            {/* Empty State */}
            {!productsLoading && filteredProducts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No products found</Text>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#006241" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        renderItem={({ item: product }) => {
          const groupName = (product.productGroupId as any)?.name || 'Product';
          const depositValue = (product.productSizeId as any)?.depositValue || 0;
          const imageUrl = (product.productGroupId as any)?.imageUrl || product.images?.[0];
          const isAvailable = product.status === 'available';
          const statusText = isAvailable ? 'Available' : 'Borrowed';

          return (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => handleProductPress(product)}
              activeOpacity={0.7}
            >
              {/* Product Image - Top 60-65% of card */}
              <View style={styles.productImageContainer}>
                {/* Status Badge - Top right corner */}
                <View style={[
                  styles.statusBadge,
                  isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeBorrowed
                ]}>
                  <View style={[
                    styles.statusDot,
                    isAvailable ? styles.statusDotAvailable : styles.statusDotBorrowed
                  ]} />
                  <Text style={[
                    styles.statusBadgeText,
                    isAvailable ? styles.statusBadgeTextAvailable : styles.statusBadgeTextBorrowed
                  ]}>
                    {statusText}
                  </Text>
                </View>

                {imageUrl && imageUrl.trim() !== '' ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.productImage}
                    resizeMode="contain"
                    onError={() => {
                      // Image load error - will show placeholder
                    }}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
              </View>
              
              {/* Product Info - Bottom on card background */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {groupName}
                </Text>
                <Text style={styles.productDeposit}>
                  {depositValue > 0 ? (
                    <>
                      <Text style={styles.depositLabel}>Deposit: </Text>
                      <Text style={styles.depositValue}>
                        {depositValue.toLocaleString('vi-VN')} VNĐ
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.depositFree}>Free</Text>
                  )}
                </Text>
              </View>

              {/* Action Button - Bottom right corner */}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !isAvailable && styles.addButtonDisabled
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (isAvailable) {
                    handleProductPress(product);
                  }
                }}
                activeOpacity={0.8}
                disabled={!isAvailable}
              >
                <Ionicons 
                  name={isAvailable ? "bag-outline" : "bag-outline"} 
                  size={18} 
                  color={isAvailable ? "#FFFFFF" : "#9CA3AF"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

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
                  style={styles.productModalImage}
                  resizeMode="cover"
                />
              )}

              {/* Product Info */}
              <View style={styles.productInfoCard}>
                <Text style={styles.productModalName}>{selectedProduct.name}</Text>
                {selectedProduct.size && (
                  <Text style={styles.productModalSize}>Kích thước: {selectedProduct.size}</Text>
                )}
                
                {(() => {
                  // Tính toán realtime tiền cọc - Ưu tiên rentalPrice vì đó là giá 1 ngày
                  const pricePerDay = 
                    (selectedProduct.product?.productSizeId as any)?.rentalPrice ??
                    (selectedProduct.product?.productSizeId as any)?.rentalPricePerDay ??
                    (selectedProduct.product?.productGroupId as any)?.rentalPrice ??
                    (selectedProduct.product?.productGroupId as any)?.rentalPricePerDay ??
                    (selectedProduct.product?.productSizeId as any)?.depositValue ??
                    (selectedProduct.product?.productGroupId as any)?.depositValue ??
                    3200;
                  
                  const days = Math.max(1, Math.min(30, parseInt(durationInDays) || 1));
                  const depositValue = pricePerDay * days;
                  
                  if (!pricePerDay || pricePerDay <= 0) return null;
                  
                  return (
                    <View style={styles.depositInfo}>
                      <Ionicons name="cash-outline" size={20} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.depositModalLabel}>Tiền cọc:</Text>
                        <Text style={styles.depositModalValue}>
                          {depositValue.toLocaleString('vi-VN')} VNĐ
                        </Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                          ({pricePerDay.toLocaleString('vi-VN')} VNĐ/ngày × {days} ngày)
                        </Text>
                      </View>
                    </View>
                  );
                })()}

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
                      
                      // Tính toán realtime tiền cọc - Ưu tiên rentalPrice vì đó là giá 1 ngày
                      const pricePerDay = 
                        (selectedProduct.product?.productSizeId as any)?.rentalPrice ??
                        (selectedProduct.product?.productSizeId as any)?.rentalPricePerDay ??
                        (selectedProduct.product?.productGroupId as any)?.rentalPrice ??
                        (selectedProduct.product?.productGroupId as any)?.rentalPricePerDay ??
                        (selectedProduct.product?.productSizeId as any)?.depositValue ??
                        (selectedProduct.product?.productGroupId as any)?.depositValue ??
                        3200;
                      
                      const days = Math.max(1, Math.min(30, parseInt(durationInDays) || 1));
                      const depositValue = pricePerDay * days;
                      const isInsufficient = walletBalance < depositValue;
                      
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
                      styles.statusModalBadge,
                      selectedProduct.status === 'available' ? styles.statusAvailable : styles.statusUnavailable
                    ]}>
                      <Text style={[
                        styles.statusModalText,
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
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      // Cho phép xóa hết (rỗng) trong quá trình nhập
                      if (num === '') {
                        setDurationInDays('');
                      } else if (parseInt(num) > 30) {
                        setDurationInDays('30');
                      } else {
                        setDurationInDays(num);
                      }
                    }}
                    onBlur={() => {
                      // Validate khi blur: nếu rỗng hoặc <= 0 thì set về '1'
                      const num = parseInt(durationInDays, 10);
                      if (isNaN(num) || num <= 0) {
                        setDurationInDays('1');
                      }
                    }}
                    placeholder="Nhập số ngày mượn"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Borrow Button */}
              {selectedProduct.status === 'available' && !isStoreOwner && (
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
                      <Text style={styles.borrowButtonText}>Mượn sản phẩm</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Thông báo nếu user là owner của store */}
              {selectedProduct.status === 'available' && isStoreOwner && (
                <View style={styles.ownerMessage}>
                  <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
                  <Text style={styles.ownerText}>
                    Bạn không thể mượn sản phẩm của chính cửa hàng mình
                  </Text>
                </View>
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
    backgroundColor: '#F5F5F5',
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
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0F4D3A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeInfoSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  storeLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storeHeaderInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  storeType: {
    fontSize: 16,
    color: '#00704A',
    fontWeight: '600',
    marginBottom: 12,
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  productsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  productsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  storeDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  storeStatusText: {
    fontWeight: '600',
  },
  productGroupsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  categoryListContent: {
    paddingRight: 20,
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 70,
  },
  categoryItemActive: {
    // Active state handled by child components
  },
  categoryIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIconBoxActive: {
    borderColor: '#006241',
    backgroundColor: '#F0FDF4',
    shadowColor: '#006241',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0B0',
    textAlign: 'center',
    maxWidth: 70,
  },
  categoryNameActive: {
    color: '#006241',
    fontWeight: '700',
  },
  productsSection: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
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
  productsListContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  productsSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#F9F7F2', // Creamy Beige / Bone White
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E0D6', // Soft Beige-Gray
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    // Card height approximately 200-220px, image takes 60-65%
    minHeight: 200,
    padding: 8, // Inner padding so content doesn't touch edges
  },
  productImageContainer: {
    width: '100%',
    height: 130, // ~65% of card (200px card)
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12, // Slightly smaller radius for inner container
    position: 'relative', // For status badge positioning
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  productInfo: {
    padding: 8,
    paddingTop: 12,
    paddingBottom: 40, // Space for add button
    backgroundColor: 'transparent', // Transparent to show card background
    minHeight: 70, // ~35% of card for text area
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  productDeposit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  depositLabel: {
    color: '#6B7280',
    fontWeight: '500',
  },
  depositValue: {
    color: '#F97316', // Orange color for deposit
    fontWeight: '700',
  },
  depositFree: {
    color: '#3B82F6', // Blue color for free
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statusBadgeAvailable: {
    backgroundColor: '#F0FDF4', // Light green background
  },
  statusBadgeBorrowed: {
    backgroundColor: '#FEF2F2', // Light red background
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotAvailable: {
    backgroundColor: '#10B981', // Green dot
  },
  statusDotBorrowed: {
    backgroundColor: '#EF4444', // Red dot
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadgeTextAvailable: {
    color: '#059669', // Green text
  },
  statusBadgeTextBorrowed: {
    color: '#DC2626', // Red text
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#006241',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006241',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 4,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#F3F4F6',
  },
  paginationPageButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  paginationPageButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#006241',
  },
  paginationPageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paginationPageTextActive: {
    color: '#006241',
    fontWeight: '700',
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
  productModalImage: {
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
  productModalName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  productModalSize: {
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
  depositModalLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  depositModalValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  statusInfo: {
    marginBottom: 16,
  },
  statusModalBadge: {
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
  statusModalText: {
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
  ownerMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  ownerText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
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
});

