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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import BusinessHeader from '../../../components/BusinessHeader';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';
import { walletApi, WalletTransaction, walletTransactionsApi } from '../../../lib/api';
import { businessesApi } from '../../../src/services/api/businessService';
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
          page: 1,
          limit: 50,
        });
        
        console.log('📡 Transactions API Response:', response);
        
        if (response.statusCode === 200 && response.data) {
          setRealTransactions(response.data);
          console.log('✅ Loaded transactions:', response.data.length);
          
          // Calculate summary - only count completed transactions
          let income = 0;
          let expenses = 0;
          
          response.data.forEach(transaction => {
            // Only count completed transactions
            if (transaction.status === 'completed') {
              if (transaction.direction === 'in') {
                income += transaction.amount;
              } else {
                expenses += transaction.amount;
              }
            }
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
        page: 1,
        limit: 50,
      });
      
      console.log('📊 Real transactions response:', response);
      setRealTransactions(response.data);
      
      // Calculate summary - only count completed transactions
      let income = 0;
      let expenses = 0;
      
      response.data.forEach(transaction => {
        // Only count completed transactions
        if (transaction.status === 'completed') {
          if (transaction.direction === 'in') {
            income += transaction.amount;
          } else {
            expenses += transaction.amount;
          }
        }
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

  const handlePaymentSuccess = async () => {
    console.log('✅ Payment successful, closing WebView and showing result');
    setShowPaymentWebView(false);
    setPaymentResult('success');
    setShowPaymentResult(true);
    setPaymentResultShown(true);
    
    // Immediate refresh
    await loadBusinessData();
    await loadTransactions();
    
    // Additional refresh after delay to ensure data is updated
    setTimeout(async () => {
      console.log('🔄 Refreshing data after payment success...');
      await loadBusinessData();
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
    await loadBusinessData();
    await loadTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'returned':
        return '#10B981';
      case 'active':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'Active';
      case 'overdue':
        return 'Overdue';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <BusinessHeader
        title="Business Wallet"
        user={businessProfile ? {
          _id: businessProfile.userId._id,
          email: businessProfile.userId.email,
          name: businessProfile.userId.username,
          fullName: businessProfile.businessName,
          avatar: businessProfile.businessLogoUrl || undefined,
          role: 'business' as const,
        } : null}
        rightAction={
          <TouchableOpacity 
            style={styles.refreshButton}
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
                {wallet?.availableBalance && typeof wallet.availableBalance === 'number' ? wallet.availableBalance.toLocaleString('vi-VN') : '0'} VNĐ
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VNĐ</Text>
            )}
          </View>
          
          <Text style={styles.cardSubtitle}>Business Account</Text>
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
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFunds(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Deposit</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
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
          </View>
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
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
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
    padding: 20,
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