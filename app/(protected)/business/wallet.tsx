import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, AppState, Dimensions, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';
import { getCurrentUserProfileWithAutoRefresh, User, walletApi, WalletDetails } from '../../../lib/api';

const { width: screenWidth } = Dimensions.get('window')

export default function BusinessWalletPage() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'add-funds' | 'receive-return'>('add-funds');
  const [addFundsFilter, setAddFundsFilter] = useState<'all' | 'add_funds' | 'withdraw'>('all');
  const [receiveReturnFilter, setReceiveReturnFilter] = useState<'all' | 'receive' | 'return'>('all');
  
  // Deposit/Withdraw modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load user data and wallet
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (auth.state.accessToken) {
          const userData = await getCurrentUserProfileWithAutoRefresh();
          setUser(userData);
          
          // Use wallet data directly from user profile
          if (userData.wallet) {
            console.log('🔍 Wallet data from API:', userData.wallet);
            console.log('💰 Balance type:', typeof userData.wallet.balance);
            console.log('💰 Balance value:', userData.wallet.balance);
            
            setWallet({
              _id: userData.wallet._id,
              balance: typeof userData.wallet.balance === 'number' ? userData.wallet.balance : 0,
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [auth.state.accessToken]);

  // Listen for app state changes to refresh wallet after payment
  useEffect(() => {
    const handleAppStateChange = () => {
      // Refresh wallet data when app becomes active (user returns from VNPay)
      if (wallet?._id) {
        loadUserData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [wallet?._id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#00704A" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const mockTransactions = [
    {
      id: "1",
      type: "add_funds",
      description: "Added funds to wallet",
      amount: 500000,
      createdAt: new Date("2024-01-15"),
    },
    { 
      id: "2", 
      type: "withdraw", 
      description: "ATM Withdrawal", 
      amount: 200000, 
      createdAt: new Date("2024-01-14") 
    },
    {
      id: "3",
      type: "receive",
      description: "Received payment from customer",
      amount: 250000,
      createdAt: new Date("2024-01-13"),
    },
    {
      id: "4",
      type: "return",
      description: "Refunded customer deposit",
      amount: 150000,
      createdAt: new Date("2024-01-12"),
    },
    {
      id: "5",
      type: "add_funds",
      description: "Bank transfer deposit",
      amount: 1000000,
      createdAt: new Date("2024-01-11"),
    },
    {
      id: "6",
      type: "receive",
      description: "Container deposit received",
      amount: 50000,
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "7",
      type: "withdraw",
      description: "Business expense payment",
      amount: 300000,
      createdAt: new Date("2024-01-09"),
    },
    {
      id: "8",
      type: "return",
      description: "Customer refund processed",
      amount: 75000,
      createdAt: new Date("2024-01-08"),
    },
  ];

  const filterAddFundsTransactions = (transactions: any[]) => {
    if (addFundsFilter === "all") return transactions.filter((t) => ["add_funds", "withdraw"].includes(t.type));
    return transactions.filter((t) => t.type === addFundsFilter);
  };

  const filterReceiveReturnTransactions = (transactions: any[]) => {
    if (receiveReturnFilter === "all") return transactions.filter((t) => ["receive", "return"].includes(t.type));
    return transactions.filter((t) => t.type === receiveReturnFilter);
  };

  const handleDeposit = async () => {
    console.log('🚀 Starting deposit process...');
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
        
        Alert.alert(
          'Redirect to Payment',
          'You will be redirected to VNPay to complete the payment.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: async () => {
                try {
                  if (paymentUrl) {
                    const supported = await Linking.canOpenURL(paymentUrl);
                    if (supported) {
                      await Linking.openURL(paymentUrl);
                    } else {
                      Alert.alert('Error', 'Cannot open payment URL');
                    }
                  } else {
                    Alert.alert('Error', 'No payment URL received');
                  }
                } catch (error) {
                  console.error('Error opening payment URL:', error);
                  Alert.alert('Error', 'Failed to open payment URL');
                }
              },
            },
          ]
        );
      } else {
        console.log('✅ Direct deposit successful');
        Alert.alert('Success', 'Deposit successful');
        // Reload wallet data
        await loadUserData();
      }
      
      setShowDepositModal(false);
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
      setShowWithdrawModal(false);
      setAmount('');
      
      // Reload wallet data
      await loadUserData();
    } catch (error) {
      console.error('Withdraw error:', error);
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadUserData = async () => {
    try {
      if (auth.state.accessToken) {
        const userData = await getCurrentUserProfileWithAutoRefresh();
        setUser(userData);
        
        // Use wallet data directly from user profile
        if (userData.wallet) {
          console.log('🔍 Wallet data from API:', userData.wallet);
          console.log('💰 Balance type:', typeof userData.wallet.balance);
          console.log('💰 Balance value:', userData.wallet.balance);
          
          setWallet({
            _id: userData.wallet._id,
            balance: typeof userData.wallet.balance === 'number' ? userData.wallet.balance : 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#00704A" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Wallet</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
            <View style={styles.patternCircle3} />
          </View>
          <View style={styles.cardHeader}>
            <Text style={styles.cardAccountNumber}>Available Balance</Text>
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
          
          {/* Balance Display */}
          <View style={styles.balanceContainer}>
            {showBalance ? (
              <Text style={styles.balanceAmount}>
                {wallet?.balance && typeof wallet.balance === 'number' ? wallet.balance.toLocaleString('vi-VN') : '0'} VNĐ
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VNĐ</Text>
            )}
          </View>
          
          <Text style={styles.cardName}>Business Account</Text>
          
          {/* Action Button - Right aligned */}
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity style={styles.addFundsButton}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, styles.depositsCard]}>
              <View style={styles.overviewCardHeader}>
                <Text style={styles.overviewCardTitle}>Deposits</Text>
                <Ionicons name="information-circle" size={16} color="#00704A" />
              </View>
              <Text style={styles.overviewCardValue}>1.247.500 VNĐ</Text>
            </View>
            <View style={[styles.overviewCard, styles.refundsCard]}>
              <View style={styles.overviewCardHeader}>
                <Text style={styles.overviewCardTitle}>Refunds</Text>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.overviewCardValue}>892.300 VNĐ</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.primaryButton, styles.depositButton]}
            onPress={() => setShowDepositModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryButton, styles.withdrawButton]}
            onPress={() => setShowWithdrawModal(true)}
          >
            <Ionicons name="remove-circle" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods Section */}
        <View style={styles.paymentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#00704A" />
              <Text style={styles.addButtonText}>Add Method</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.paymentMethod}>
            <View style={styles.methodInfo}>
              <View style={styles.bankIcon}>
                <Ionicons name="card" size={24} color="#00704A" />
              </View>
              <View style={styles.methodDetails}>
                <Text style={styles.methodName}>Vietcombank</Text>
                <Text style={styles.methodNumber}>**** 1234</Text>
              </View>
            </View>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {/* Main Filter Tabs */}
          <View style={styles.mainFilterTabs}>
            <TouchableOpacity
              style={[styles.mainTab, activeTab === 'add-funds' && styles.activeMainTab]}
              onPress={() => setActiveTab('add-funds')}
            >
              <Text style={[styles.mainTabText, activeTab === 'add-funds' && styles.activeMainTabText]}>
                Add Funds & Withdraw
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mainTab, activeTab === 'receive-return' && styles.activeMainTab]}
              onPress={() => setActiveTab('receive-return')}
            >
              <Text style={[styles.mainTabText, activeTab === 'receive-return' && styles.activeMainTabText]}>
                Receive & Return
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Lists */}
          {activeTab === 'add-funds' && (
            <>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, addFundsFilter === 'all' && styles.activeFilterButton]}
                  onPress={() => setAddFundsFilter('all')}
                >
                  <Text style={[styles.filterButtonText, addFundsFilter === 'all' && styles.activeFilterButtonText]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, addFundsFilter === 'add_funds' && styles.activeFilterButton]}
                  onPress={() => setAddFundsFilter('add_funds')}
                >
                  <Text style={[styles.filterButtonText, addFundsFilter === 'add_funds' && styles.activeFilterButtonText]}>
                    + Add Funds
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, addFundsFilter === 'withdraw' && styles.activeFilterButton]}
                  onPress={() => setAddFundsFilter('withdraw')}
                >
                  <Text style={[styles.filterButtonText, addFundsFilter === 'withdraw' && styles.activeFilterButtonText]}>
                    — Withdraw
                  </Text>
                </TouchableOpacity>
              </View>

              {filterAddFundsTransactions(mockTransactions).map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionIcon}>
                      <Ionicons 
                        name={transaction.type === 'add_funds' ? 'arrow-up' : 'arrow-down'} 
                        size={20} 
                        color={transaction.type === 'add_funds' ? '#10B981' : '#EF4444'} 
                      />
                    </View>
                    <View>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>
                        {transaction.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'add_funds' ? '#10B981' : '#EF4444' }
                  ]}>
                    {transaction.type === 'add_funds' ? '+' : '-'}{transaction.amount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              ))}
            </>
          )}

          {activeTab === 'receive-return' && (
            <>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, receiveReturnFilter === 'all' && styles.activeFilterButton]}
                  onPress={() => setReceiveReturnFilter('all')}
                >
                  <Text style={[styles.filterButtonText, receiveReturnFilter === 'all' && styles.activeFilterButtonText]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, receiveReturnFilter === 'receive' && styles.activeFilterButton]}
                  onPress={() => setReceiveReturnFilter('receive')}
                >
                  <Text style={[styles.filterButtonText, receiveReturnFilter === 'receive' && styles.activeFilterButtonText]}>
                    + Receive
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, receiveReturnFilter === 'return' && styles.activeFilterButton]}
                  onPress={() => setReceiveReturnFilter('return')}
                >
                  <Text style={[styles.filterButtonText, receiveReturnFilter === 'return' && styles.activeFilterButtonText]}>
                    — Return
                  </Text>
                </TouchableOpacity>
              </View>

              {filterReceiveReturnTransactions(mockTransactions).map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionIcon}>
                      <Ionicons 
                        name={transaction.type === 'receive' ? 'arrow-down' : 'arrow-up'} 
                        size={20} 
                        color={transaction.type === 'receive' ? '#3B82F6' : '#F59E0B'} 
                      />
                    </View>
                    <View>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>
                        {transaction.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'receive' ? '#3B82F6' : '#F59E0B' }
                  ]}>
                    {transaction.type === 'receive' ? '+' : '-'}{transaction.amount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Funds</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Enter amount to deposit</Text>
            
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
              style={[styles.confirmButton, styles.depositConfirmButton]}
              onPress={handleDeposit}
              disabled={isProcessing}
            >
              <Text style={styles.confirmButtonText}>
                {isProcessing ? 'Processing...' : 'Add Funds'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Withdraw</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>Enter amount to withdraw</Text>
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
    backgroundColor: '#00704A',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00704A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: '#00704A',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
  },
  patternCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardAccountNumber: {
    fontSize: 14,
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
    marginBottom: 20,
  },
  balanceHidden: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  cardName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  actionButtonContainer: {
    alignItems: 'flex-end',
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFundsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  depositsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  refundsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  overviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  overviewCardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  depositButton: {
    backgroundColor: '#00704A',
  },
  withdrawButton: {
    backgroundColor: '#F59E0B',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#00704A',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  methodNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  mainFilterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeMainTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeMainTabText: {
    color: '#00704A',
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeFilterButton: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#00704A',
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
    color: '#00704A',
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
  depositConfirmButton: {
    backgroundColor: '#00704A',
  },
  withdrawConfirmButton: {
    backgroundColor: '#F59E0B',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
