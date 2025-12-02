import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Dimensions,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';
import { walletApi, WalletTransaction, walletTransactionsApi } from '../../../lib/api';
import { businessesApi } from '../../../src/services/api/businessService';
import { apiCall } from '../../../src/services/api/client';
import { BusinessProfile, BusinessWallet } from '../../../src/types/business.types';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'add_fund' | 'subscription' | 'withdrawal';
  createdAt: string;
}

interface DepositTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'deposit' | 'refund';
  itemName: string;
  dueDate?: string;
  returnCondition?: string;
  status: 'completed' | 'active' | 'overdue' | 'returned';
  createdAt: string;
}

export default function BusinessWalletScreen() {
  const auth = useAuth();
  const { t } = useI18n();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [wallet, setWallet] = useState<BusinessWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  
  // Real transactions from API
  const [realTransactions, setRealTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // Summary data from real transactions
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [showBalance, setShowBalance] = useState(false); // Mặc định ẩn số tiền
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo'>('vnpay');
  
  // VNPay WebView states
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null); // Lưu URL callback khi detect
  
  // Payment result states
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [savedPaymentAmount, setSavedPaymentAmount] = useState(0);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentResultShown, setPaymentResultShown] = useState(false);
  
  // Payment verification state
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const verifyPaymentIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const paymentVerifyAttemptsRef = React.useRef(0);
  
  // Ref để tránh xử lý callback nhiều lần
  const callbackProcessedRef = React.useRef(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔍 Business Wallet State - showAddFunds:', showAddFunds);
    console.log('🔍 Business Wallet State - showWithdraw:', showWithdraw);
    console.log('🔍 Business Wallet State - amount:', amount);
    console.log('🔍 Business Wallet State - isPaymentProcessing:', isPaymentProcessing);
    console.log('🔍 Business Wallet State - paymentResultShown:', paymentResultShown);
    
    if (showWithdraw) {
      console.log('🔍 Withdraw modal should be visible now');
    }
  }, [showAddFunds, showWithdraw, amount, isPaymentProcessing, paymentResultShown]);

  // Load user data and wallet
  useEffect(() => {
    loadBusinessData();
  }, [auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);

  // Load real transactions from API
  useEffect(() => {
    const loadTransactions = async () => {
      if (!wallet?._id) return;
      
      try {
        setTransactionsLoading(true);
        console.log('🔄 Loading real transactions...');
        
        const response = await walletTransactionsApi.getMy({
          walletType: 'business',
          typeGroup: 'personal', // Chỉ lấy personal transactions (top_up, withdraw, subscription_fee)
          page: 1,
          limit: 50,
        });
        
        console.log('📡 Business Transactions API Response:', response);
        console.log('📡 Request params:', { walletType: 'business', typeGroup: 'personal' });
        
        if (response.statusCode === 200 && response.data) {
          console.log('✅ Business transactions data:', response.data);
          console.log('✅ Number of transactions:', response.data.length);
          setRealTransactions(response.data);
          
          // Calculate summary - only count completed transactions
          let income = 0;
          let expenses = 0;
          
          response.data.forEach(transaction => {
            // Only count completed transactions (not processing or failed)
            if (transaction.status === 'completed') {
              if (transaction.direction === 'in') {
                income += transaction.amount;
              } else {
                expenses += transaction.amount;
              }
            }
          });
          
          console.log('📊 Business transactions breakdown:', {
            total: response.data.length,
            completed: response.data.filter(t => t.status === 'completed').length,
            processing: response.data.filter(t => t.status === 'processing').length,
            failed: response.data.filter(t => t.status === 'failed').length,
          });
          
          setTotalIncome(income);
          setTotalExpenses(expenses);
          console.log('💰 Summary - Income:', income, 'Expenses:', expenses);
        }
      } catch (error) {
        console.error('❌ Error loading transactions:', error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    loadTransactions();
  }, [wallet?._id]);

  // Listen for app state changes to refresh wallet after payment
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      console.log('🔄 App state changed to:', nextAppState);
      // Refresh wallet data when app becomes active (user returns from VNPay)
      if (nextAppState === 'active' && wallet?._id) {
        console.log('🔄 App became active, refreshing data...');
        // Immediate refresh
        await loadBusinessData();
        await loadTransactions();
        
        // Additional refresh after delay
        setTimeout(async () => {
          console.log('🔄 Delayed refresh after app state change...');
          await loadBusinessData();
          await loadTransactions();
        }, 2000); // 2 seconds delay
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [wallet?._id]);

  const loadBusinessData = async () => {
    // Wait for auth state to be hydrated before making API calls
    if (!auth.state.isHydrated) {
      return;
    }
    
    if (auth.state.accessToken && auth.state.isAuthenticated && auth.state.role === 'business') {
      try {
        setLoading(true);
        console.log('🔍 Loading business profile for wallet screen...');
        const profileResponse = await businessesApi.getProfileWithAutoRefresh();
        console.log('✅ Business profile loaded:', profileResponse);
        
        if (profileResponse.data) {
          if (profileResponse.data.business) {
            setBusinessProfile(profileResponse.data.business);
          }
          
          if (profileResponse.data.wallet) {
            setWallet(profileResponse.data.wallet);
          }
        }
      } catch (error: any) {
        // Don't log network errors as errors - they're expected when offline
        const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                               error?.message?.toLowerCase().includes('timeout') ||
                               error?.message?.toLowerCase().includes('connection');
        
        if (!isNetworkError) {
          console.error('Error loading business profile:', error);
          // Show user-friendly error message for non-network errors
          Alert.alert(
            'Lỗi',
            'Không thể tải dữ liệu doanh nghiệp. Vui lòng thử lại.',
            [
              { text: 'Thử lại', onPress: () => loadBusinessData() },
              { text: 'Hủy', style: 'cancel' }
            ]
          );
        } else {
          console.warn('⚠️ Network error loading business profile (will retry later):', error.message);
          // Don't show alert for network errors - user can still use the screen with default values
        }
        // Continue with default/empty wallet data
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      console.log('🔄 Loading real transactions...');
      
      const response = await walletTransactionsApi.getMy({
        walletType: 'business',
        typeGroup: 'personal', // Chỉ lấy personal transactions (top_up, withdraw, subscription_fee)
        page: 1,
        limit: 50,
      });
      
      console.log('📊 Business Real transactions response:', response);
      console.log('📊 Request params:', { walletType: 'business', typeGroup: 'personal' });
      console.log('📊 Transactions data:', response.data);
      setRealTransactions(response.data);
      
      // Calculate summary - only count completed transactions
      let income = 0;
      let expenses = 0;
      
      response.data.forEach(transaction => {
        // Only count completed transactions (not processing or failed)
        if (transaction.status === 'completed') {
          if (transaction.direction === 'in') {
            income += transaction.amount;
          } else {
            expenses += transaction.amount;
          }
        }
      });
      
      console.log('📊 Business transactions breakdown (reload):', {
        total: response.data.length,
        completed: response.data.filter(t => t.status === 'completed').length,
        processing: response.data.filter(t => t.status === 'processing').length,
        failed: response.data.filter(t => t.status === 'failed').length,
      });
      
      setTotalIncome(income);
      setTotalExpenses(expenses);
      console.log('💰 Summary - Income:', income, 'Expenses:', expenses);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Function verify payment status
  const verifyPaymentStatus = async (expectedAmount: number): Promise<boolean> => {
    try {
      console.log('🔍 Verifying payment status...', { expectedAmount });
      
      // Reload transactions để lấy status mới nhất
      await loadTransactions();
      
      // Kiểm tra có transaction nào vừa completed không
      const recentCompletedTransaction = realTransactions.find(
        t => Math.abs(t.amount - expectedAmount) < 100 && // Cho phép sai số nhỏ
             t.status === 'completed' &&
             t.direction === 'in'
      );
      
      if (recentCompletedTransaction) {
        console.log('✅ Payment verified as completed!', {
          id: recentCompletedTransaction._id,
          amount: recentCompletedTransaction.amount,
          status: recentCompletedTransaction.status
        });
        return true;
      }
      
      console.log('⏳ Payment still processing...', {
        expectedAmount,
        transactionsChecked: realTransactions.length,
        completedTransactions: realTransactions.filter(t => t.status === 'completed').length
      });
      return false;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      return false;
    }
  };

  // Function start polling để verify
  const startPaymentVerification = (amount: number) => {
    console.log('🔄 Starting payment verification polling...');
    setIsVerifyingPayment(true);
    paymentVerifyAttemptsRef.current = 0;
    
    // Clear existing interval nếu có
    if (verifyPaymentIntervalRef.current) {
      clearInterval(verifyPaymentIntervalRef.current);
    }
    
    verifyPaymentIntervalRef.current = setInterval(async () => {
      paymentVerifyAttemptsRef.current++;
      console.log(`🔄 Verification attempt ${paymentVerifyAttemptsRef.current}/15`);
      
      const isCompleted = await verifyPaymentStatus(amount);
      
      if (isCompleted) {
        // ✅ THÀNH CÔNG
        console.log('✅ Payment verified successfully!');
        
        if (verifyPaymentIntervalRef.current) {
          clearInterval(verifyPaymentIntervalRef.current);
        }
        
        setIsVerifyingPayment(false);
        setPaymentResult('success');
        setShowPaymentResult(true);
        
        // Refresh data
        await loadBusinessData();
        await loadTransactions();
        
      } else if (paymentVerifyAttemptsRef.current >= 15) {
        // ❌ HẾT ATTEMPTS (45 giây)
        console.log('⏰ Payment verification timeout');
        
        if (verifyPaymentIntervalRef.current) {
          clearInterval(verifyPaymentIntervalRef.current);
        }
        
        setIsVerifyingPayment(false);
        
        // Show alert để user tự check
        Alert.alert(
          'Đang xử lý',
          'Thanh toán của bạn đang được xử lý. Vui lòng kiểm tra lại sau vài phút.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await loadBusinessData();
                await loadTransactions();
              }
            }
          ]
        );
      }
    }, 3000); // Check mỗi 3 giây
  };

  // Cleanup polling khi unmount
  useEffect(() => {
    return () => {
      if (verifyPaymentIntervalRef.current) {
        clearInterval(verifyPaymentIntervalRef.current);
        verifyPaymentIntervalRef.current = null;
      }
    };
  }, []);

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing all data...');
    await loadBusinessData();
    await loadTransactions();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Filter real transactions based on type
  const filteredTransactions = realTransactions.filter(transaction => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'deposits') return transaction.direction === 'in';
    if (transactionFilter === 'withdrawals') return transaction.direction === 'out';
    return true;
  });

  const handleAddFunds = async () => {
    console.log('🚀 Starting add funds process...');
    console.log('💰 Amount:', amount);
    console.log('💳 Wallet ID:', wallet?._id);
    console.log('💳 Payment Method:', paymentMethod);
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      console.log('❌ Invalid amount');
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!wallet?._id) {
      console.log('❌ No wallet ID');
      Alert.alert('Error', 'Wallet not found');
      return;
    }

    // Validate payment method
    const validPaymentMethod = paymentMethod && (paymentMethod === 'vnpay' || paymentMethod === 'momo') 
      ? paymentMethod 
      : 'vnpay';
    
    if (!validPaymentMethod || (validPaymentMethod !== 'vnpay' && validPaymentMethod !== 'momo')) {
      console.log('❌ Invalid payment method:', paymentMethod);
      Alert.alert('Error', 'Please select a valid payment method');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('📡 Calling deposit API...');
      console.log('📡 API URL:', `/wallets/${wallet._id}/deposit`);
      console.log('📡 Amount:', Number(amount));
      console.log('📡 Payment Method:', validPaymentMethod);
      
      // Call deposit API - returnUrl is configured on backend
      const response = await walletApi.deposit(wallet._id, Number(amount), validPaymentMethod);
      console.log('✅ Deposit API response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      // Response can be: 
      // - { url: "...", transactionId: "...", paymentResponse: { payUrl: "..." } }
      // - { url: "...", payUrl: "..." }
      let paymentUrl = response.url || response.payUrl;
      if (!paymentUrl && response.paymentResponse) {
        paymentUrl = response.paymentResponse.payUrl || response.paymentResponse.url || response.paymentResponse.shortLink;
      }
      
      console.log('🔗 Payment URL extracted:', paymentUrl);
      console.log('🔗 Response structure:', {
        hasUrl: !!response.url,
        hasPayUrl: !!response.payUrl,
        hasPaymentResponse: !!response.paymentResponse,
        transactionId: response.transactionId
      });
      
      if (paymentUrl) {
        // Save transaction ID for retry if needed
        if (response.transactionId) {
          console.log('💾 Saving transaction ID:', response.transactionId);
          // Could save to state if needed for retry
        }
        
        // Save payment amount for result display
        setSavedPaymentAmount(Number(amount));
        setPaymentAmount(Number(amount));
        
        // Clear callback URL cũ nếu có và reset flag
        setCallbackUrl(null);
        callbackProcessedRef.current = false; // Reset flag khi bắt đầu payment mới
        
        // Show Payment WebView
        setPaymentUrl(paymentUrl);
        setShowPaymentWebView(true);
        setShowAddFunds(false);
      } else {
        console.log('✅ Direct deposit successful');
        Alert.alert('Success', 'Deposit successful');
        // Reload wallet data and transactions
        await loadBusinessData();
        await loadTransactions();
        setShowAddFunds(false);
      setAmount('');
      }
    } catch (error: any) {
      console.error('❌ Add funds error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      Alert.alert('Error', `Failed to process deposit: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!wallet?._id) {
      Alert.alert('Error', 'Wallet not found');
      return;
    }

    if (Number(amount) > (wallet.availableBalance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    try {
      setIsProcessing(true);
      await walletApi.withdraw(wallet._id, Number(amount));
      
      Alert.alert('Success', 'Withdrawal successful');
      setShowWithdraw(false);
      setAmount('');
      
      // Reload wallet data
      await loadBusinessData();
    } catch (error) {
      console.error('Withdraw error:', error);
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryPayment = async (transactionId: string) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Retrying payment for transaction:', transactionId);
      
      // Call retry payment API endpoint
      const response = await apiCall<any>(`/wallets/transactions/${transactionId}/retry`, {
        method: 'POST',
      });
      
      console.log('✅ Retry payment response:', response);
      
      if (response.data?.url || response.data?.payUrl || response.url || response.payUrl) {
        const paymentUrl = response.data?.url || response.data?.payUrl || response.url || response.payUrl;
        console.log('🔗 Payment URL received:', paymentUrl);
        
        // Clear callback URL cũ nếu có và reset flag
        setCallbackUrl(null);
        callbackProcessedRef.current = false; // Reset flag khi bắt đầu payment mới
        
        // Show Payment WebView
        setPaymentUrl(paymentUrl || '');
        setShowPaymentWebView(true);
      } else {
        Alert.alert('Error', 'Failed to get payment URL');
      }
    } catch (error: any) {
      console.error('❌ Retry payment error:', error);
      Alert.alert('Error', `Failed to retry payment: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Đã loại bỏ handlePaymentSuccess và handlePaymentFailure - xử lý trực tiếp trong WebView callback

  const handlePaymentResultClose = async () => {
    console.log('🔄 Closing payment result modal');
    setShowPaymentResult(false);
    setPaymentResult(null);
    setPaymentResultShown(false);
    setAmount('');
    
    // Refresh data when closing payment result
    console.log('🔄 Refreshing data after closing payment result...');
    await loadBusinessData();
    await loadTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'returned':
        return '#10B981';
      case 'processing':
        return '#F59E0B'; // Amber for processing
      case 'active':
        return '#3B82F6';
      case 'overdue':
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'active':
        return 'Active';
      case 'overdue':
        return 'Overdue';
      case 'returned':
        return 'Returned';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1); // Capitalize first letter
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Business Wallet</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Business Wallet</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={forceRefresh}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Available Balance</Text>
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowBalance(!showBalance)}
            >
              <Ionicons
                name={showBalance ? "eye" : "eye-off"}
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceContainer}>
            {showBalance ? (
              <Text style={styles.balanceAmount}>
                {wallet?.availableBalance && typeof wallet.availableBalance === 'number' ? wallet.availableBalance.toLocaleString('vi-VN') : '0'} VNĐ
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VNĐ</Text>
            )}
          </View>
          
          <Text style={styles.cardSubtitle}>Business Account</Text>
        </View>

      {/* White Background Content */}
      <View style={styles.whiteBackground}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={transactionsLoading}
              onRefresh={forceRefresh}
              colors={['#00704A']}
              tintColor="#00704A"
            />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={styles.summaryValue}>{totalIncome.toLocaleString('vi-VN')} VNĐ</Text>
            </View>
              </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="trending-down" size={24} color="#EF4444" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>{totalExpenses.toLocaleString('vi-VN')} VNĐ</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addFundsButton]}
            onPress={() => setShowAddFunds(true)}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>Deposit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => setShowWithdraw(true)}
          >
            <Ionicons name="remove-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Section */}
        <View style={styles.transactionHistorySection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, transactionFilter === 'all' && styles.activeFilterButton]}
              onPress={() => setTransactionFilter('all')}
            >
              <Text style={[styles.filterButtonText, transactionFilter === 'all' && styles.activeFilterButtonText]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
              style={[styles.filterButton, transactionFilter === 'deposits' && styles.activeFilterButton]}
              onPress={() => setTransactionFilter('deposits')}
                >
              <Ionicons name="arrow-up" size={16} color={transactionFilter === 'deposits' ? "#fff" : "#10B981"} />
              <Text style={[styles.filterButtonText, transactionFilter === 'deposits' && styles.activeFilterButtonText]}>
                Deposits
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
              style={[styles.filterButton, transactionFilter === 'withdrawals' && styles.activeFilterButton]}
              onPress={() => setTransactionFilter('withdrawals')}
                >
              <Ionicons name="arrow-down" size={16} color={transactionFilter === 'withdrawals' ? "#fff" : "#EF4444"} />
              <Text style={[styles.filterButtonText, transactionFilter === 'withdrawals' && styles.activeFilterButtonText]}>
                Withdrawals
                  </Text>
                </TouchableOpacity>
          </View>
              </View>

        {/* Transaction List */}
        <View style={styles.transactionSection}>
          {transactionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0F4D3A" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : (
            <>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <View key={transaction._id} style={styles.transactionCard}>
                    <View style={[styles.transactionIcon, { backgroundColor: transaction.direction === 'in' ? '#E6F7F7' : '#FCE8E8' }]}>
                      <Ionicons 
                        name={transaction.direction === 'in' ? 'arrow-up' : 'arrow-down'} 
                        size={18} 
                        color={transaction.direction === 'in' ? '#10B981' : '#EF4444'} 
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString('en-US')}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[styles.amountText, { color: transaction.direction === 'in' ? '#10B981' : '#EF4444' }]}>
                        {transaction.direction === 'in' ? '+' : '-'}{transaction.amount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                          {getStatusText(transaction.status)}
                  </Text>
              </View>
                      {transaction.status === 'processing' && transaction.transactionType === 'deposit' && (
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => handleRetryPayment(transaction._id)}
                          disabled={isProcessing}
                        >
                          <Ionicons name="refresh" size={14} color="#0F4D3A" />
                          <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No transactions found</Text>
                  <Text style={styles.emptyStateSubtext}>Your transaction history will appear here</Text>
                  </View>
              )}
            </>
          )}
        </View>
        </ScrollView>
      </View>

      {/* Deposit Modal */}
      <Modal
        visible={showAddFunds}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFunds(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Deposit</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalSubtitle}>Enter amount to add to your wallet</Text>
            
            {/* Payment Method Selection */}
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.paymentMethodLabel}>Payment Method</Text>
              <View style={styles.paymentMethodButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'vnpay' && styles.paymentMethodButtonActive
                  ]}
                  onPress={() => setPaymentMethod('vnpay')}
                >
                  <Ionicons 
                    name="card" 
                    size={20} 
                    color={paymentMethod === 'vnpay' ? '#FFFFFF' : '#0F4D3A'} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'vnpay' && styles.paymentMethodTextActive
                  ]}>
                    VNPay
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'momo' && styles.paymentMethodButtonActive
                  ]}
                  onPress={() => setPaymentMethod('momo')}
                >
                  <Ionicons 
                    name="phone-portrait" 
                    size={20} 
                    color={paymentMethod === 'momo' ? '#FFFFFF' : '#A50064'} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'momo' && styles.paymentMethodTextActive
                  ]}>
                    MoMo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>VNĐ</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.quickAmounts}>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => setAmount('100000')}
              >
                <Text style={styles.quickAmountText}>100,000 VNĐ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => setAmount('500000')}
              >
                <Text style={styles.quickAmountText}>500,000 VNĐ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmountButton}
                onPress={() => setAmount('1000000')}
              >
                <Text style={styles.quickAmountText}>1,000,000 VNĐ</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.confirmButton, styles.addFundsConfirmButton]}
              onPress={handleAddFunds}
              disabled={isProcessing}
            >
              <Text style={styles.confirmButtonText}>
                {isProcessing ? 'Processing...' : 'Deposit'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdraw}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWithdraw(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Withdraw</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Enter amount to withdraw from your wallet</Text>
            <Text style={styles.balanceInfo}>
              Available balance: {wallet?.availableBalance ? wallet.availableBalance.toLocaleString('vi-VN') : '0'} VNĐ
            </Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>VNĐ</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity 
              style={[styles.confirmButton, styles.withdrawConfirmButton]}
              onPress={handleWithdraw}
              disabled={isProcessing}
            >
              <Text style={styles.confirmButtonText}>
                {isProcessing ? 'Processing...' : 'Withdraw'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment WebView Modal - FINAL FIX */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // Không cho đóng nếu đang verify
          if (!isVerifyingPayment) {
            // Xử lý tương tự như nút Back
            if (callbackUrl && !callbackProcessedRef.current) {
              const urlLower = callbackUrl.toLowerCase();
              
              // VNPay callback
              if (urlLower.includes('/vnpay/return') || urlLower.includes('vnp_responsecode')) {
                // Đánh dấu đã xử lý
                callbackProcessedRef.current = true;
                
                const urlParts = callbackUrl.split('?');
                const params = urlParts.length > 1 ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
                const responseCode = params.get('vnp_ResponseCode');
                const transactionStatus = params.get('vnp_TransactionStatus');
                
                setCallbackUrl(null);
                setShowPaymentWebView(false);
                setPaymentUrl('');
                
                if (responseCode === '00' && transactionStatus === '00') {
                  startPaymentVerification(Number(savedPaymentAmount));
                } else {
                  setPaymentResult('failed');
                  setShowPaymentResult(true);
                }
              }
              // MoMo callback
              else if (urlLower.includes('momo/redirect') || urlLower.includes('momo/return') || urlLower.includes('resultcode=')) {
                // Đánh dấu đã xử lý
                callbackProcessedRef.current = true;
                
                const urlParts = callbackUrl.split('?');
                const params = urlParts.length > 1 ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
                const resultCode = params.get('resultCode');
                
                setCallbackUrl(null);
                setShowPaymentWebView(false);
                setPaymentUrl('');
                
                if (resultCode === '0') {
                  startPaymentVerification(Number(savedPaymentAmount));
                } else {
                  setPaymentResult('failed');
                  setShowPaymentResult(true);
                }
              } else {
                setCallbackUrl(null);
                callbackProcessedRef.current = false;
                setShowPaymentWebView(false);
                setPaymentUrl('');
              }
            } else {
              callbackProcessedRef.current = false;
              setShowPaymentWebView(false);
              setPaymentUrl('');
            }
          }
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => {
                if (!isVerifyingPayment) {
                  // Kiểm tra nếu có callback URL đã được lưu
                  if (callbackUrl && !callbackProcessedRef.current) {
                    const urlLower = callbackUrl.toLowerCase();
                    
                    // VNPay callback
                    if (urlLower.includes('/vnpay/return') || urlLower.includes('vnp_responsecode')) {
                      // Đánh dấu đã xử lý để tránh xử lý lại
                      callbackProcessedRef.current = true;
                      
                      // Parse params từ callback URL
                      const urlParts = callbackUrl.split('?');
                      const params = urlParts.length > 1 ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
                      const responseCode = params.get('vnp_ResponseCode');
                      const transactionStatus = params.get('vnp_TransactionStatus');
                      
                      console.log('🔙 User pressed Back - processing VNPay payment result');
                      console.log('📊 Callback URL:', callbackUrl);
                      console.log('📊 Response code:', responseCode);
                      console.log('📊 Transaction status:', transactionStatus);
                      
                      // Clear callback URL
                      setCallbackUrl(null);
                      
                      // Đóng WebView
                      setShowPaymentWebView(false);
                      setPaymentUrl('');
                      
                      // Xử lý kết quả
                      if (responseCode === '00' && transactionStatus === '00') {
                        // Bắt đầu verify payment
                        startPaymentVerification(Number(savedPaymentAmount));
                      } else {
                        // Failed
                        setPaymentResult('failed');
                        setShowPaymentResult(true);
                      }
                      return;
                    }
                    // MoMo callback
                    else if (urlLower.includes('momo/redirect') || urlLower.includes('momo/return') || urlLower.includes('resultcode=')) {
                      // Đánh dấu đã xử lý để tránh xử lý lại
                      callbackProcessedRef.current = true;
                      
                      // Parse params từ callback URL
                      const urlParts = callbackUrl.split('?');
                      const params = urlParts.length > 1 ? new URLSearchParams(urlParts[1]) : new URLSearchParams();
                      const resultCode = params.get('resultCode');
                      
                      console.log('🔙 User pressed Back - processing MoMo payment result');
                      console.log('📊 Callback URL:', callbackUrl);
                      console.log('📊 Result code:', resultCode);
                      
                      // Clear callback URL
                      setCallbackUrl(null);
                      
                      // Đóng WebView
                      setShowPaymentWebView(false);
                      setPaymentUrl('');
                      
                      // Xử lý kết quả
                      if (resultCode === '0') {
                        // Bắt đầu verify payment
                        startPaymentVerification(Number(savedPaymentAmount));
                      } else {
                        // Failed
                        setPaymentResult('failed');
                        setShowPaymentResult(true);
                      }
                      return;
                    }
                  }
                  
                  // Không phải callback URL, chỉ đóng bình thường
                  setCallbackUrl(null);
                  callbackProcessedRef.current = false; // Reset flag
                  setShowPaymentWebView(false);
                  setPaymentUrl('');
                  loadBusinessData();
                }
              }}
              disabled={isVerifyingPayment}
            >
              <Text style={[styles.webViewCloseButton, isVerifyingPayment && { opacity: 0.5 }]}>
                ← Back
              </Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>
              {paymentMethod === 'momo' ? 'Thanh toán MoMo' : 'Thanh toán VNPAY'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* WebView */}
          {paymentUrl ? (
            <WebView
              key={paymentUrl}
              source={{ uri: paymentUrl }}
              style={{ flex: 1, backgroundColor: '#fff' }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                  <ActivityIndicator size="large" color="#00704A" />
                  <Text style={{ marginTop: 16, color: '#666' }}>Đang tải...</Text>
                </View>
              )}
              onLoadStart={() => {
                console.log('🔄 WebView started loading:', paymentUrl);
              }}
              onLoadProgress={({ nativeEvent }) => {
                console.log('📊 WebView loading progress:', Math.round(nativeEvent.progress * 100) + '%');
              }}

              // ===== XỬ LÝ URL =====
              onShouldStartLoadWithRequest={(request) => {
                const url = request.url.toLowerCase();
                const originalUrl = request.url;
                console.log('🔍 URL detected:', originalUrl);
                console.log('🔍 Current paymentUrl:', paymentUrl);

                // QUAN TRỌNG: Cho phép URL ban đầu (paymentUrl) load trước
                const paymentBaseUrl = paymentUrl ? paymentUrl.split('?')[0] : '';
                const requestBaseUrl = originalUrl.split('?')[0];
                
                if (originalUrl === paymentUrl || 
                    originalUrl.startsWith(paymentUrl) ||
                    (paymentBaseUrl && requestBaseUrl.startsWith(paymentBaseUrl))) {
                  console.log('✅ Allowing initial payment URL to load');
                  return true;
                }

                // MOMO CALLBACK - CHO PHÉP LOAD VÀ HIỂN THỊ, USER TỰ ĐÓNG (giống VNPay)
                if (url.includes('momo/redirect') || url.includes('momo/return') || url.includes('resultcode=')) {
                  // Chỉ cho phép URL từ backend domain
                  if (originalUrl.includes('back-2-use.up.railway.app') || 
                      originalUrl.includes('backend.back2use.vn')) {
                    // Chỉ xử lý 1 lần - tránh reload loop
                    if (!callbackProcessedRef.current) {
                      console.log('💳 MoMo callback detected - allowing load and display...');
                      console.log('📊 Full callback URL:', originalUrl);
                      // Lưu URL callback để xử lý khi user ấn Back
                      setCallbackUrl(originalUrl);
                      callbackProcessedRef.current = true; // Đánh dấu đã xử lý
                    } else {
                      console.log('⚠️ MoMo callback already processed, preventing reload');
                    }
                    // Cho phép load để hiển thị cho user xem (chỉ lần đầu)
                    return true;
                  } else {
                    console.log('⚠️ MoMo callback URL không phải từ backend, chặn:', originalUrl);
                    return false; // Chặn các URL không hợp lệ
                  }
                }

                // VNPAY CALLBACK - CHO PHÉP LOAD VÀ HIỂN THỊ, USER TỰ ĐÓNG
                if (url.includes('/vnpay/return') || url.includes('vnp_responsecode')) {
                  // Chỉ cho phép URL từ backend domain
                  if (originalUrl.includes('back-2-use.up.railway.app') || 
                      originalUrl.includes('backend.back2use.vn')) {
                    // Chỉ xử lý 1 lần - tránh reload loop
                    if (!callbackProcessedRef.current) {
                      console.log('💳 VNPay callback detected - allowing load and display...');
                      console.log('📊 Full callback URL:', originalUrl);
                      // Lưu URL callback để xử lý khi user ấn Back
                      setCallbackUrl(originalUrl);
                      callbackProcessedRef.current = true; // Đánh dấu đã xử lý
                    } else {
                      console.log('⚠️ VNPay callback already processed, preventing reload');
                    }
                    // Cho phép load để hiển thị cho user xem (chỉ lần đầu)
                    return true;
                  } else {
                    console.log('⚠️ VNPay callback URL không phải từ backend, chặn:', originalUrl);
                    return false; // Chặn các URL không hợp lệ
                  }
                }

                // XỬ LÝ payment-success từ backend hoặc localhost
                if (url.includes('payment-success')) {
                  if (originalUrl.includes('localhost') || originalUrl.includes('127.0.0.1')) {
                    console.log('✅ Localhost payment-success detected - processing immediately');
                    console.log('📊 URL:', originalUrl);
                    
                    const params = new URLSearchParams(originalUrl.split('?')[1]);
                    const txnRef = params.get('txnRef');
                    console.log('📊 Transaction ref:', txnRef);
                    
                    // Set payment result TRƯỚC khi đóng WebView
                    setPaymentResult('success');
                    setPaymentAmount(savedPaymentAmount || Number(amount) || 0);
                    
                    // Đợi một chút để state được set xong rồi mới hiển thị modal
                    setTimeout(() => {
                      setShowPaymentResult(true);
                    }, 100);
                    
                    // Đóng WebView sau khi đã set state
                    setTimeout(() => {
                      setShowPaymentWebView(false);
                      setPaymentUrl('');
                      setCallbackUrl(null);
                      callbackProcessedRef.current = false;
                      
                      // Refresh ví ngay lập tức
                      loadBusinessData();
                      loadTransactions();
                    }, 200);
                    
                    return false; // Chặn load localhost
                  } else {
                    // Backend payment-success - cho phép load, xử lý trong onLoadEnd
                    console.log('✅ Payment success page detected - allowing load first');
                    console.log('📊 URL:', originalUrl);
                    return true;
                  }
                }

                // CHẶN localhost khác (không phải payment-success) - không thể load trong mobile app
                if ((originalUrl.includes('localhost') || originalUrl.includes('127.0.0.1')) && 
                    !originalUrl.includes('payment-success')) {
                  console.log('⚠️ Chặn localhost URL:', originalUrl);
                  return false;
                }

                // Cho phép tất cả các URL khác (VNPay gateway, ngân hàng, OTP, etc.)
                console.log('✅ Allowing URL to load:', originalUrl);
                return true;
              }}

              // ===== LOG URL KHI LOAD XONG (KHÔNG TỰ ĐỘNG ĐÓNG) =====
              onLoadEnd={(syntheticEvent) => {
                const url = syntheticEvent.nativeEvent.url;
                const urlLower = url.toLowerCase();
                console.log('✅ Load end:', url);

                // XỬ LÝ payment-success - tự động đóng và hiển thị màn hình thành công
                if (urlLower.includes('payment-success')) {
                  const params = new URLSearchParams(url.split('?')[1]);
                  const txnRef = params.get('txnRef');
                  
                  console.log('✅ Payment success page loaded - closing WebView and showing success');
                  console.log('📊 Transaction ref:', txnRef);
                  
                  // Đợi 1 giây để WebView hiển thị xong rồi mới đóng
                  setTimeout(() => {
                    setShowPaymentWebView(false);
                    setPaymentUrl('');
                    setCallbackUrl(null);
                    callbackProcessedRef.current = false;
                    
                    // Hiển thị màn hình thành công
                    setPaymentResult('success');
                    setPaymentAmount(savedPaymentAmount || Number(amount) || 0);
                    setShowPaymentResult(true);
                    
                    // Refresh ví ngay lập tức
                    loadBusinessData();
                    loadTransactions();
                  }, 1000);
                  return;
                }

                // Chỉ log, không tự động đóng - để user tự đóng bằng nút Back
                // Chỉ xử lý 1 lần để tránh reload loop
                
                // VNPay callback
                if ((urlLower.includes('/vnpay/return') || urlLower.includes('vnp_responsecode')) && !callbackProcessedRef.current) {
                  // Đảm bảo callbackUrl được set (nếu chưa có từ onShouldStartLoadWithRequest)
                  if (!callbackUrl) {
                    setCallbackUrl(url);
                    console.log('💾 Saved VNPay callback URL for later processing');
                  }
                  
                  const params = new URLSearchParams(url.split('?')[1]);
                  const responseCode = params.get('vnp_ResponseCode');
                  const transactionStatus = params.get('vnp_TransactionStatus');
                  
                  console.log('📊 VNPay callback loaded - waiting for user to close WebView');
                  console.log('📊 Response code:', responseCode);
                  console.log('📊 Transaction status:', transactionStatus);
                  console.log('📊 User can now see the result and press Back button');
                }
                // MoMo callback
                else if ((urlLower.includes('momo/redirect') || urlLower.includes('momo/return') || urlLower.includes('resultcode=')) && !callbackProcessedRef.current) {
                  // Đảm bảo callbackUrl được set (nếu chưa có từ onShouldStartLoadWithRequest)
                  if (!callbackUrl) {
                    setCallbackUrl(url);
                    console.log('💾 Saved MoMo callback URL for later processing');
                  }
                  
                  const params = new URLSearchParams(url.split('?')[1]);
                  const resultCode = params.get('resultCode');
                  
                  console.log('📊 MoMo callback loaded - waiting for user to close WebView');
                  console.log('📊 Result code:', resultCode);
                  console.log('📊 User can now see the result and press Back button');
                }
                else if (callbackProcessedRef.current) {
                  console.log('⚠️ Callback already processed, ignoring reload');
                }
              }}

              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                const errorUrl = nativeEvent.url;
                
                // Nếu lỗi ở sandbox.vnpayment.vn (trang OTP) - chỉ log warning, không log error
                if (errorUrl && errorUrl.includes('sandbox.vnpayment.vn')) {
                  console.log('⚠️ VNPay OTP page connection issue - this is normal, user can retry');
                  // Không log error chi tiết cho OTP page
                  return;
                }
                
                // Nếu lỗi xảy ra ở URL callback, vẫn xử lý payment
                if (errorUrl && (errorUrl.includes('/vnpay/return') || errorUrl.includes('vnp_responsecode'))) {
                  console.log('⚠️ Error loading callback URL, but will try to process payment result');
                  // Lưu URL để xử lý khi user ấn Back
                  if (!callbackUrl) {
                    setCallbackUrl(errorUrl);
                  }
                  // Không log error chi tiết cho callback URL
                  return;
                }
                
                // Chỉ log error cho các URL khác (không phải OTP hoặc callback)
                console.warn('⚠️ WebView error:', {
                  code: nativeEvent.code,
                  description: nativeEvent.description,
                  url: errorUrl
                });
              }}

              cacheEnabled={false}
              domStorageEnabled={true}
              javaScriptEnabled={true}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#00704A" />
              <Text style={{ marginTop: 16, color: '#666' }}>Đang chuẩn bị...</Text>
            </View>
          )}

          {/* Verification Overlay */}
          {isVerifyingPayment && (
            <View style={styles.verificationOverlay}>
              <View style={styles.verificationCard}>
                <ActivityIndicator size="large" color="#00704A" />
                <Text style={styles.verificationText}>Đang xác nhận thanh toán...</Text>
                <Text style={styles.verificationSubtext}>
                  Kiểm tra {paymentVerifyAttemptsRef.current}/15
                </Text>
                <Text style={styles.verificationNote}>
                  Vui lòng không tắt màn hình
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Payment Result Modal */}
      <Modal
        visible={showPaymentResult}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.resultModalContainer}>
          <View style={styles.resultModalContent}>
            <View style={styles.resultIcon}>
              <Ionicons 
                name={paymentResult === 'success' ? 'checkmark-circle' : 'close-circle'} 
                size={64} 
                color={paymentResult === 'success' ? '#10B981' : '#EF4444'} 
              />
            </View>
            
            <Text style={styles.resultTitle}>
              {paymentResult === 'success' ? 'Payment Successful!' : 'Payment Failed'}
            </Text>
            
            <Text style={styles.resultMessage}>
              {paymentResult === 'success' 
                ? `Successfully added ${savedPaymentAmount.toLocaleString('vi-VN')} VNĐ to your wallet`
                : 'Payment could not be processed. Please try again.'
              }
            </Text>
            
            <TouchableOpacity 
              style={[styles.resultButton, paymentResult === 'success' ? styles.successButton : styles.failureButton]}
              onPress={handlePaymentResultClose}
            >
              <Text style={styles.resultButtonText}>
                {paymentResult === 'success' ? 'Continue' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#00704A',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  balanceCardOld: {
    backgroundColor: '#0F4D3A',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceHidden: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  summarySection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  transactionHistorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addFundsButton: {
    backgroundColor: '#00704A',
  },
  withdrawButton: {
    backgroundColor: '#F97316',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabSection: {
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#0F4D3A',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: '#0F4D3A',
    borderColor: '#0F4D3A',
    shadowColor: '#0F4D3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  transactionSection: {
    marginBottom: 20,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F4D3A',
  },
  cancelButton: {
    fontSize: 16,
    color: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    flex: 1,
  },
  modalContentScroll: {
    padding: 20,
    paddingBottom: 100, // Tránh bị che bởi navigation bar
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  balanceInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F4D3A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addFundsConfirmButton: {
    backgroundColor: '#0F4D3A',
  },
  withdrawConfirmButton: {
    backgroundColor: '#F59E0B',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  paymentMethodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#0F4D3A',
    borderColor: '#0F4D3A',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 4,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  // WebView styles
  webViewContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F4D3A',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  webView: {
    flex: 1,
  },
  // Payment result modal styles
  resultModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  resultButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  failureButton: {
    backgroundColor: '#EF4444',
  },
  resultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});