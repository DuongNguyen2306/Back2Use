import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { productsApi } from "@/services/api/businessService";
import { getCurrentUserProfileWithAutoRefresh, leaderboardApi } from "@/services/api/userService";
import { mockTransactions } from "@/utils/mockData";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from "expo-camera";
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
  const [permission, requestPermission] = useCameraPermissions();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showAIQualityCheck, setShowAIQualityCheck] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [borrowing, setBorrowing] = useState(false);
  const [showBalance, setShowBalance] = useState(false); // Mặc định ẩn số tiền
  const [durationInDays, setDurationInDays] = useState<string>('30'); // Số ngày mượn, mặc định 30
  const [userRank, setUserRank] = useState<number | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [laserLinePosition, setLaserLinePosition] = useState(0);
  // use layout navigation; no local tab state here
  const scanLock = useRef(false);
  const laserAnimationRef = useRef<any>(null);

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
              entry.customerId._id === user._id
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
          // Silently handle "No valid access token available" errors
          const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                                 error?.message?.toLowerCase().includes('no access token');
          
          // Don't log network errors as errors - they're expected when offline
          const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                                 error?.message?.toLowerCase().includes('timeout') ||
                                 error?.message?.toLowerCase().includes('connection') ||
                                 error?.message?.toLowerCase().includes('application failed to respond') ||
                                 error?.message?.toLowerCase().includes('failed to fetch');
          
          if (!isNoTokenError && !isNetworkError) {
            console.error('Error loading user data:', error);
          } else if (isNetworkError) {
            // Silently handle - don't log to UI
            return;
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
        } catch (error: any) {
          // Silently handle "No valid access token available" errors
          const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                                 error?.message?.toLowerCase().includes('no access token');
          if (!isNoTokenError) {
            console.error('Error reloading user data:', error);
          }
        }
      };
      reloadUserData();
    }
  }, [showProductModal, state.accessToken]);

  const user = userData || {
    id: "1",
    name: "User",
    rank: userRank !== null ? userRank : undefined,
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
      if (!permission?.granted) {
        const result = await requestPermission();
        if (result.granted) {
          scanLock.current = false;
          setShowQRScanner(true);
        } else {
          Alert.alert("Camera Permission", "Please grant camera permission to scan QR codes", [{ text: "OK" }]);
        }
      } else {
        scanLock.current = false;
        setShowQRScanner(true);
      }
    } catch {
      Alert.alert("Error", "Unable to open camera. Please try again.");
    }
  };

  const stopScanning = () => {
    setShowQRScanner(false);
    setFlashEnabled(false);
    if (laserAnimationRef.current) {
      clearInterval(laserAnimationRef.current);
      laserAnimationRef.current = null;
    }
  };

  // Laser scanning line animation
  useEffect(() => {
    if (showQRScanner && permission?.granted) {
      const frameSize = screenWidth * 0.7;
      let direction = 1;
      let position = 10; // Start from top
      
      laserAnimationRef.current = setInterval(() => {
        position += direction * 3;
        if (position >= frameSize - 10 || position <= 10) {
          direction *= -1;
        }
        setLaserLinePosition(position);
      }, 16); // ~60fps
      
      return () => {
        if (laserAnimationRef.current) {
          clearInterval(laserAnimationRef.current);
          laserAnimationRef.current = null;
        }
        setLaserLinePosition(0);
      };
    } else {
      setLaserLinePosition(0);
    }
  }, [showQRScanner, permission?.granted]);

  // Helper function to handle product not found case
  const handleProductNotFound = async (serialNumber: string) => {
    try {
      // Check if customer has a borrowing transaction with this serial number
      const customerHistory = await borrowTransactionsApi.getCustomerHistory({ page: 1, limit: 100 });
      const transactions = customerHistory.data?.items || (Array.isArray(customerHistory.data) ? customerHistory.data : []);
      
      const borrowingTransaction = transactions.find((t: any) => 
        t.status === 'borrowing' &&
        t.productId?.serialNumber === serialNumber
      );
      
      if (borrowingTransaction) {
        console.log('✅ Found borrowing transaction - product is currently borrowed');
        Alert.alert(
          'Product Currently Borrowed',
          'This product is currently being borrowed. Please return the product at the store.',
          [{ text: 'OK' }]
        );
      } else {
        // Product not found - likely being borrowed by someone else or doesn't exist
        // Show message that product is being borrowed
        console.log('⚠️ Product not found - likely being borrowed');
        Alert.alert(
          'Product Currently Borrowed',
          'This product is currently being borrowed or not available.',
          [{ text: 'OK' }]
        );
      }
    } catch (historyError: any) {
      console.log('⚠️ Error checking transaction history:', historyError);
      // Show message even if we can't check transaction history
      Alert.alert(
        'Sản phẩm đang được mượn',
        'Sản phẩm này đang được mượn hoặc không có sẵn.',
        [{ text: 'OK' }]
      );
    }
  };

  const onBarcode = async (e: { data?: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    const scannedData = e?.data ?? "";
    console.log('📱 QR Code scanned:', scannedData);
    
    if (!scannedData || scannedData.trim() === '') {
      Alert.alert('Error', 'Invalid QR code');
      scanLock.current = false;
      return;
    }
    
    Vibration.vibrate(Platform.OS === "ios" ? 30 : 50);
    setShowQRScanner(false);
    
    // Extract ID from deep link if present
    let actualId = scannedData;
    if (scannedData.includes('://')) {
      const match = scannedData.match(/(?:com\.)?back2use:\/\/item\/([^\/]+)/);
      if (match && match[1]) {
        actualId = match[1];
        console.log('🔗 Extracted ID from deep link:', actualId);
      } else {
        const parts = scannedData.split('/');
        actualId = parts[parts.length - 1];
        console.log('🔗 Extracted ID from path:', actualId);
      }
    }
    
    // Check if this is a transaction ID (24 character hex string - MongoDB ObjectId)
    const isTransactionId = /^[0-9a-fA-F]{24}$/.test(actualId);
    if (isTransactionId) {
      console.log('🔍 Detected transaction ID, navigating to transaction detail');
      try {
        // Try to get transaction detail to verify it exists
        const transactionDetail = await borrowTransactionsApi.getCustomerDetail(actualId);
        if (transactionDetail?.statusCode === 200 && transactionDetail?.data) {
          router.push({
            pathname: '/(protected)/customer/transaction-detail/[id]',
            params: { id: actualId }
          });
          scanLock.current = false;
          return;
        }
      } catch (error: any) {
        // Silently handle transaction detail errors - don't show on UI
        console.log('⚠️ Not a valid transaction ID, trying as product serial number');
        // Continue to try as product serial number
      }
    }
    
    try {
      // Gọi API để lấy thông tin sản phẩm từ serial number
      console.log('🔄 Calling productsApi.scan with:', actualId);
      
      let response;
      try {
        response = await productsApi.scan(actualId);
      console.log('📦 API Response:', JSON.stringify(response, null, 2));
      } catch (scanError: any) {
        // If 404 or 400 with "Invalid product ID", product might be currently borrowed
        const is404 = scanError?.response?.status === 404;
        const is400InvalidId = scanError?.response?.status === 400 && 
                               (scanError?.response?.data?.message?.toLowerCase().includes('invalid product') ||
                                scanError?.response?.data?.message?.toLowerCase().includes('product id'));
        
        if (is404 || is400InvalidId) {
          console.log('⚠️ Product not found or invalid (404/400) - checking if it\'s currently borrowed...');
          await handleProductNotFound(actualId);
          scanLock.current = false;
          return;
        }
        // Re-throw other errors
        throw scanError;
      }
      
      // Check if response indicates 404 or 400 (from apiCall silent handling)
      const responseData: any = response;
      
      // Check for 404 or 400 first - before processing response
      const is404Response = responseData.statusCode === 404 || 
                            (responseData.success === false && responseData.statusCode === 404);
      const is400InvalidIdResponse = responseData.statusCode === 400 &&
                                      (responseData.message?.toLowerCase().includes('invalid product') ||
                                       responseData.message?.toLowerCase().includes('product id'));
      
      if (is404Response || is400InvalidIdResponse) {
        console.log('⚠️ Product not found or invalid (404/400 in response) - checking if it\'s currently borrowed...');
        await handleProductNotFound(actualId);
        scanLock.current = false;
        return;
      }
      
      // API trả về: { success: true, data: { product: {...}, qrCode: "...", serialNumber: "...", ... } }
      // Hoặc: { statusCode: 200, data: {...} }
      let productData: any = null;
      let qrCode: string = '';
      let productStatus: string = '';
      
      if (responseData.success && responseData.data) {
        // Trường hợp response có success: true
        // API trả về: { success: true, data: { _id, reuseCount, ... } }
        const data: any = responseData.data;
        // Nếu data có product thì lấy product, không thì lấy data (vì data chính là product object)
        productData = data.product || data;
        qrCode = data.qrCode || '';
        productStatus = data.status || '';
        console.log('📦 Parsed productData (success:true):', {
          hasProduct: !!data.product,
          reuseCount: productData?.reuseCount,
          keys: Object.keys(productData || {})
        });
      } else if (responseData.statusCode === 200 && responseData.data) {
        // Trường hợp response có statusCode
        // API trả về: { statusCode: 200, data: { _id, reuseCount, ... } }
        const data: any = responseData.data;
        // Nếu data có product thì lấy product, không thì lấy data (vì data chính là product object)
        productData = data.product || data;
        qrCode = data.qrCode || '';
        productStatus = data.status || '';
        console.log('📦 Parsed productData (statusCode:200):', {
          hasProduct: !!data.product,
          reuseCount: productData?.reuseCount,
          keys: Object.keys(productData || {})
        });
      }
      
      // Check if productData is empty or null
      if (!productData || Object.keys(productData).length === 0) {
        console.log('⚠️ No product data in response - checking if it\'s currently borrowed...');
        await handleProductNotFound(actualId);
        scanLock.current = false;
        return;
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
          ? productData.productSizeId.sizeName
          : "Unknown";
        
        // Đảm bảo reuseCount được giữ lại từ API response
        const scannedItem = {
          id: productData._id || productData.id,
          name: productGroupName || "Product",
          size: productSizeName,
        type: "container",
          data: actualId,
          product: {
            ...productData, // Lưu thông tin sản phẩm đầy đủ, bao gồm reuseCount
            reuseCount: productData.reuseCount !== undefined ? productData.reuseCount : 0, // Đảm bảo reuseCount được giữ lại
          },
          qrCode: qrCode || productData.qrCode || '',
          status: productStatus || productData.status || 'available',
        };
        
        console.log('📱 Scanned item created:', scannedItem);
        console.log('🔄 reuseCount in scannedItem:', scannedItem.product.reuseCount);
        setScannedItem(scannedItem);
        setDurationInDays('30'); // Reset về mặc định khi mở modal mới
        setShowProductModal(true);
      } else {
        console.error('❌ No product data in response');
        // Don't show alert - silently handle
        console.log('⚠️ Product not found - silently handled');
      }
    } catch (error: any) {
      console.error('❌ Error scanning product:', error);
      // Don't show alert - silently handle
      console.log('⚠️ Error scanning - silently handled');
    } finally {
      scanLock.current = false;
    }
  };

  const handleBorrow = async () => {
    if (!scannedItem || !scannedItem.product) {
      Alert.alert('Error', 'Invalid product information');
      return;
    }

    if (scannedItem.status !== 'available') {
      Alert.alert('Notification', 'This product is currently unavailable for borrowing.');
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

    const product = scannedItem.product;
    
    // Kiểm tra số ngày mượn trước
    const days = parseInt(durationInDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Error', 'Please enter a valid number of days (greater than 0)');
      return;
    }
    
    // LẤY GIÁ CỌC 1 NGÀY
    // LẤY GIÁ MƯỢN 1 NGÀY - Ưu tiên basePrice (API mới)
    const pricePerDay = 
      (product.productSizeId as any)?.basePrice ??
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
        'Insufficient Balance',
        `Your wallet balance is insufficient to borrow this product.\n\n` +
        `Current balance: ${walletBalance.toLocaleString('vi-VN')} VND\n` +
        `Required deposit: ${depositValue.toLocaleString('vi-VN')} VND\n` +
        `Shortage: ${shortage.toLocaleString('vi-VN')} VND\n\n` +
        `Please top up your wallet to continue.`,
        [
          {
            text: 'Cancel',
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
    // Ưu tiên basePrice (API mới)
    const realtimePricePerDay = 
      (product.productSizeId as any)?.basePrice ??
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
      'Confirm Borrowing',
      `Are you sure you want to borrow this product?\n\n` +
      `Deposit: ${realtimeDeposit.toLocaleString('vi-VN')} VND\n` +
      `(= ${realtimePricePerDay.toLocaleString('vi-VN')} VND/day × ${realtimeDays} days)\n\n` +
      `Current balance: ${walletBalance.toLocaleString('vi-VN')} VND\n` +
      `Balance after deduction: ${(walletBalance - realtimeDeposit).toLocaleString('vi-VN')} VND\n` +
      `Borrow duration: ${realtimeDays} days`,
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

              // LẤY depositValue CỐ ĐỊNH TỪ PRODUCT - KHÔNG TÍNH TOÁN
              // Chỉ lấy giá trị cố định từ productSizeId.depositValue hoặc productGroupId.depositValue
              // KHÔNG tính toán từ basePrice * days
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
                throw new Error('Store information not found. Please try again or contact support.');
              }

              // Lấy productId
              const productId = product._id || product.id;
              if (!productId) {
                console.error('❌ Cannot find productId in product:', product);
                throw new Error('Product ID not found. Please try again.');
              }

              // Validate depositValue before sending
              if (!backendDepositValue || backendDepositValue <= 0 || isNaN(backendDepositValue)) {
                console.error('❌ Product không có depositValue hợp lệ:', {
                  productSizeId: product.productSizeId,
                  productGroupId: product.productGroupId
                });
                Alert.alert(
                  'Error',
                  'This product does not have deposit information. Please contact support or try another product.'
                );
                setBorrowing(false);
                return;
              }

              const borrowDto = {
                productId,
                businessId,
                depositValue: backendDepositValue, // Dùng giá trị cố định từ product, không tính toán
                durationInDays: realtimeDays,
              };

              console.log('📦 FINAL borrowDto gửi đi:', {
                productId,
                businessId,
                depositValue: backendDepositValue, // Giá trị cố định từ product
                depositValueType: typeof backendDepositValue,
                durationInDays: realtimeDays,
                uiCalculated: realtimeDeposit, // Giá trị tính toán chỉ để hiển thị UI
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
                      setShowProductModal(false);
                      setScannedItem(null);
                      // Reload user data để cập nhật số dư
                      if (state.accessToken) {
                        getCurrentUserProfileWithAutoRefresh().then(setUserData).catch(console.error);
                      }
                      // Redirect đến lịch sử mượn
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
                  'Borrow Limit Reached',
                  'You have reached the maximum number of products you can borrow simultaneously (maximum 3 products).\n\nPlease return some borrowed products before borrowing more.',
                  [
                    {
                      text: 'View Borrow History',
                      onPress: () => {
                        setShowProductModal(false);
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
                  `Current balance: ${currentBalance.toLocaleString('vi-VN')} VND\n` +
                  `Required deposit: ${depositValue.toLocaleString('vi-VN')} VND\n` +
                  `Shortage: ${shortage.toLocaleString('vi-VN')} VND\n\n` +
                  `Please top up your wallet to continue.`,
                  [
                    {
                      text: 'Close',
                      style: 'cancel',
                    },
                    {
                      text: 'Top Up',
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
          <Text style={styles.heroRankNumber}>
            {userRank !== null ? userRank : '10+'}
          </Text>
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
                    <Text style={styles.impactValue}>
                      {userData?.returnSuccessCount ?? 0}
                    </Text>
                    <Text style={styles.impactLabel}>Returns</Text>
            </View>
              <TouchableOpacity 
                style={styles.impactStat}
                onPress={() => router.push('/(protected)/customer/customer-co2-report')}
                activeOpacity={0.7}
              >
                    <Text style={styles.impactValue}>
                      {userData?.co2Reduced 
                        ? `${Math.abs(userData.co2Reduced).toFixed(2)}kg` 
                        : '0kg'}
                    </Text>
                    <Text style={styles.impactLabel}>CO₂ Reduced</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* bottom navigation removed; using layout navigation */}

      {showQRScanner && permission?.granted && (
        <Modal
          visible={showQRScanner}
          animationType="fade"
          transparent={true}
          onRequestClose={stopScanning}
        >
          <View style={styles.qrScannerContainer}>
            <StatusBar hidden />
            {/* Full Screen Camera */}
            <CameraView 
              style={StyleSheet.absoluteFillObject} 
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }} 
              onBarcodeScanned={onBarcode}
              enableTorch={flashEnabled}
            />
            
            {/* Overlay Mask - Dark Semi-transparent (60-70% opacity) with cutout */}
            <View style={styles.overlayMask}>
              {/* Top overlay */}
              <View style={styles.overlayTop} />
              {/* Bottom overlay */}
              <View style={styles.overlayBottom} />
              {/* Left overlay */}
              <View style={styles.overlayLeft} />
              {/* Right overlay */}
              <View style={styles.overlayRight} />
            </View>

            {/* Branding - Top */}
            <View style={styles.brandingContainer}>
              <Text style={styles.brandingText}>Powered by Back2Use</Text>
            </View>

            {/* Close Button - Top Right */}
            <TouchableOpacity 
              style={styles.closeButtonTop} 
              onPress={stopScanning}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Scanning Frame with Rounded Corner Brackets */}
            <View style={styles.scanningFrameContainer}>
              <View style={styles.scanningFrame}>
                {/* Top Left Corner */}
                <View style={[styles.cornerBracket, styles.topLeftCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                {/* Top Right Corner */}
                <View style={[styles.cornerBracket, styles.topRightCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                {/* Bottom Left Corner */}
                <View style={[styles.cornerBracket, styles.bottomLeftCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                {/* Bottom Right Corner */}
                <View style={[styles.cornerBracket, styles.bottomRightCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                
                {/* Laser Scanning Line */}
                <View 
                  style={[
                    styles.laserLine,
                    { top: laserLinePosition }
                  ]}
                />
              </View>
            </View>

            {/* Instructions Text */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Align the QR code within the frame to scan
              </Text>
            </View>

            {/* Floating Controls - Bottom */}
            <View style={styles.floatingControls}>
              {/* My QR Button */}
              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => {
                  // Navigate to My QR or show QR code
                  Alert.alert('My QR', 'Feature coming soon');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Flash/Torch Button - Center (Large) */}
              <TouchableOpacity 
                style={[styles.floatingButton, styles.flashButton]}
                onPress={() => setFlashEnabled(!flashEnabled)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={flashEnabled ? "flash" : "flash-outline"} 
                  size={28} 
                  color={flashEnabled ? "#FCD34D" : "#FFFFFF"} 
                />
              </TouchableOpacity>

              {/* Upload Image Button */}
              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => {
                  // Open image picker to scan from gallery
                  Alert.alert('Upload Image', 'Feature coming soon');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
               <Text style={styles.productModalTitle}>Product Information</Text>
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
                   <Text style={styles.productSize}>Size: {scannedItem.size}</Text>
                 )}
                 
                 {(() => {
                   // Tính deposit theo số ngày để hiển thị trên UI - dùng depositValue (giá thuê)
                   const depositValuePerDay = (scannedItem.product?.productSizeId as any)?.depositValue ??
                                              (scannedItem.product?.productGroupId as any)?.depositValue ??
                                              0;
                   
                   const days = Math.max(1, Math.min(30, parseInt(durationInDays) || 1));
                   
                   // Tính từ depositValue (giá thuê) × số ngày
                   const displayDeposit = depositValuePerDay * days;
                   
                   if (!displayDeposit || displayDeposit <= 0) return null;
                   
                   return (
                   <View style={styles.depositInfo}>
                     <Ionicons name="cash-outline" size={20} color="#059669" />
                     <View style={{ flex: 1 }}>
                       <Text style={styles.depositLabel}>Deposit:</Text>
                       <Text style={styles.depositValue}>
                           {displayDeposit.toLocaleString('vi-VN')} VND
                         </Text>
                       <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                         ({depositValuePerDay.toLocaleString('vi-VN')} VND/day × {days} days)
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
                       
                       // Lấy depositValue CỐ ĐỊNH từ product - không tính toán
                       // Tính deposit theo số ngày để kiểm tra số dư (chỉ cho UI) - dùng depositValue (giá thuê)
                       const depositValuePerDay = (scannedItem.product?.productSizeId as any)?.depositValue ??
                                                  (scannedItem.product?.productGroupId as any)?.depositValue ??
                                                  0;
                       const days = Math.max(1, Math.min(30, parseInt(durationInDays) || 1));
                       const displayDeposit = depositValuePerDay * days;
                       const isInsufficient = walletBalance < displayDeposit;
                       
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
                         {scannedItem.status === 'available' ? 'Available' : 'Unavailable'}
                       </Text>
                     </View>
                   </View>
                 )}

                 {/* Product Description */}
                 {scannedItem.product?.productGroupId?.description && (
                   <View style={styles.productDescriptionSection}>
                     <Text style={styles.sectionTitle}>Description</Text>
                     <Text style={styles.productDescription}>
                       {scannedItem.product.productGroupId.description}
                     </Text>
                   </View>
                 )}

                 {/* Product Details */}
                 <View style={styles.productDetailsSection}>
                   <Text style={styles.sectionTitle}>Product Details</Text>
                   
                   {scannedItem.data && (
                     <View style={styles.detailRow}>
                       <Ionicons name="barcode-outline" size={18} color="#6B7280" />
                       <Text style={styles.detailLabel}>Serial Number:</Text>
                       <Text style={styles.detailValue}>{scannedItem.data}</Text>
                     </View>
                   )}

                   {scannedItem.product?.productSizeId?.description && (
                     <View style={styles.detailRow}>
                       <Ionicons name="resize-outline" size={18} color="#6B7280" />
                       <Text style={styles.detailLabel}>Size Description:</Text>
                       <Text style={styles.detailValue}>
                         {scannedItem.product.productSizeId.description}
                       </Text>
                     </View>
                   )}

                   {scannedItem.product?.condition && (
                     <View style={styles.detailRow}>
                       <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                       <Text style={styles.detailLabel}>Condition:</Text>
                       <Text style={styles.detailValue}>
                         {scannedItem.product.condition}
                       </Text>
                     </View>
                   )}

                   {(scannedItem.product?.reuseCount !== undefined && scannedItem.product?.reuseCount !== null) && (
                     <View style={styles.detailRow}>
                       <Ionicons name="repeat-outline" size={18} color="#6B7280" />
                       <Text style={styles.detailLabel}>Reuse Count:</Text>
                       <Text style={styles.detailValue}>
                         {String(scannedItem.product.reuseCount || 0)}
                       </Text>
                     </View>
                   )}

                   {/* CO2 Reduced */}
                   {scannedItem.product?.co2Reduced !== undefined && (
                     <View style={styles.detailRow}>
                       <Ionicons name="leaf-outline" size={18} color="#10B981" />
                       <Text style={styles.detailLabel}>CO₂ Reduced:</Text>
                       <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '600' }]}>
                         {scannedItem.product.co2Reduced.toFixed(3)} kg
                       </Text>
                     </View>
                   )}
                 </View>

                 {/* Last Condition Images */}
                 {scannedItem.product?.lastConditionImages && (
                   <View style={styles.conditionImagesSection}>
                     <Text style={styles.sectionTitle}>Last Condition Images</Text>
                     <View style={styles.imageGrid}>
                       {scannedItem.product.lastConditionImages.frontImage && (
                         <View style={styles.imageItem}>
                           <Text style={styles.imageLabel}>Front</Text>
                           <Image 
                             source={{ uri: scannedItem.product.lastConditionImages.frontImage }} 
                             style={styles.conditionImage} 
                             resizeMode="cover"
                           />
                         </View>
                       )}
                       {scannedItem.product.lastConditionImages.backImage && (
                         <View style={styles.imageItem}>
                           <Text style={styles.imageLabel}>Back</Text>
                           <Image 
                             source={{ uri: scannedItem.product.lastConditionImages.backImage }} 
                             style={styles.conditionImage} 
                             resizeMode="cover"
                           />
                         </View>
                       )}
                       {scannedItem.product.lastConditionImages.leftImage && (
                         <View style={styles.imageItem}>
                           <Text style={styles.imageLabel}>Left</Text>
                           <Image 
                             source={{ uri: scannedItem.product.lastConditionImages.leftImage }} 
                             style={styles.conditionImage} 
                             resizeMode="cover"
                           />
                         </View>
                       )}
                       {scannedItem.product.lastConditionImages.rightImage && (
                         <View style={styles.imageItem}>
                           <Text style={styles.imageLabel}>Right</Text>
                           <Image 
                             source={{ uri: scannedItem.product.lastConditionImages.rightImage }} 
                             style={styles.conditionImage} 
                             resizeMode="cover"
                           />
                         </View>
                       )}
                       {scannedItem.product.lastConditionImages.topImage && (
                         <View style={styles.imageItem}>
                           <Text style={styles.imageLabel}>Top</Text>
                           <Image 
                             source={{ uri: scannedItem.product.lastConditionImages.topImage }} 
                             style={styles.conditionImage} 
                             resizeMode="cover"
                           />
                         </View>
                       )}
                       {scannedItem.product.lastConditionImages.bottomImage && (
                         <View style={styles.imageItem}>
                           <Text style={styles.imageLabel}>Bottom</Text>
                           <Image 
                             source={{ uri: scannedItem.product.lastConditionImages.bottomImage }} 
                             style={styles.conditionImage} 
                             resizeMode="cover"
                           />
                         </View>
                       )}
                     </View>
                   </View>
                 )}

                 {/* Last Damage Assessment */}
                 {scannedItem.product?.lastDamageFaces && (
                   <View style={styles.damageFacesSection}>
                     <Text style={styles.sectionTitle}>Last Damage Assessment</Text>
                     {(() => {
                       // Check if lastDamageFaces exists and has items
                       if (!scannedItem.product.lastDamageFaces || scannedItem.product.lastDamageFaces.length === 0) {
                         return (
                           <View style={styles.emptyDamageFaces}>
                             <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
                             <Text style={styles.emptyDamageFacesText}>This product has never been borrowed</Text>
                           </View>
                         );
                       }
                       
                       // Check if all faces have "none" issue
                       const hasRealDamage = scannedItem.product.lastDamageFaces.some((face: any) => 
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
                       return scannedItem.product.lastDamageFaces
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
                       <Text style={styles.borrowButtonText}>Borrow Product</Text>
                     </>
                   )}
                 </TouchableOpacity>
               )}

               {scannedItem.status !== 'available' && (
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
  // QR Scanner - Professional Redesign
  qrScannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayMask: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.25,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight - (screenHeight * 0.25 + screenWidth * 0.7),
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayLeft: {
    position: 'absolute',
    top: screenHeight * 0.25,
    left: 0,
    width: screenWidth * 0.15,
    height: screenWidth * 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayRight: {
    position: 'absolute',
    top: screenHeight * 0.25,
    right: 0,
    width: screenWidth * 0.15,
    height: screenWidth * 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  brandingContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  brandingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButtonTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scanningFrameContainer: {
    position: 'absolute',
    top: screenHeight * 0.25,
    left: screenWidth * 0.15,
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  scanningFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  cornerBracketHorizontal: {
    position: 'absolute',
    width: 30,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  cornerBracketVertical: {
    position: 'absolute',
    width: 4,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
  },
  topRightCorner: {
    top: 0,
    right: 0,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
    opacity: 0.9,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flashButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
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
  productDescriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  productSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  productDetailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
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
});