import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../../context/AuthProvider';
import { borrowTransactionsApi } from '../../../../src/services/api/borrowTransactionService';
import { businessesApi } from '../../../../src/services/api/businessService';
import { productsApi } from '../../../../src/services/api/productService';
import { getCurrentUserProfileWithAutoRefresh } from '../../../../src/services/api/userService';
import { voucherApi } from '../../../../src/services/api/voucherService';
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
  const [storeVouchers, setStoreVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [myVoucherIds, setMyVoucherIds] = useState<Set<string>>(new Set());
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  
  // New states for redesigned UI
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [scrollY] = useState(new Animated.Value(0));
  const [cartItems, setCartItems] = useState<any[]>([]); // For future cart functionality
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const COVER_IMAGE_HEIGHT = screenHeight * 0.3; // 30% of screen height

  // Get user location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('📍 Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('📍 User location obtained:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('❌ Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

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
        
        // Load vouchers for this store
        await loadStoreVouchers(storeBusinessId);
      } catch (error: any) {
        console.error('❌ Error loading store:', error);
        Alert.alert('Lỗi', error.message || 'Không thể tải thông tin cửa hàng.');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [id]);
  
  // Load my vouchers to check which ones are already redeemed
  const loadMyVouchers = async () => {
    try {
      const response = await voucherApi.getMy({ page: 1, limit: 100 });
      if (response.statusCode === 200 && response.data?.items) {
        const redeemedIds = new Set<string>();
        response.data.items.forEach((voucher: any) => {
          // Get voucher ID from different possible fields
          const voucherId = voucher._id || voucher.voucherId || voucher.id;
          if (voucherId) {
            redeemedIds.add(voucherId);
          }
        });
        setMyVoucherIds(redeemedIds);
        console.log(`✅ Loaded ${redeemedIds.size} redeemed vouchers`);
      }
    } catch (error: any) {
      console.error('❌ Error loading my vouchers:', error);
      // Silently fail
    }
  };

  // Load vouchers for the store
  const loadStoreVouchers = async (storeBusinessId: string) => {
    try {
      setLoadingVouchers(true);
      console.log('🎫 ===== Loading vouchers for store =====');
      console.log('🎫 Store Business ID:', storeBusinessId);
      
      // Load my vouchers first to check which ones are already redeemed
      await loadMyVouchers();
      
      // Step 1: Get all active vouchers from API (limit 100)
      console.log('📡 Step 1: Calling voucherApi với status=active...');
      const response = await voucherApi.getAll({ 
        page: 1, 
        limit: 100,
        status: 'active'
      });
      
      // ✅ SỬA: Check response.data.data thay vì response.data.items
      // Response structure: { statusCode: 200, data: [...], total: 6 }
      if (response.statusCode === 200) {
        // ✅ SỬA: Lấy từ response.data.data hoặc response.data (tùy structure)
        // Handle both cases: data is array directly OR data.items is array
        const responseData = response.data as any;
        const allVouchers = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || responseData?.items || []);
        
        console.log(`📦 Step 2: Received ${allVouchers.length} vouchers from API`);
        console.log('📦 Vouchers structure:', JSON.stringify(allVouchers.slice(0, 1), null, 2));
        
        if (allVouchers.length === 0) {
          console.log('⚠️ No vouchers returned from API');
          setStoreVouchers([]);
          return;
        }
        
        // Step 2: Filter vouchers by businessId (client-side filtering)
        console.log('🔍 Step 3: Filtering vouchers by businessId...');
        const filteredVouchers = allVouchers.filter((voucher: any) => {
          // ✅ Filter loại bỏ leaderboard vouchers
          if (voucher.voucherType === 'leaderboard') {
            console.log(`⏭️ Skipping leaderboard voucher: ${voucher._id}`);
            return false;
          }
          
          // ✅ Chỉ lấy active vouchers
          if (voucher.status !== 'active') {
            return false;
          }
          
          // Extract businessId from voucher
          // ✅ Thứ tự ưu tiên giống web: businessInfo.businessId trước
          let voucherBusinessId: string | null = null;
          
          // Priority 1: Check businessInfo.businessId (giống web)
          if (voucher.businessInfo?.businessId) {
            voucherBusinessId = String(voucher.businessInfo.businessId);
          }
          // Priority 2: Check businessId directly (có thể là string)
          else if (voucher.businessId) {
            voucherBusinessId = String(voucher.businessId);
          }
          // Priority 3: Check businessInfo._id
          else if (voucher.businessInfo?._id) {
            voucherBusinessId = String(voucher.businessInfo._id);
          }
          // Priority 4: Check business object
          else if (voucher.business) {
            if (typeof voucher.business === 'string') {
              voucherBusinessId = voucher.business;
            } else if (typeof voucher.business === 'object') {
              voucherBusinessId = String(voucher.business._id || voucher.business.id || '');
            }
          }
          
          // Compare with store businessId
          const matches = voucherBusinessId && String(voucherBusinessId) === String(storeBusinessId);
          
          if (matches) {
            console.log(`✅ Match found - Voucher ID: ${voucher._id}, Business ID: ${voucherBusinessId}, Name: ${voucher.customName}`);
          } else {
            console.log(`❌ No match - Voucher ID: ${voucher._id}, Business ID: ${voucherBusinessId}, Store ID: ${storeBusinessId}`);
          }
          
          return matches;
        });
        
        console.log(`✅ Step 4: Filtered ${filteredVouchers.length} vouchers matching businessId ${storeBusinessId}`);
        
        // Step 3: Filter only active vouchers (double check)
        console.log('🔍 Step 5: Final filtering active vouchers only...');
        const activeVouchers = filteredVouchers.filter((voucher: any) => {
          // Check status
          const status = String(voucher.status || '').toLowerCase();
          const isActiveStatus = status === 'active';
          
          // Check isPublished
          const isPublished = voucher.isPublished !== false;
          
          // Check expiration date
          let isNotExpired = true;
          if (voucher.endDate) {
            try {
              const endDate = new Date(voucher.endDate);
              const now = new Date();
              isNotExpired = endDate >= now;
            } catch (e) {
              console.warn('⚠️ Invalid endDate format:', voucher.endDate);
            }
          }
          
          const isActive = isActiveStatus && isPublished && isNotExpired;
          
          if (!isActive) {
            console.log(`⏭️ Skipping inactive voucher: ${voucher._id}`, {
              status,
              isPublished,
              isNotExpired,
              endDate: voucher.endDate
            });
          }
          
          return isActive;
        });
        
        console.log(`✅ Step 6: Found ${activeVouchers.length} active vouchers for store ${storeBusinessId}`);
        console.log('🎫 ===== Finished loading vouchers =====');
        
        setStoreVouchers(activeVouchers);
      } else {
        console.log('⚠️ Invalid status code:', response.statusCode);
        console.log('⚠️ Response:', response);
        setStoreVouchers([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading store vouchers:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      setStoreVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Handle redeem voucher
  const handleRedeemVoucher = async (voucherId: string) => {
    if (redeemingId) return; // Prevent multiple clicks

    try {
      setRedeemingId(voucherId);
      const response = await voucherApi.redeem(voucherId);
      
      if (response.statusCode === 200) {
        // Reload vouchers to update status
        if (store?._id) {
          await loadStoreVouchers(store._id);
        }
        Alert.alert('Success', 'Voucher redeemed successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to redeem voucher. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to redeem voucher. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setRedeemingId(null);
    }
  };

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
              };

              console.log('📦 FINAL borrowDto gửi đi:', {
                productId,
                businessId,
                depositValue: backendDepositValue, // Giá trị cố định từ backend
                depositValueType: typeof backendDepositValue,
                durationInDays: realtimeDays,
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

  // Calculate distance
  let distance = 0;
  if (userLocation && store.location?.coordinates) {
    const [longitude, latitude] = store.location.coordinates;
    distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      latitude,
      longitude
    );
  }

  // Calculate estimated time (rough estimate: 1km = 3 minutes)
  const estimatedTime = Math.round(distance * 3);

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COVER_IMAGE_HEIGHT - 100, COVER_IMAGE_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Cover image opacity (fade out on scroll)
  const coverImageOpacity = scrollY.interpolate({
    inputRange: [0, COVER_IMAGE_HEIGHT - 100, COVER_IMAGE_HEIGHT],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  // Cover image translate (parallax effect)
  const coverImageTranslate = scrollY.interpolate({
    inputRange: [0, COVER_IMAGE_HEIGHT],
    outputRange: [0, -COVER_IMAGE_HEIGHT * 0.3],
    extrapolate: 'clamp',
  });

  // Cart total calculation
  const cartTotal = cartItems.reduce((sum, item) => {
    const depositValue = (item.product?.productSizeId as any)?.depositValue || 0;
    return sum + depositValue;
  }, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Cover Image with Parallax */}
      <Animated.View
        style={[
          styles.coverImageContainer,
          {
            opacity: coverImageOpacity,
            transform: [{ translateY: coverImageTranslate }],
          },
        ]}
      >
        <ImageBackground
          source={
            store.businessLogoUrl
              ? { uri: store.businessLogoUrl }
              : require('../../../../assets/images/logo.jpg')
          }
          style={styles.coverImage}
          resizeMode="cover"
        >
          {/* Overlay gradient */}
          <View style={styles.coverOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* Header buttons overlay - Outside ImageBackground, at top level */}
      <View style={styles.headerOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => {
            console.log('🔙 Back button pressed - navigating to stores');
            router.push('/(protected)/customer/stores');
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View style={styles.headerButtonBackground}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Animated Header (appears on scroll) */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            opacity: headerOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.animatedHeaderBackButton}
          onPress={() => {
            console.log('🔙 Animated header back button pressed - navigating to stores');
            router.push('/(protected)/customer/stores');
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle}>{store.businessName}</Text>
        <View style={styles.animatedHeaderPlaceholder} />
      </Animated.View>

      {/* Main ScrollView with redesigned layout */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            // Động tính padding bottom = safeArea dưới + tab bar + cart bar (nếu có)
            paddingBottom: insets.bottom + 80 + (cartItems.length > 0 ? 80 : 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        bounces={true}
      >
        {/* Store Info Card (Floating Overlay) */}
        <View style={styles.storeInfoCard}>
          {/* Store Header with Logo */}
          <View style={styles.storeInfoHeader}>
            {store.businessLogoUrl ? (
              <Image
                source={{ uri: store.businessLogoUrl }}
                style={styles.storeInfoLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.storeInfoLogoPlaceholder}>
                <Ionicons name="storefront" size={32} color="#0F4D3A" />
              </View>
            )}
            <View style={styles.storeInfoHeaderText}>
              <Text style={styles.storeInfoName}>{store.businessName}</Text>
              <View style={styles.storeInfoMeta}>
                <View style={styles.storeInfoMetaItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.storeInfoMetaText}>
                    {store.averageRating ? store.averageRating.toFixed(1) : '0.0'}
                  </Text>
                </View>
                {estimatedTime > 0 && (
                  <>
                    <Text style={styles.storeInfoMetaSeparator}>•</Text>
                    <View style={styles.storeInfoMetaItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.storeInfoMetaText}>{estimatedTime} min</Text>
                    </View>
                  </>
                )}
                {distance > 0 && (
                  <>
                    <Text style={styles.storeInfoMetaSeparator}>•</Text>
                    <View style={styles.storeInfoMetaItem}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.storeInfoMetaText}>
                        {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Store Address (Collapsible) */}
          <View style={styles.storeInfoAddress}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.storeInfoAddressText} numberOfLines={2}>
              {store.businessAddress}
            </Text>
          </View>
        </View>

        {/* Vouchers Section */}
        <View style={styles.vouchersSection}>
          <Text style={styles.sectionTitle}>Available Vouchers</Text>
          {loadingVouchers ? (
            <View style={styles.vouchersLoadingContainer}>
              <ActivityIndicator size="small" color="#0F4D3A" />
              <Text style={styles.vouchersLoadingText}>Loading vouchers...</Text>
            </View>
          ) : storeVouchers.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vouchersList}
            >
              {storeVouchers.map((voucher, index) => {
                const discountPercent = voucher.discountPercent || 0;
                const rewardPointCost = voucher.rewardPointCost || 0;
                const endDate = voucher.endDate ? new Date(voucher.endDate) : null;
                const isExpired = endDate ? endDate < new Date() : false;
                const voucherId = voucher._id || voucher.id;
                const isRedeemed = myVoucherIds.has(voucherId);
                const isRedeeming = redeemingId === voucherId;
                const canRedeem = !isRedeemed && !isExpired && voucher.status === 'active' && !isRedeeming;
                
                // Gradient colors for vouchers (same as rewards screen)
                const GRADIENT_COLORS = [
                  ['#FF6B35', '#F7931E'],
                  ['#0F4D3A', '#1F2937'],
                  ['#DC2626', '#7C2D12'],
                  ['#059669', '#0D9488'],
                  ['#7C3AED', '#A855F7'],
                  ['#EA580C', '#F97316'],
                ];
                const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
                const baseCode = voucher.baseCode || voucher.code || 'N/A';
                
                return (
                  <TouchableOpacity
                    key={voucherId}
                    style={[styles.voucherCardNew, isRedeemed && styles.usedVoucherCard]}
                    onPress={() => {
                      router.push({
                        pathname: '/(protected)/customer/voucher-detail/[id]',
                        params: { id: voucherId }
                      });
                    }}
                    disabled={isRedeeming}
                  >
                    <View style={[
                      styles.voucherGradient,
                      { backgroundColor: gradient[0] },
                      isRedeemed && styles.usedVoucherGradient
                    ]}>
                      {/* Status Badge */}
                      {(isRedeemed || isExpired) && (
                        <View style={[styles.voucherStatusBadgeNew, { 
                          backgroundColor: (isExpired ? '#EF4444' : '#10B981') + '20' 
                        }]}>
                          <View style={[styles.voucherStatusDot, { 
                            backgroundColor: isExpired ? '#EF4444' : '#10B981' 
                          }]} />
                          <Text style={[styles.voucherStatusTextNew, { 
                            color: isExpired ? '#EF4444' : '#10B981' 
                          }]}>
                            {isRedeemed ? 'Redeemed' : 'Expired'}
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
                          <Text style={[styles.voucherTitle, isRedeemed && styles.usedVoucherText]}>
                            Up to
                          </Text>
                        </View>
                        <Text style={[styles.voucherDiscount, isRedeemed && styles.usedVoucherText]}>
                          {discountPercent}% OFF
                        </Text>
                        <Text style={[styles.voucherDescription, isRedeemed && styles.usedVoucherText]}>
                          {voucher.customDescription || voucher.customName || 'Special discount voucher'}
                        </Text>
                        <View style={styles.voucherCodeContainer}>
                          <Text style={styles.voucherCode}>{baseCode}</Text>
                        </View>
                        <View style={styles.voucherFooter}>
                          <Text style={[styles.validUntil, isRedeemed && styles.usedVoucherText]}>
                            HSD: {endDate ? endDate.toLocaleDateString('vi-VN') : 'N/A'}
                          </Text>
                          {isRedeemed ? (
                            <Text style={styles.ownedLabel}>Đã nhận</Text>
                          ) : canRedeem ? (
                            <TouchableOpacity
                              style={[styles.useButton, isRedeeming && styles.useButtonDisabled]}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleRedeemVoucher(voucherId);
                              }}
                              disabled={isRedeeming}
                            >
                              {isRedeeming ? (
                                <ActivityIndicator size="small" color="#0F4D3A" />
                              ) : (
                                <Text style={styles.useButtonText}>Nhận ngay</Text>
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
              })}
            </ScrollView>
          ) : (
            <View style={styles.vouchersEmptyContainer}>
              <Ionicons name="ticket-outline" size={32} color="#9CA3AF" />
              <Text style={styles.vouchersEmptyText}>No vouchers available</Text>
            </View>
          )}
        </View>

        {/* Menu Navigation - Pill-shaped Tabs */}
        {productGroups.length > 0 && (
          <View style={styles.menuNavigationContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuNavigationContent}
            >
              {[{ _id: 'all', name: 'All' }, ...productGroups].map((item) => {
                const isSelected = selectedCategory === item._id || (item._id === 'all' && selectedCategory === null);
                
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.menuTab,
                      isSelected && styles.menuTabActive
                    ]}
                    onPress={() => {
                      if (item._id === 'all') {
                        setSelectedCategory(null);
                      } else {
                        setSelectedCategory(item._id);
                      }
                    }}
                  >
                    <Text style={[
                      styles.menuTabText,
                      isSelected && styles.menuTabTextActive
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Products List - Vertical List */}
        <View style={styles.productsListContainer}>
          {productsLoading && filteredProducts.length === 0 ? (
            <View style={styles.loadingProductsContainer}>
              <ActivityIndicator size="large" color="#0F4D3A" />
              <Text style={styles.loadingProductsText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No products found</Text>
            </View>
          ) : (
            displayedProducts.map((product) => {
              const groupName = (product.productGroupId as any)?.name || 'Product';
              const groupDescription = (product.productGroupId as any)?.description || '';
              const depositValue = (product.productSizeId as any)?.depositValue || 0;
              const imageUrl = (product.productGroupId as any)?.imageUrl || product.images?.[0];

              return (
                <TouchableOpacity
                  key={product._id}
                  style={styles.productCardNew}
                  onPress={() => handleProductPress(product)}
                  activeOpacity={0.7}
                >
                  {/* Product Image - Left */}
                  <View style={styles.productCardImageContainer}>
                    {imageUrl && imageUrl.trim() !== '' ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.productCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productCardImagePlaceholder}>
                        <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  {/* Product Info - Middle */}
                  <View style={styles.productCardInfo}>
                    <Text style={styles.productCardName} numberOfLines={1}>
                      {groupName}
                    </Text>
                    <Text style={styles.productCardDescription} numberOfLines={2}>
                      {groupDescription || 'No description available'}
                    </Text>
                    <Text style={styles.productCardPrice}>
                      {depositValue > 0 ? `${depositValue.toLocaleString('vi-VN')} VNĐ` : 'Free'}
                    </Text>
                  </View>

                  {/* Add Button - Right */}
                  <TouchableOpacity
                    style={styles.productCardAddButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleProductPress(product);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={24} color="#0F4D3A" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}

          {/* Load More Button */}
          {hasMoreProducts && !loadingMore && displayedProducts.length < filteredProducts.length && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMoreProducts}
            >
              <Text style={styles.loadMoreButtonText}>Load More Products</Text>
            </TouchableOpacity>
          )}

          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#0F4D3A" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom Floating Bar (Cart) */}
      {cartItems.length > 0 && (
        <View style={styles.bottomFloatingBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemsText}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.cartTotalText}>
              {cartTotal.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={() => {
              // TODO: Navigate to cart screen
              Alert.alert('Cart', 'Cart functionality coming soon');
            }}
          >
            <Text style={styles.viewCartButtonText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

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
              <Text style={styles.productModalTitle}>Product Information</Text>
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
                  <Text style={styles.productModalSize}>Size: {selectedProduct.size}</Text>
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
                        <Text style={styles.depositLabel}>Deposit:</Text>
                        <Text style={styles.depositValue}>
                          {depositValue.toLocaleString('vi-VN')} VND
                        </Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                          ({pricePerDay.toLocaleString('vi-VN')} VND/day × {days} days)
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Wallet Balance Info */}
                <View style={styles.balanceInfo}>
                  <Ionicons name="wallet-outline" size={20} color="#3B82F6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.balanceLabel}>Current Wallet Balance:</Text>
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
                            {walletBalance.toLocaleString('vi-VN')} VND
                          </Text>
                          {isInsufficient && (
                            <Text style={styles.insufficientWarning}>
                              ⚠️ Insufficient balance. Please top up your wallet.
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
                        {selectedProduct.status === 'available' ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Product Description */}
                {selectedProduct.product?.productGroupId?.description && (
                  <View style={styles.productDescriptionSection}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.productDescription}>
                      {selectedProduct.product.productGroupId.description}
                    </Text>
                  </View>
                )}

                {/* Product Details */}
                <View style={styles.productDetailsSection}>
                  <Text style={styles.sectionTitle}>Product Details</Text>
                  
                  {selectedProduct.data && (
                    <View style={styles.detailRow}>
                      <Ionicons name="barcode-outline" size={18} color="#6B7280" />
                      <Text style={styles.detailLabel}>Serial Number:</Text>
                      <Text style={styles.detailValue}>{selectedProduct.data}</Text>
                    </View>
                  )}

                  {selectedProduct.product?.productSizeId?.description && (
                    <View style={styles.detailRow}>
                      <Ionicons name="resize-outline" size={18} color="#6B7280" />
                      <Text style={styles.detailLabel}>Size Description:</Text>
                      <Text style={styles.detailValue}>
                        {selectedProduct.product.productSizeId.description}
                      </Text>
                    </View>
                  )}

                  {selectedProduct.product?.condition && (
                    <View style={styles.detailRow}>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                      <Text style={styles.detailLabel}>Condition:</Text>
                      <Text style={styles.detailValue}>
                        {selectedProduct.product.condition}
                      </Text>
                    </View>
                  )}

                  {selectedProduct.product?.reuseCount !== undefined && (
                    <View style={styles.detailRow}>
                      <Ionicons name="repeat-outline" size={18} color="#6B7280" />
                      <Text style={styles.detailLabel}>Reuse Count:</Text>
                      <Text style={styles.detailValue}>
                        {selectedProduct.product.reuseCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Last Condition Images */}
                {selectedProduct.product?.lastConditionImages && (
                  <View style={styles.conditionImagesSection}>
                    <Text style={styles.sectionTitle}>Last Condition Images</Text>
                    <View style={styles.imageGrid}>
                      {selectedProduct.product.lastConditionImages.frontImage && (
                        <View style={styles.imageItem}>
                          <Text style={styles.imageLabel}>Front</Text>
                          <Image 
                            source={{ uri: selectedProduct.product.lastConditionImages.frontImage }} 
                            style={styles.conditionImage} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selectedProduct.product.lastConditionImages.backImage && (
                        <View style={styles.imageItem}>
                          <Text style={styles.imageLabel}>Back</Text>
                          <Image 
                            source={{ uri: selectedProduct.product.lastConditionImages.backImage }} 
                            style={styles.conditionImage} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selectedProduct.product.lastConditionImages.leftImage && (
                        <View style={styles.imageItem}>
                          <Text style={styles.imageLabel}>Left</Text>
                          <Image 
                            source={{ uri: selectedProduct.product.lastConditionImages.leftImage }} 
                            style={styles.conditionImage} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selectedProduct.product.lastConditionImages.rightImage && (
                        <View style={styles.imageItem}>
                          <Text style={styles.imageLabel}>Right</Text>
                          <Image 
                            source={{ uri: selectedProduct.product.lastConditionImages.rightImage }} 
                            style={styles.conditionImage} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selectedProduct.product.lastConditionImages.topImage && (
                        <View style={styles.imageItem}>
                          <Text style={styles.imageLabel}>Top</Text>
                          <Image 
                            source={{ uri: selectedProduct.product.lastConditionImages.topImage }} 
                            style={styles.conditionImage} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      {selectedProduct.product.lastConditionImages.bottomImage && (
                        <View style={styles.imageItem}>
                          <Text style={styles.imageLabel}>Bottom</Text>
                          <Image 
                            source={{ uri: selectedProduct.product.lastConditionImages.bottomImage }} 
                            style={styles.conditionImage} 
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Last Damage Assessment */}
                {selectedProduct.product?.lastDamageFaces && (
                  <View style={styles.damageFacesSection}>
                    <Text style={styles.sectionTitle}>Last Damage Assessment</Text>
                    {(() => {
                      // Check if lastDamageFaces exists and has items
                      if (!selectedProduct.product.lastDamageFaces || selectedProduct.product.lastDamageFaces.length === 0) {
                        return (
                          <View style={styles.emptyDamageFaces}>
                            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.emptyDamageFacesText}>This product has never been borrowed</Text>
                          </View>
                        );
                      }
                      
                      // Check if all faces have "none" issue
                      const hasRealDamage = selectedProduct.product.lastDamageFaces.some((face: any) => 
                        face.issue && face.issue.toLowerCase() !== 'none'
                      );
                      
                      if (!hasRealDamage) {
                        return (
                          <View style={styles.emptyDamageFaces}>
                            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.emptyDamageFacesText}>This product has never been borrowed</Text>
                          </View>
                        );
                      }
                      
                      // Show damage faces if there's real damage
                      return selectedProduct.product.lastDamageFaces
                        .filter((face: any) => face.issue && face.issue.toLowerCase() !== 'none')
                        .map((face: any, index: number) => (
                          <View key={index} style={styles.damageFaceItem}>
                            <View style={styles.damageFaceRow}>
                              <Ionicons name="warning" size={18} color="#EF4444" />
                              <Text style={styles.damageFaceLabel}>
                                {face.face.charAt(0).toUpperCase() + face.face.slice(1)}:
                              </Text>
                              <Text style={styles.damageFaceValue}>{face.issue}</Text>
                            </View>
                          </View>
                        ));
                    })()}
                  </View>
                )}

                {/* Duration Input */}
                <View style={styles.durationInputContainer}>
                  <Text style={styles.durationLabel}>Borrow Duration (days) *</Text>
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
                    placeholder="Enter number of days"
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
                      <Text style={styles.borrowButtonText}>Borrow Product</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Thông báo nếu user là owner của store */}
              {selectedProduct.status === 'available' && isStoreOwner && (
                <View style={styles.ownerMessage}>
                  <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
                  <Text style={styles.ownerText}>
                    You cannot borrow products from your own store
                  </Text>
                </View>
              )}

              {selectedProduct.status !== 'available' && (
                <View style={styles.unavailableMessage}>
                  <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
                  <Text style={styles.unavailableText}>
                    This product is currently unavailable for borrowing
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
    zIndex: 2,
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
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  productsSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    // Card height approximately 200-220px, image takes 60-65%
    minHeight: 200,
  },
  productImageContainer: {
    width: '100%',
    height: 130, // ~65% of card (200px card)
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 12,
    paddingBottom: 40, // Space for add button
    backgroundColor: '#FFFFFF',
    minHeight: 70, // ~35% of card for text area
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006241',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006241',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
  productDescriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  productDetailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vouchersSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vouchersList: {
    paddingRight: 16,
    gap: 12,
  },
  // Old voucher styles (kept for backward compatibility)
  voucherCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
  },
  voucherCardContent: {
    padding: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  // Old voucher styles (kept for backward compatibility)
  voucherStatusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voucherStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  voucherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  voucherPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  voucherPointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  voucherExpiry: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // New voucher styles (matching rewards screen)
  voucherCardNew: {
    width: 240,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginRight: 12,
  },
  voucherGradient: {
    padding: 16,
    borderRadius: 16,
    minHeight: 160,
  },
  voucherContent: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  voucherDiscount: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  voucherDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    lineHeight: 16,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
  useButtonDisabled: {
    opacity: 0.6,
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
  ownedLabel: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  voucherStatusBadgeNew: {
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
  voucherStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  voucherStatusTextNew: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 36,
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
  vouchersLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  vouchersLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  vouchersEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  vouchersEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4D3A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  redeemButtonDisabled: {
    opacity: 0.6,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  redeemedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  redeemedBadgeText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  voucherStatusBadgeRedeemed: {
    backgroundColor: '#D1FAE5',
  },
  voucherStatusTextRedeemed: {
    color: '#059669',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textTransform: 'capitalize',
  },
  conditionImagesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageItem: {
    width: '30%',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  conditionImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  damageFacesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  damageFaceItem: {
    marginBottom: 12,
  },
  damageFaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  damageFaceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '600',
  },
  damageFaceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    textTransform: 'capitalize',
  },
  emptyDamageFaces: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyDamageFacesText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // New redesigned styles
  coverImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.3,
    zIndex: 0,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    zIndex: 200,
    elevation: 200,
  },
  headerButtonBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButton: {
    zIndex: 201,
    elevation: 201,
    pointerEvents: 'auto',
  },
  headerSearchButton: {
    // Container for search button
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animatedHeaderBackButton: {
    padding: 8,
    width: 40,
    zIndex: 100,
    elevation: 10,
  },
  animatedHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  animatedHeaderPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingTop: Dimensions.get('window').height * 0.3,
    // paddingBottom được tính động trong contentContainerStyle dựa trên safe area + tab bar + cart bar
  },
  storeInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -40, // Overlap with cover image
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    position: 'relative',
  },
  storeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeInfoLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  storeInfoLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeInfoHeaderText: {
    flex: 1,
  },
  storeInfoName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  storeInfoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeInfoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeInfoMetaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  storeInfoMetaSeparator: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  storeInfoAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  storeInfoAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  menuNavigationContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  menuNavigationContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  menuTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  menuTabActive: {
    backgroundColor: '#0F4D3A',
  },
  menuTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  menuTabTextActive: {
    color: '#FFFFFF',
  },
  productsListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productCardNew: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productCardImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  productCardImage: {
    width: '100%',
    height: '100%',
  },
  productCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  productCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  productCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F4D3A',
  },
  productCardAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0F4D3A',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  bottomFloatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F4D3A',
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4D3A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewCartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

