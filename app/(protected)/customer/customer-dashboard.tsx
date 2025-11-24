import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { productsApi } from "@/services/api/businessService";
import { getCurrentUserProfileWithAutoRefresh } from "@/services/api/userService";
import { mockTransactions } from "@/utils/mockData";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import CustomerHeader from "../../../components/CustomerHeader";
import { StandaloneAIChecker } from "../../../components/StandaloneAIChecker";
import { useAuth } from "../../../context/AuthProvider";
import { useI18n } from "../../../hooks/useI18n";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CustomerDashboard() {
  const { state } = useAuth();
  const { t } = useI18n();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showAIQualityCheck, setShowAIQualityCheck] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [borrowing, setBorrowing] = useState(false);
  const [showBalance, setShowBalance] = useState(false); // Mặc định ẩn số tiền
  const [durationInDays, setDurationInDays] = useState<string>('30'); // Số ngày mượn, mặc định 30
  // use layout navigation; no local tab state here
  const scanLock = useRef(false);

  useTokenRefresh();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard').greeting;
    if (hour < 18) return t('dashboard').greeting;
    return t('dashboard').greeting;
  };

  const loadUserData = useCallback(async () => {
      if (state.accessToken) {
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
        console.log('🔍 Dashboard - Loaded User Data:', user);
        console.log('💰 Dashboard - Wallet:', user.wallet);
        console.log('💰 Dashboard - Balance:', user.wallet?.balance);
        console.log('💰 Dashboard - AvailableBalance:', (user.wallet as any)?.availableBalance);
          setUserData(user);
        } catch (error: any) {
          // Don't log network errors as errors - they're expected when offline
          const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                                 error?.message?.toLowerCase().includes('timeout') ||
                                 error?.message?.toLowerCase().includes('connection');
          
          if (!isNetworkError) {
            console.error('Error loading user data:', error);
          } else {
            console.warn('⚠️ Network error loading user data (using default values):', error.message);
          }
          // Continue with default user data
        }
      }
  }, [state.accessToken]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Reload user data when screen is focused (e.g., after returning from profile edit)
  useFocusEffect(
    useCallback(() => {
      const checkAndReload = async () => {
        try {
          const lastUpdateTimestamp = await AsyncStorage.getItem('PROFILE_UPDATED_TIMESTAMP');
          if (lastUpdateTimestamp) {
            const lastUpdate = parseInt(lastUpdateTimestamp, 10);
            const now = Date.now();
            // Reload if profile was updated within the last 5 minutes
            if (now - lastUpdate < 5 * 60 * 1000) {
              console.log('🔄 Profile was recently updated, reloading user data...');
              await loadUserData();
            }
          } else {
            // Always reload when screen is focused to ensure fresh data
            await loadUserData();
          }
        } catch (error) {
          console.error('Error checking profile update:', error);
          // Still try to load user data
          await loadUserData();
        }
      };
      checkAndReload();
    }, [loadUserData])
  );

  // Reload user data when product modal opens to get latest balance
  useEffect(() => {
    if (showProductModal && state.accessToken) {
      const reloadUserData = async () => {
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
          console.log('🔄 Reloading user data for product modal...');
          console.log('💰 Updated Wallet Balance:', user.wallet?.balance);
          console.log('💰 Updated AvailableBalance:', (user.wallet as any)?.availableBalance);
          setUserData(user);
        } catch (error) {
          console.error('Error reloading user data:', error);
        }
      };
      reloadUserData();
    }
  }, [showProductModal, state.accessToken]);

  const user = userData || {
    id: "1",
    name: "User",
    rank: 8,
    maxRank: 10,
    level: "Green",
    walletBalance: 125.5,
  };

  const userTransactions = mockTransactions.filter((t) => (t as any).customerId === user?.id || (t as any).userId === user?.id);
  // Mock data for active borrows
  const mockActiveBorrows = [
    {
      id: "borrow-1",
      customerId: "1",
      storeId: "store-1",
      packagingItemId: "item-1",
      type: "borrow",
      status: "completed",
      borrowedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      returnedAt: null,
    },
    {
      id: "borrow-2", 
      customerId: "1",
      storeId: "store-2",
      packagingItemId: "item-2",
      type: "borrow",
      status: "completed",
      borrowedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      returnedAt: null,
    }
  ];

  const mockBorrowItems = [
    { id: "item-1", name: "Coffee Cup", type: "cup", size: "Medium" },
    { id: "item-2", name: "Food Container", type: "container", size: "Large" }
  ];

  const mockBorrowStores = [
    { id: "store-1", name: "Starbucks Coffee" },
    { id: "store-2", name: "McDonald's" }
  ];

  const activeBorrows = mockActiveBorrows;

  const startScanning = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status === "granted") {
        scanLock.current = false;
        setShowQRScanner(true);
      } else {
        Alert.alert("Quyền truy cập camera", "Vui lòng cấp quyền truy cập camera để quét mã QR", [{ text: "OK" }]);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể mở camera. Vui lòng thử lại.");
    }
  };

  const stopScanning = () => setShowQRScanner(false);

  const onBarcode = async (e: { data?: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    const serialNumber = e?.data ?? "";
    console.log('📱 QR Code scanned:', serialNumber);
    
    if (!serialNumber || serialNumber.trim() === '') {
      Alert.alert('Error', 'Invalid QR code');
      scanLock.current = false;
      return;
    }
    
    Vibration.vibrate(Platform.OS === "ios" ? 30 : 50);
    setShowQRScanner(false);
    
    try {
      // Gọi API để lấy thông tin sản phẩm từ serial number
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
          ? productData.productSizeId.sizeName
          : "Unknown";
        
        const scannedItem = {
          id: productData._id || productData.id,
          name: productGroupName || "Product",
          size: productSizeName,
        type: "container",
          data: serialNumber,
          product: productData, // Lưu thông tin sản phẩm đầy đủ
          qrCode: qrCode || productData.qrCode || '',
          status: productStatus || productData.status || 'available',
        };
        
        console.log('📱 Scanned item created:', scannedItem);
        setScannedItem(scannedItem);
        setDurationInDays('30'); // Reset về mặc định khi mở modal mới
        setShowProductModal(true);
      } else {
        console.error('❌ No product data in response');
        Alert.alert('Error', responseData.message || 'Product not found');
      }
    } catch (error: any) {
      console.error('Error scanning QR:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to scan product';
      Alert.alert('Error', errorMessage);
    } finally {
      scanLock.current = false;
    }
  };

  const handleBorrow = async () => {
    if (!scannedItem || !scannedItem.product) {
      Alert.alert('Error', 'Thông tin sản phẩm không hợp lệ');
      return;
    }

    if (scannedItem.status !== 'available') {
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
    } catch (error) {
      console.error('Error reloading user data:', error);
      // Continue with existing userData if reload fails
    }

    const product = scannedItem.product;
    const depositValue = product.productSizeId?.depositValue || 0;
    
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
    
    // Kiểm tra số ngày mượn
    const days = parseInt(durationInDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số ngày mượn hợp lệ (lớn hơn 0)');
      return;
    }

    console.log('✅ Balance sufficient, proceeding to confirm...');

    // Confirm borrow
    Alert.alert(
      'Xác nhận đặt mượn',
      `Bạn có chắc chắn muốn đặt mượn sản phẩm này?\n\n` +
      `Tiền cọc: ${depositValue.toLocaleString('vi-VN')} VNĐ\n` +
      `Số dư hiện tại: ${walletBalance.toLocaleString('vi-VN')} VNĐ\n` +
      `Số dư sau khi trừ: ${(walletBalance - depositValue).toLocaleString('vi-VN')} VNĐ\n` +
      `Thời gian mượn: ${days} ngày`,
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

              const borrowDto = {
                productId,
                businessId,
                depositValue,
                durationInDays: days,
                type: "online" as const, // ← CỨ ĐỂ CỨNG THẾ NÀY LÀ CHẮC ĂN NHẤT
              };

              console.log('📦 FINAL borrowDto gửi đi:', {
                productId,
                businessId,
                depositValue,
                durationInDays: days,
                type: 'online'
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
                      setScannedItem(null);
                      // Reload user data để cập nhật số dư
                      if (state.accessToken) {
                        getCurrentUserProfileWithAutoRefresh().then(setUserData).catch(console.error);
                      }
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Error creating borrow transaction:', error);
              
              // Xử lý lỗi cụ thể
              const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tạo yêu cầu mượn. Vui lòng thử lại.';
              
              // Check for insufficient balance
              const isInsufficientBalance = errorMessage.toLowerCase().includes('insufficient') || 
                                           errorMessage.toLowerCase().includes('không đủ') ||
                                           errorMessage.toLowerCase().includes('số dư');
              
              // Check for maximum concurrent borrow limit
              const isLimitReached = errorMessage.toLowerCase().includes('maximum concurrent') || 
                                     errorMessage.toLowerCase().includes('limit reached') ||
                                     errorMessage.toLowerCase().includes('giới hạn');
              
              if (isLimitReached) {
                Alert.alert(
                  'Đã đạt giới hạn mượn',
                  `Bạn đã đạt giới hạn số lượng sản phẩm có thể mượn đồng thời.\n\n` +
                  `Vui lòng trả một số sản phẩm đang mượn trước khi mượn thêm.\n\n` +
                  `Thông báo: ${errorMessage}`,
                  [{ text: 'Đóng' }]
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
                  errorMessage
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

  return (
    <View style={styles.container}>
      <CustomerHeader 
        title={getTimeBasedGreeting() + ", " + ((user as any)?.fullName || user?.name || "User")} 
        subtitle="Nice to meet you!" 
        user={user} 
      />
      {/* Floating White Card - Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroCardLeft}>
          <Text style={styles.heroRankNumber}>{user?.rank || 8}</Text>
          <Text style={styles.heroRankLabel}>Your Rank</Text>
            </View>
        <TouchableOpacity 
          style={styles.heroScanButton}
          onPress={startScanning}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
          <Text style={styles.heroScanButtonText}>Scan to Borrow</Text>
            </TouchableOpacity>
        </View>

      <View style={styles.whiteBackground}>
        <View style={styles.contentWrapper}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 24, paddingTop: 16 }}>
              {/* Partner Brands Carousel */}
            <View style={styles.sectionPad}>
                <Text style={styles.sectionTitle}>Partner Brands</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.partnerCarouselContainer}
                >
                  {[
                    { 
                      image: "https://i.pinimg.com/736x/15/f3/78/15f378382068f1695de5a8f1a73a81e2.jpg",
                      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_logo.svg/1200px-Starbucks_logo.svg.png",
                      brand: "Starbucks"
                    },
                    { 
                      image: "https://i.pinimg.com/736x/ac/b8/ed/acb8edfe7de480f3de889444d3079ca1.jpg",
                      logo: "https://i.pinimg.com/736x/23/4f/9b/234f9bbee27cd84a0a1ffba559d5bb4b.jpg",
                      brand: "Highlands"
                    },
                    { 
                      image: "https://i.pinimg.com/1200x/f0/d8/ac/f0d8ac3b671863d6473cec480755cf47.jpg",
                      logo: "https://i.pinimg.com/736x/c2/22/59/c22259cd5eea08886a0642857da34345.jpg",
                      brand: "Phuc Long"
                    },
                    { 
                      image: "https://i.pinimg.com/736x/66/fe/de/66fedec04f3aba15c6892be93406481d.jpg",
                      logo: "https://i.pinimg.com/736x/cb/66/84/cb668448a69f7917c91cd06c0943901a.jpg",
                      brand: "The Coffee House"
                    },
                  ].map((partner, index) => (
                    <View key={index} style={styles.partnerCard}>
                  <Image
                        source={{ uri: partner.image }}
                        style={styles.partnerCardImage}
                    resizeMode="cover"
                  />
                      <View style={styles.partnerCardOverlay}>
                        <View style={styles.partnerLogoContainer}>
                          <Image
                            source={{ uri: partner.logo }}
                            style={styles.partnerLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.partnerBrandName}>{partner.brand}</Text>
                      </View>
                    </View>
                ))}
              </ScrollView>
            </View>

              {/* Quick Actions */}
            <View style={styles.sectionPad}>
                <View style={styles.quickActionsContainer}>
                  <TouchableOpacity 
                    style={styles.quickActionItem}
                    onPress={() => router.push("/(protected)/customer/customer-wallet")}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#10B981" }]}>
                      <Ionicons name="wallet-outline" size={28} color="#FFFFFF" />
              </View>
                    <Text style={styles.quickActionLabel}>Deposit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickActionItem}
                    onPress={() => router.push("/(protected)/customer/stores")}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#3B82F6" }]}>
                      <Ionicons name="map-outline" size={28} color="#FFFFFF" />
                  </View>
                    <Text style={styles.quickActionLabel}>Stores</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.quickActionItem}
                  onPress={() => {
                    const mockItem = {
                      id: Math.random().toString(),
                      name: "AI Quality Check",
                      type: "container",
                      data: "ai-quality-check",
                    };
                    setScannedItem(mockItem);
                    setShowAIQualityCheck(true);
                  }}
                >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#8B5CF6" }]}>
                      <Ionicons name="sparkles-outline" size={28} color="#FFFFFF" />
                  </View>
                    <Text style={styles.quickActionLabel}>AI Check</Text>
                </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickActionItem}
                    onPress={() => router.push("/(protected)/customer/rewards")}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#F59E0B" }]}>
                      <Ionicons name="trophy-outline" size={28} color="#FFFFFF" />
                  </View>
                    <Text style={styles.quickActionLabel}>Rank</Text>
                </TouchableOpacity>
                  </View>
            </View>

              {/* Recommended Section */}
            <View style={styles.sectionPad}>
              <View style={styles.recoHeader}>
                  <Text style={styles.recoTitle}>Recommended</Text>
                <TouchableOpacity>
                  <Text style={styles.recoCta}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.recoGrid, { marginTop: 12 }]}>
                {[
                  "https://i.pinimg.com/736x/c2/22/59/c22259cd5eea08886a0642857da34345.jpg",
                  "https://i.pinimg.com/736x/66/fe/de/66fedec04f3aba15c6892be93406481d.jpg",
                  "https://i.pinimg.com/736x/cb/66/84/cb668448a69f7917c91cd06c0943901a.jpg",
                  "https://i.pinimg.com/1200x/2e/13/a2/2e13a2c8a786bb5eeebb3531c4709a18.jpg"
                ].map((uri, index) => (
                  <View key={uri} style={styles.recoCard}>
                    <Image
                      source={{ uri }}
                      style={styles.recoImg}
                      resizeMode="cover"
                    />
                    <View style={styles.recoOverlay}>
                      <Text style={styles.recoCardTitle}>Coffee Cup {index + 1}</Text>
                      <Text style={styles.recoSubtitle}>Eco-friendly</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
      </View>


            <View style={[styles.sectionPad, { marginTop: 8 }]}>
              <View style={styles.cardPlain}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="cube" size={16} color="#111827" />
                    <Text style={styles.cardHeaderTitle}>{t('dashboard').currentlyBorrowing}</Text>
                </View>
                  <View style={styles.badgeSmall}><Text style={styles.badgeSmallText}>{activeBorrows.length}</Text></View>
            </View>
              {activeBorrows.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <View style={styles.emptyIconBox}>
                      <Ionicons name="cube" size={40} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyTitle}>No items available</Text>
                    <Text style={styles.emptySub}>Scan QR code to start</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={startScanning}>
                      <Ionicons name="qr-code" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>Scan QR Code</Text>
                </TouchableOpacity>
              </View>
              ) : (
                  <View style={{ gap: 10 }}>
                  {activeBorrows.map((transaction) => {
                    const item = mockBorrowItems.find((p) => p.id === transaction.packagingItemId);
                    const store = mockBorrowStores.find((s) => s.id === transaction.storeId);
                    const isOverdue = transaction.dueDate && new Date() > transaction.dueDate;
                    return (
                        <View key={transaction.id} style={styles.borrowCard}>
                          <View style={styles.borrowHead}>
                            <View style={styles.borrowLeft}>
                              <View style={styles.borrowIcon}><Ionicons name="cube" size={18} color="#0F4D3A" /></View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.borrowTitle}>{item?.name} - {item?.size}</Text>
                                <Text style={styles.borrowStore}>{store?.name}</Text>
            </View>
          </View>
                            <View style={[styles.statusPill, isOverdue && styles.statusPillDanger]}>
                              <Text style={[styles.statusPillText, isOverdue && styles.statusPillDangerText]}>{isOverdue ? "Overdue" : "Borrowing"}</Text>
                    </View>
                  </View>
                          <View style={styles.borrowFoot}>
                            <Text style={styles.borrowLabel}>Due Date</Text>
                            <Text style={styles.borrowDate}>{transaction.dueDate?.toLocaleDateString("vi-VN")}</Text>
              </View>
            </View>
                    );
                  })}
          </View>
        )}
              </View>
            </View>

            <View style={styles.sectionPad}>
          <View style={styles.impactCard}>
                <View style={styles.impactHead}>
                  <Ionicons name="leaf" size={18} color="#fff" />
              <Text style={styles.impactTitle}>Your Impact</Text>
            </View>
                <View style={styles.impactGrid}>
              <View style={styles.impactStat}>
                    <Text style={styles.impactValue}>12</Text>
                    <Text style={styles.impactLabel}>Returns</Text>
            </View>
              <View style={styles.impactStat}>
                    <Text style={styles.impactValue}>2.4kg</Text>
                    <Text style={styles.impactLabel}>Plastic Saved</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* bottom navigation removed; using layout navigation */}

      {showQRScanner && hasPermission && (
         <View style={styles.cameraSheet}>
          <TouchableOpacity style={styles.cameraBackdrop} onPress={stopScanning} activeOpacity={1} />
           <View style={styles.cameraHeader}>
             <Text style={styles.cameraTitle}>Scan QR</Text>
            <TouchableOpacity style={styles.closeButton} onPress={stopScanning} activeOpacity={0.7}>
               <Ionicons name="close" size={24} color="#fff" />
             </TouchableOpacity>
           </View>
           <View style={styles.cameraBox}>
            <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onBarcode} />
             <View pointerEvents="none" style={styles.reticle} />
           </View>
           <Text style={styles.cameraHint}>Align the QR inside the frame to scan</Text>
         </View>
       )}

       {/* Product Info Modal - Hiển thị sau khi quét QR */}
       {showProductModal && scannedItem && (
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
               {scannedItem.product?.productGroupId?.imageUrl && (
                 <Image
                   source={{ uri: scannedItem.product.productGroupId.imageUrl }}
                   style={styles.productImage}
                   resizeMode="cover"
                 />
               )}

               {/* Product Info */}
               <View style={styles.productInfoCard}>
                 <Text style={styles.productName}>{scannedItem.name}</Text>
                 {scannedItem.size && (
                   <Text style={styles.productSize}>Kích thước: {scannedItem.size}</Text>
                 )}
                 
                 {scannedItem.product?.productSizeId?.depositValue && (
                   <View style={styles.depositInfo}>
                     <Ionicons name="cash-outline" size={20} color="#059669" />
                     <View style={{ flex: 1 }}>
                       <Text style={styles.depositLabel}>Tiền cọc:</Text>
                       <Text style={styles.depositValue}>
                         {scannedItem.product.productSizeId.depositValue.toLocaleString('vi-VN')} VNĐ
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
                       const depositValue = scannedItem.product?.productSizeId?.depositValue || 0;
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

                 {scannedItem.status && (
                   <View style={styles.statusInfo}>
                     <View style={[
                       styles.statusBadge,
                       scannedItem.status === 'available' ? styles.statusAvailable : styles.statusUnavailable
                     ]}>
                       <Text style={[
                         styles.statusText,
                         scannedItem.status !== 'available' && { color: '#DC2626' }
                       ]}>
                         {scannedItem.status === 'available' ? 'Có sẵn' : 'Không có sẵn'}
                       </Text>
                     </View>
                   </View>
                 )}

                 {scannedItem.product?.productGroupId?.description && (
                   <Text style={styles.productDescription}>
                     {scannedItem.product.productGroupId.description}
                   </Text>
                 )}

                 {scannedItem.data && (
                   <View style={styles.serialInfo}>
                     <Text style={styles.serialLabel}>Serial Number:</Text>
                     <Text style={styles.serialValue}>{scannedItem.data}</Text>
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
               {scannedItem.status === 'available' && (
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

               {scannedItem.status !== 'available' && (
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

       {showAIQualityCheck && (
         <View style={styles.aiQualityOverlay}>
           <View style={styles.aiQualityContainer}>
             <View style={styles.aiQualityHeader}>
               <Text style={styles.aiQualityTitle}>AI Quality Check</Text>
               <TouchableOpacity 
                 style={styles.aiQualityCloseButton} 
                 onPress={() => setShowAIQualityCheck(false)}
                 activeOpacity={0.7}
               >
                 <Ionicons name="close" size={24} color="#6B7280" />
               </TouchableOpacity>
             </View>
             <StandaloneAIChecker />
           </View>
         </View>
       )}
     </View>
   );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00704A' },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 20,
  },
  // Hero Card Styles
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: -30, // Overlap with header
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  heroRankNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FF8C00',
    lineHeight: 72,
    marginBottom: 4,
  },
  heroRankLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  heroScanButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#00704A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
  },
  heroScanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Partner Carousel Styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  partnerCarouselContainer: {
    paddingRight: 16,
    gap: 16,
  },
  partnerCard: {
    width: 280,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  partnerCardImage: {
    width: '100%',
    height: '100%',
  },
  partnerCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerLogoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 12,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  partnerBrandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  // Quick Actions Styles
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  aiTestButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  aiTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stickyHeader: { position: 'relative', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  stickyHeaderInner: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stickyHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sectionPad: { paddingHorizontal: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  balanceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceHidden: { fontSize: 16, fontWeight: '800', color: '#00704A', letterSpacing: 2 },
  eyeButton: { padding: 4 },
  cardGrid: { flexDirection: 'row', gap: 10 },
  cardScrollContainer: {
    paddingHorizontal: 0,
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardTile: {
    width: 160,
    height: 107,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTileImg: {
    width: 160,
    height: 107,
    borderRadius: 14,
  },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  quickScrollContainer: { paddingVertical: 8, gap: 16 },
  quickBtn: { alignItems: 'center', marginRight: 16 },
  quickIcon: { padding: 14, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  quickText: { fontSize: 10, color: '#111827', marginTop: 6, fontWeight: '600', fontFamily: 'Poppins' },
  recoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  recoTitle: { fontWeight: '800', fontSize: 16, color: '#111827' },
  recoCta: { color: '#00704A', fontWeight: '700', fontSize: 12 },
  recoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recoCard: { 
    width: (Dimensions.get('window').width - 16*2 - 10) / 2, 
    aspectRatio: 4/3, 
    borderRadius: 16, 
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recoImg: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 16,
  },
  recoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  recoCardTitle: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700',
    marginBottom: 2,
  },
  recoSubtitle: { 
    color: 'rgba(255, 255, 255, 0.8)', 
    fontSize: 12, 
    fontWeight: '500',
  },
  iconRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 12 },
  iconBtn: { padding: 8 },
  cardPlain: { backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  badgeSmall: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeSmallText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyIconBox: { backgroundColor: '#F3F4F6', padding: 20, borderRadius: 16, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#00704A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  borrowCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  borrowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  borrowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 10 },
  borrowIcon: { backgroundColor: '#0F4D3A20', padding: 8, borderRadius: 10 },
  borrowTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  borrowStore: { fontSize: 11, color: '#6B7280' },
  statusPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  statusPillDanger: { backgroundColor: '#FEF2F2' },
  statusPillDangerText: { color: '#EF4444' },
  borrowFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borrowLabel: { fontSize: 11, color: '#6B7280' },
  borrowDate: { fontSize: 11, fontWeight: '600', color: '#111827' },
  impactCard: { backgroundColor: '#00704A', borderRadius: 16, padding: 16, overflow: 'hidden' },
  impactHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  impactTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  impactGrid: { flexDirection: 'row', gap: 12 },
  impactStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  impactValue: { color: '#fff', fontWeight: '900', fontSize: 20, marginBottom: 4 },
  impactLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  // Product Modal Styles
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
    fontWeight: '600',
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10, paddingTop: 10 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, marginTop: 4, color: '#6B7280', fontWeight: '700' },
  // camera overlay
  cameraSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 50,
    paddingTop: 56,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cameraBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cameraHeader: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  cameraTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBox: { width: "100%", maxWidth: 420, aspectRatio: 3 / 4, borderRadius: 16, overflow: "hidden", marginTop: 24 },
  camera: { flex: 1 },
  reticle: {
    position: "absolute",
    left: "10%",
    top: "18%",
    width: "80%",
    height: "64%",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  cameraHint: { color: "#fff", opacity: 0.9, fontSize: 12, marginTop: 12 },
  aiQualityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  aiQualityContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 16,
    maxHeight: '95%',
    width: '95%',
    overflow: 'hidden',
    flex: 1,
  },
  aiQualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  aiQualityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  aiQualityCloseButton: {
    padding: 8,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  balanceInsufficient: {
    color: '#DC2626',
  },
  insufficientWarning: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    fontWeight: '600',
  },
});