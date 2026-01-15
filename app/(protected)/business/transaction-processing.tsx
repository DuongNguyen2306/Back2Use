import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { businessesApi, SingleUseProduct, singleUseProductsApi, SingleUseProductUsage, singleUseProductUsageApi } from '../../../src/services/api/businessService';
import { Feedback, feedbackApi } from '../../../src/services/api/feedbackService';
import { BusinessProfile } from '../../../src/types/business.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<BusinessTransaction | null>(null);
  const [transactionDetail, setTransactionDetail] = useState<any>(null);
  const [loadingTransactionDetail, setLoadingTransactionDetail] = useState(false);
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
  const [checkReturnResponse, setCheckReturnResponse] = useState<any>(null); // Lưu response từ checkReturn
  
  // Unified QR Scanner with mode switcher
  const [showUnifiedQRScanner, setShowUnifiedQRScanner] = useState(false);
  const [unifiedScannerMode, setUnifiedScannerMode] = useState<'borrow' | 'return'>('borrow');
  const [hasUnifiedCameraPermission, setHasUnifiedCameraPermission] = useState<boolean | null>(null);
  const [unifiedFlashEnabled, setUnifiedFlashEnabled] = useState(false);
  const [unifiedLaserLinePosition, setUnifiedLaserLinePosition] = useState(0);
  const unifiedScanLock = useRef(false);
  const unifiedLaserAnimationRef = useRef<any>(null);
  const userClosedScannerRef = useRef(false); // Flag to prevent auto-reopening when user manually closes
  const lastOpenQRParamRef = useRef<string | null>(null); // Track last openQR param to detect new navigation
  
  // QR Scanner states for return (keep for backward compatibility)
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [laserLinePosition, setLaserLinePosition] = useState(0);
  const scanLock = useRef(false);
  const laserAnimationRef = useRef<any>(null);
  
  // QR Scanner states for borrow confirmation (keep for backward compatibility)
  const [showBorrowQRScanner, setShowBorrowQRScanner] = useState(false);
  const [hasBorrowCameraPermission, setHasBorrowCameraPermission] = useState<boolean | null>(null);
  const [borrowFlashEnabled, setBorrowFlashEnabled] = useState(false);
  const [borrowLaserLinePosition, setBorrowLaserLinePosition] = useState(0);
  const borrowScanLock = useRef(false);
  const borrowLaserAnimationRef = useRef<any>(null);
  const [scannedBorrowTransaction, setScannedBorrowTransaction] = useState<BusinessTransaction | null>(null);
  const [showBorrowConfirmModal, setShowBorrowConfirmModal] = useState(false);
  const [scannedBorrowTransactionDetail, setScannedBorrowTransactionDetail] = useState<any>(null);
  const [transactionFeedback, setTransactionFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingScannedBorrowDetail, setLoadingScannedBorrowDetail] = useState(false);
  
  // Single Use Product Usage states
  const [singleUseProductUsages, setSingleUseProductUsages] = useState<SingleUseProductUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [showAddUsageModal, setShowAddUsageModal] = useState(false);
  const [availableSingleUseProducts, setAvailableSingleUseProducts] = useState<SingleUseProduct[]>([]);
  const [loadingSingleUseProducts, setLoadingSingleUseProducts] = useState(false);
  const [selectedUsageProduct, setSelectedUsageProduct] = useState<SingleUseProduct | null>(null);
  const [usageNote, setUsageNote] = useState('');
  const [submittingUsage, setSubmittingUsage] = useState(false);
  
  // Single-use product for return flow
  const [returnSingleUseProduct, setReturnSingleUseProduct] = useState<SingleUseProduct | null>(null);
  const [returnSingleUseNote, setReturnSingleUseNote] = useState('');

  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);

  // Load damage policy when return modal opens
  useEffect(() => {
    if (showReturnModal && damagePolicy.length === 0 && !loadingDamagePolicy) {
      loadDamagePolicy();
    }
  }, [showReturnModal]);

  // Load single-use products when confirm return modal opens
  useEffect(() => {
    if (showConfirmModal && availableSingleUseProducts.length === 0 && !loadingSingleUseProducts) {
      loadAvailableSingleUseProducts();
    }
  }, [showConfirmModal]);

  // Debug: Log when showAddUsageModal changes
  useEffect(() => {
    console.log('📦 [SINGLE-USE] showAddUsageModal changed:', showAddUsageModal);
  }, [showAddUsageModal]);

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

  // Ref to prevent infinite loop
  const isLoadingTransactionsRef = useRef(false);

  useEffect(() => {
    // Normalize role: handle both array and string formats
    const normalizedRole = Array.isArray(auth.state.role) ? auth.state.role[0] : auth.state.role;
    
    // Allow both business and staff to load transactions
    if (auth.state.isHydrated && auth.state.accessToken && auth.state.isAuthenticated && (normalizedRole === 'business' || normalizedRole === 'staff')) {
      // Prevent multiple simultaneous calls
      if (!isLoadingTransactionsRef.current) {
      loadTransactions();
    }
    }
    // Note: Search is handled by local filtering only, no API call needed
  }, [activeTab, auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated]);

  const loadTransactions = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingTransactionsRef.current) {
      console.log('⏸️ Already loading transactions, skipping...');
      return;
    }

    // Allow both business and staff to load transactions
    if (!auth.state.isHydrated || !auth.state.accessToken || !auth.state.isAuthenticated) {
      return;
    }

    // Normalize role: handle both array and string formats
    const normalizedRole = Array.isArray(auth.state.role) ? auth.state.role[0] : auth.state.role;

    // Only allow business and staff roles
    if (normalizedRole !== 'business' && normalizedRole !== 'staff') {
      return;
    }

    try {
      isLoadingTransactionsRef.current = true;
      setLoading(true);
      console.log('🔄 Loading business transactions...');
      
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (activeTab !== 'all') {
        if (activeTab === 'borrow') {
          params.status = 'borrowing';
        } else if (activeTab === 'return-success') {
          params.status = 'returned';
        } else if (activeTab === 'overdue') {
          // Overdue transactions - filter on client side since API doesn't have overdue status
          params.status = 'borrowing';
        }
      }
      
      // Search is handled by local filtering in getFilteredTransactions()
      // No need to call API for search
      
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
      // Silently handle 401/403/500 errors (Unauthorized / Access denied / Business not found)
      if (error?.response?.status === 401 || 
          error?.response?.status === 403 || 
          error?.response?.status === 500 ||
          error?.message?.toLowerCase().includes('unauthorized')) {
        // Silently handle - don't show error to user
        console.log('⚠️ Error accessing business transactions API:', error?.response?.status || error?.message);
        setTransactions([]);
        return;
      } else if (error?.response?.status && error.response.status >= 500) {
        console.error('Error loading transactions:', error);
      }
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingTransactionsRef.current = false;
    }
  };

  // Auto open QR scanner when navigated from "Process Returns" button
  useEffect(() => {
    if (params?.openQRScanner === 'true') {
      // Small delay to ensure screen is fully loaded
      const timer = setTimeout(async () => {
        try {
          if (!cameraPermission?.granted) {
            const result = await requestCameraPermission();
            if (result.granted) {
              setHasCameraPermission(true);
              setShowQRScanner(true);
            } else {
              setHasCameraPermission(false);
              Alert.alert('Camera Permission', 'Please grant camera permission to scan QR codes', [{ text: 'OK' }]);
            }
          } else {
            setHasCameraPermission(true);
            setShowQRScanner(true);
          }
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          Alert.alert('Error', 'Unable to open camera. Please try again.');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [params?.openQRScanner, cameraPermission, requestCameraPermission]);

  // Auto open unified QR scanner when navigated from navigation QR button (for staff)
  useFocusEffect(
    React.useCallback(() => {
      // Check if this is staff and coming from navigation QR button
      const normalizedRole = Array.isArray(auth.state.role) ? auth.state.role[0] : auth.state.role;
      const isStaff = normalizedRole === 'staff';
      
      const currentOpenQR = params?.openQR;
      
      // Only reset flag if this is a NEW navigation from QR button (param changed)
      // This prevents resetting flag if screen is just refocused with same param
      if (currentOpenQR === 'true' && lastOpenQRParamRef.current !== 'true' && !showUnifiedQRScanner) {
        userClosedScannerRef.current = false;
        console.log('🔄 Reset closed flag - new navigation from QR button');
      }
      
      // Update last param ref (handle array case)
      const currentOpenQRString: string | null = Array.isArray(currentOpenQR) 
        ? (currentOpenQR[0] || null)
        : (currentOpenQR || null);
      lastOpenQRParamRef.current = currentOpenQRString;
      
      // Only auto-open if staff and (coming from navigation QR button OR no params) and user hasn't manually closed it
      // AND scanner is not currently showing
      const shouldAutoOpen = isStaff && 
        !showUnifiedQRScanner && 
        !userClosedScannerRef.current &&
        (currentOpenQR === 'true' || (!params?.openQRScanner && !params?.openBorrowQR && !params?.openReturnQR && !params?.transactionId));
      
      if (shouldAutoOpen) {
        console.log('🚀 Auto-opening scanner...');
        // Small delay to ensure screen is fully loaded
        const timer = setTimeout(async () => {
          // Double-check flag before opening (user might have closed it during delay)
          if (userClosedScannerRef.current) {
            console.log('⏸️ Scanner opening cancelled - user closed it');
            return;
          }
          
          try {
            if (!cameraPermission?.granted) {
              const result = await requestCameraPermission();
              if (result.granted) {
                // Triple-check flag before actually opening
                if (userClosedScannerRef.current) {
                  console.log('⏸️ Scanner opening cancelled - user closed it (after permission)');
                  return;
                }
                setHasUnifiedCameraPermission(true);
                setShowUnifiedQRScanner(true);
                // Default to borrow mode
                setUnifiedScannerMode('borrow');
                console.log('✅ Scanner opened');
              } else {
                setHasUnifiedCameraPermission(false);
              }
            } else {
              // Triple-check flag before actually opening
              if (userClosedScannerRef.current) {
                console.log('⏸️ Scanner opening cancelled - user closed it (after permission)');
                return;
              }
              setHasUnifiedCameraPermission(true);
              setShowUnifiedQRScanner(true);
              // Default to borrow mode
              setUnifiedScannerMode('borrow');
              console.log('✅ Scanner opened');
            }
          } catch (error) {
            console.error('Error requesting camera permission:', error);
          }
        }, 300);
        return () => clearTimeout(timer);
      } else {
        console.log('⏸️ Not auto-opening scanner:', {
          isStaff,
          showUnifiedQRScanner,
          userClosed: userClosedScannerRef.current,
          hasOpenQR: currentOpenQR === 'true',
          hasOtherParams: !!(params?.openQRScanner || params?.openBorrowQR || params?.openReturnQR || params?.transactionId),
          lastOpenQR: lastOpenQRParamRef.current
        });
      }
    }, [auth.state.role, params, showUnifiedQRScanner])
  );

  // Auto open transaction details modal when navigated with transactionId
  useEffect(() => {
    if (params?.transactionId && transactions.length > 0) {
      const transaction = transactions.find(t => t._id === params.transactionId);
      if (transaction) {
        setSelectedTransaction(transaction);
        setShowDetailsModal(true);
      }
    }
  }, [params?.transactionId, transactions]);

  // Load transaction detail when modal opens
  useEffect(() => {
    if (showDetailsModal && selectedTransaction?._id) {
      loadTransactionDetail(selectedTransaction._id);
      loadTransactionFeedback(selectedTransaction._id);
      
      // Load available single-use products if this is a borrow transaction
      // This helps match products when displaying usages
      if (selectedTransaction?.borrowTransactionType === 'borrow' && availableSingleUseProducts.length === 0) {
        loadAvailableSingleUseProducts();
      }
    } else {
      setTransactionDetail(null);
      setTransactionFeedback(null);
    }
  }, [showDetailsModal, selectedTransaction?._id]);

  // Load feedback for transaction
  const loadTransactionFeedback = async (transactionId: string) => {
    try {
      setLoadingFeedback(true);
      // Get all feedbacks and find the one for this transaction
      // Note: Business can see feedbacks via getByBusiness API
      // For now, we'll try to get feedbacks for this business and find matching transaction
      if (businessProfile?._id) {
        const response = await feedbackApi.getByBusiness(businessProfile._id, {
          page: 1,
          limit: 100,
        });
        const feedbacks = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.items || [];
        
        const feedback = feedbacks.find((f: Feedback) => f.borrowTransactionId === transactionId);
        setTransactionFeedback(feedback || null);
      }
    } catch (error) {
      console.error('Error loading transaction feedback:', error);
      setTransactionFeedback(null);
    } finally {
      setLoadingFeedback(false);
    }
  };

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

  const loadTransactionDetail = async (transactionId: string) => {
    try {
      setLoadingTransactionDetail(true);
      const response = await borrowTransactionsApi.getBusinessDetail(transactionId);
      
      if (response.statusCode === 200 && response.data) {
        setTransactionDetail(response.data);
        // Load single-use product usages if this is a borrow transaction
        if (selectedTransaction?.borrowTransactionType === 'borrow') {
          await loadSingleUseProductUsages(transactionId);
        }
      } else {
        console.warn('Failed to load transaction detail:', response);
        setTransactionDetail(null);
      }
    } catch (error: any) {
      console.error('Error loading transaction detail:', error);
      // Silently handle errors - don't show alert
      setTransactionDetail(null);
    } finally {
      setLoadingTransactionDetail(false);
    }
  };

  // Load single-use product usages for a borrow transaction
  const loadSingleUseProductUsages = async (borrowTransactionId: string) => {
    try {
      setLoadingUsages(true);
      const response = await singleUseProductUsageApi.getByBorrowTransaction(borrowTransactionId);
      
      // Enhanced parsing to handle multiple response structures
      console.log('📦 [SINGLE-USE] Raw response:', JSON.stringify(response, null, 2));
      
      let responseData = (response as any)?.data || response;
      console.log('📦 [SINGLE-USE] Response data:', responseData);
      console.log('📦 [SINGLE-USE] Is array?', Array.isArray(responseData));
      
      // Parse response structure
      let usagesArray: any[] = [];
      if (Array.isArray(responseData)) {
        // Case 1: Direct array
        usagesArray = responseData;
        console.log('📦 [SINGLE-USE] Using: Direct array');
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // Case 2: Nested data.data
        usagesArray = responseData.data;
        console.log('📦 [SINGLE-USE] Using: responseData.data');
      } else if (responseData?.usages && Array.isArray(responseData.usages)) {
        // Case 3: responseData.usages
        usagesArray = responseData.usages;
        console.log('📦 [SINGLE-USE] Using: responseData.usages');
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        // Case 4: responseData.items
        usagesArray = responseData.items;
        console.log('📦 [SINGLE-USE] Using: responseData.items');
      } else {
        console.warn('📦 [SINGLE-USE] ⚠️ Could not parse response structure!');
        usagesArray = [];
      }
      
      console.log('📦 [SINGLE-USE] Parsed usages:', usagesArray.length);
      if (usagesArray.length > 0) {
        console.log('📦 [SINGLE-USE] First usage:', JSON.stringify(usagesArray[0], null, 2));
        // Check if product is populated
        const firstUsage = usagesArray[0];
        if (firstUsage.singleUseProductId) {
          const productId = firstUsage.singleUseProductId;
          console.log('📦 [SINGLE-USE] Product ID type:', typeof productId);
          console.log('📦 [SINGLE-USE] Product ID is object?', typeof productId === 'object');
          if (typeof productId === 'object' && productId !== null) {
            console.log('📦 [SINGLE-USE] Product data:', JSON.stringify(productId, null, 2));
          }
        }
      }
      
      setSingleUseProductUsages(usagesArray);
    } catch (error: any) {
      console.error('📦 [SINGLE-USE] Error loading single-use product usages:', error);
      console.error('📦 [SINGLE-USE] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      setSingleUseProductUsages([]);
    } finally {
      setLoadingUsages(false);
    }
  };

  // Load available single-use products
  const loadAvailableSingleUseProducts = async () => {
    try {
      setLoadingSingleUseProducts(true);
      const response = await singleUseProductsApi.getMy({ isActive: true, page: 1, limit: 100 });
      const responseData = (response as any)?.data || response;
      const productsArray = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.singleUseProducts || responseData?.data || []);
      
      // Log to check if productSizeId is populated
      if (productsArray.length > 0) {
        console.log('📦 [SINGLE-USE] First product structure:', JSON.stringify(productsArray[0], null, 2));
        console.log('📦 [SINGLE-USE] productSizeId type:', typeof productsArray[0].productSizeId);
        if (typeof productsArray[0].productSizeId === 'object') {
          console.log('📦 [SINGLE-USE] productSizeId object:', JSON.stringify(productsArray[0].productSizeId, null, 2));
        }
      }
      
      setAvailableSingleUseProducts(productsArray);
    } catch (error: any) {
      console.error('Error loading single-use products:', error);
      Alert.alert('Error', 'Failed to load single-use products');
      setAvailableSingleUseProducts([]);
    } finally {
      setLoadingSingleUseProducts(false);
    }
  };

  // Handle add single-use product usage
  const handleCopyTxHash = async (txHash: string) => {
    try {
      await Clipboard.setStringAsync(txHash);
      Alert.alert("Đã sao chép", "Blockchain transaction hash đã được sao chép vào clipboard");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert("Lỗi", "Không thể sao chép");
    }
  };

  const handleAddUsage = async () => {
    if (!selectedTransaction || !selectedUsageProduct) {
      Alert.alert('Error', 'Please select a single-use product');
      return;
    }

    try {
      setSubmittingUsage(true);
      await singleUseProductUsageApi.create(selectedTransaction._id, {
        singleUseProductId: selectedUsageProduct._id,
        note: usageNote.trim() || undefined,
      });
      
      Alert.alert('Success', 'Single-use product added to transaction');
      
      // Close add usage modal
      setShowAddUsageModal(false);
      setSelectedUsageProduct(null);
      setUsageNote('');
      
      // Reload usages
      await loadSingleUseProductUsages(selectedTransaction._id);
      
      // Reload transaction detail to update CO2
      await loadTransactionDetail(selectedTransaction._id);
      
      // Reopen transaction detail modal after a short delay
      setTimeout(() => {
        setShowDetailsModal(true);
      }, 300);
    } catch (error: any) {
      console.error('Error adding usage:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add single-use product';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmittingUsage(false);
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
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (result.granted) {
          setHasCameraPermission(true);
          setShowQRScanner(true);
        } else {
          setHasCameraPermission(false);
          Alert.alert('Camera Permission', 'Please grant camera permission to scan QR codes', [{ text: 'OK' }]);
        }
      } else {
        setHasCameraPermission(true);
        setShowQRScanner(true);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  // Open Unified QR Scanner with Mode Switcher
  const openUnifiedQRScanner = async () => {
    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        setHasUnifiedCameraPermission(result.granted);
        if (result.granted) {
          setShowUnifiedQRScanner(true);
          setUnifiedScannerMode('borrow'); // Default to borrow mode
        } else {
          setHasUnifiedCameraPermission(false);
          Alert.alert('Camera Permission', 'Please grant camera permission to scan QR codes', [{ text: 'OK' }]);
        }
      } else {
        setHasUnifiedCameraPermission(true);
        setShowUnifiedQRScanner(true);
        setUnifiedScannerMode('borrow'); // Default to borrow mode
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  // Stop Unified QR Scanner
  const stopUnifiedScanning = () => {
    console.log('🛑 Stopping unified scanning...');
    // Mark that user manually closed the scanner FIRST to prevent auto-reopening
    userClosedScannerRef.current = true;
    // Then close the scanner
    setShowUnifiedQRScanner(false);
    setUnifiedFlashEnabled(false);
    if (unifiedLaserAnimationRef.current) {
      clearInterval(unifiedLaserAnimationRef.current);
      unifiedLaserAnimationRef.current = null;
    }
    unifiedScanLock.current = false;
    setUnifiedLaserLinePosition(0);
    console.log('✅ Unified scanning stopped, userClosedScannerRef:', userClosedScannerRef.current);
  };

  // Handle Unified QR Scanner barcode scan
  const onUnifiedBarcodeScanned = async (e: any) => {
    if (unifiedScanLock.current) {
      console.log('🔒 Unified scanner is locked, ignoring scan');
      return;
    }
    unifiedScanLock.current = true;
    
    const scannedData = e?.data ?? '';
    console.log('📱 Unified QR Code scanned:', scannedData, 'Mode:', unifiedScannerMode);
    
    if (!scannedData || scannedData.trim() === '') {
      Alert.alert('Error', 'Invalid QR code');
      unifiedScanLock.current = false;
      return;
    }
    
    Vibration.vibrate(Platform.OS === 'ios' ? 30 : 50);
    
    // Close scanner first before processing
    setShowUnifiedQRScanner(false);
    stopUnifiedScanning();
    
    // Small delay to ensure scanner is fully closed
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      if (unifiedScannerMode === 'borrow') {
        console.log('🔍 Processing borrow confirmation scan...');
        // Handle borrow confirmation (same logic as onBorrowBarcodeScanned)
        let serialNumber = scannedData.trim();
        if (scannedData.includes('://')) {
          const match = scannedData.match(/(?:com\.)?back2use:\/\/item\/([^\/]+)/);
          if (match && match[1]) {
            serialNumber = match[1];
          } else {
            const parts = scannedData.split('/');
            serialNumber = parts[parts.length - 1];
          }
        }
        
        console.log('🔍 Extracted serial number:', serialNumber);
        const isTransactionId = /^[0-9a-fA-F]{24}$/.test(serialNumber);
        let foundTransaction: BusinessTransaction | null = null;
        
        if (isTransactionId) {
          console.log('🔍 Searching by transaction ID...');
          try {
            const response = await borrowTransactionsApi.getBusinessDetail(serialNumber);
            if (response.statusCode === 200 && response.data) {
              const transaction = response.data as BusinessTransaction;
              // Check if transaction is borrow type and can be confirmed
              const canConfirm = transaction.borrowTransactionType === 'borrow' &&
                                (transaction.status === 'pending' || transaction.status === 'waiting' || transaction.status === 'pending_pickup');
              
              if (canConfirm) {
                foundTransaction = transaction;
                console.log('✅ Found transaction by ID:', foundTransaction._id);
              } else {
                console.log('⚠️ Transaction found but cannot be confirmed. Status:', transaction.status);
                Alert.alert(
                  'Transaction Already Processed',
                  `This transaction has already been ${transaction.status === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${transaction.status}`,
                  [{ text: 'OK' }]
                );
                unifiedScanLock.current = false;
                return;
              }
            }
          } catch (error) {
            console.log('❌ Transaction not found by ID:', error);
          }
        }
        
        if (!foundTransaction) {
          console.log('🔍 Searching by serial number in history...');
          try {
            const apiResponse = await borrowTransactionsApi.getBusinessHistory({
              page: 1,
              limit: 1000,
            });
            console.log('📡 API Response:', {
              statusCode: apiResponse.statusCode,
              hasData: !!apiResponse.data,
              dataType: Array.isArray(apiResponse.data) ? 'array' : typeof apiResponse.data,
              itemsCount: apiResponse.data?.items?.length || (Array.isArray(apiResponse.data) ? apiResponse.data.length : 0)
            });
            
            const apiTransactions = apiResponse.data?.items || (Array.isArray(apiResponse.data) ? apiResponse.data : []);
            console.log('📋 Total transactions in history:', apiTransactions.length);
            
            if (apiTransactions.length === 0) {
              console.log('⚠️ No transactions found in history');
            }
            
            foundTransaction = apiTransactions.find((t: BusinessTransaction) => {
              const matchesSerial = t.productId?.serialNumber === serialNumber;
              const matchesType = t.borrowTransactionType === 'borrow';
              const matchesStatus = (t.status === 'pending' || t.status === 'waiting' || t.status === 'pending_pickup');
              
              if (matchesSerial && matchesType) {
                console.log('🔍 Found matching transaction:', {
                  id: t._id,
                  serialNumber: t.productId?.serialNumber,
                  type: t.borrowTransactionType,
                  status: t.status,
                  matchesStatus
                });
              }
              
              return matchesSerial && matchesType && matchesStatus;
            }) as BusinessTransaction | undefined || null;
            
            if (foundTransaction) {
              console.log('✅ Found transaction by serial number:', foundTransaction._id, 'Status:', foundTransaction.status);
            } else {
              console.log('❌ No pending borrow transaction found for serial number:', serialNumber);
              console.log('🔍 Available transactions with this serial:', 
                apiTransactions.filter((t: BusinessTransaction) => t.productId?.serialNumber === serialNumber).map((t: BusinessTransaction) => ({
                  id: t._id,
                  type: t.borrowTransactionType,
                  status: t.status
                }))
              );
            }
          } catch (error: any) {
            console.error('❌ Error fetching transaction history:', error);
            console.error('❌ Error details:', {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data
            });
            Alert.alert('Error', `Failed to fetch transactions: ${error.message || 'Unknown error'}`);
          }
        }
        
        if (foundTransaction) {
          console.log('📝 Setting scanned transaction and loading details...');
          console.log('📝 Found transaction ID:', foundTransaction._id);
          console.log('📝 Found transaction status:', foundTransaction.status);
          
          // Store detail in local variable first
          let transactionDetail: any = null;
          
          try {
            setLoadingScannedBorrowDetail(true);
            console.log('📡 Fetching transaction detail for ID:', foundTransaction._id);
            
            const detailResponse = await borrowTransactionsApi.getBusinessDetail(foundTransaction._id);
            console.log('📡 Detail response status:', detailResponse.statusCode);
            console.log('📡 Detail response data:', detailResponse.data ? 'present' : 'missing');
            
            if (detailResponse.statusCode === 200 && detailResponse.data) {
              console.log('✅ Transaction detail loaded successfully');
              transactionDetail = detailResponse.data;
              
              // Check status again from detail response - prevent confirming already confirmed transactions
              const currentStatus = transactionDetail.status || foundTransaction.status;
              const canConfirm = currentStatus === 'pending' || currentStatus === 'waiting' || currentStatus === 'pending_pickup';
              
              if (!canConfirm) {
                console.log('⚠️ Transaction already confirmed or cannot be confirmed. Status:', currentStatus);
                Alert.alert(
                  'Transaction Already Processed',
                  `This transaction has already been ${currentStatus === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${currentStatus}`,
                  [{ text: 'OK' }]
                );
                unifiedScanLock.current = false;
                return;
              }
            } else {
              console.log('⚠️ Transaction detail response status:', detailResponse.statusCode);
            }
          } catch (error: any) {
            console.error('❌ Error loading transaction detail:', error);
            console.error('❌ Error details:', {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data
            });
            // Even if detail fails, we can still show the transaction from history
            transactionDetail = null;
          } finally {
            setLoadingScannedBorrowDetail(false);
          }
          
          // Double-check status before showing modal
          const finalStatus = transactionDetail?.status || foundTransaction.status;
          const canConfirm = finalStatus === 'pending' || finalStatus === 'waiting' || finalStatus === 'pending_pickup';
          
          if (!canConfirm) {
            console.log('⚠️ Transaction cannot be confirmed. Status:', finalStatus);
            Alert.alert(
              'Transaction Already Processed',
              `This transaction has already been ${finalStatus === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${finalStatus}`,
              [{ text: 'OK' }]
            );
            unifiedScanLock.current = false;
            return;
          }
          
          // Set both states together
          setScannedBorrowTransaction(foundTransaction);
          setScannedBorrowTransactionDetail(transactionDetail);
          
          // Ensure scanner is closed before opening modal
          setShowUnifiedQRScanner(false);
          stopUnifiedScanning();
          
          // Wait a bit longer to ensure scanner modal is fully closed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Double-check that transaction is still set
          console.log('📱 Opening borrow confirm modal...');
          console.log('📱 Transaction ID:', foundTransaction._id);
          console.log('📱 Transaction Detail:', transactionDetail ? 'loaded' : 'null');
          
          // Use setTimeout to ensure state updates are applied
          setTimeout(() => {
            setShowBorrowConfirmModal(true);
            console.log('📱 Borrow confirm modal opened');
          }, 200);
        } else {
          console.log('❌ No transaction found, showing alert');
          Alert.alert('No Borrow Request', 'This product does not have a borrow request');
        }
      } else {
        // Handle return processing - Find transaction and show detail modal
        let serialNumber = scannedData.trim();
        if (scannedData.includes('://')) {
          const match = scannedData.match(/(?:com\.)?back2use:\/\/item\/([^\/]+)/);
          if (match && match[1]) {
            serialNumber = match[1];
          } else {
            const parts = scannedData.split('/');
            serialNumber = parts[parts.length - 1];
          }
        }
        
        console.log('🔍 Searching transaction for return by serial:', serialNumber);
        
        // Ensure scanner is closed
        setShowUnifiedQRScanner(false);
        stopUnifiedScanning();
        
        // Find transaction by serial number
        let foundTransaction: BusinessTransaction | null = null;
        
        // Check if it's a transaction ID (24 char hex)
        const isTransactionId = /^[0-9a-fA-F]{24}$/.test(serialNumber);
        
        if (isTransactionId) {
          try {
            const response = await borrowTransactionsApi.getBusinessDetail(serialNumber);
            if (response.statusCode === 200 && response.data) {
              foundTransaction = response.data as BusinessTransaction;
            }
          } catch (error) {
            console.log('Transaction not found by ID');
          }
        }
        
        // If not found by ID, search by product serial in borrowing transactions
        if (!foundTransaction) {
          try {
            const apiResponse = await borrowTransactionsApi.getBusinessHistory({
              page: 1,
              limit: 1000,
            });
            
            const apiTransactions = apiResponse.data?.items || (Array.isArray(apiResponse.data) ? apiResponse.data : []);
            
            // Find transaction by serial number - prioritize borrowing status
            foundTransaction = apiTransactions.find((t: BusinessTransaction) => {
              const matchesSerial = t.productId?.serialNumber === serialNumber;
              const isBorrowing = t.status === 'borrowing';
              return matchesSerial && isBorrowing;
            }) as BusinessTransaction | undefined || null;
            
            // If no borrowing found, try pending_pickup
            if (!foundTransaction) {
              foundTransaction = apiTransactions.find((t: BusinessTransaction) => {
                const matchesSerial = t.productId?.serialNumber === serialNumber;
                const isPendingPickup = t.status === 'pending_pickup';
                return matchesSerial && isPendingPickup;
              }) as BusinessTransaction | undefined || null;
            }
            
            // If still not found, get any transaction with this serial
            if (!foundTransaction) {
              foundTransaction = apiTransactions.find((t: BusinessTransaction) => 
                t.productId?.serialNumber === serialNumber
              ) as BusinessTransaction | undefined || null;
            }
          } catch (error) {
            console.log('Error searching transaction by serial:', error);
          }
        }
        
        if (foundTransaction) {
          console.log('✅ Found transaction for return:', foundTransaction._id);
          
          // Load full transaction detail
          try {
            setLoadingTransactionDetail(true);
            const detailResponse = await borrowTransactionsApi.getBusinessDetail(foundTransaction._id);
            if (detailResponse.statusCode === 200 && detailResponse.data) {
              setTransactionDetail(detailResponse.data);
            }
          } catch (error) {
            console.error('Error loading transaction detail:', error);
            setTransactionDetail(null);
          } finally {
            setLoadingTransactionDetail(false);
          }
          
          // Show transaction detail modal (like clicking on history)
          setTimeout(() => {
            setSelectedTransaction(foundTransaction);
            setShowDetailsModal(true);
          }, 200);
        } else {
          Alert.alert('Không tìm thấy', 'Không tìm thấy đơn hàng cho sản phẩm này');
        }
      }
    } catch (error: any) {
      console.error('Error processing QR scan:', error);
      Alert.alert('Error', error.message || 'Failed to process QR code');
    } finally {
      unifiedScanLock.current = false;
    }
  };

  // Laser scanning line animation for unified scanner
  useEffect(() => {
    if (showUnifiedQRScanner && hasUnifiedCameraPermission) {
      const frameSize = screenWidth * 0.7;
      let direction = 1;
      let position = 10;
      
      unifiedLaserAnimationRef.current = setInterval(() => {
        position += direction * 3;
        if (position >= frameSize - 10 || position <= 10) {
          direction *= -1;
        }
        setUnifiedLaserLinePosition(position);
      }, 16);
      
      return () => {
        if (unifiedLaserAnimationRef.current) {
          clearInterval(unifiedLaserAnimationRef.current);
          unifiedLaserAnimationRef.current = null;
        }
        setUnifiedLaserLinePosition(0);
      };
    } else {
      setUnifiedLaserLinePosition(0);
    }
  }, [showUnifiedQRScanner, hasUnifiedCameraPermission]);

  // Open QR Scanner for Borrow Confirmation (keep for backward compatibility)
  const openBorrowQRScanner = async () => {
    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        setHasBorrowCameraPermission(result.granted);
        if (result.granted) {
          setShowBorrowQRScanner(true);
        } else {
          setHasBorrowCameraPermission(false);
          Alert.alert('Camera Permission', 'Please grant camera permission to scan QR codes', [{ text: 'OK' }]);
        }
      } else {
        setHasBorrowCameraPermission(true);
        setShowBorrowQRScanner(true);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  // Handle QR code scan for borrow confirmation
  const onBorrowBarcodeScanned = async (e: any) => {
    if (borrowScanLock.current) return;
    borrowScanLock.current = true;
    
    const scannedData = e?.data ?? '';
    console.log('📱 QR Code scanned for borrow confirmation:', scannedData);
    
    if (!scannedData || scannedData.trim() === '') {
      Alert.alert('Error', 'Invalid QR code');
      borrowScanLock.current = false;
      return;
    }
    
    Vibration.vibrate(Platform.OS === 'ios' ? 30 : 50);
    setShowBorrowQRScanner(false);
    
    // Extract serialNumber from scanned data
    let serialNumber = scannedData.trim();
    
    // Extract from deep link if present
    if (scannedData.includes('://')) {
      const match = scannedData.match(/(?:com\.)?back2use:\/\/item\/([^\/]+)/);
      if (match && match[1]) {
        serialNumber = match[1];
      } else {
        const parts = scannedData.split('/');
        serialNumber = parts[parts.length - 1];
      }
    }
    
    // Check if it's a transaction ID
    const isTransactionId = /^[0-9a-fA-F]{24}$/.test(serialNumber);
    
    try {
      let foundTransaction: BusinessTransaction | null = null;
      
      if (isTransactionId) {
        // If it's a transaction ID, get transaction directly
        try {
          const response = await borrowTransactionsApi.getBusinessDetail(serialNumber);
          if (response.statusCode === 200 && response.data) {
            const transaction = response.data;
            // Check if transaction is borrow type and can be confirmed
            const canConfirm = transaction.borrowTransactionType === 'borrow' &&
                              (transaction.status === 'pending' || transaction.status === 'waiting' || transaction.status === 'pending_pickup');
            
            if (canConfirm) {
              foundTransaction = transaction;
            } else {
              console.log('⚠️ Transaction found but cannot be confirmed. Status:', transaction.status);
              Alert.alert(
                'Transaction Already Processed',
                `This transaction has already been ${transaction.status === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${transaction.status}`,
                [{ text: 'OK' }]
              );
              borrowScanLock.current = false;
              return;
            }
          }
        } catch (error) {
          console.log('Transaction not found by ID');
        }
      }
      
      // If not found by ID or not an ID, search by serial number
      if (!foundTransaction) {
        const apiResponse = await borrowTransactionsApi.getBusinessHistory({
          page: 1,
          limit: 1000, // Get more to search
        });
        const apiTransactions = apiResponse.data?.items || (Array.isArray(apiResponse.data) ? apiResponse.data : []);
        
        // Find transaction with matching serial number and status pending/waiting/pending_pickup
        foundTransaction = apiTransactions.find((t: BusinessTransaction) => 
          t.productId?.serialNumber === serialNumber &&
          t.borrowTransactionType === 'borrow' &&
          (t.status === 'pending' || t.status === 'waiting' || t.status === 'pending_pickup')
        ) || null;
      }
      
      if (foundTransaction) {
        console.log('✅ Found transaction:', foundTransaction._id);
        setScannedBorrowTransaction(foundTransaction);
        
        // Load full transaction detail and check status
        let transactionDetail: any = null;
        let canConfirm = false;
        
        try {
          setLoadingScannedBorrowDetail(true);
          const detailResponse = await borrowTransactionsApi.getBusinessDetail(foundTransaction._id);
          if (detailResponse.statusCode === 200 && detailResponse.data) {
            transactionDetail = detailResponse.data;
            setScannedBorrowTransactionDetail(transactionDetail);
            
            // Check status again from detail response - prevent confirming already confirmed transactions
            const currentStatus = transactionDetail.status || foundTransaction.status;
            canConfirm = currentStatus === 'pending' || currentStatus === 'waiting' || currentStatus === 'pending_pickup';
            
            if (!canConfirm) {
              console.log('⚠️ Transaction already confirmed or cannot be confirmed. Status:', currentStatus);
              Alert.alert(
                'Transaction Already Processed',
                `This transaction has already been ${currentStatus === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${currentStatus}`,
                [{ text: 'OK' }]
              );
              borrowScanLock.current = false;
              return;
            }
          } else {
            // If detail load fails, use transaction from history and check its status
            transactionDetail = null;
            const currentStatus = foundTransaction.status;
            canConfirm = currentStatus === 'pending' || currentStatus === 'waiting' || currentStatus === 'pending_pickup';
            
            if (!canConfirm) {
              console.log('⚠️ Transaction cannot be confirmed. Status:', currentStatus);
              Alert.alert(
                'Transaction Already Processed',
                `This transaction has already been ${currentStatus === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${currentStatus}`,
                [{ text: 'OK' }]
              );
              borrowScanLock.current = false;
              return;
            }
          }
        } catch (error: any) {
          console.error('Error loading transaction detail:', error);
          // Use basic transaction data if detail fails
          setScannedBorrowTransactionDetail(null);
          
          // Check status from foundTransaction
          const currentStatus = foundTransaction.status;
          canConfirm = currentStatus === 'pending' || currentStatus === 'waiting' || currentStatus === 'pending_pickup';
          
          if (!canConfirm) {
            console.log('⚠️ Transaction cannot be confirmed. Status:', currentStatus);
            Alert.alert(
              'Transaction Already Processed',
              `This transaction has already been ${currentStatus === 'borrowing' ? 'confirmed' : 'processed'}. Status: ${currentStatus}`,
              [{ text: 'OK' }]
            );
            borrowScanLock.current = false;
            return;
          }
        } finally {
          setLoadingScannedBorrowDetail(false);
        }
        
        // Only show modal if transaction can be confirmed
        if (canConfirm) {
          setShowBorrowConfirmModal(true);
        }
      } else {
        Alert.alert(
          'No Borrow Request',
          'This product does not have a borrow request',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error finding transaction:', error);
      Alert.alert(
        'No Borrow Request',
        'This product does not have a borrow request',
        [{ text: 'OK' }]
      );
    } finally {
      borrowScanLock.current = false;
    }
  };

  const stopBorrowScanning = () => {
    setShowBorrowQRScanner(false);
    setBorrowFlashEnabled(false);
    if (borrowLaserAnimationRef.current) {
      clearInterval(borrowLaserAnimationRef.current);
      borrowLaserAnimationRef.current = null;
    }
  };

  // Laser scanning line animation for borrow scanner
  useEffect(() => {
    if (showBorrowQRScanner && hasBorrowCameraPermission) {
      const frameSize = screenWidth * 0.7;
      let direction = 1;
      let position = 10;
      
      borrowLaserAnimationRef.current = setInterval(() => {
        position += direction * 3;
        if (position >= frameSize - 10 || position <= 10) {
          direction *= -1;
        }
        setBorrowLaserLinePosition(position);
      }, 16);
      
      return () => {
        if (borrowLaserAnimationRef.current) {
          clearInterval(borrowLaserAnimationRef.current);
          borrowLaserAnimationRef.current = null;
        }
        setBorrowLaserLinePosition(0);
      };
    } else {
      setBorrowLaserLinePosition(0);
    }
  }, [showBorrowQRScanner, hasBorrowCameraPermission]);

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
          Alert.alert('Error', 'Serial number not found from transaction. Please scan the product QR code.');
          scanLock.current = false;
          return;
        }
      } catch (error: any) {
        // Silently handle Unauthorized errors
        if (error?.response?.status === 401 || 
            error?.message?.toLowerCase().includes('unauthorized')) {
          console.log('⚠️ Unauthorized error getting transaction (silently handled)');
          Alert.alert(
            'Error', 
            'Cannot get serial number from transaction. Please scan the product QR code (not the transaction QR code).'
          );
          scanLock.current = false;
          return;
        }
        // If error, don't use transaction ID as serialNumber
        console.log('⚠️ Error getting transaction:', error?.response?.status || error?.message);
        Alert.alert(
          'Error', 
          'Cannot get serial number from transaction. Please scan the product QR code (not the transaction QR code).'
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
      Alert.alert('Error', 'Cannot get serial number. Please scan the product QR code.');
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
    setFlashEnabled(false);
    if (laserAnimationRef.current) {
      clearInterval(laserAnimationRef.current);
      laserAnimationRef.current = null;
    }
  };

  // Laser scanning line animation
  useEffect(() => {
    if (showQRScanner && hasCameraPermission) {
      const frameSize = screenWidth * 0.7;
      let direction = 1;
      let position = 10;
      
      laserAnimationRef.current = setInterval(() => {
        position += direction * 3;
        if (position >= frameSize - 10 || position <= 10) {
          direction *= -1;
        }
        setLaserLinePosition(position);
      }, 16);
      
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
  }, [showQRScanner, hasCameraPermission]);

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
    const productName = transaction.productId?.productGroupId?.name || 'Unknown Product';
    const customerName = typeof transaction.customerId === 'object' 
      ? transaction.customerId.fullName 
      : 'Unknown';

    const getTransactionStatus = () => {
      if (transaction.borrowTransactionType === 'borrow') {
        if (transaction.status === 'borrowing') {
          if (overdueInfo && overdueInfo.overdueDays > 0) {
            return { text: 'Overdue', color: '#EF4444', bgColor: '#FEE2E2' };
          }
          return { text: 'Borrowing', color: '#F59E0B', bgColor: '#FEF3C7' };
        }
        if (transaction.status === 'completed') {
          return { text: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
        }
      } else {
        // Return transaction
        if (returnCategory === 'success') {
          return { text: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
        } else if (returnCategory === 'failed-other') {
          return { text: 'Failed', color: '#EF4444', bgColor: '#FEE2E2' };
        } else {
          // If returnedAt exists but returnCategory is null, still consider it successful
          if (transaction.returnedAt) {
            return { text: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
          }
          // If no returnedAt and status is unclear, show original status
          return { text: transaction.status || 'Processing', color: '#6B7280', bgColor: '#F3F4F6' };
        }
      }
      return { text: transaction.status, color: '#6B7280', bgColor: '#F3F4F6' };
    };

    const status = getTransactionStatus();
    const transactionDate = transaction.returnedAt 
      ? new Date(transaction.returnedAt) 
      : new Date(transaction.borrowDate);

    return (
      <View style={styles.transactionCard}>
        <TouchableOpacity 
          style={styles.transactionCardContent}
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
            <Text style={styles.userName}>Borrower: {customerName}</Text>
          </View>

          {/* Right Side - Status & Date */}
          <View style={styles.cardRight}>
            <Text style={styles.transactionDate}>
              {transactionDate.toLocaleDateString('en-US')}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons - Confirm Borrow or Check Return */}
        {transaction.borrowTransactionType === 'borrow' && 
         (transaction.status === 'pending' || 
          transaction.status === 'waiting' || 
          transaction.status === 'pending_pickup') && (
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={async (e) => {
              e.stopPropagation();
              try {
                await borrowTransactionsApi.confirmBorrow(transaction._id);
                
                // Close scanner if open
                setShowUnifiedQRScanner(false);
                stopUnifiedScanning();
                
                // Reload transactions
                        await loadTransactions();
                
                // Find and show transaction detail
                try {
                  const detailResponse = await borrowTransactionsApi.getBusinessDetail(transaction._id);
                  if (detailResponse.statusCode === 200 && detailResponse.data) {
                    setTransactionDetail(detailResponse.data);
                    setSelectedTransaction(transaction);
                    setShowDetailsModal(true);
                  }
                } catch (error) {
                  console.error('Error loading confirmed transaction detail:', error);
                }
                
                Alert.alert(
                  'Success',
                  'Borrow transaction confirmed successfully!',
                  [{ text: 'OK' }]
                );
              } catch (error: any) {
                console.error('Error confirming borrow:', error);
                Alert.alert('Error', error.message || 'Failed to confirm borrow transaction');
              }
            }}
          >
            <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />
            <Text style={styles.cardActionButtonText}>Confirm Borrow</Text>
          </TouchableOpacity>
        )}

        {transaction.borrowTransactionType === 'borrow' && transaction.status === 'borrowing' && (
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={(e) => {
              e.stopPropagation();
              const serialNumber = transaction.productId?.serialNumber;
              if (serialNumber) {
                setReturnSerialNumber(serialNumber);
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
              } else {
                Alert.alert('Error', 'Serial number not found for this transaction');
              }
            }}
          >
            <Ionicons name="qr-code-outline" size={18} color="#0F4D3A" />
            <Text style={styles.cardActionButtonText}>Check Return</Text>
          </TouchableOpacity>
        )}
      </View>
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
          ? 'No borrow transactions'
          : type === 'return-success'
            ? 'No successful return transactions'
            : type === 'overdue'
              ? 'No overdue transactions'
              : 'No transactions found'}
      </Text>
      <Text style={styles.emptySubtitle}>Try adjusting search or filters</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F4D3A" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Borrowing History</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push('/(protected)/business/business-co2-report')}
              activeOpacity={0.7}
            >
              <Ionicons name="leaf" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={openUnifiedQRScanner}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, QR code, or name..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'borrow', label: 'Borrowing' },
          { key: 'return-success', label: 'Returned' },
          { key: 'overdue', label: 'Overdue' }
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
        <SafeAreaView style={styles.returnModalOverlay}>
          <View style={styles.returnModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {loadingTransactionDetail ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0F4D3A" />
                <Text style={styles.loadingText}>Loading transaction details...</Text>
              </View>
            ) : selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                {/* Basic Information */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{transactionDetail?._id || selectedTransaction._id}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View style={[
                    styles.typeBadge,
                    (transactionDetail?.borrowTransactionType || selectedTransaction.borrowTransactionType) === 'borrow' ? styles.borrowBadge : styles.returnBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {(transactionDetail?.borrowTransactionType || selectedTransaction.borrowTransactionType) === 'borrow' ? 'BORROW' : 'RETURN'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product</Text>
                  <Text style={styles.detailValue}>
                    {transactionDetail?.productId?.productGroupId?.name || selectedTransaction.productId?.productGroupId?.name || 'N/A'} - {transactionDetail?.productId?.productSizeId?.sizeName || selectedTransaction.productId?.productSizeId?.sizeName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Material</Text>
                  <Text style={styles.detailValue}>
                    {transactionDetail?.productId?.productGroupId?.materialId?.materialName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Serial Number</Text>
                  <Text style={styles.detailValue}>
                    {transactionDetail?.productId?.serialNumber || selectedTransaction.productId?.serialNumber || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Borrow Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(transactionDetail?.borrowDate || selectedTransaction.borrowDate).toLocaleString('en-US')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(transactionDetail?.dueDate || selectedTransaction.dueDate).toLocaleString('en-US')}
                  </Text>
                </View>
                
                {transactionDetail?.returnDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Return Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(transactionDetail.returnDate).toLocaleString('en-US')}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deposit Amount</Text>
                  <Text style={styles.detailValue}>
                    {(transactionDetail?.depositAmount || selectedTransaction.depositAmount)?.toLocaleString('en-US')} VND
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {transactionDetail?.status || selectedTransaction.status}
                  </Text>
                </View>

                {/* Customer Information */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer Name</Text>
                  <Text style={styles.detailValue}>
                    {transactionDetail?.customerId?.fullName || (typeof selectedTransaction.customerId === 'object' ? selectedTransaction.customerId.fullName : 'N/A')}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>
                    {transactionDetail?.customerId?.phone || (typeof selectedTransaction.customerId === 'object' ? selectedTransaction.customerId.phone || 'N/A' : 'N/A')}
                  </Text>
                </View>

                {/* Condition Information */}
                {transactionDetail && (
                  <>
                    {transactionDetail.totalConditionPoints !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Condition Points</Text>
                        <Text style={styles.detailValue}>{transactionDetail.totalConditionPoints}</Text>
                      </View>
                    )}

                    {/* Previous Condition Images */}
                    {transactionDetail.previousConditionImages && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Previous Condition Images</Text>
                        </View>
                        <View style={styles.imageGrid}>
                          {transactionDetail.previousConditionImages.frontImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Front</Text>
                              <Image source={{ uri: transactionDetail.previousConditionImages.frontImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.previousConditionImages.backImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Back</Text>
                              <Image source={{ uri: transactionDetail.previousConditionImages.backImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.previousConditionImages.leftImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Left</Text>
                              <Image source={{ uri: transactionDetail.previousConditionImages.leftImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.previousConditionImages.rightImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Right</Text>
                              <Image source={{ uri: transactionDetail.previousConditionImages.rightImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.previousConditionImages.topImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Top</Text>
                              <Image source={{ uri: transactionDetail.previousConditionImages.topImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.previousConditionImages.bottomImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Bottom</Text>
                              <Image source={{ uri: transactionDetail.previousConditionImages.bottomImage }} style={styles.conditionImage} />
                            </View>
                          )}
                        </View>
                      </>
                    )}

                    {/* Current Condition Images */}
                    {transactionDetail.currentConditionImages && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Current Condition Images</Text>
                        </View>
                        <View style={styles.imageGrid}>
                          {transactionDetail.currentConditionImages.frontImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Front</Text>
                              <Image source={{ uri: transactionDetail.currentConditionImages.frontImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.currentConditionImages.backImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Back</Text>
                              <Image source={{ uri: transactionDetail.currentConditionImages.backImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.currentConditionImages.leftImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Left</Text>
                              <Image source={{ uri: transactionDetail.currentConditionImages.leftImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.currentConditionImages.rightImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Right</Text>
                              <Image source={{ uri: transactionDetail.currentConditionImages.rightImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.currentConditionImages.topImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Top</Text>
                              <Image source={{ uri: transactionDetail.currentConditionImages.topImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {transactionDetail.currentConditionImages.bottomImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Bottom</Text>
                              <Image source={{ uri: transactionDetail.currentConditionImages.bottomImage }} style={styles.conditionImage} />
                            </View>
                          )}
                        </View>
                      </>
                    )}

                    {/* Previous Damage Faces */}
                    {transactionDetail.previousDamageFaces && transactionDetail.previousDamageFaces.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Previous Damage Assessment</Text>
                        </View>
                        {transactionDetail.previousDamageFaces.map((face: any, index: number) => (
                          <View key={index} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{face.face.charAt(0).toUpperCase() + face.face.slice(1)}</Text>
                            <Text style={styles.detailValue}>{face.issue}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Current Damage Faces */}
                    {transactionDetail.currentDamageFaces && transactionDetail.currentDamageFaces.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Current Damage Assessment</Text>
                        </View>
                        {transactionDetail.currentDamageFaces.map((face: any, index: number) => (
                          <View key={index} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{face.face.charAt(0).toUpperCase() + face.face.slice(1)}</Text>
                            <Text style={styles.detailValue}>{face.issue}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Single Use Product Usages */}
                    {selectedTransaction.borrowTransactionType === 'borrow' && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Single-Use Products Used</Text>
                          {selectedTransaction.status === 'borrowing' && (
                            <TouchableOpacity
                              style={styles.addUsageButton}
                              onPress={async () => {
                                console.log('📦 [SINGLE-USE] Add button pressed');
                                
                                // Close transaction detail modal first
                                setShowDetailsModal(false);
                                
                                // Small delay to ensure modal closes before opening new one
                                await new Promise(resolve => setTimeout(resolve, 300));
                                
                                // Open add usage modal immediately (don't wait for products to load)
                                setShowAddUsageModal(true);
                                console.log('📦 [SINGLE-USE] Modal opened, showAddUsageModal:', true);
                                
                                // Load available products in background (non-blocking)
                                loadAvailableSingleUseProducts().catch((error) => {
                                  console.error('📦 [SINGLE-USE] Error loading products:', error);
                                  // Don't show alert here, just log - user can still see the modal
                                });
                              }}
                            >
                              <Ionicons name="add-circle" size={20} color="#059669" />
                              <Text style={styles.addUsageButtonText}>Add</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        {loadingUsages ? (
                          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 16 }} />
                        ) : singleUseProductUsages.length === 0 ? (
                          <Text style={styles.emptyText}>No single-use products used yet</Text>
                        ) : (
                          singleUseProductUsages.map((usage) => {
                            // Enhanced product data extraction - handle multiple response structures
                            let product: any = null;
                            let productName = 'N/A';
                            let sizeName = 'N/A';
                            
                            // Log usage structure for debugging
                            console.log('📦 [SINGLE-USE] Rendering usage:', JSON.stringify(usage, null, 2));
                            
                            // Try multiple ways to get product data
                            // Case 1: Check if usage has a 'product' field (web app structure)
                            if ((usage as any).product && typeof (usage as any).product === 'object') {
                              product = (usage as any).product;
                              console.log('📦 [SINGLE-USE] Found product in usage.product');
                            }
                            // Case 2: Check if singleUseProductId is populated (object)
                            else if (usage.singleUseProductId && typeof usage.singleUseProductId === 'object' && usage.singleUseProductId !== null) {
                              product = usage.singleUseProductId;
                              console.log('📦 [SINGLE-USE] Found product in usage.singleUseProductId (populated)');
                            }
                            // Case 3: singleUseProductId is string ID, find in available products
                            else if (typeof usage.singleUseProductId === 'string') {
                              product = availableSingleUseProducts.find(p => p._id === usage.singleUseProductId);
                              if (product) {
                                console.log('📦 [SINGLE-USE] Found product in availableSingleUseProducts');
                              } else {
                                console.warn('📦 [SINGLE-USE] Product not found in available list:', usage.singleUseProductId);
                              }
                            }
                            
                            // Extract product name and size
                            if (product) {
                              // Product name - try multiple fields
                              productName = product.name || product.productName || product.typeName || 'N/A';
                              
                              // Size name - prioritize direct 'size' field (from logs, response has product.size)
                              if (product.size) {
                                sizeName = product.size;
                              } else if (product.productSizeId) {
                                if (typeof product.productSizeId === 'object' && product.productSizeId !== null) {
                                  sizeName = product.productSizeId.sizeName || (product.productSizeId as any).name || 'N/A';
                                } else if (typeof product.productSizeId === 'string') {
                                  // Size ID is string, try to find in available products
                                  const foundProduct = availableSingleUseProducts.find(p => p._id === product._id || p._id === product.id);
                                  if (foundProduct?.productSizeId && typeof foundProduct.productSizeId === 'object') {
                                    sizeName = foundProduct.productSizeId.sizeName || (foundProduct.productSizeId as any).name || 'N/A';
                                  }
                                }
                              }
                              
                              console.log('📦 [SINGLE-USE] Extracted:', { productName, sizeName, hasImage: !!product.imageUrl });
                            } else {
                              console.warn('📦 [SINGLE-USE] No product data found for usage:', usage._id);
                            }
                            
                            // Get product image
                            const productImage = product?.imageUrl || product?.image || null;
                            
                            return (
                              <View key={usage._id} style={styles.usageCard}>
                                {productImage && (
                                  <Image 
                                    source={{ uri: productImage }} 
                                    style={styles.usageProductImage}
                                    resizeMode="cover"
                                  />
                                )}
                                <View style={styles.usageCardContent}>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Product:</Text>
                                    <Text style={styles.detailValue}>{productName}</Text>
                                  </View>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Size:</Text>
                                    <Text style={styles.detailValue}>{sizeName}</Text>
                                  </View>
                                  {usage.note && (
                                    <View style={styles.detailRow}>
                                      <Text style={styles.detailLabel}>Note:</Text>
                                      <Text style={styles.detailValue}>{usage.note}</Text>
                                    </View>
                                  )}
                                  {usage.createdAt && (
                                    <View style={styles.detailRow}>
                                      <Text style={styles.detailLabel}>Time:</Text>
                                      <Text style={styles.detailValue}>
                                        {new Date(usage.createdAt).toLocaleString('vi-VN')}
                                      </Text>
                                    </View>
                                  )}
                                  {(usage as any).blockchainTxHash && (
                                    <TouchableOpacity 
                                      style={styles.txHashRow}
                                      onPress={() => handleCopyTxHash((usage as any).blockchainTxHash)}
                                      activeOpacity={0.7}
                                    >
                                      <Ionicons name="link" size={14} color="#6B7280" />
                                      <Text style={styles.txHashText} numberOfLines={1}>
                                        {(usage as any).blockchainTxHash}
                                      </Text>
                                      <Ionicons name="copy-outline" size={14} color="#6B7280" style={styles.copyIcon} />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            );
                          })
                        )}
                      </>
                    )}

                    {/* Points and Changes */}
                    {(transactionDetail.co2Changed !== undefined || transactionDetail.ecoPointChanged !== undefined || 
                      transactionDetail.rankingPointChanged !== undefined || transactionDetail.rewardPointChanged !== undefined) && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Points & Changes</Text>
                        </View>
                        {transactionDetail.co2Changed !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>CO2 Changed</Text>
                            <Text style={[styles.detailValue, transactionDetail.co2Changed < 0 && { color: '#ef4444' }, transactionDetail.co2Changed > 0 && { color: '#16a34a' }]}>
                              {transactionDetail.co2Changed > 0 ? '+' : ''}{transactionDetail.co2Changed}
                            </Text>
                          </View>
                        )}
                        {transactionDetail.ecoPointChanged !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Eco Point Changed</Text>
                            <Text style={[styles.detailValue, transactionDetail.ecoPointChanged < 0 && { color: '#ef4444' }, transactionDetail.ecoPointChanged > 0 && { color: '#16a34a' }]}>
                              {transactionDetail.ecoPointChanged > 0 ? '+' : ''}{transactionDetail.ecoPointChanged}
                            </Text>
                          </View>
                        )}
                        {transactionDetail.rankingPointChanged !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Ranking Point Changed</Text>
                            <Text style={[styles.detailValue, transactionDetail.rankingPointChanged < 0 && { color: '#ef4444' }, transactionDetail.rankingPointChanged > 0 && { color: '#16a34a' }]}>
                              {transactionDetail.rankingPointChanged > 0 ? '+' : ''}{transactionDetail.rankingPointChanged}
                            </Text>
                          </View>
                        )}
                        {transactionDetail.rewardPointChanged !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reward Point Changed</Text>
                            <Text style={[styles.detailValue, transactionDetail.rewardPointChanged < 0 && { color: '#ef4444' }, transactionDetail.rewardPointChanged > 0 && { color: '#16a34a' }]}>
                              {transactionDetail.rewardPointChanged > 0 ? '+' : ''}{transactionDetail.rewardPointChanged}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Wallet Transactions */}
                    {transactionDetail.walletTransactions && transactionDetail.walletTransactions.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Wallet Transactions</Text>
                        </View>
                        {transactionDetail.walletTransactions.map((walletTx: any, index: number) => (
                          <View key={index} style={styles.walletTransactionCard}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Type</Text>
                              <Text style={styles.detailValue}>{walletTx.transactionType}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Amount</Text>
                              <Text style={[styles.detailValue, walletTx.direction === 'in' ? { color: '#16a34a' } : { color: '#ef4444' }]}>
                                {walletTx.direction === 'in' ? '+' : '-'}{walletTx.amount.toLocaleString('en-US')} VND
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Description</Text>
                              <Text style={styles.detailValue}>{walletTx.description}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Status</Text>
                              <Text style={styles.detailValue}>{walletTx.status}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Date</Text>
                              <Text style={styles.detailValue}>
                                {new Date(walletTx.createdAt).toLocaleString('en-US')}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </>
                )}

                {/* Confirm Borrow Button - Show for borrow transactions with pending status */}
                {selectedTransaction.borrowTransactionType === 'borrow' && 
                 (selectedTransaction.status === 'pending' || 
                  selectedTransaction.status === 'waiting' || 
                  selectedTransaction.status === 'pending_pickup') && (
                  <TouchableOpacity
                    style={[styles.processReturnButton, { backgroundColor: '#3B82F6' }]}
                    onPress={async () => {
                      try {
                        await borrowTransactionsApi.confirmBorrow(selectedTransaction._id);
                        
                        // Close scanner if open
                        setShowUnifiedQRScanner(false);
                        stopUnifiedScanning();
                        
                        // Reload transactions
                                await loadTransactions();
                        
                        // Reload transaction detail
                        try {
                          const detailResponse = await borrowTransactionsApi.getBusinessDetail(selectedTransaction._id);
                          if (detailResponse.statusCode === 200 && detailResponse.data) {
                            setTransactionDetail(detailResponse.data);
                            // Keep modal open to show updated detail
                          }
                        } catch (error) {
                          console.error('Error reloading transaction detail:', error);
                        }
                        
                        Alert.alert(
                          'Success',
                          'Borrow transaction confirmed successfully!',
                          [{ text: 'OK' }]
                        );
                      } catch (error: any) {
                        console.error('Error confirming borrow:', error);
                        Alert.alert('Error', error.message || 'Failed to confirm borrow transaction');
                      }
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.processReturnButtonText}>Confirm Borrow</Text>
                  </TouchableOpacity>
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

                {/* Feedback Section */}
                {(transactionDetail?.status === 'returned' || transactionDetail?.status === 'completed' || 
                  selectedTransaction?.status === 'returned' || selectedTransaction?.status === 'completed') && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Customer Feedback</Text>
                    </View>
                    {loadingFeedback ? (
                      <View style={styles.feedbackLoading}>
                        <ActivityIndicator size="small" color="#0F4D3A" />
                        <Text style={styles.feedbackLoadingText}>Loading feedback...</Text>
                      </View>
                    ) : transactionFeedback ? (
                      <View style={styles.feedbackCard}>
                        <View style={styles.feedbackHeader}>
                          <View style={styles.feedbackRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= transactionFeedback.rating ? 'star' : 'star-outline'}
                                size={20}
                                color="#FCD34D"
                              />
                            ))}
                            <Text style={styles.feedbackRatingText}>
                              {transactionFeedback.rating}/5
                            </Text>
                          </View>
                          <Text style={styles.feedbackDate}>
                            {new Date(transactionFeedback.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                        {transactionFeedback.comment && (
                          <Text style={styles.feedbackComment}>{transactionFeedback.comment}</Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.feedbackEmpty}>
                        <Ionicons name="star-outline" size={32} color="#9CA3AF" />
                        <Text style={styles.feedbackEmptyText}>No feedback yet</Text>
                        <Text style={styles.feedbackEmptySubtext}>
                          Customer hasn't left feedback for this transaction
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Single Use Product Usage Modal */}
      <Modal
        visible={showAddUsageModal}
        transparent={true}
        animationType="slide"
        presentationStyle="overFullScreen"
        onShow={() => {
          console.log('📦 [SINGLE-USE] Modal onShow triggered, showAddUsageModal:', showAddUsageModal);
        }}
        onRequestClose={() => {
          console.log('📦 [SINGLE-USE] Modal onRequestClose triggered');
          setShowAddUsageModal(false);
          setSelectedUsageProduct(null);
          setUsageNote('');
          // Reopen transaction detail modal if it was open
          if (selectedTransaction?._id) {
            setTimeout(() => {
              setShowDetailsModal(true);
            }, 300);
          }
        }}
      >
        <SafeAreaView style={styles.returnModalOverlay}>
          <View style={styles.returnModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Single-Use Product</Text>
              <TouchableOpacity onPress={() => {
                setShowAddUsageModal(false);
                setSelectedUsageProduct(null);
                setUsageNote('');
                // Reopen transaction detail modal if it was open
                if (selectedTransaction?._id) {
                  setTimeout(() => {
                    setShowDetailsModal(true);
                  }, 300);
                }
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select single-use product *</Text>
                {loadingSingleUseProducts ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 16 }} />
                ) : (
                  <ScrollView style={{ maxHeight: 300 }}>
                    {availableSingleUseProducts.map((product) => {
                      // Extract size name - handle multiple structures
                      // Check for direct 'size' field first (from API response)
                      let sizeName = (product as any).size || 'N/A';
                      
                      // If no direct size field, check productSizeId
                      if (sizeName === 'N/A' && product.productSizeId) {
                        if (typeof product.productSizeId === 'object' && product.productSizeId !== null) {
                          sizeName = product.productSizeId.sizeName || (product.productSizeId as any).name || 'N/A';
                        } else if (typeof product.productSizeId === 'string') {
                          // If it's just an ID, we can't get the name without additional API call
                          // For now, show N/A
                          sizeName = 'N/A';
                        }
                      }
                      
                      const isSelected = selectedUsageProduct?._id === product._id;
                      return (
                        <TouchableOpacity
                          key={product._id}
                          style={[
                            styles.productOption,
                            isSelected && styles.productOptionSelected
                          ]}
                          onPress={() => setSelectedUsageProduct(product)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productOptionName}>{product.name}</Text>
                            <Text style={styles.productOptionSize}>Size: {sizeName}</Text>
                            {product.weight && (
                              <Text style={styles.productOptionWeight}>Weight: {product.weight}g</Text>
                            )}
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={24} color="#059669" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Enter note..."
                  value={usageNote}
                  onChangeText={setUsageNote}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={[styles.processReturnButton, !selectedUsageProduct && { opacity: 0.5 }]}
                onPress={handleAddUsage}
                disabled={!selectedUsageProduct || submittingUsage}
              >
                {submittingUsage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.processReturnButtonText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <SafeAreaView style={styles.returnModalOverlay}>
          <View style={styles.returnModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Borrowing Details</Text>
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
                        Due: {new Date(transaction.dueDate).toLocaleDateString('en-US')}
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
        </SafeAreaView>
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
        <SafeAreaView style={styles.returnModalOverlay}>
          <View style={styles.returnModalContent}>
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
                              quality: 0.5, // Reduced from 0.8 to 0.5 for smaller file size (50% smaller)
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
                    const checkResponse = await borrowTransactionsApi.checkReturn(returnSerialNumber, checkData);
                    
                    // Lưu response từ checkReturn để dùng cho confirmReturn
                    // checkResponse đã là response.data rồi (từ service trả về response.data)
                    console.log('✅ Check Return Response (Full):', JSON.stringify(checkResponse, null, 2));
                    console.log('✅ Check Return Response - Type:', typeof checkResponse);
                    console.log('✅ Check Return Response - Keys:', checkResponse ? Object.keys(checkResponse) : 'null/undefined');
                    console.log('✅ Check Return Response - tempImages:', checkResponse?.tempImages);
                    console.log('✅ Check Return Response - totalDamagePoints:', checkResponse?.totalDamagePoints);
                    console.log('✅ Check Return Response - finalCondition:', checkResponse?.finalCondition);
                    console.log('✅ Check Return Response - damageFaces:', checkResponse?.damageFaces);
                    console.log('✅ Check Return Response - note:', checkResponse?.note);
                    
                    setCheckReturnResponse(checkResponse);

                    // After check success, show confirm modal
                    setShowReturnModal(false);
                    setShowConfirmModal(true);
                  } catch (error: any) {
                    // Silently handle specific errors
                    if (error?.message === 'MATERIAL_NOT_FOUND' || 
                        error?.message?.toLowerCase().includes('material not found')) {
                      // Silently handle - don't show alert
                      return;
                    }
                    
                    // Handle timeout and network errors - show weak network message
                    if (error?.message?.toLowerCase().includes('timeout') ||
                        error?.message?.toLowerCase().includes('network error') ||
                        error?.code === 'ECONNABORTED' ||
                        error?.code === 'NETWORK_ERROR' ||
                        error?.response === undefined) {
                      Alert.alert('Mạng yếu', 'Kết nối mạng không ổn định, vui lòng thử lại.');
                      return;
                    }
                    
                    // Show alert for other errors
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
        </SafeAreaView>
      </Modal>

      {/* Confirm Return Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <SafeAreaView style={styles.returnModalOverlay}>
          <View style={styles.returnModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Return</Text>
              <TouchableOpacity onPress={() => {
                setShowConfirmModal(false);
                setReturnNote('');
                setReturnSingleUseProduct(null);
                setReturnSingleUseNote('');
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

              {(() => {
                // Lấy dữ liệu từ checkReturn response
                // Response có thể có cấu trúc { preview: { ... } } hoặc trực tiếp { ... }
                const responseData = checkReturnResponse;
                const previewData = responseData?.preview || responseData;
                const serverDamagePoints = previewData?.totalDamagePoints !== undefined 
                                         ? previewData.totalDamagePoints 
                                         : (responseData?.totalDamagePoints !== undefined 
                                             ? responseData.totalDamagePoints 
                                             : calculatedPoints);
                const serverCondition = previewData?.finalCondition || responseData?.finalCondition || calculatedCondition;
                
                return (
                  <View style={styles.calculationResult}>
                    <Text style={styles.calculationLabel}>
                      Total Damage Points: {serverDamagePoints}
                    </Text>
                    <View style={[
                      styles.conditionBadge,
                      serverCondition === 'damaged' ? styles.conditionBadgeDamaged : styles.conditionBadgeGood
                    ]}>
                      <Text style={[
                        styles.conditionBadgeText,
                        serverCondition === 'damaged' ? styles.conditionBadgeTextDamaged : styles.conditionBadgeTextGood
                      ]}>
                        Final Condition: {serverCondition.toUpperCase()}
                      </Text>
                    </View>
                    {responseData && (
                      <Text style={styles.serverCalculatedNote}>
                        * Calculated by server from check return
                      </Text>
                    )}
                  </View>
                );
              })()}

              {/* Images Preview */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Uploaded Images</Text>
                <View style={styles.imagesContainer}>
                  {(() => {
                    // Lấy hình ảnh từ checkReturnResponse (ưu tiên các link Cloudinary từ API check)
                    // Response có thể có cấu trúc { preview: { tempImages: {...} } } hoặc trực tiếp { tempImages: {...} }
                    const responseData = checkReturnResponse;
                    const previewData = responseData?.preview || responseData;
                    // Ưu tiên lấy từ preview.tempImages (các link Cloudinary đã được lưu)
                    const tempImages = previewData?.tempImages || responseData?.tempImages || {};
                    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
                    
                    return faces.map((face) => {
                      // Ưu tiên lấy từ tempImages (URLs Cloudinary từ server), nếu không có thì lấy từ checkData (local)
                      const imageUrl = tempImages[`${face}Image`] || 
                                      tempImages[`${face}image`] || 
                                      checkData[`${face}Image` as keyof typeof checkData];
                      
                      if (!imageUrl) return null;
                      
                      return (
                        <View key={face} style={styles.confirmImageContainer}>
                          <Text style={styles.confirmImageLabel}>{face.toUpperCase()}</Text>
                          <Image 
                            source={{ uri: imageUrl as string }} 
                            style={styles.confirmImagePreview} 
                            resizeMode="cover"
                          />
                        </View>
                      );
                    }).filter(Boolean);
                  })()}
                </View>
                {(() => {
                  // Lấy tempImages từ checkReturnResponse (các link Cloudinary)
                  const responseData = checkReturnResponse;
                  const previewData = responseData?.preview || responseData;
                  const tempImages = previewData?.tempImages || responseData?.tempImages || {};
                  const hasImages = Object.keys(tempImages).length > 0 || 
                                   ['front', 'back', 'left', 'right', 'top', 'bottom'].some(face => 
                                     checkData[`${face}Image` as keyof typeof checkData]
                                   );
                  if (!hasImages) {
                    return (
                      <Text style={styles.noImagesText}>No images uploaded</Text>
                    );
                  }
                  return null;
                })()}
              </View>

              {/* Single Use Product Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Single-use product used (Optional)</Text>
                {loadingSingleUseProducts ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 8 }} />
                ) : (
                  <ScrollView style={{ maxHeight: 200 }}>
                    {availableSingleUseProducts.map((product) => {
                      const sizeName = (product.productSizeId as any)?.name || 'N/A';
                      const isSelected = returnSingleUseProduct?._id === product._id;
                      return (
                        <TouchableOpacity
                          key={product._id}
                          style={[
                            styles.productOption,
                            isSelected && styles.productOptionSelected
                          ]}
                          onPress={() => setReturnSingleUseProduct(isSelected ? null : product)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productOptionName}>{product.name}</Text>
                            <Text style={styles.productOptionSize}>Size: {sizeName}</Text>
                            {product.weight && (
                              <Text style={styles.productOptionWeight}>Trọng lượng: {product.weight}g</Text>
                            )}
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={24} color="#059669" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
                {returnSingleUseProduct && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Note for single-use product (Optional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={returnSingleUseNote}
                      onChangeText={setReturnSingleUseNote}
                      placeholder="Enter note..."
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                    />
                  </View>
                )}
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
                  if (!returnSerialNumber.trim()) {
                    Alert.alert('Error', 'Serial number is required');
                    return;
                  }

                  // Validate note - must be filled in
                  if (!returnNote || !returnNote.trim()) {
                    Alert.alert('Validation Error', 'You must fill in the note');
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

                    // Lấy dữ liệu từ checkReturn response
                    // Response structure có thể là:
                    // 1. { success: 200, message: "...", preview: { tempImages: {...}, totalDamagePoints: 1, finalCondition: "good" } }
                    // 2. { tempImages: {...}, totalDamagePoints: 0, finalCondition: "good", damageFaces: [...], note: "..." }
                    let tempImages = {};
                    let totalDamagePoints = calculatedPoints;
                    let finalCondition = calculatedCondition;
                    
                    if (checkReturnResponse) {
                      // checkReturnResponse đã là response.data rồi (từ service trả về response.data)
                      const responseData = checkReturnResponse;
                      
                      // Kiểm tra cả 2 cấu trúc: preview.tempImages hoặc tempImages trực tiếp
                      // Ưu tiên lấy từ preview (cấu trúc mới)
                      const previewData = responseData?.preview || responseData;
                      
                      // Lấy tempImages (object chứa URLs của các hình đã upload từ Cloudinary)
                      // Đây là các link đã được lưu trên Cloudinary từ API check
                      tempImages = previewData?.tempImages || responseData?.tempImages || {};
                      
                      // Lấy totalDamagePoints và finalCondition từ server (đã tính toán)
                      totalDamagePoints = previewData?.totalDamagePoints !== undefined 
                                        ? previewData.totalDamagePoints 
                                        : (responseData?.totalDamagePoints !== undefined 
                                            ? responseData.totalDamagePoints 
                                            : calculatedPoints);
                      finalCondition = previewData?.finalCondition || responseData?.finalCondition || calculatedCondition;
                      
                      console.log('📦 Extracted from checkResponse:', {
                        tempImages,
                        totalDamagePoints,
                        finalCondition,
                        hasPreview: !!responseData?.preview,
                        responseDataKeys: responseData ? Object.keys(responseData) : [],
                        previewKeys: previewData ? Object.keys(previewData) : [],
                      });
                      
                      // Đảm bảo tempImages chứa các link từ Cloudinary (không phải local file paths)
                      if (Object.keys(tempImages).length > 0) {
                        console.log('✅ Using Cloudinary URLs from checkReturn response:', tempImages);
                      } else {
                        console.warn('⚠️ No tempImages found in checkReturn response');
                      }
                    }
                    
                    // Ensure note is always a string (not undefined) as required by backend
                    const noteValue = returnNote?.trim() || '';
                    
                    console.log('📤 Confirm Return - Final data to send:', {
                      note: noteValue,
                      damageFaces,
                      tempImages,
                      totalDamagePoints,
                      finalCondition,
                    });

                    console.log('📤 Confirm Return - Sending data:', {
                      note: noteValue,
                      damageFaces,
                      tempImages,
                      totalDamagePoints,
                      finalCondition,
                    });

                    const confirmResponse = await borrowTransactionsApi.confirmReturn(returnSerialNumber, {
                      note: noteValue,
                      damageFaces,
                      tempImages,
                      totalDamagePoints,
                      finalCondition,
                    });

                    // If single-use product is selected, add usage to borrow transaction
                    if (returnSingleUseProduct) {
                      try {
                        // Find borrow transaction from serial number
                        const allTransactions = await borrowTransactionsApi.getBusinessHistory({
                          page: 1,
                          limit: 1000,
                        });
                        const transactionsList = allTransactions.data?.items || (Array.isArray(allTransactions.data) ? allTransactions.data : []);
                        
                        // Find the borrow transaction with this serial number that is still borrowing
                        const borrowTransaction = transactionsList.find((t: BusinessTransaction) => 
                          t.productId?.serialNumber === returnSerialNumber &&
                          t.borrowTransactionType === 'borrow' &&
                          (t.status === 'borrowing' || t.status === 'completed')
                        );
                        
                        if (borrowTransaction) {
                          // Add single-use product usage
                          await singleUseProductUsageApi.create(borrowTransaction._id, {
                            singleUseProductId: returnSingleUseProduct._id,
                            note: returnSingleUseNote.trim() || undefined,
                          });
                          console.log('✅ Single-use product usage added successfully');
                        } else {
                          console.warn('⚠️ Could not find borrow transaction for serial number:', returnSerialNumber);
                        }
                      } catch (error: any) {
                        console.error('❌ Error adding single-use product usage:', error);
                        // Don't show error to user - return is already successful
                      }
                    }

                    // ✅ OPTIMIZED: Show success immediately after confirmReturn succeeds
                    Alert.alert(
                      'Success', 
                      'Return confirmed successfully!',
                      [{ text: 'OK' }]
                    );

                    // Close all modals and scanner
                    setShowConfirmModal(false);
                    setShowReturnModal(false);
                    setShowUnifiedQRScanner(false);
                    stopUnifiedScanning();
                    
                    // Reset form
                    const savedSerialNumber = returnSerialNumber;
                    setReturnSerialNumber('');
                    setReturnNote('');
                    setReturnSingleUseProduct(null);
                    setReturnSingleUseNote('');
                    setCheckReturnResponse(null);
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

                    // ✅ OPTIMIZED: Reload data in background (non-blocking) để không làm chậm UI
                    // User đã thấy success message rồi, reload data sau cũng được
                    Promise.all([
                      loadTransactions(),
                      loadBusinessData(),
                    ]).then(() => {
                      console.log('✅ Data reloaded in background');
                    }).catch((error) => {
                      console.error('Error reloading data in background:', error);
                    });

                    // ✅ OPTIMIZED: Load transaction detail in background (optional, không bắt buộc)
                    // Chỉ load nếu user cần xem detail, không block UI
                    setTimeout(async () => {
                      try {
                        const updatedTransactions = await borrowTransactionsApi.getBusinessHistory({
                          page: 1,
                          limit: 1000,
                        });
                        const allTransactions = updatedTransactions.data?.items || (Array.isArray(updatedTransactions.data) ? updatedTransactions.data : []);
                        
                        const returnTransactions = allTransactions.filter((t: BusinessTransaction) => 
                          t.productId?.serialNumber === savedSerialNumber &&
                          t.borrowTransactionType === 'return'
                        );
                        
                        const returnedTransaction = returnTransactions.length > 0
                          ? returnTransactions.sort((a: BusinessTransaction, b: BusinessTransaction) => {
                              const dateA = new Date(a.borrowDate || a.createdAt || 0).getTime();
                              const dateB = new Date(b.borrowDate || b.createdAt || 0).getTime();
                              return dateB - dateA;
                            })[0]
                          : null;

                        if (returnedTransaction) {
                          const detailResponse = await borrowTransactionsApi.getBusinessDetail(returnedTransaction._id);
                          if (detailResponse.statusCode === 200 && detailResponse.data) {
                            setTransactionDetail(detailResponse.data);
                            setSelectedTransaction(returnedTransaction);
                            // Không tự động mở detail modal, user có thể mở sau nếu cần
                            // setShowDetailsModal(true);
                          }
                        }
                      } catch (error) {
                        console.error('Error loading returned transaction detail in background:', error);
                      }
                    }, 1000); // Delay 1s để không ảnh hưởng đến UX
                  } catch (error: any) {
                    console.error('Error confirming return:', error);
                    
                    // Check if error is about note requirement
                    const errorMessage = error?.message || '';
                    const responseMessage = error?.response?.data?.message || '';
                    const isNoteError = 
                      errorMessage.toLowerCase().includes('note must be a string') ||
                      errorMessage.toLowerCase().includes('note must be') ||
                      responseMessage.toLowerCase().includes('note must be a string') ||
                      responseMessage.toLowerCase().includes('note must be') ||
                      (error?.response?.status === 400 && (
                        errorMessage.toLowerCase().includes('note') ||
                        responseMessage.toLowerCase().includes('note')
                      ));
                    
                    if (isNoteError) {
                      Alert.alert('Validation Error', 'You must fill in the note');
                    } else {
                      // Don't show error message on UI, only log to console
                      // Alert.alert('Error', error.message || 'Failed to confirm return');
                      console.log('Error details:', {
                        message: errorMessage,
                        responseMessage: responseMessage,
                        status: error?.response?.status
                      });
                    }
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
        </SafeAreaView>
      </Modal>

      {/* QR Scanner Modal for Borrow Confirmation */}
      {showBorrowQRScanner && hasBorrowCameraPermission && (
        <Modal
          visible={showBorrowQRScanner}
          animationType="fade"
          transparent={true}
          onRequestClose={stopBorrowScanning}
        >
          <View style={styles.qrScannerContainer}>
            <StatusBar hidden />
            <CameraView 
              style={StyleSheet.absoluteFillObject} 
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
              onBarcodeScanned={onBorrowBarcodeScanned}
              enableTorch={borrowFlashEnabled}
            />
            
            <View style={styles.overlayMask}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayBottom} />
              <View style={styles.overlayLeft} />
              <View style={styles.overlayRight} />
            </View>

            <View style={styles.brandingContainer}>
              <Text style={styles.brandingText}>Powered by Back2Use</Text>
            </View>

            <TouchableOpacity 
              style={styles.closeButtonTop} 
              onPress={stopBorrowScanning}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.scanningFrameContainer}>
              <View style={styles.scanningFrame}>
                <View style={[styles.cornerBracket, styles.topLeftCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                <View style={[styles.cornerBracket, styles.topRightCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                <View style={[styles.cornerBracket, styles.bottomLeftCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                <View style={[styles.cornerBracket, styles.bottomRightCorner]}>
                  <View style={styles.cornerBracketHorizontal} />
                  <View style={styles.cornerBracketVertical} />
                </View>
                
                <View 
                  style={[
                    styles.laserLine,
                    { top: borrowLaserLinePosition }
                  ]}
                />
              </View>
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Align the QR code within the frame to scan
              </Text>
            </View>

            <View style={styles.floatingControls}>
              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => {
                  Alert.alert('My QR', 'Feature coming soon');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.floatingButton, styles.flashButton]}
                onPress={() => setBorrowFlashEnabled(!borrowFlashEnabled)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={borrowFlashEnabled ? "flash" : "flash-outline"} 
                  size={28} 
                  color={borrowFlashEnabled ? "#FCD34D" : "#FFFFFF"} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => {
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

      {/* Borrow Confirmation Modal - Full Transaction Detail */}
      <Modal
        visible={showBorrowConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowBorrowConfirmModal(false);
          setScannedBorrowTransaction(null);
          setScannedBorrowTransactionDetail(null);
        }}
      >
        <SafeAreaView style={styles.returnModalOverlay}>
          <View style={[styles.returnModalContent, { flexDirection: 'column' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Borrow Transaction Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBorrowConfirmModal(false);
                  setScannedBorrowTransaction(null);
                  setScannedBorrowTransactionDetail(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {loadingScannedBorrowDetail ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0F4D3A" />
                <Text style={styles.loadingText}>Loading borrow transaction details...</Text>
              </View>
            ) : scannedBorrowTransaction ? (
                <ScrollView 
                  style={styles.modalBody} 
                  contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                  showsVerticalScrollIndicator={true}
                >
                {/* Basic Information */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{scannedBorrowTransactionDetail?._id || scannedBorrowTransaction._id}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View style={[
                    styles.typeBadge,
                    (scannedBorrowTransactionDetail?.borrowTransactionType || scannedBorrowTransaction.borrowTransactionType) === 'borrow' ? styles.borrowBadge : styles.returnBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {(scannedBorrowTransactionDetail?.borrowTransactionType || scannedBorrowTransaction.borrowTransactionType) === 'borrow' ? 'BORROW' : 'RETURN'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product</Text>
                  <Text style={styles.detailValue}>
                    {scannedBorrowTransactionDetail?.productId?.productGroupId?.name || scannedBorrowTransaction.productId?.productGroupId?.name || 'N/A'} - {scannedBorrowTransactionDetail?.productId?.productSizeId?.sizeName || scannedBorrowTransaction.productId?.productSizeId?.sizeName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Material</Text>
                  <Text style={styles.detailValue}>
                    {scannedBorrowTransactionDetail?.productId?.productGroupId?.materialId?.materialName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Serial Number</Text>
                  <Text style={styles.detailValue}>
                    {scannedBorrowTransactionDetail?.productId?.serialNumber || scannedBorrowTransaction.productId?.serialNumber || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Borrow Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(scannedBorrowTransactionDetail?.borrowDate || scannedBorrowTransaction.borrowDate).toLocaleString('en-US')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(scannedBorrowTransactionDetail?.dueDate || scannedBorrowTransaction.dueDate).toLocaleString('en-US')}
                  </Text>
                </View>
                
                {scannedBorrowTransactionDetail?.returnDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Return Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(scannedBorrowTransactionDetail.returnDate).toLocaleString('en-US')}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deposit Amount</Text>
                  <Text style={styles.detailValue}>
                    {(scannedBorrowTransactionDetail?.depositAmount || scannedBorrowTransaction.depositAmount)?.toLocaleString('en-US')} VND
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {scannedBorrowTransactionDetail?.status || scannedBorrowTransaction.status}
                  </Text>
                </View>

                {/* Customer Information */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer Name</Text>
                  <Text style={styles.detailValue}>
                    {scannedBorrowTransactionDetail?.customerId?.fullName || (typeof scannedBorrowTransaction.customerId === 'object' ? scannedBorrowTransaction.customerId.fullName : 'N/A')}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>
                    {scannedBorrowTransactionDetail?.customerId?.phone || (typeof scannedBorrowTransaction.customerId === 'object' ? scannedBorrowTransaction.customerId.phone || 'N/A' : 'N/A')}
                  </Text>
                </View>

                {/* Condition Information */}
                {scannedBorrowTransactionDetail && (
                  <>
                    {scannedBorrowTransactionDetail.totalConditionPoints !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Condition Points</Text>
                        <Text style={styles.detailValue}>{scannedBorrowTransactionDetail.totalConditionPoints}</Text>
                      </View>
                    )}

                    {/* Previous Condition Images */}
                    {scannedBorrowTransactionDetail.previousConditionImages && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Previous Condition Images</Text>
                        </View>
                        <View style={styles.imageGrid}>
                          {scannedBorrowTransactionDetail.previousConditionImages.frontImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Front</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.previousConditionImages.frontImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.previousConditionImages.backImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Back</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.previousConditionImages.backImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.previousConditionImages.leftImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Left</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.previousConditionImages.leftImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.previousConditionImages.rightImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Right</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.previousConditionImages.rightImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.previousConditionImages.topImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Top</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.previousConditionImages.topImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.previousConditionImages.bottomImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Bottom</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.previousConditionImages.bottomImage }} style={styles.conditionImage} />
                            </View>
                          )}
                        </View>
                      </>
                    )}

                    {/* Current Condition Images */}
                    {scannedBorrowTransactionDetail.currentConditionImages && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Current Condition Images</Text>
                        </View>
                        <View style={styles.imageGrid}>
                          {scannedBorrowTransactionDetail.currentConditionImages.frontImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Front</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.currentConditionImages.frontImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.currentConditionImages.backImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Back</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.currentConditionImages.backImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.currentConditionImages.leftImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Left</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.currentConditionImages.leftImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.currentConditionImages.rightImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Right</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.currentConditionImages.rightImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.currentConditionImages.topImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Top</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.currentConditionImages.topImage }} style={styles.conditionImage} />
                            </View>
                          )}
                          {scannedBorrowTransactionDetail.currentConditionImages.bottomImage && (
                            <View style={styles.imageItem}>
                              <Text style={styles.imageLabel}>Bottom</Text>
                              <Image source={{ uri: scannedBorrowTransactionDetail.currentConditionImages.bottomImage }} style={styles.conditionImage} />
                            </View>
                          )}
                        </View>
                      </>
                    )}

                    {/* Previous Damage Faces */}
                    {scannedBorrowTransactionDetail.previousDamageFaces && scannedBorrowTransactionDetail.previousDamageFaces.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Previous Damage Assessment</Text>
                        </View>
                        {scannedBorrowTransactionDetail.previousDamageFaces.map((face: any, index: number) => (
                          <View key={index} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{face.face.charAt(0).toUpperCase() + face.face.slice(1)}</Text>
                            <Text style={styles.detailValue}>{face.issue}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Current Damage Faces */}
                    {scannedBorrowTransactionDetail.currentDamageFaces && scannedBorrowTransactionDetail.currentDamageFaces.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Current Damage Assessment</Text>
                        </View>
                        {scannedBorrowTransactionDetail.currentDamageFaces.map((face: any, index: number) => (
                          <View key={index} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{face.face.charAt(0).toUpperCase() + face.face.slice(1)}</Text>
                            <Text style={styles.detailValue}>{face.issue}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Points and Changes */}
                    {(scannedBorrowTransactionDetail.co2Changed !== undefined || scannedBorrowTransactionDetail.ecoPointChanged !== undefined || 
                      scannedBorrowTransactionDetail.rankingPointChanged !== undefined || scannedBorrowTransactionDetail.rewardPointChanged !== undefined) && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Points & Changes</Text>
                        </View>
                        {scannedBorrowTransactionDetail.co2Changed !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>CO2 Changed</Text>
                            <Text style={[styles.detailValue, scannedBorrowTransactionDetail.co2Changed < 0 && { color: '#ef4444' }, scannedBorrowTransactionDetail.co2Changed > 0 && { color: '#16a34a' }]}>
                              {scannedBorrowTransactionDetail.co2Changed > 0 ? '+' : ''}{scannedBorrowTransactionDetail.co2Changed}
                            </Text>
                          </View>
                        )}
                        {scannedBorrowTransactionDetail.ecoPointChanged !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Eco Point Changed</Text>
                            <Text style={[styles.detailValue, scannedBorrowTransactionDetail.ecoPointChanged < 0 && { color: '#ef4444' }, scannedBorrowTransactionDetail.ecoPointChanged > 0 && { color: '#16a34a' }]}>
                              {scannedBorrowTransactionDetail.ecoPointChanged > 0 ? '+' : ''}{scannedBorrowTransactionDetail.ecoPointChanged}
                            </Text>
                          </View>
                        )}
                        {scannedBorrowTransactionDetail.rankingPointChanged !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Ranking Point Changed</Text>
                            <Text style={[styles.detailValue, scannedBorrowTransactionDetail.rankingPointChanged < 0 && { color: '#ef4444' }, scannedBorrowTransactionDetail.rankingPointChanged > 0 && { color: '#16a34a' }]}>
                              {scannedBorrowTransactionDetail.rankingPointChanged > 0 ? '+' : ''}{scannedBorrowTransactionDetail.rankingPointChanged}
                            </Text>
                          </View>
                        )}
                        {scannedBorrowTransactionDetail.rewardPointChanged !== undefined && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reward Point Changed</Text>
                            <Text style={[styles.detailValue, scannedBorrowTransactionDetail.rewardPointChanged < 0 && { color: '#ef4444' }, scannedBorrowTransactionDetail.rewardPointChanged > 0 && { color: '#16a34a' }]}>
                              {scannedBorrowTransactionDetail.rewardPointChanged > 0 ? '+' : ''}{scannedBorrowTransactionDetail.rewardPointChanged}
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Wallet Transactions */}
                    {scannedBorrowTransactionDetail.walletTransactions && scannedBorrowTransactionDetail.walletTransactions.length > 0 && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Wallet Transactions</Text>
                        </View>
                        {scannedBorrowTransactionDetail.walletTransactions.map((walletTx: any, index: number) => (
                          <View key={index} style={styles.walletTransactionCard}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Type</Text>
                              <Text style={styles.detailValue}>{walletTx.transactionType}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Amount</Text>
                              <Text style={[styles.detailValue, walletTx.direction === 'in' ? { color: '#16a34a' } : { color: '#ef4444' }]}>
                                {walletTx.direction === 'in' ? '+' : '-'}{walletTx.amount.toLocaleString('en-US')} VND
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Description</Text>
                              <Text style={styles.detailValue}>{walletTx.description}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Status</Text>
                              <Text style={styles.detailValue}>{walletTx.status}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Date</Text>
                              <Text style={styles.detailValue}>
                                {new Date(walletTx.createdAt).toLocaleString('en-US')}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </>
                )}
                </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Borrow transaction information not found</Text>
                <TouchableOpacity
                  style={styles.errorButton}
                  onPress={() => {
                    setShowBorrowConfirmModal(false);
                    setScannedBorrowTransaction(null);
                    setScannedBorrowTransactionDetail(null);
                  }}
                >
                  <Text style={styles.errorButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Confirm Borrow Button - Fixed at bottom, outside ScrollView */}
            {scannedBorrowTransaction && 
             scannedBorrowTransaction.borrowTransactionType === 'borrow' && 
             (scannedBorrowTransaction.status === 'pending' || 
              scannedBorrowTransaction.status === 'waiting' || 
              scannedBorrowTransaction.status === 'pending_pickup') && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.processReturnButton, { backgroundColor: '#00704A', width: '100%' }]}
                  onPress={async () => {
                    try {
                      await borrowTransactionsApi.confirmBorrow(scannedBorrowTransaction._id);
                      
                      // Close all modals and scanner
                      setShowBorrowConfirmModal(false);
                      setShowUnifiedQRScanner(false);
                      stopUnifiedScanning();
                      
                      // Save transaction ID for showing detail
                      const confirmedTransactionId = scannedBorrowTransaction._id;
                      setScannedBorrowTransaction(null);
                      setScannedBorrowTransactionDetail(null);
                      
                      // Reload transactions
                      await loadTransactions();
                      
                      // Find and show transaction detail
                      try {
                        const detailResponse = await borrowTransactionsApi.getBusinessDetail(confirmedTransactionId);
                        if (detailResponse.statusCode === 200 && detailResponse.data) {
                          setTransactionDetail(detailResponse.data);
                          // Find transaction in list
                          const updatedTransactions = await borrowTransactionsApi.getBusinessHistory({
                            page: 1,
                            limit: 1000,
                          });
                          const allTransactions = updatedTransactions.data?.items || (Array.isArray(updatedTransactions.data) ? updatedTransactions.data : []);
                          const foundTransaction = allTransactions.find((t: BusinessTransaction) => t._id === confirmedTransactionId);
                          if (foundTransaction) {
                            setSelectedTransaction(foundTransaction);
                            setShowDetailsModal(true);
                          }
                        }
                      } catch (error) {
                        console.error('Error loading confirmed transaction detail:', error);
                      }
                      
                      Alert.alert(
                        'Success',
                        'Borrow transaction confirmed successfully!',
                        [{ text: 'OK' }]
                      );
                    } catch (error: any) {
                      console.error('Error confirming borrow:', error);
                      Alert.alert('Error', error.message || 'Failed to confirm borrow transaction');
                    }
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.processReturnButtonText}>Confirm Borrow</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Unified QR Scanner Modal with Mode Switcher */}
      {showUnifiedQRScanner && hasUnifiedCameraPermission && !showBorrowConfirmModal && (
        <Modal
          visible={showUnifiedQRScanner && !showBorrowConfirmModal}
          animationType="fade"
          transparent={true}
          onRequestClose={stopUnifiedScanning}
        >
            <View style={styles.qrScannerContainer}>
            <StatusBar hidden />
            <CameraView 
              style={StyleSheet.absoluteFillObject} 
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
              onBarcodeScanned={onUnifiedBarcodeScanned}
              enableTorch={unifiedFlashEnabled}
            />
            
            <View style={styles.overlayMask}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayBottom} />
              <View style={styles.overlayLeft} />
              <View style={styles.overlayRight} />
            </View>

            <View style={styles.brandingContainer}>
              <Text style={styles.brandingText}>Powered by Back2Use</Text>
            </View>

            <TouchableOpacity 
              style={styles.closeButtonTop} 
              onPress={stopUnifiedScanning}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

            <View style={styles.scanningFrameContainer}>
              <View style={[
                styles.scanningFrame,
                { 
                  borderColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316'
                }
              ]}>
                <View style={[
                  styles.cornerBracket, 
                  styles.topLeftCorner,
                  { borderColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316' }
                ]}>
                  <View style={[
                    styles.cornerBracketHorizontal,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      top: 0,
                      left: 0
                    }
                  ]} />
                  <View style={[
                    styles.cornerBracketVertical,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      top: 0,
                      left: 0
                    }
                  ]} />
                </View>
                <View style={[
                  styles.cornerBracket, 
                  styles.topRightCorner,
                  { borderColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316' }
                ]}>
                  <View style={[
                    styles.cornerBracketHorizontal,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      top: 0,
                      right: 0
                    }
                  ]} />
                  <View style={[
                    styles.cornerBracketVertical,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      top: 0,
                      right: 0
                    }
                  ]} />
                </View>
                <View style={[
                  styles.cornerBracket, 
                  styles.bottomLeftCorner,
                  { borderColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316' }
                ]}>
                  <View style={[
                    styles.cornerBracketHorizontal,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      bottom: 0,
                      left: 0
                    }
                  ]} />
                  <View style={[
                    styles.cornerBracketVertical,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      bottom: 0,
                      left: 0
                    }
                  ]} />
                </View>
                <View style={[
                  styles.cornerBracket, 
                  styles.bottomRightCorner,
                  { borderColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316' }
                ]}>
                  <View style={[
                    styles.cornerBracketHorizontal,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      bottom: 0,
                      right: 0
                    }
                  ]} />
                  <View style={[
                    styles.cornerBracketVertical,
                    { 
                      backgroundColor: unifiedScannerMode === 'borrow' ? '#00FF88' : '#F97316',
                      bottom: 0,
                      right: 0
                    }
                  ]} />
                </View>
              
                <View 
                  style={[
                    styles.laserLine,
                    { 
                      top: unifiedLaserLinePosition,
                      backgroundColor: unifiedScannerMode === 'borrow' 
                        ? 'rgba(0, 255, 136, 0.8)' 
                        : 'rgba(249, 115, 22, 0.8)'
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Align the QR code within the frame to scan
              </Text>
            </View>

            {/* Mode Switcher - Segmented Control */}
            <View style={styles.modeSwitcherContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  unifiedScannerMode === 'borrow' && styles.modeButtonActive,
                  unifiedScannerMode === 'borrow' && { backgroundColor: '#00FF88' }
                ]}
                onPress={() => setUnifiedScannerMode('borrow')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="arrow-down-circle" 
                  size={20} 
                  color={unifiedScannerMode === 'borrow' ? '#FFFFFF' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.modeButtonText,
                  unifiedScannerMode === 'borrow' && styles.modeButtonTextActive
                ]}>
                  Borrow
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  unifiedScannerMode === 'return' && styles.modeButtonActive,
                  unifiedScannerMode === 'return' && { backgroundColor: '#F97316' }
                ]}
                onPress={() => setUnifiedScannerMode('return')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="arrow-up-circle" 
                  size={20} 
                  color={unifiedScannerMode === 'return' ? '#FFFFFF' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.modeButtonText,
                  unifiedScannerMode === 'return' && styles.modeButtonTextActive
                ]}>
                  Return
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.floatingControls}>
              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => {
                  Alert.alert('My QR', 'Feature coming soon');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.floatingButton, styles.flashButton]}
                onPress={() => setUnifiedFlashEnabled(!unifiedFlashEnabled)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={unifiedFlashEnabled ? "flash" : "flash-outline"} 
                  size={28} 
                  color={unifiedFlashEnabled ? "#FCD34D" : "#FFFFFF"} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => {
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

      {/* QR Scanner Modal for Return Processing */}
      {showQRScanner && hasCameraPermission && (
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
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }} 
                  onBarcodeScanned={onBarcodeScanned} 
              enableTorch={flashEnabled}
            />
            
            {/* Overlay Mask - Dark Semi-transparent (60-70% opacity) with cutout */}
            <View style={styles.overlayMask}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayBottom} />
              <View style={styles.overlayLeft} />
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
    </View>
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
  // Header Styles (Simple like Customer Wallet)
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
  headerLeft: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  quickActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  quickActionButtonBorrow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00704A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  quickActionButtonReturn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  quickActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  transactionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  returnModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    minHeight: '50%',
  },
  returnModalContent: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
    width: '100%',
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
  modalFooter: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#00704A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  // Mode Switcher Styles
  modeSwitcherContainer: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 4,
    zIndex: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modeButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Borrow Confirmation Modal Styles
  transactionDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalScrollView: {
    maxHeight: screenHeight * 0.6,
  },
  confirmBorrowButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
    shadowColor: '#00704A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBorrowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  cardActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  confirmImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmImageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  confirmImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  noImagesText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  serverCalculatedNote: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
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
  walletTransactionCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Feedback Styles
  feedbackLoading: {
    padding: 20,
    alignItems: 'center',
  },
  feedbackLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  feedbackCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedbackRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F4D3A',
    marginLeft: 8,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  feedbackEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  feedbackEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  feedbackEmptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  addUsageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addUsageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  usageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
  },
  usageProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  usageCardContent: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  productOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
    borderWidth: 2,
  },
  productOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productOptionSize: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  productOptionWeight: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  txHashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  txHashText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyIcon: {
    marginLeft: 4,
  },
});
