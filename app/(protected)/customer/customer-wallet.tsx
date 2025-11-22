import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Modal,
  ScrollView,
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
import { getCurrentUserProfileWithAutoRefresh } from '@/services/api/userService';
import { User } from '@/types/auth.types';
import { walletApi, walletTransactionsApi, type WalletDetails, type WalletTransaction } from '@/services/api/walletService';

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
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'deposits'>('subscriptions');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'plus' | 'minus'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'plus' | 'minus'>('all');
  
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
          
          setWallet({
            _id: userData.wallet._id,
            balance: typeof userData.wallet.balance === 'number' ? userData.wallet.balance : 0,
          });
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
        loadTransactions(); // Also reload transactions to get updated status
        loadAllTransactionsForSummary(); // Also reload summary
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [wallet?._id, isPaymentProcessing, showPaymentWebView]);

  // Load transactions when component mounts and when activeTab or filters change
  useEffect(() => {
    if (wallet?._id) {
      loadTransactions();
    }
  }, [activeTab, subscriptionFilter, depositFilter, wallet?._id]);

  // Load all transactions for summary when component mounts
  useEffect(() => {
    if (wallet?._id) {
      loadAllTransactionsForSummary();
    }
  }, [wallet?._id]);

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
        
        setWallet({
          _id: userData.wallet._id,
          balance: typeof userData.wallet.balance === 'number' ? userData.wallet.balance : 0,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    console.log('🚀 Starting customer deposit process...');
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
        console.log('🔗 URL type:', typeof paymentUrl);
        console.log('🔗 URL length:', paymentUrl?.length);
        console.log('🔗 URL starts with:', paymentUrl?.substring(0, 50));
        
        // Validate URL before showing WebView
        if (!paymentUrl || paymentUrl.trim() === '') {
          console.error('❌ Empty payment URL');
          Alert.alert('Error', 'Invalid payment URL received');
          return;
        }
        
        if (!paymentUrl.startsWith('http')) {
          console.error('❌ Invalid URL format:', paymentUrl);
          Alert.alert('Error', 'Invalid payment URL format');
          return;
        }
        
        
        const paymentAmountValue = Number(amount) || 0;
        setSavedPaymentAmount(paymentAmountValue);
        console.log('🔍 Saving payment amount:', paymentAmountValue);
        
        
        setShowAddFunds(false);
        setPaymentUrl(paymentUrl);
        setShowPaymentWebView(true);
      } else {
        console.log('✅ Direct deposit successful');
        Alert.alert('Success', 'Deposit successful');
        // Reload wallet data
        await loadUserData();
      }
      
      setShowAddFunds(false);
      setAmount('');
    } catch (error: any) {
      console.error('❌ Deposit error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      Alert.alert('Error', `Failed to process deposit: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    console.log('🚀 Starting customer withdraw process...');
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

    if (Number(amount) > (wallet.balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('📡 Calling withdraw API...');
      console.log('📡 API URL:', `/wallets/${wallet._id}/withdraw`);
      console.log('📡 Amount:', Number(amount));
      
      await walletApi.withdraw(wallet._id, Number(amount));
      console.log('✅ Withdraw successful');
      
      Alert.alert('Success', 'Withdrawal successful');
      setShowWithdraw(false);
      setAmount('');
      
      // Reload wallet data
      await loadUserData();
    } catch (error: any) {
      console.error('❌ Withdraw error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      Alert.alert('Error', `Failed to process withdrawal: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
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
      case 'completed': return '#10B981';
      case 'active': return '#3B82F6';
      case 'overdue': return '#EF4444';
      case 'returned': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const filteredSubscriptionTransactions = subscriptionTransactions.filter(transaction => {
    if (subscriptionFilter === 'all') return true;
    if (subscriptionFilter === 'plus') return transaction.type === 'add_fund';
    if (subscriptionFilter === 'minus') return transaction.type === 'subscription' || transaction.type === 'withdrawal';
    return true;
  });

  const filteredDepositTransactions = depositTransactions.filter(transaction => {
    if (depositFilter === 'all') return true;
    if (depositFilter === 'plus') return transaction.type === 'refund';
    if (depositFilter === 'minus') return transaction.type === 'deposit';
    return true;
  });




  const handleAddFunds = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    // Handle add funds logic here
    setShowAddFunds(false);
    setAmount('');
  };

  const quickAmounts = [10000, 50000, 100000, 200000];

  // Load real transactions from API
  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      console.log('📡 Loading transactions from API...');
      
      // Determine direction based on active tab and filter
      let direction: 'in' | 'out' | undefined = undefined;
      
      if (activeTab === 'subscriptions') {
        if (subscriptionFilter === 'plus') direction = 'in';
        else if (subscriptionFilter === 'minus') direction = 'out';
      } else if (activeTab === 'deposits') {
        if (depositFilter === 'plus') direction = 'in';
        else if (depositFilter === 'minus') direction = 'out';
      }
      
      const response = await walletTransactionsApi.getMy({
        typeGroup: 'personal',
        direction: direction,
        page: 1,
        limit: 20
      });
      
      console.log('✅ Transactions loaded:', response.data);
      setRealTransactions(response.data);
      
      // Calculate summary from loaded transactions
      calculateSummary(response.data);
    } catch (error: any) {
      console.error('❌ Error loading transactions:', error);
      // Fallback to mock data if API fails
      setRealTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Force refresh transactions (useful after payment)
  const refreshTransactions = async () => {
    console.log('🔄 Force refreshing transactions...');
    await loadTransactions();
    await loadAllTransactionsForSummary(); // Also refresh summary
  };

  // Calculate income and expenses from transactions
  const calculateSummary = (transactions: WalletTransaction[]) => {
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.direction === 'in') {
        income += transaction.amount;
      } else if (transaction.direction === 'out') {
        expenses += transaction.amount;
      }
    });
    
    console.log('💰 Calculated summary:', { income, expenses });
    setTotalIncome(income);
    setTotalExpenses(expenses);
  };

  // Load all transactions for summary calculation
  const loadAllTransactionsForSummary = async () => {
    try {
      console.log('📡 Loading all transactions for summary...');
      
      const response = await walletTransactionsApi.getMy({
        typeGroup: 'personal',
        // No direction filter to get all transactions
        page: 1,
        limit: 100 // Get more transactions for accurate summary
      });
      
      console.log('✅ All transactions loaded for summary:', response.data);
      calculateSummary(response.data);
    } catch (error: any) {
      console.error('❌ Error loading all transactions for summary:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomerHeader
          title="Loading..."
          user={user}
        />
        
        {/* Credit Card Section - Show even when loading */}
        <View style={styles.cardSection}>
          <View style={styles.creditCard}>
            <View style={styles.cardPattern}>
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
              <View style={styles.patternCircle3} />
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardAccountNumber}>{t('wallet').totalBalance}</Text>
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowBalance(!showBalance)}
              >
                <Ionicons 
                  name={showBalance ? "eye" : "eye-off"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Balance Display */}
            <View style={styles.balanceContainer}>
              {showBalance ? (
                <Text style={styles.balanceAmount}>
                  Loading...
                </Text>
              ) : (
                <Text style={styles.balanceHidden}>•••••••• VND</Text>
              )}
            </View>
            
            <Text style={styles.cardName}>Loading...</Text>
            
            {/* Action Button - Right aligned */}
            <View style={styles.cardActionsRight}>
              <TouchableOpacity 
                style={styles.depositWithdrawButton}
                onPress={() => setShowAddFunds(true)}
              >
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.depositWithdrawText}>Deposit</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomerHeader
        title={getTimeBasedGreeting() + ", " + ((user as any)?.fullName || user?.name || "User")}
        subtitle="Wallet & Transactions"
        user={user}
      />

      {/* Credit Card Section - Outside ScrollView */}
      <View style={styles.cardSection}>
        <View style={styles.creditCard}>
          <View style={styles.cardPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            <View style={styles.patternCircle3} />
          </View>
          <View style={styles.cardHeader}>
            <Text style={styles.cardAccountNumber}>{t('wallet').totalBalance}</Text>
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowBalance(!showBalance)}
            >
              <Ionicons 
                name={showBalance ? "eye" : "eye-off"} 
                size={20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Balance Display */}
          <View style={styles.balanceContainer}>
            {showBalance ? (
              <Text style={styles.balanceAmount}>
                {wallet?.balance && typeof wallet.balance === 'number' ? wallet.balance.toLocaleString('vi-VN') : '0'} VND
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VND</Text>
            )}
          </View>
          
          <Text style={styles.cardName}>{(user as any)?.fullName || user?.name || "User"}</Text>
          
          {/* Action Buttons - Right aligned */}
          <View style={styles.cardActionsRight}>
            <TouchableOpacity 
              style={[styles.depositWithdrawButton, { marginRight: 8 }]}
              onPress={() => setShowAddFunds(true)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.depositWithdrawText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.depositWithdrawButton}
              onPress={() => {
                console.log('🔘 Withdraw button clicked');
                console.log('🔘 Current showWithdraw state:', showWithdraw);
                setShowWithdraw(true);
                console.log('🔘 Set showWithdraw to true');
              }}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
              <Text style={styles.depositWithdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>{t('wallet').income}</Text>
              <Ionicons name="arrow-up" size={16} color="#fff" />
                </View>
            <Text style={styles.summaryAmount}>
              {totalIncome.toLocaleString('vi-VN')} VND
            </Text>
                </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>{t('wallet').expenses}</Text>
              <Ionicons name="arrow-down" size={16} color="#fff" />
              </View>
            <Text style={styles.summaryAmount}>
              {totalExpenses.toLocaleString('vi-VN')} VND
            </Text>
                </View>
        </View>

        {/* Transaction Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "subscriptions" && styles.activeTab]}
            onPress={() => setActiveTab("subscriptions")}
          >
            <Text style={[styles.tabText, activeTab === "subscriptions" && styles.activeTabText]}>
              Transactions & Withdrawals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "deposits" && styles.activeTab]}
            onPress={() => setActiveTab("deposits")}
          >
            <Text style={[styles.tabText, activeTab === "deposits" && styles.activeTabText]}>
              Deposits & Refunds
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          {/* Refresh Button */}
          <View style={styles.refreshHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshTransactions}
              disabled={transactionsLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={transactionsLoading ? "#9CA3AF" : "#3B82F6"} 
              />
            </TouchableOpacity>
          </View>
          
          {activeTab === "subscriptions" && (
            <>
              {/* Filter Buttons */}
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[styles.filterButton, subscriptionFilter === "all" && styles.activeFilterButton]}
                  onPress={() => setSubscriptionFilter("all")}
                >
                  <Text style={[styles.filterText, subscriptionFilter === "all" && styles.activeFilterText]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, subscriptionFilter === "plus" && styles.activeFilterButton]}
                  onPress={() => setSubscriptionFilter("plus")}
                >
                  <Ionicons name="arrow-up" size={14} color={subscriptionFilter === "plus" ? "#fff" : "#3B9797"} />
                  <Text style={[styles.filterText, subscriptionFilter === "plus" && styles.activeFilterText]}>
                    {t('wallet').income}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, subscriptionFilter === "minus" && styles.activeFilterButton]}
                  onPress={() => setSubscriptionFilter("minus")}
                >
                  <Ionicons name="arrow-down" size={14} color={subscriptionFilter === "minus" ? "#fff" : "#BF092F"} />
                  <Text style={[styles.filterText, subscriptionFilter === "minus" && styles.activeFilterText]}>
                    {t('wallet').expenses}
                  </Text>
                </TouchableOpacity>
              </View>

              {transactionsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
              ) : realTransactions.length > 0 ? (
                realTransactions.map((transaction) => (
                <View key={transaction._id} style={styles.subscriptionCard}>
                  <View style={[styles.subscriptionIcon, { backgroundColor: transaction.direction === "in" ? "#D1FAE5" : "#FEE2E2" }]}>
                    {transaction.transactionType === "deposit" ? (
                      <Ionicons name="add-circle" size={20} color={transaction.direction === "in" ? "#10B981" : "#EF4444"} />
                    ) : transaction.transactionType === "withdraw" ? (
                      <Ionicons name="remove-circle" size={20} color={transaction.direction === "in" ? "#10B981" : "#EF4444"} />
                    ) : transaction.transactionType === "subscription_fee" ? (
                      <Ionicons name="card" size={20} color={transaction.direction === "in" ? "#10B981" : "#EF4444"} />
                    ) : (
                      <Ionicons name="card" size={20} color={transaction.direction === "in" ? "#10B981" : "#EF4444"} />
                    )}
                  </View>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionName}>{transaction.description}</Text>
                    <Text style={styles.subscriptionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString("vi-VN", { 
                        day: "numeric", 
                        month: "long", 
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </Text>
                  </View>
                  <View style={styles.subscriptionAmount}>
                    <Text style={[styles.subscriptionAmountText, { color: transaction.direction === "in" ? "#10B981" : "#EF4444" }]}>
                      {transaction.direction === "in" ? "+" : "-"} {transaction.amount.toLocaleString('vi-VN')} VND
                    </Text>
                    <View style={[styles.subscriptionStatus, { 
                      backgroundColor: transaction.status === "completed" ? "#D1FAE5" : 
                                     transaction.status === "processing" ? "#FEF3C7" : "#FEE2E2"
                    }]}>
                      <Text style={[styles.subscriptionStatusText, { 
                        color: transaction.status === "completed" ? "#065F46" : 
                               transaction.status === "processing" ? "#92400E" : "#991B1B"
                      }]}>
                        {transaction.status === "completed" ? "Completed" : 
                         transaction.status === "processing" ? "Processing" : "Failed"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No transactions found</Text>
                </View>
              )}
            </>
          )}

          {activeTab === "deposits" && (
            <>
              {/* Filter Buttons */}
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[styles.filterButton, depositFilter === "all" && styles.activeFilterButton]}
                  onPress={() => setDepositFilter("all")}
                >
                  <Text style={[styles.filterText, depositFilter === "all" && styles.activeFilterText]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, depositFilter === "plus" && styles.activeFilterButton]}
                  onPress={() => setDepositFilter("plus")}
                >
                  <Ionicons name="arrow-up" size={14} color={depositFilter === "plus" ? "#fff" : "#3B9797"} />
                  <Text style={[styles.filterText, depositFilter === "plus" && styles.activeFilterText]}>
                    Refunds
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, depositFilter === "minus" && styles.activeFilterButton]}
                  onPress={() => setDepositFilter("minus")}
                >
                  <Ionicons name="arrow-down" size={14} color={depositFilter === "minus" ? "#fff" : "#BF092F"} />
                  <Text style={[styles.filterText, depositFilter === "minus" && styles.activeFilterText]}>
                    Deposits
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredDepositTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, { backgroundColor: transaction.type === "refund" ? "#E6F7F7" : "#FCE8E8" }]}>
                    {transaction.itemName?.includes("Glass") ? (
                      <Ionicons name="wine" size={18} color={transaction.type === "refund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.itemName?.includes("Steel") ? (
                      <Ionicons name="flask" size={18} color={transaction.type === "refund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.itemName?.includes("Aluminum") ? (
                      <Ionicons name="cube" size={18} color={transaction.type === "refund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.itemName?.includes("Plastic") ? (
                      <Ionicons name="cube" size={18} color={transaction.type === "refund" ? "#3B9797" : "#BF092F"} />
                    ) : (
                    <Ionicons
                        name={transaction.type === "refund" ? "arrow-up" : "arrow-down"}
                      size={18}
                      color={transaction.type === "refund" ? "#3B9797" : "#BF092F"}
                    />
                    )}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.transactionItem}>{transaction.itemName}</Text>
                    {transaction.dueDate && (
                      <Text style={styles.transactionDue}>Due: {new Date(transaction.dueDate).toLocaleDateString()}</Text>
                    )}
                    {transaction.returnCondition && (
                      <Text style={styles.transactionCondition}>Condition: {transaction.returnCondition}</Text>
                    )}
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: transaction.type === "refund" ? "#3B9797" : "#BF092F" }]}>
                      {transaction.type === "refund" ? "+" : "-"}{(transaction.amount * 25000).toLocaleString('vi-VN')} VND
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status === "completed" ? "Completed" : 
                         transaction.status === "active" ? "Active" : 
                         transaction.status === "overdue" ? "Overdue" : 
                         transaction.status === "returned" ? "Returned" : transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Funds Modal - Old Beautiful Design */}
      {showAddFunds && (
        <Modal
          visible={showAddFunds}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddFunds(false)}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Deposit Money</Text>
              <TouchableOpacity onPress={() => setShowAddFunds(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
              
            <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Amount (VND)</Text>
              <TextInput
                style={styles.modalInput}
                  placeholder="Enter amount"
                  value={amount}
                  onChangeText={setAmount}
                keyboardType="numeric"
              />
                
                <Text style={styles.modalLabel}>Quick Amounts</Text>
              <View style={styles.quickAmounts}>
                  {quickAmounts.map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={styles.quickAmountButton}
                      onPress={() => setAmount(quickAmount.toString())}
                    >
                      <Text style={styles.quickAmountText}>{quickAmount.toLocaleString('vi-VN')} VND</Text>
                </TouchableOpacity>
                  ))}
              </View>
            </View>
              
              <TouchableOpacity style={styles.modalButton} onPress={handleDeposit}>
                <Text style={styles.modalButtonText}>Deposit</Text>
              </TouchableOpacity>
            </View>
              </View>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <Modal
          visible={showWithdraw}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            console.log('🔘 Withdraw modal onRequestClose called');
            setShowWithdraw(false);
          }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Withdraw Money</Text>
              <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
              
            <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Withdrawal Amount (VND)</Text>
              <TextInput
                style={styles.modalInput}
                  placeholder="Enter amount"
                  value={amount}
                  onChangeText={setAmount}
                keyboardType="numeric"
              />
                
                <Text style={styles.modalLabel}>Quick Amounts</Text>
              <View style={styles.quickAmounts}>
                  {quickAmounts.map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={styles.quickAmountButton}
                      onPress={() => setAmount(quickAmount.toString())}
                    >
                      <Text style={styles.quickAmountText}>{quickAmount.toLocaleString('vi-VN')} VND</Text>
                </TouchableOpacity>
                  ))}
              </View>
            </View>
              
              <TouchableOpacity style={styles.modalButton} onPress={handleWithdraw}>
                <Text style={styles.modalButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
              </View>
        </Modal>
      )}



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
                    await refreshTransactions();
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  addCardButton: {
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditCard: {
    width: '100%',
    height: 250,
    backgroundColor: '#0F4D3A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
  },
  patternCircle1: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 50,
    right: 50,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardChip: {
    width: 30,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardExpiry: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  summarySection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#3B9797',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseCard: {
    backgroundColor: '#BF092F',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionsSection: {
    marginTop: 8,
  },
  refreshHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  subscriptionCard: {
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
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  subscriptionDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  subscriptionAmount: {
    alignItems: 'flex-end',
  },
  subscriptionAmountText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: 'center',
  },
  subscriptionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subscriptionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#00704A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  activeFilterButton: {
    backgroundColor: '#00704A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#fff',
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
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionDue: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionCondition: {
    fontSize: 12,
    color: '#6B7280',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    marginBottom: 24,
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
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  addFundsButton: {
    backgroundColor: '#00704A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  cardAccountNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  cardBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cardActionsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardActionText: {
    color: '#00704A',
    fontSize: 10,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    zIndex: 10,
    elevation: 10,
  },
  balanceContainer: {
    marginVertical: 15,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  balanceHidden: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
  },
  depositButton: {
    backgroundColor: '#10B981',
    flex: 1,
    marginRight: 8,
  },
  withdrawButton: {
    backgroundColor: '#EF4444',
    flex: 1,
    marginLeft: 8,
  },
  depositButtonText: {
    color: '#FFFFFF',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
  },
  depositWithdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  depositWithdrawText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#00704A',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  depositModalButton: {
    backgroundColor: '#10B981',
  },
  withdrawModalButton: {
    backgroundColor: '#EF4444',
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
  cancelButton: {
    fontSize: 16,
    color: 'white',
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
  withdrawConfirmButton: {
    backgroundColor: '#F59E0B',
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
});
