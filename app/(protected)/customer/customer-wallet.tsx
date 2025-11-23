import { getCurrentUserProfileWithAutoRefresh } from '@/services/api/userService';
import { walletApi, walletTransactionsApi, type WalletDetails, type WalletTransaction } from '@/services/api/walletService';
import { User } from '@/types/auth.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import CustomerHeader from '../../../components/CustomerHeader';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';

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

export default function CustomerWallet() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
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
  
  // VNPay WebView states
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  
  // Payment result states
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [savedPaymentAmount, setSavedPaymentAmount] = useState(0);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentResultShown, setPaymentResultShown] = useState(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔍 Customer Wallet State - showAddFunds:', showAddFunds);
    console.log('🔍 Customer Wallet State - showWithdraw:', showWithdraw);
    console.log('🔍 Customer Wallet State - amount:', amount);
    console.log('🔍 Customer Wallet State - isPaymentProcessing:', isPaymentProcessing);
    console.log('🔍 Customer Wallet State - paymentResultShown:', paymentResultShown);
    
    if (showWithdraw) {
      console.log('🔍 Withdraw modal should be visible now');
    }
  }, [showAddFunds, showWithdraw, amount, isPaymentProcessing, paymentResultShown]);

  // Load user data and wallet
  useEffect(() => {
    const loadUserData = async () => {
        try {
        setLoading(true);
        const userData = await getCurrentUserProfileWithAutoRefresh();
        console.log('🔍 Wallet User Data:', userData);
        console.log('💰 Wallet Balance:', userData.wallet);
        setUser(userData);
        
        // Use wallet data directly from user profile
        if (userData.wallet) {
          console.log('🔍 Customer Wallet data from API:', userData.wallet);
          console.log('💰 Customer Balance type:', typeof userData.wallet.balance);
          console.log('💰 Customer Balance value:', userData.wallet.balance);
          console.log('💰 Customer Wallet full object:', JSON.stringify(userData.wallet, null, 2));
          
          // Handle both balance and availableBalance fields
          const walletBalance = (userData.wallet as any).availableBalance ?? userData.wallet.balance ?? 0;
          
          setWallet({
            _id: userData.wallet._id,
            balance: typeof walletBalance === 'number' ? walletBalance : 0,
          });
          
          console.log('✅ Set wallet balance to:', walletBalance);
        } else {
          console.warn('⚠️ No wallet data in user profile');
        }
        } catch (error: any) {
        // Don't log network errors as errors - they're expected when offline
        const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                               error?.message?.toLowerCase().includes('timeout') ||
                               error?.message?.toLowerCase().includes('connection');
        
        if (!isNetworkError) {
          console.error('Error loading user data:', error);
        } else {
          console.warn('⚠️ Network error loading user data (will retry later):', error.message);
        }
        // Continue with default/empty wallet data
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Listen for app state changes to refresh wallet after payment
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      // Only refresh if app becomes active and not currently processing payment
      if (nextAppState === 'active' && wallet?._id && !isPaymentProcessing && !showPaymentWebView) {
        console.log('🔄 App became active, reloading wallet and transaction data...');
        loadUserData();
        loadTransactions(); // Also reload transactions to get updated status (includes summary calculation)
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [wallet?._id, isPaymentProcessing, showPaymentWebView]);

  // Load transactions when component mounts and when filter changes
  useEffect(() => {
    if (wallet?._id) {
      loadTransactions();
    }
  }, [transactionFilter, wallet?._id]);


  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUserProfileWithAutoRefresh();
      console.log('🔍 Wallet User Data:', userData);
      console.log('💰 Wallet Balance:', userData.wallet);
      setUser(userData);
      
      // Use wallet data directly from user profile
      if (userData.wallet) {
        console.log('🔍 Customer Wallet data from API:', userData.wallet);
        console.log('💰 Customer Balance type:', typeof userData.wallet.balance);
        console.log('💰 Customer Balance value:', userData.wallet.balance);
        console.log('💰 Customer Wallet full object:', JSON.stringify(userData.wallet, null, 2));
        
        // Handle both balance and availableBalance fields
        const walletBalance = (userData.wallet as any).availableBalance ?? userData.wallet.balance ?? 0;
        
        setWallet({
          _id: userData.wallet._id,
          balance: typeof walletBalance === 'number' ? walletBalance : 0,
        });
        
        console.log('✅ Set wallet balance to:', walletBalance);
      } else {
        console.warn('⚠️ No wallet data in user profile');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    console.log('🚀 Starting add funds process...');
    console.log('💰 Amount:', amount);
    console.log('💳 Wallet ID:', wallet?._id);
    
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

    try {
      setIsProcessing(true);
      console.log('📡 Calling deposit API...');
      console.log('📡 API URL:', `/wallets/${wallet._id}/deposit`);
      console.log('📡 Amount:', Number(amount));
      
      const response = await walletApi.deposit(wallet._id, Number(amount));
      console.log('✅ Deposit API response:', response);
      
      if (response.url || response.payUrl) {
        const paymentUrl = response.url || response.payUrl;
        console.log('🔗 Payment URL received:', paymentUrl);
        
        // Save payment amount for result display
        setSavedPaymentAmount(Number(amount));
        setPaymentAmount(Number(amount));
        
        // Show VNPay WebView
        setPaymentUrl(paymentUrl || '');
        setShowPaymentWebView(true);
        setShowAddFunds(false);
      } else {
        console.log('✅ Direct deposit successful');
        Alert.alert('Success', 'Deposit successful');
        // Reload wallet data and transactions
        await loadUserData();
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

    if (Number(amount) > (wallet.balance || 0)) {
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
      await loadUserData();
      await loadTransactions();
    } catch (error) {
      console.error('Withdraw error:', error);
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ Payment successful, closing WebView and showing result');
    setShowPaymentWebView(false);
    setPaymentResult('success');
    setShowPaymentResult(true);
    setPaymentResultShown(true);
    
    // Immediate refresh
    await loadUserData();
    await loadTransactions();
    
    // Additional refresh after delay to ensure data is updated
    setTimeout(async () => {
      console.log('🔄 Refreshing data after payment success...');
      await loadUserData();
      await loadTransactions();
    }, 3000); // 3 seconds delay
  };

  const handlePaymentFailure = () => {
    console.log('❌ Payment failed, closing WebView and showing result');
    setShowPaymentWebView(false);
    setPaymentResult('failed');
    setShowPaymentResult(true);
    setPaymentResultShown(true);
  };

  const handlePaymentResultClose = async () => {
    console.log('🔄 Closing payment result modal');
    setShowPaymentResult(false);
    setPaymentResult(null);
    setPaymentResultShown(false);
    setAmount('');
    
    // Refresh data when closing payment result
    console.log('🔄 Refreshing data after closing payment result...');
    await loadUserData();
    await loadTransactions();
  };

  // Mock data
  const subscriptionTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Netflix Subscription',
      amount: 15.99,
      type: 'subscription',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      description: 'Salary Payment',
      amount: 2500,
      type: 'add_fund',
      createdAt: '2024-01-14T09:00:00Z',
    },
    {
      id: '3',
      description: 'Spotify Premium',
      amount: 9.99,
      type: 'subscription',
      createdAt: '2024-01-13T14:30:00Z',
    },
    {
      id: '4',
      description: 'Freelance Payment',
      amount: 800,
      type: 'add_fund',
      createdAt: '2024-01-12T16:45:00Z',
    },
    {
      id: '5',
      description: 'Cash Withdrawal',
      amount: 200,
      type: 'withdrawal',
      createdAt: '2024-01-11T11:20:00Z',
    },
  ];

  const depositTransactions: DepositTransaction[] = [
    {
      id: '1',
      description: 'Glass Bottle Deposit',
      amount: 0.25,
      type: 'deposit',
      itemName: 'Glass Bottle',
      dueDate: '2024-02-15',
      returnCondition: 'Good condition',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      description: 'Steel Can Refund',
      amount: 0.10,
      type: 'refund',
      itemName: 'Steel Can',
      status: 'completed',
      createdAt: '2024-01-14T09:00:00Z',
    },
    {
      id: '3',
      description: 'Aluminum Can Deposit',
      amount: 0.15,
      type: 'deposit',
      itemName: 'Aluminum Can',
      dueDate: '2024-02-20',
      returnCondition: 'Clean and dry',
      status: 'active',
      createdAt: '2024-01-13T14:30:00Z',
    },
    {
      id: '4',
      description: 'Plastic Bottle Refund',
      amount: 0.05,
      type: 'refund',
      itemName: 'Plastic Bottle',
      status: 'completed',
      createdAt: '2024-01-12T16:45:00Z',
    },
  ];

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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

  const getTransactionTypeText = (transactionType: string) => {
    switch (transactionType) {
      case 'top_up':
        return 'Nạp tiền';
      case 'withdraw':
        return 'Rút tiền';
      case 'subscription_fee':
        return 'Phí đăng ký';
      case 'borrow_deposit':
        return 'Tiền cọc mượn';
      case 'return_refund':
        return 'Hoàn tiền cọc';
      case 'deposit_forfeited':
        return 'Mất tiền cọc';
      default:
        return transactionType;
    }
  };

  const getTransactionTypeIcon = (transactionType: string) => {
    switch (transactionType) {
      case 'top_up':
        return 'add-circle';
      case 'withdraw':
        return 'remove-circle';
      case 'subscription_fee':
        return 'card';
      case 'borrow_deposit':
        return 'cube';
      case 'return_refund':
        return 'refresh';
      case 'deposit_forfeited':
        return 'close-circle';
      default:
        return 'receipt';
    }
  };

  // Filter real transactions based on type
  const filteredTransactions = realTransactions.filter(transaction => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'deposits') return transaction.direction === 'in';
    if (transactionFilter === 'withdrawals') return transaction.direction === 'out';
    return true;
  });





  const quickAmounts = [10000, 50000, 100000, 200000];

  // Load real transactions from API
  const loadTransactions = async () => {
    if (!wallet?._id) return;
    
    try {
      setTransactionsLoading(true);
      console.log('🔄 Loading customer transactions...');
      
      // Load cả personal và deposit_refund transactions
      const [personalResponse, depositRefundResponse] = await Promise.all([
        walletTransactionsApi.getMy({
          walletType: 'customer',
          typeGroup: 'personal',
          page: 1,
          limit: 50,
        }),
        walletTransactionsApi.getMy({
          walletType: 'customer',
          typeGroup: 'deposit_refund',
          page: 1,
          limit: 50,
        }),
      ]);
      
      console.log('📡 Personal Transactions API Response:', personalResponse);
      console.log('📡 Deposit Refund Transactions API Response:', depositRefundResponse);
      
      // Merge cả 2 loại transactions và sort theo createdAt (mới nhất trước)
      const allTransactions = [
        ...(personalResponse.statusCode === 200 && personalResponse.data ? personalResponse.data : []),
        ...(depositRefundResponse.statusCode === 200 && depositRefundResponse.data ? depositRefundResponse.data : []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('✅ All customer transactions:', allTransactions);
      console.log('✅ Total number of transactions:', allTransactions.length);
      setRealTransactions(allTransactions);
      
      // Calculate summary - only count completed transactions
      let income = 0;
      let expenses = 0;
      
      allTransactions.forEach(transaction => {
        // Only count completed transactions (not processing or failed)
        if (transaction.status === 'completed') {
          if (transaction.direction === 'in') {
            income += transaction.amount;
          } else {
            expenses += transaction.amount;
          }
        }
      });
      
      console.log('📊 Customer transactions breakdown:', {
        total: allTransactions.length,
        personal: personalResponse.statusCode === 200 && personalResponse.data ? personalResponse.data.length : 0,
        depositRefund: depositRefundResponse.statusCode === 200 && depositRefundResponse.data ? depositRefundResponse.data.length : 0,
        completed: allTransactions.filter(t => t.status === 'completed').length,
        processing: allTransactions.filter(t => t.status === 'processing').length,
        failed: allTransactions.filter(t => t.status === 'failed').length,
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

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing all data...');
    await loadUserData();
    await loadTransactions();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomerHeader
          title="Customer Wallet"
          user={user}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomerHeader
        title="Customer Wallet"
        user={user}
        rightAction={
          <TouchableOpacity 
            style={styles.iconGhost}
            onPress={forceRefresh}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={transactionsLoading}
            onRefresh={forceRefresh}
            colors={['#0F4D3A']}
            tintColor="#0F4D3A"
          />
        }
      >

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
                {wallet?.balance && typeof wallet.balance === 'number' ? wallet.balance.toLocaleString('vi-VN') : '0'} VNĐ
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VNĐ</Text>
            )}
          </View>
          
          <Text style={styles.cardSubtitle}>Customer Account</Text>
        </View>

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

        {/* Action Buttons - Deposit & Withdraw */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.addFundsButton]}
            onPress={() => {
              console.log('💰 Deposit button pressed');
              setShowAddFunds(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>Deposit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => {
              console.log('💸 Withdraw button pressed');
              setShowWithdraw(true);
            }}
            activeOpacity={0.8}
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
        <View style={styles.transactionHistorySection}>
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
                      <Text style={styles.transactionTitle}>
                        {transaction.transactionType ? getTransactionTypeText(transaction.transactionType) : transaction.description}
                      </Text>
                      {transaction.description && transaction.transactionType && (
                        <Text style={styles.transactionSubtitle}>{transaction.description}</Text>
                      )}
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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

      {/* Deposit Modal */}
      <Modal
        visible={showAddFunds}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
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
          <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
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
              Available balance: {wallet?.balance ? wallet.balance.toLocaleString('vi-VN') : '0'} VNĐ
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

      {/* VNPay WebView Modal */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={() => setShowPaymentWebView(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>VNPay Payment</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.webView}
            onNavigationStateChange={(navState) => {
              console.log('🔍 WebView navigation:', navState.url);
              
              // Check for success URL
              if (navState.url.includes('vnp_ResponseCode=00') || navState.url.includes('success')) {
                console.log('✅ Payment success detected');
                handlePaymentSuccess();
              }
              
              // Check for failure URL
              if (navState.url.includes('vnp_ResponseCode=') && !navState.url.includes('vnp_ResponseCode=00')) {
                console.log('❌ Payment failure detected');
                handlePaymentFailure();
              }
            }}
            onError={(error) => {
              console.error('❌ WebView error:', error);
              handlePaymentFailure();
            }}
          />
        </View>
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



      {/* VNPay WebView Modal */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowPaymentWebView(false);
                setPaymentUrl('');
                // Reload wallet data after payment
                loadUserData();
              }}
            >
              <Text style={styles.webViewCloseButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>VNPay Payment</Text>
            <View style={{ width: 60 }} />
          </View>
          
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.webView}
            onNavigationStateChange={(navState) => {
              console.log('🔍 WebView Navigation:', navState.url);
              
              // Check if user returned from VNPay (success/failure)
              if (navState.url.includes('vnpay') && (navState.url.includes('success') || navState.url.includes('cancel'))) {
                console.log('🔍 Payment completed, closing WebView');
                setShowPaymentWebView(false);
                setPaymentUrl('');
                loadUserData();
              }
              
              
              // Handle payment success redirect
              if (navState.url.includes('payment-success') && !isPaymentProcessing && !paymentResultShown) {
                console.log('🔍 Payment success redirect received');
                console.log('🔍 Current wallet balance before reload:', wallet?.balance);
                console.log('🔍 Amount from input:', amount);
                
                // Set flags to prevent multiple triggers
                setIsPaymentProcessing(true);
                setPaymentResultShown(true);
                
                // Close WebView immediately
                setShowPaymentWebView(false);
                setPaymentUrl('');
                
                // Show success screen
                setPaymentResult('success');
                setPaymentAmount(savedPaymentAmount);
                setShowPaymentResult(true);
                console.log('🔍 Setting payment amount from saved:', savedPaymentAmount);
                
                // Wait for backend to process, then reload
                setTimeout(async () => {
                  console.log('🔄 Reloading wallet data after payment...');
                  await loadUserData();
                  await loadTransactions(); // Also reload transactions to get updated status
                  console.log('🔍 New wallet balance after reload:', wallet?.balance);
                }, 2000);
              }
              
              // Handle payment failure redirect
              if (navState.url.includes('payment-failed') && !isPaymentProcessing && !paymentResultShown) {
                console.log('🔍 Payment failed redirect received');
                
                // Set flags to prevent multiple triggers
                setIsPaymentProcessing(true);
                setPaymentResultShown(true);
                
                // Close WebView immediately
                setShowPaymentWebView(false);
                setPaymentUrl('');
                
                // Show failure screen
                setPaymentResult('failed');
                setPaymentAmount(savedPaymentAmount);
                setShowPaymentResult(true);
                console.log('🔍 Setting failed payment amount from saved:', savedPaymentAmount);
              }
            }}
            onError={(error) => {
              console.error('WebView Error:', error);
              Alert.alert('Error', 'Failed to load payment page');
            }}
          />
        </View>
      </Modal>

      {/* Payment Result Modal */}
      <Modal
        visible={showPaymentResult}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.paymentResultContainer}>
          <View style={styles.paymentResultContent}>
            {paymentResult === 'success' ? (
              <>
                {/* Success Screen */}
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                </View>
                <Text style={styles.paymentResultTitle}>Payment Successful!</Text>
                <Text style={styles.paymentResultSubtitle}>
                  Your payment of {paymentAmount.toLocaleString('vi-VN')} VNĐ has been processed successfully.
                </Text>
                <View style={styles.paymentResultDetails}>
                  <View style={styles.paymentResultRow}>
                    <Text style={styles.paymentResultLabel}>Amount:</Text>
                    <Text style={styles.paymentResultValue}>{paymentAmount.toLocaleString('vi-VN')} VNĐ</Text>
                  </View>
                  <View style={styles.paymentResultRow}>
                    <Text style={styles.paymentResultLabel}>Status:</Text>
                    <Text style={[styles.paymentResultValue, { color: '#10B981' }]}>Completed</Text>
                  </View>
                  <View style={styles.paymentResultRow}>
                    <Text style={styles.paymentResultLabel}>Time:</Text>
                    <Text style={styles.paymentResultValue}>{new Date().toLocaleString('vi-VN')}</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Failure Screen */}
                <View style={styles.failureIconContainer}>
                  <Ionicons name="close-circle" size={80} color="#EF4444" />
                </View>
                <Text style={styles.paymentResultTitle}>Payment Failed</Text>
                <Text style={styles.paymentResultSubtitle}>
                  Your payment of {paymentAmount.toLocaleString('vi-VN')} VNĐ could not be processed.
                </Text>
                <View style={styles.paymentResultDetails}>
                  <View style={styles.paymentResultRow}>
                    <Text style={styles.paymentResultLabel}>Amount:</Text>
                    <Text style={styles.paymentResultValue}>{paymentAmount.toLocaleString('vi-VN')} VNĐ</Text>
                  </View>
                  <View style={styles.paymentResultRow}>
                    <Text style={styles.paymentResultLabel}>Status:</Text>
                    <Text style={[styles.paymentResultValue, { color: '#EF4444' }]}>Failed</Text>
                  </View>
                  <View style={styles.paymentResultRow}>
                    <Text style={styles.paymentResultLabel}>Time:</Text>
                    <Text style={styles.paymentResultValue}>{new Date().toLocaleString('vi-VN')}</Text>
                  </View>
                </View>
              </>
            )}
            
            <View style={styles.paymentResultActions}>
              <TouchableOpacity 
                style={styles.paymentResultButton}
                onPress={async () => {
                  setShowPaymentResult(false);
                  setPaymentResult(null);
                  setPaymentAmount(0);
                  setSavedPaymentAmount(0);
                  setAmount('');
                  setIsPaymentProcessing(false);
                  setPaymentResultShown(false);
                  
                  // Refresh transactions to get updated status
                  if (paymentResult === 'success') {
                    console.log('🔄 Refreshing transactions after successful payment...');
                    await loadTransactions();
                  }
                }}
              >
                <Text style={styles.paymentResultButtonText}>
                  {paymentResult === 'success' ? 'Continue' : 'Try Again'}
                </Text>
              </TouchableOpacity>
              
              {paymentResult === 'success' && (
                <TouchableOpacity 
                  style={[styles.paymentResultButton, styles.paymentResultButtonSecondary]}
                  onPress={() => {
                    setShowPaymentResult(false);
                    setPaymentResult(null);
                    setPaymentAmount(0);
                    setSavedPaymentAmount(0);
                    setAmount('');
                    setIsPaymentProcessing(false);
                    setPaymentResultShown(false);
                    setShowAddFunds(true);
                  }}
                >
                  <Text style={styles.paymentResultButtonTextSecondary}>Add More Funds</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconGhost: { 
    height: 36, 
    width: 36, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.15)' 
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
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
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addFundsButton: {
    backgroundColor: '#0F4D3A',
  },
  withdrawButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  wiseLogo: {
    width: 24,
    height: 24,
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
  transactionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  // Old modal styles - keeping for backward compatibility but not used
  modalBody: {
    marginBottom: 24,
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: 100, // Tránh bị che bởi navigation bar
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  modalButton: {
    backgroundColor: '#00704A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceSection: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceCard: {
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
  cardTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  addFundsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  withdrawText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 4,
  },
  balanceContainer: {
    marginVertical: 15,
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
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // New modal styles
  newModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  newModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
  },
  newModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  newModalContent: {
    flex: 1,
    padding: 20,
  },
  newModalSubtitle: {
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
    color: '#3B82F6',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  newQuickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 8,
  },
  newQuickAmountButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  newQuickAmountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  depositConfirmButton: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#3B82F6',
    paddingTop: 50, // Account for status bar
  },
  webViewCloseButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  webView: {
    flex: 1,
  },
  // Loading and Empty State styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Payment Result styles
  paymentResultContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentResultContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  failureIconContainer: {
    marginBottom: 20,
  },
  paymentResultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  paymentResultSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  paymentResultDetails: {
    width: '100%',
    marginBottom: 30,
  },
  paymentResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentResultLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentResultValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  paymentResultActions: {
    width: '100%',
    gap: 12,
  },
  paymentResultButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentResultButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  paymentResultButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentResultButtonTextSecondary: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles (from business wallet)
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
    paddingTop: 50, // Account for status bar
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
  addFundsConfirmButton: {
    backgroundColor: '#0F4D3A',
  },
  withdrawConfirmButton: {
    backgroundColor: '#F59E0B',
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
