import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { borrowTransactionsApi } from '../../../src/services/api/borrowTransactionService';
import { businessesApi } from '../../../src/services/api/businessService';
import { BusinessProfile } from '../../../src/types/business.types';

interface BusinessTransaction {
  _id: string;
  customerId: {
    _id: string;
    userId?: string;
    fullName: string;
    phone?: string;
  };
  productId: {
    _id: string;
    productGroupId: {
      _id: string;
      name: string;
      imageUrl?: string;
    };
    productSizeId: {
      _id: string;
      sizeName: string;
    };
    qrCode?: string;
    serialNumber: string;
    status?: string;
    reuseCount?: number;
  };
  businessId: string | {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    businessType?: string;
    businessLogoUrl?: string;
  };
  borrowTransactionType: string;
  borrowDate: string;
  dueDate: string;
  depositAmount: number;
  status: string;
  extensionCount?: number;
  isLateProcessed: boolean;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  walletTransaction?: any;
}

export default function TransactionProcessingScreen() {
  const auth = useAuth();
  const params = useLocalSearchParams();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<BusinessTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Process return states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [returnSerialNumber, setReturnSerialNumber] = useState('');
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNote, setReturnNote] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [checkingReturn, setCheckingReturn] = useState(false);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  
  // Damage policy and check data
  const [damagePolicy, setDamagePolicy] = useState<Array<{ issue: string; points: number }>>([]);
  const [loadingDamagePolicy, setLoadingDamagePolicy] = useState(false);
  const [checkData, setCheckData] = useState({
    frontImage: null as any,
    frontIssue: '',
    backImage: null as any,
    backIssue: '',
    leftImage: null as any,
    leftIssue: '',
    rightImage: null as any,
    rightIssue: '',
    topImage: null as any,
    topIssue: '',
    bottomImage: null as any,
    bottomIssue: '',
  });
  const [calculatedPoints, setCalculatedPoints] = useState(0);
  const [calculatedCondition, setCalculatedCondition] = useState<'good' | 'damaged'>('good');
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scanLock = useRef(false);

  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);

  // Load damage policy when return modal opens
  useEffect(() => {
    if (showReturnModal && damagePolicy.length === 0 && !loadingDamagePolicy) {
      loadDamagePolicy();
    }
  }, [showReturnModal]);

  // Debug: Log when returnSerialNumber changes
  useEffect(() => {
    if (returnSerialNumber) {
      console.log('📝 returnSerialNumber state updated:', returnSerialNumber);
    }
  }, [returnSerialNumber]);

  // Tự động mở modal khi returnSerialNumber có giá trị (từ QR scan hoặc từ transaction card)
  useEffect(() => {
    if (returnSerialNumber && returnSerialNumber.trim() !== '') {
      console.log('✅ returnSerialNumber changed, opening return modal:', returnSerialNumber);
      console.log('📊 Current showReturnModal state:', showReturnModal);
      // Đảm bảo modal được mở (nếu đang đóng) hoặc mở lại (nếu đang mở với serialNumber khác)
      setShowReturnModal(true);
    }
  }, [returnSerialNumber]); // Chỉ phụ thuộc returnSerialNumber, KHÔNG cần showReturnModal

  // Debug: Log when return modal opens
  useEffect(() => {
    if (showReturnModal) {
      console.log('🔍 Return modal opened. Current returnSerialNumber value:', returnSerialNumber);
      console.log('🔍 Field should display:', returnSerialNumber || '(empty)');
    }
  }, [showReturnModal, returnSerialNumber]);

  // Calculate damage points and condition when checkData changes
  useEffect(() => {
    calculateDamagePoints();
  }, [checkData, damagePolicy]);

  const loadDamagePolicy = async () => {
    try {
      setLoadingDamagePolicy(true);
      const response = await borrowTransactionsApi.getDamagePolicy();
      if (response.statusCode === 200 && response.data) {
        setDamagePolicy(response.data);
      }
    } catch (error: any) {
      console.error('Error loading damage policy:', error);
      Alert.alert('Error', 'Failed to load damage policy');
    } finally {
      setLoadingDamagePolicy(false);
    }
  };

  const calculateDamagePoints = () => {
    if (damagePolicy.length === 0) {
      setCalculatedPoints(0);
      setCalculatedCondition('good');
      return;
    }

    // Collect all issues from all faces
    const allIssues: string[] = [];
    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    faces.forEach(face => {
      const issue = checkData[`${face}Issue` as keyof typeof checkData] as string;
      if (issue && issue !== 'none' && issue.trim() !== '') {
        allIssues.push(issue);
      }
    });

    // Calculate total points
    let totalPoints = 0;
    allIssues.forEach(issue => {
      const policy = damagePolicy.find(p => p.issue === issue);
      if (policy) {
        totalPoints += policy.points;
      }
    });

    // Count issues by type
    const scratchHeavyCount = allIssues.filter(i => i === 'scratch_heavy').length;
    const dentSmallCount = allIssues.filter(i => i === 'dent_small').length;
    const dentLargeCount = allIssues.filter(i => i === 'dent_large').length;
    const crackSmallCount = allIssues.filter(i => i === 'crack_small').length;
    const crackLargeCount = allIssues.filter(i => i === 'crack_large').length;
    const hasDeformed = allIssues.includes('deformed');
    const hasBroken = allIssues.includes('broken');

    // Apply damage rules
    let isDamaged = false;

    // Rule 1: Total points > 12
    if (totalPoints > 12) {
      isDamaged = true;
    }

    // Rule 2: More than 3 scratch_heavy
    if (scratchHeavyCount > 3) {
      isDamaged = true;
    }

    // Rule 3: Dent rules
    if (dentSmallCount > 3) {
      isDamaged = true;
    }
    if (dentLargeCount > 1) {
      isDamaged = true;
    }
    if (dentLargeCount > 0 && dentSmallCount > 0) {
      isDamaged = true;
    }

    // Rule 4: Crack rules
    if (crackSmallCount > 1) {
      isDamaged = true;
    }
    if (crackLargeCount > 0) {
      isDamaged = true;
    }

    // Rule 5: Critical issues (immediate damage)
    if (hasDeformed || hasBroken || crackLargeCount > 0) {
      isDamaged = true;
    }

    setCalculatedPoints(totalPoints);
    setCalculatedCondition(isDamaged ? 'damaged' : 'good');
  };

  useEffect(() => {
    loadBusinessData();
  }, [auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);

  useEffect(() => {
    // Allow both business and staff to load transactions
    if (auth.state.isHydrated && auth.state.accessToken && auth.state.isAuthenticated && (auth.state.role === 'business' || auth.state.role === 'staff')) {
      loadTransactions();
    }
  }, [activeTab, searchTerm, auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);

  const loadTransactions = async () => {
    // Allow both business and staff to load transactions
    if (!auth.state.isHydrated || !auth.state.accessToken || !auth.state.isAuthenticated) {
      return;
    }

    // Only allow business and staff roles
    if (auth.state.role !== 'business' && auth.state.role !== 'staff') {
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading business transactions...');
      
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (activeTab !== 'all') {
        if (activeTab === 'borrow') {
          params.borrowTransactionType = 'borrow';
        } else if (activeTab === 'return-success') {
          params.status = 'completed';
        } else if (activeTab === 'overdue') {
          // Overdue transactions might need special handling
          params.status = 'borrowing';
        }
      }
      
      if (searchTerm.trim()) {
        params.productName = searchTerm.trim();
      }
      
      const response = await borrowTransactionsApi.getBusinessHistory(params);
      
      console.log('📡 Business Transactions Response:', response);
      
      if (response.statusCode === 200 && response.data?.items) {
        console.log('✅ Business transactions items:', response.data.items.length);
        setTransactions(response.data.items);
      } else if (response.statusCode === 200 && response.data && Array.isArray(response.data)) {
        console.log('✅ Business transactions (array format):', response.data.length);
        setTransactions(response.data);
      } else {
        console.warn('⚠️ No items found in response:', response);
        setTransactions([]);
      }
    } catch (error: any) {
      // Silently handle 403/500 errors (Access denied / Business not found)
      if (error?.response?.status === 403 || error?.response?.status === 500) {
        console.log('⚠️ Error accessing business transactions API:', error?.response?.status);
        setTransactions([]);
      } else if (error?.response?.status && error.response.status >= 500) {
        console.error('Error loading transactions:', error);
      }
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto open QR scanner when navigated from "Process Returns" button
  useEffect(() => {
    if (params?.openQRScanner === 'true') {
      // Small delay to ensure screen is fully loaded
      const timer = setTimeout(async () => {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          if (status === 'granted') {
            setHasCameraPermission(true);
            setShowQRScanner(true);
          } else {
            setHasCameraPermission(false);
            Alert.alert('Camera Permission', 'Please grant camera permission to scan QR codes', [{ text: 'OK' }]);
          }
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          Alert.alert('Error', 'Unable to open camera. Please try again.');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params?.openQRScanner]);

  const loadBusinessData = async () => {
    // Wait for auth state to be hydrated before making API calls
    if (!auth.state.isHydrated) {
      return;
    }
    
    // Staff doesn't need business profile, they can still scan QR and process returns
    if (auth.state.role === 'staff' as any) {
      setLoading(false);
      setBusinessProfile(null);
      return;
    }
    
    if (auth.state.accessToken && auth.state.isAuthenticated && auth.state.role === 'business') {
      try {
        setLoading(true);
        console.log('🔍 Loading business profile for transaction processing screen...');
        const profileResponse = await businessesApi.getProfileWithAutoRefresh();
        console.log('✅ Business profile loaded:', profileResponse);
        
        if (profileResponse.data && profileResponse.data.business) {
          setBusinessProfile(profileResponse.data.business);
        }
      } catch (error: any) {
        // Silently handle 403/500 errors (Access denied / Business not found)
        if (error?.response?.status === 403 || error?.response?.status === 500) {
          console.log('⚠️ Cannot access business profile API (staff role or business not found)');
        } else {
          // Don't log network errors as errors - they're expected when offline
          const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                                 error?.message?.toLowerCase().includes('timeout') ||
                                 error?.message?.toLowerCase().includes('connection');
          
          if (!isNetworkError) {
            console.error('Error loading business profile:', error);
          } else {
            console.warn('⚠️ Network error loading business profile (will retry later):', error.message);
          }
        }
        // Continue with default/empty business profile data
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    await loadBusinessData();
    setRefreshing(false);
  };

  // Open QR Scanner for return processing
  const openQRScanner = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setHasCameraPermission(true);
        setShowQRScanner(true);
      } else {
        setHasCameraPermission(false);
        Alert.alert('Camera Permission', 'Please grant camera permission to scan QR codes', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  // Handle QR code scan
  const onBarcodeScanned = async (e: any) => {
    if (scanLock.current) return;
    scanLock.current = true;
    
    const scannedData = e?.data ?? '';
    console.log('📱 QR Code scanned for return:', scannedData);
    
    if (!scannedData || scannedData.trim() === '') {
      Alert.alert('Error', 'Invalid QR code');
      scanLock.current = false;
      return;
    }
    
    Vibration.vibrate(Platform.OS === 'ios' ? 30 : 50);
    setShowQRScanner(false);
    
    // Extract serialNumber from scanned data
    // QR code for return should contain the product serialNumber directly (e.g., "TIẾ-1763976862439-26522-4")
    // Or it might be in a deep link format: back2use://item/{serialNumber}
    let serialNumber = scannedData.trim();
    
    console.log('📱 Raw scanned data:', scannedData);
    
    // Extract from deep link if present (format: back2use://item/{serialNumber})
    if (scannedData.includes('://')) {
      const match = scannedData.match(/(?:com\.)?back2use:\/\/item\/([^\/]+)/);
      if (match && match[1]) {
        serialNumber = match[1];
        console.log('🔗 Extracted from deep link:', serialNumber);
      } else {
        // Try to extract last part after last slash
        const parts = scannedData.split('/');
        serialNumber = parts[parts.length - 1];
        console.log('🔗 Extracted from path:', serialNumber);
      }
    }
    
    // Check if it's a transaction ID (24 hex chars) - if so, need to get serialNumber from transaction
    const isTransactionId = /^[0-9a-fA-F]{24}$/.test(serialNumber);
    let finalSerialNumber = serialNumber; // Store the original scanned data
    
    if (isTransactionId) {
      console.log('⚠️ Detected transaction ID, getting serialNumber from transaction...');
      try {
        // Try to get transaction from business history (works for both business and staff)
        const apiResponse = await borrowTransactionsApi.getBusinessHistory({
          page: 1,
          limit: 100,
        });
        const apiTransactions = apiResponse.data?.items || (Array.isArray(apiResponse.data) ? apiResponse.data : []);
        const transaction = apiTransactions.find((t: BusinessTransaction) => t._id === serialNumber);
        
        if (transaction?.productId?.serialNumber) {
          finalSerialNumber = transaction.productId.serialNumber;
          console.log('✅ Found serialNumber from transaction:', finalSerialNumber);
        } else {
          console.log('⚠️ Transaction not found in business history');
          Alert.alert('Lỗi', 'Không tìm thấy serialNumber từ transaction. Vui lòng quét QR code của sản phẩm.');
          scanLock.current = false;
          return;
        }
      } catch (error: any) {
        // If error, don't use transaction ID as serialNumber
        console.log('⚠️ Error getting transaction:', error?.response?.status || error?.message);
        Alert.alert(
          'Lỗi', 
          'Không thể lấy serialNumber từ transaction. Vui lòng quét QR code của sản phẩm (không phải QR code transaction).'
        );
        scanLock.current = false;
        return;
      }
    } else {
      // It's a serialNumber (format like "TIẾ-1763976862439-26522-4")
      console.log('✅ Using scanned data as serialNumber:', finalSerialNumber);
    }
    
    // Verify we have a valid serialNumber (not a transaction ID)
    if (/^[0-9a-fA-F]{24}$/.test(finalSerialNumber)) {
      console.log('❌ Error: finalSerialNumber is still a transaction ID, aborting');
      Alert.alert('Lỗi', 'Không thể lấy serialNumber. Vui lòng quét QR code của sản phẩm.');
      scanLock.current = false;
      return;
    }
    
    console.log('✅ Final serialNumber to use for return check:', finalSerialNumber);
    
    // Directly set serialNumber and open return modal for return processing
    // The serialNumber will be used to call /borrow-transactions/{serialNumber}/check API
    console.log('✅ Setting returnSerialNumber to:', finalSerialNumber);
    
    // Reset form data first
    setReturnCondition('good');
    setReturnNote('');
    setReturnImages([]);
    setCheckData({
      frontImage: null,
      frontIssue: '',
      backImage: null,
      backIssue: '',
      leftImage: null,
      leftIssue: '',
      rightImage: null,
      rightIssue: '',
      topImage: null,
      topIssue: '',
      bottomImage: null,
      bottomIssue: '',
    });
    
    // Đóng modal nếu đang mở để đảm bảo modal mở lại với serialNumber mới
    if (showReturnModal) {
      console.log('⚠️ Modal is open, closing it first before opening with new serialNumber');
      setShowReturnModal(false);
      // Wait a bit for modal to close
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Reset returnSerialNumber trước để đảm bảo useEffect chạy khi set giá trị mới
    // (Nếu serialNumber giống giá trị cũ, useEffect sẽ không chạy)
    if (returnSerialNumber === finalSerialNumber) {
      console.log('⚠️ Same serialNumber, resetting first to trigger useEffect');
      setReturnSerialNumber('');
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Chỉ set serialNumber, KHÔNG mở modal ở đây
    // Modal sẽ được mở tự động bởi useEffect khi returnSerialNumber có giá trị
    console.log('✅ Setting returnSerialNumber to:', finalSerialNumber);
    setReturnSerialNumber(finalSerialNumber);
    
    // Reset calculated points và condition
    setCalculatedPoints(0);
    setCalculatedCondition('good');
    
    scanLock.current = false;
  };

  const stopScanning = () => {
    setShowQRScanner(false);
  };

  const categorizeReturnTransaction = (transaction: BusinessTransaction) => {
    if (transaction.borrowTransactionType !== 'return') return null;

    if (transaction.status === 'failed' || transaction.status === 'cancelled') {
      return 'failed-other';
    }

    // Nếu có returnedAt và status không phải failed/cancelled, coi là thành công
    if (transaction.returnedAt) {
      return 'success';
    }

    if (transaction.status === 'completed' || transaction.status === 'returned') {
      return 'success';
    }

    return null;
  };

  const calculateOverdueInfo = (transaction: BusinessTransaction) => {
    if (!transaction.dueDate) return null;

    const returnDate = transaction.returnedAt ? new Date(transaction.returnedAt) : new Date();
    const dueDate = new Date(transaction.dueDate);
    const overdueDays = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (overdueDays > 0) {
      const lateFeePerDay = 3.0;
      const maxAllowedOverdueDays = 3;

      return {
        overdueDays,
        totalLateFee: overdueDays * lateFeePerDay,
        isCompletelyOverdue: overdueDays > maxAllowedOverdueDays,
        remainingDeposit: overdueDays > maxAllowedOverdueDays
          ? 0
          : Math.max(0, transaction.depositAmount - overdueDays * lateFeePerDay),
      };
    }

    return null;
  };

  const getUserBorrowingCount = (customerId: string) => {
    return transactions.filter((t) => 
      (typeof t.customerId === 'string' ? t.customerId : t.customerId._id) === customerId && 
      t.borrowTransactionType === 'borrow' && 
      t.status === 'borrowing'
    ).length;
  };

  const getUserBorrowedItems = (customerId: string) => {
    return transactions.filter((t) => 
      (typeof t.customerId === 'string' ? t.customerId : t.customerId._id) === customerId && 
      t.borrowTransactionType === 'borrow' && 
      t.status === 'borrowing'
    );
  };

  const getFilteredTransactions = (tabType: string) => {
    return transactions.filter((transaction) => {
      const productName = transaction.productId?.productGroupId?.name?.toLowerCase() || '';
      const customerName = typeof transaction.customerId === 'object' 
        ? transaction.customerId.fullName?.toLowerCase() || ''
        : '';
      const serialNumber = transaction.productId?.serialNumber?.toLowerCase() || '';
      
      const matchesSearch = 
        transaction._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productName.includes(searchTerm.toLowerCase()) ||
        customerName.includes(searchTerm.toLowerCase()) ||
        serialNumber.includes(searchTerm.toLowerCase());

      let matchesTab = false;
      if (tabType === 'all') {
        matchesTab = true;
      } else if (tabType === 'borrow') {
        matchesTab = transaction.borrowTransactionType === 'borrow' && transaction.status === 'borrowing';
      } else if (tabType === 'return-success') {
        const category = categorizeReturnTransaction(transaction);
        matchesTab = category === 'success';
      } else if (tabType === 'overdue') {
        const overdueInfo = calculateOverdueInfo(transaction);
        matchesTab = overdueInfo !== null && overdueInfo.overdueDays > 0;
      }

      return matchesSearch && matchesTab;
    });
  };

  const TransactionCard = ({ transaction }: { transaction: BusinessTransaction }) => {
    const overdueInfo = calculateOverdueInfo(transaction);
    const returnCategory = categorizeReturnTransaction(transaction);
    const productName = transaction.productId?.productGroupId?.name || 'Sản phẩm không xác định';
    const customerName = typeof transaction.customerId === 'object' 
      ? transaction.customerId.fullName 
      : 'Không xác định';

    const getTransactionStatus = () => {
      if (transaction.borrowTransactionType === 'borrow') {
        if (transaction.status === 'borrowing') {
          if (overdueInfo && overdueInfo.overdueDays > 0) {
            return { text: 'Quá hạn', color: '#EF4444', bgColor: '#FEE2E2' };
          }
          return { text: 'Đang mượn', color: '#F59E0B', bgColor: '#FEF3C7' };
        }
        if (transaction.status === 'completed') {
          return { text: 'Hoàn tất', color: '#10B981', bgColor: '#D1FAE5' };
        }
      } else {
        // Return transaction
        if (returnCategory === 'success') {
          return { text: 'Hoàn tất', color: '#10B981', bgColor: '#D1FAE5' };
        } else if (returnCategory === 'failed-other') {
          return { text: 'Thất bại', color: '#EF4444', bgColor: '#FEE2E2' };
        } else {
          // Nếu có returnedAt nhưng returnCategory là null, vẫn coi là thành công
          if (transaction.returnedAt) {
            return { text: 'Hoàn tất', color: '#10B981', bgColor: '#D1FAE5' };
          }
          // Nếu không có returnedAt và status không rõ, hiển thị status gốc
          return { text: transaction.status || 'Đang xử lý', color: '#6B7280', bgColor: '#F3F4F6' };
        }
      }
      return { text: transaction.status, color: '#6B7280', bgColor: '#F3F4F6' };
    };

    const status = getTransactionStatus();
    const transactionDate = transaction.returnedAt 
      ? new Date(transaction.returnedAt) 
      : new Date(transaction.borrowDate);

    return (
      <TouchableOpacity 
        style={styles.transactionCard}
        onPress={() => {
          setSelectedTransaction(transaction);
          setShowDetailsModal(true);
        }}
      >
        {/* Left Side - Icon */}
        <View style={styles.cardLeft}>
          <View style={[
            styles.iconContainer,
            transaction.borrowTransactionType === 'borrow' ? styles.borrowIcon : styles.returnIcon
          ]}>
            <Ionicons 
              name={transaction.borrowTransactionType === 'borrow' ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color="white" 
            />
          </View>
        </View>

        {/* Middle - Main Info */}
        <View style={styles.cardMiddle}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.userName}>Người mượn: {customerName}</Text>
        </View>

        {/* Right Side - Status & Date */}
        <View style={styles.cardRight}>
          <Text style={styles.transactionDate}>
            {transactionDate.toLocaleDateString('vi-VN')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'borrow' ? 'arrow-down' : type === 'return-success' ? 'checkmark-circle' : type === 'overdue' ? 'warning' : 'receipt'} 
        size={48} 
        color="#9CA3AF" 
      />
      <Text style={styles.emptyTitle}>
        {type === 'borrow' 
          ? 'Không có giao dịch mượn'
          : type === 'return-success'
            ? 'Không có giao dịch trả thành công'
            : type === 'overdue'
              ? 'Không có giao dịch quá hạn'
              : 'Không có giao dịch nào'}
      </Text>
      <Text style={styles.emptySubtitle}>Thử điều chỉnh tìm kiếm hoặc bộ lọc</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F4D3A" />
        <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={openQRScanner}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileIcon}>
              {businessProfile?.businessLogoUrl ? (
                <Image source={{ uri: businessProfile.businessLogoUrl }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle" size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo ID, mã QR, hoặc tên..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'borrow', label: 'Đang mượn' },
          { key: 'return-success', label: 'Đã trả' },
          { key: 'overdue', label: 'Quá hạn' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.activeTabButtonText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <FlatList
        data={getFilteredTransactions(activeTab)}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <TransactionCard transaction={item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0F4D3A']}
            tintColor="#0F4D3A"
          />
        }
        ListEmptyComponent={() => renderEmptyState(activeTab)}
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã giao dịch</Text>
                  <Text style={styles.detailValue}>{selectedTransaction._id}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại</Text>
                  <View style={[
                    styles.typeBadge,
                    selectedTransaction.borrowTransactionType === 'borrow' ? styles.borrowBadge : styles.returnBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {selectedTransaction.borrowTransactionType === 'borrow' ? 'MƯỢN' : 'TRẢ'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sản phẩm</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.productId?.productGroupId?.name || 'N/A'} - {selectedTransaction.productId?.productSizeId?.sizeName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Serial Number</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.productId?.serialNumber || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày mượn</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.borrowDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày hết hạn</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.dueDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền cọc</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.depositAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Khách hàng</Text>
                  <Text style={styles.detailValue}>
                    {typeof selectedTransaction.customerId === 'object' 
                      ? selectedTransaction.customerId.fullName 
                      : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số điện thoại</Text>
                  <Text style={styles.detailValue}>
                    {typeof selectedTransaction.customerId === 'object' 
                      ? selectedTransaction.customerId.phone || 'N/A'
                      : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.status}
                  </Text>
                </View>

                {selectedTransaction.returnedAt && (
                  <View style={styles.returnInfo}>
                    <Text style={styles.returnInfoTitle}>Thông tin trả</Text>
                    <Text style={styles.returnInfoText}>
                      Ngày trả: {new Date(selectedTransaction.returnedAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                )}

                {/* Process Return Button - Only show for borrow transactions that haven't been returned */}
                {selectedTransaction.borrowTransactionType === 'borrow' && selectedTransaction.status === 'borrowing' && (
                  <TouchableOpacity
                    style={styles.processReturnButton}
                    onPress={() => {
                      // Get serial number from transaction
                      const serialNumber = selectedTransaction.productId?.serialNumber;
                      if (serialNumber) {
                        console.log('✅ Setting returnSerialNumber from transaction card:', serialNumber);
                        // Chỉ set serialNumber, KHÔNG mở modal ở đây
                        // Modal sẽ được mở tự động bởi useEffect khi returnSerialNumber có giá trị
                        setReturnSerialNumber(serialNumber);
                        // Reset check data
                        setCheckData({
                          frontImage: null,
                          frontIssue: '',
                          backImage: null,
                          backIssue: '',
                          leftImage: null,
                          leftIssue: '',
                          rightImage: null,
                          rightIssue: '',
                          topImage: null,
                          topIssue: '',
                          bottomImage: null,
                          bottomIssue: '',
                        });
                        setReturnNote('');
                        setReturnImages([]);
                        setCalculatedPoints(0);
                        setCalculatedCondition('good');
                        // Đóng details modal
                        setShowDetailsModal(false);
                      } else {
                        Alert.alert('Error', 'Serial number not found for this transaction');
                      }
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.processReturnButtonText}>Check Return</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết mượn của người dùng</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.userBorrowingCount}>
                Total items borrowed: {selectedUser ? getUserBorrowedItems(selectedUser).length : 0}/3
              </Text>
              
              {selectedUser && getUserBorrowedItems(selectedUser).map((transaction) => {
                const productName = transaction.productId?.productGroupId?.name || 'N/A';
                const productImage = transaction.productId?.productGroupId?.imageUrl || 'https://via.placeholder.com/48x48';
                const serialNumber = transaction.productId?.serialNumber || 'N/A';
                return (
                  <View key={transaction._id} style={styles.borrowedItem}>
                    <Image 
                      source={{ uri: productImage }} 
                      style={styles.borrowedItemImage}
                    />
                    <View style={styles.borrowedItemInfo}>
                      <Text style={styles.borrowedItemName}>{productName}</Text>
                      <Text style={styles.borrowedItemDue}>
                        Hạn: {new Date(transaction.dueDate).toLocaleDateString('vi-VN')}
                      </Text>
                      <Text style={styles.borrowedItemMaterial}>
                        Size: {transaction.productId?.productSizeId?.sizeName || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.borrowedItemQR}>
                      <Text style={styles.borrowedItemQRText}>{serialNumber}</Text>
                    </View>
                  </View>
                );
              })}
              
              {selectedUser && getUserBorrowedItems(selectedUser).length === 0 && (
                <Text style={styles.noBorrowedItems}>No items currently borrowed</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Check Return Modal */}
      <Modal
        visible={showReturnModal}
        transparent={true}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => {
          setShowReturnModal(false);
          // Reset serialNumber sau 300ms để tránh race condition
          setTimeout(() => {
            setReturnSerialNumber('');
          }, 300);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check Return</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowReturnModal(false);
                  setCheckData({
                    frontImage: null,
                    frontIssue: '',
                    backImage: null,
                    backIssue: '',
                    leftImage: null,
                    leftIssue: '',
                    rightImage: null,
                    rightIssue: '',
                    topImage: null,
                    topIssue: '',
                    bottomImage: null,
                    bottomIssue: '',
                  });
                  // Reset serialNumber sau 300ms để tránh race condition
                  setTimeout(() => {
                    setReturnSerialNumber('');
                  }, 300);
                }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.formGroup}>
                <Text style={styles.serialNumberLabel}>Serial Number</Text>
                <TextInput
                  style={styles.serialNumberInput}
                  value={returnSerialNumber || ''}
                  onChangeText={setReturnSerialNumber}
                  placeholder="Enter serial number"
                  editable={false}
                />
              </View>

              {/* Damage Assessment for 6 Faces */}
              {['front', 'back', 'left', 'right', 'top', 'bottom'].map((face) => (
                <View key={face} style={styles.faceGroup}>
                  <Text style={styles.faceLabel}>{face.charAt(0).toUpperCase() + face.slice(1)} Face</Text>
                  
                  {/* Image Upload */}
                  <View style={styles.imageUploadContainer}>
                    {checkData[`${face}Image` as keyof typeof checkData] ? (
                      <View style={styles.imagePreview}>
                        <Image 
                          source={{ uri: checkData[`${face}Image` as keyof typeof checkData] as string }} 
                          style={styles.imagePreviewImage} 
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => {
                            setCheckData(prev => ({
                              ...prev,
                              [`${face}Image`]: null,
                            }));
                          }}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addImageButtonNew}
                        activeOpacity={0.7}
                        onPress={async () => {
                          try {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                              Alert.alert('Permission Denied', 'Camera roll permission is required');
                              return;
                            }

                            const result = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ImagePicker.MediaTypeOptions.Images,
                              allowsEditing: true,
                              aspect: [4, 3],
                              quality: 0.8,
                            });

                            if (!result.canceled && result.assets[0]) {
                              setCheckData(prev => ({
                                ...prev,
                                [`${face}Image`]: result.assets[0].uri,
                              }));
                            }
                          } catch (error) {
                            console.error('Error picking image:', error);
                            Alert.alert('Error', 'Failed to pick image');
                          }
                        }}
                      >
                        <Ionicons name="camera" size={28} color="#00704A" />
                        <Text style={styles.addImageButtonTextNew}>Add Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Issue Selection */}
                  <View style={styles.formGroup}>
                    <Text style={styles.issueLabel}>Issue</Text>
                    <View style={styles.issueChipsContainerNew}>
                      {damagePolicy.map((policy) => {
                        const isSelected = checkData[`${face}Issue` as keyof typeof checkData] === policy.issue;
                        const displayText = policy.issue === 'none' 
                          ? `None (${policy.points} pts)`
                          : `${policy.issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${policy.points} pt${policy.points !== 1 ? 's' : ''})`;
                        return (
                          <TouchableOpacity
                            key={policy.issue}
                            style={[
                              styles.issueChipNew,
                              isSelected && styles.issueChipActiveNew
                            ]}
                            activeOpacity={0.7}
                            onPress={() => {
                              setCheckData(prev => ({
                                ...prev,
                                [`${face}Issue`]: policy.issue,
                              }));
                            }}
                          >
                            <Text style={[
                              styles.issueChipTextNew,
                              isSelected && styles.issueChipTextActiveNew
                            ]}>
                              {displayText}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}

              {/* Calculated Results */}
              <View style={styles.calculationResult}>
                <Text style={styles.calculationLabel}>Total Damage Points: {calculatedPoints}</Text>
                <View style={[
                  styles.conditionBadge,
                  calculatedCondition === 'damaged' ? styles.conditionBadgeDamaged : styles.conditionBadgeGood
                ]}>
                  <Text style={[
                    styles.conditionBadgeText,
                    calculatedCondition === 'damaged' ? styles.conditionBadgeTextDamaged : styles.conditionBadgeTextGood
                  ]}>
                    Condition: {calculatedCondition.toUpperCase()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButtonNew, checkingReturn && styles.submitButtonDisabled]}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!returnSerialNumber.trim()) {
                    Alert.alert('Error', 'Serial number is required');
                    return;
                  }

                  try {
                    setCheckingReturn(true);
                    await borrowTransactionsApi.checkReturn(returnSerialNumber, checkData);

                    // After check success, show confirm modal
                    setShowReturnModal(false);
                    setShowConfirmModal(true);
                  } catch (error: any) {
                    console.error('Error checking return:', error);
                    Alert.alert('Error', error.message || 'Failed to check return');
                  } finally {
                    setCheckingReturn(false);
                  }
                }}
                disabled={checkingReturn}
              >
                {checkingReturn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonTextNew}>Confirm & Return</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirm Return Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Return</Text>
              <TouchableOpacity onPress={() => {
                setShowConfirmModal(false);
                setReturnNote('');
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Serial Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={returnSerialNumber}
                  editable={false}
                />
              </View>

              <View style={styles.calculationResult}>
                <Text style={styles.calculationLabel}>Total Damage Points: {calculatedPoints}</Text>
                <View style={[
                  styles.conditionBadge,
                  calculatedCondition === 'damaged' ? styles.conditionBadgeDamaged : styles.conditionBadgeGood
                ]}>
                  <Text style={[
                    styles.conditionBadgeText,
                    calculatedCondition === 'damaged' ? styles.conditionBadgeTextDamaged : styles.conditionBadgeTextGood
                  ]}>
                    Final Condition: {calculatedCondition.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Note</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={returnNote}
                  onChangeText={setReturnNote}
                  placeholder="Enter notes (optional)..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, confirmingReturn && styles.submitButtonDisabled]}
                onPress={async () => {
                  // Check if user is staff (only staff can confirm return)
                  if (auth.state.role !== 'staff' as any) {
                    Alert.alert(
                      'Không thể xác nhận trả hàng',
                      'Chỉ nhân viên (staff) mới có thể xác nhận trả hàng. Vui lòng đăng nhập bằng tài khoản staff để thực hiện chức năng này.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }

                  if (!returnSerialNumber.trim()) {
                    Alert.alert('Error', 'Serial number is required');
                    return;
                  }

                  try {
                    setConfirmingReturn(true);
                    
                    // Prepare damage faces data
                    const damageFaces: Array<{ face: string; issue: string }> = [];
                    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
                    faces.forEach(face => {
                      const issue = checkData[`${face}Issue` as keyof typeof checkData] as string;
                      if (issue && issue !== 'none') {
                        damageFaces.push({
                          face,
                          issue,
                        });
                      }
                    });

                    await borrowTransactionsApi.confirmReturn(returnSerialNumber, {
                      note: returnNote || undefined,
                      damageFaces,
                      tempImages: {}, // API requires tempImages to be an object (can be empty)
                      totalDamagePoints: calculatedPoints,
                      finalCondition: calculatedCondition,
                    });

                    // Close modal and reset form immediately
                    setShowConfirmModal(false);
                    setReturnSerialNumber('');
                    setReturnNote('');
                    setCheckData({
                      frontImage: null,
                      frontIssue: '',
                      backImage: null,
                      backIssue: '',
                      leftImage: null,
                      leftIssue: '',
                      rightImage: null,
                      rightIssue: '',
                      topImage: null,
                      topIssue: '',
                      bottomImage: null,
                      bottomIssue: '',
                    });

                    // Reload transactions immediately
                    await loadTransactions();
                    await loadBusinessData();

                    // Show success alert
                    Alert.alert(
                      'Thành công', 
                      'Xác nhận trả hàng thành công!',
                      [{ text: 'OK' }]
                    );
                  } catch (error: any) {
                    console.error('Error confirming return:', error);
                    Alert.alert('Error', error.message || 'Failed to confirm return');
                  } finally {
                    setConfirmingReturn(false);
                  }
                }}
                disabled={confirmingReturn}
              >
                {confirmingReturn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal for Return Processing */}
      {showQRScanner && hasCameraPermission && (
        <Modal
          visible={showQRScanner}
          transparent={true}
          animationType="slide"
          onRequestClose={stopScanning}
        >
          <View style={styles.qrScannerOverlay}>
            <TouchableOpacity 
              style={styles.qrScannerBackdrop} 
              onPress={stopScanning} 
              activeOpacity={1} 
            />
            <View style={styles.qrScannerContainer}>
              <View style={styles.qrScannerHeader}>
                <Text style={styles.qrScannerTitle}>Scan QR Code for Return</Text>
                <TouchableOpacity onPress={stopScanning}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.qrScannerBox}>
                <CameraView 
                  style={styles.qrScannerCamera} 
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
                  onBarcodeScanned={onBarcodeScanned} 
                />
              </View>
              
              <Text style={styles.qrScannerHint}>Align the QR code inside the frame to scan</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileIcon: {
    padding: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0F4D3A',
    backgroundColor: '#F0FDF4',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#0F4D3A',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: {
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowIcon: {
    backgroundColor: '#F59E0B',
  },
  returnIcon: {
    backgroundColor: '#10B981',
  },
  cardMiddle: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    maxHeight: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  returnInfo: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  returnInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  returnInfoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesInfo: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
  },
  userBorrowingCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  borrowedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  borrowedItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  borrowedItemInfo: {
    flex: 1,
  },
  borrowedItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  borrowedItemDue: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  borrowedItemMaterial: {
    fontSize: 12,
    color: '#6B7280',
  },
  borrowedItemQR: {
    alignItems: 'flex-end',
  },
  borrowedItemQRText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noBorrowedItems: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowBadge: {
    backgroundColor: '#DBEAFE',
  },
  returnBadge: {
    backgroundColor: '#D1FAE5',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  processReturnButton: {
    backgroundColor: '#0F4D3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  processReturnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  conditionContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  conditionOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  conditionOptionActive: {
    backgroundColor: '#0F4D3A',
    borderColor: '#0F4D3A',
  },
  conditionOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  conditionOptionTextActive: {
    color: '#FFFFFF',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  faceGroup: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  imageUploadContainer: {
    marginBottom: 12,
  },
  issueChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  issueChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  issueChipActive: {
    backgroundColor: '#0F4D3A',
    borderColor: '#0F4D3A',
  },
  issueChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  issueChipTextActive: {
    color: '#FFFFFF',
  },
  calculationResult: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calculationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  conditionBadgeDamaged: {
    backgroundColor: '#FEE2E2',
  },
  conditionBadgeGood: {
    backgroundColor: '#D1FAE5',
  },
  conditionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conditionBadgeTextDamaged: {
    color: '#DC2626',
  },
  conditionBadgeTextGood: {
    color: '#059669',
  },
  imagePreview: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#0F4D3A',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageButtonText: {
    fontSize: 12,
    color: '#0F4D3A',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0F4D3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  qrScannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrScannerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  qrScannerContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: 20,
  },
  qrScannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrScannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  qrScannerBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  qrScannerCamera: {
    flex: 1,
  },
  qrScannerHint: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 14,
    textAlign: 'center',
  },
  // New styles for redesigned Check Return Modal
  serialNumberLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  serialNumberInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Courier', // Monospace font for serial number
    fontWeight: '500',
  },
  addImageButtonNew: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 0,
  },
  addImageButtonTextNew: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00704A',
    marginTop: 8,
  },
  issueLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  issueChipsContainerNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChipNew: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  issueChipActiveNew: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  issueChipTextNew: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  issueChipTextActiveNew: {
    color: '#FFFFFF',
  },
  submitButtonNew: {
    backgroundColor: '#00704A',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  submitButtonTextNew: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
