import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';
import { getCurrentUserProfileWithAutoRefresh, User } from '../../../lib/api';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'deposits'>('subscriptions');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'plus' | 'minus'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'plus' | 'minus'>('all');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDepositWithdraw, setShowDepositWithdraw] = useState(false);
  const [isDepositMode, setIsDepositMode] = useState(true); // true = deposit, false = withdraw
  const [amount, setAmount] = useState('');
  const [showBalance, setShowBalance] = useState(false); // Mặc định ẩn số tiền

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
        try {
        setLoading(true);
        const userData = await getCurrentUserProfileWithAutoRefresh();
        console.log('🔍 Wallet User Data:', userData);
        console.log('💰 Wallet Balance:', (userData as any)?.wallet);
        setUser(userData);
        } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

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
    setShowDepositWithdraw(false);
    setAmount('');
  };

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    
    // Handle withdraw logic here
    setShowWithdraw(false);
    setShowDepositWithdraw(false);
    setAmount('');
  };

  const quickAmounts = [10000, 50000, 100000, 200000];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>Loading...</Text>
            </View>
          </View>
        </View>
        
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
                onPress={() => setShowDepositWithdraw(true)}
              >
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.depositWithdrawText}>Deposit/Withdraw</Text>
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
      {/* Header */}
      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
        
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
            <Text style={styles.greetingName}>{(user as any)?.fullName || user?.name || "User"}</Text>
          </View>
            <View style={styles.avatarLg}>
              {user?.avatar && user.avatar.trim() !== "" ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarLgImage} />
              ) : (
                <Text style={styles.avatarLgText}>{((user as any)?.fullName || user?.name || "U").charAt(0).toUpperCase()}</Text>
              )}
          </View>
        </View>
      </View>

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
                {((user as any)?.wallet || 0).toLocaleString('vi-VN')} VND
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VND</Text>
            )}
          </View>
          
          <Text style={styles.cardName}>{(user as any)?.fullName || user?.name || "User"}</Text>
          
          {/* Action Button - Right aligned */}
          <View style={styles.cardActionsRight}>
            <TouchableOpacity 
              style={styles.depositWithdrawButton}
              onPress={() => setShowDepositWithdraw(true)}
            >
              <Ionicons name="card" size={16} color="#FFFFFF" />
              <Text style={styles.depositWithdrawText}>Deposit/Withdraw</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
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
              {subscriptionTransactions
                .filter(t => t.type === "add_fund")
                .reduce((sum, t) => sum + (t.amount * 25000), 0)
                .toLocaleString('vi-VN')} VND
            </Text>
                </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>{t('wallet').expenses}</Text>
              <Ionicons name="arrow-down" size={16} color="#fff" />
              </View>
            <Text style={styles.summaryAmount}>
              {subscriptionTransactions
                .filter(t => t.type === "subscription" || t.type === "withdrawal")
                .reduce((sum, t) => sum + (t.amount * 25000), 0)
                .toLocaleString('vi-VN')} VND
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

              {filteredSubscriptionTransactions.map((transaction, index) => (
                <View key={transaction.id} style={styles.subscriptionCard}>
                  <View style={[styles.subscriptionIcon, { backgroundColor: transaction.type === "add_fund" ? "#E6F7F7" : "#FCE8E8" }]}>
                    {transaction.description === "Netflix Subscription" ? (
                      <Ionicons name="tv" size={18} color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.description === "Spotify Premium" ? (
                      <Ionicons name="musical-notes" size={18} color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.description === "Salary Payment" ? (
                      <Ionicons name="briefcase" size={18} color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.description === "Freelance Payment" ? (
                      <Ionicons name="laptop" size={18} color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} />
                    ) : transaction.description === "Cash Withdrawal" ? (
                      <Ionicons name="card" size={18} color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} />
                    ) : (
                    <Ionicons 
                        name={transaction.type === "add_fund" ? "arrow-up" : "arrow-down"} 
                      size={18} 
                      color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} 
                    />
                    )}
                  </View>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionName}>{transaction.description}</Text>
                    <Text style={styles.subscriptionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                    </Text>
                  </View>
                  <View style={styles.subscriptionAmount}>
                    <Text style={[styles.subscriptionAmountText, { color: transaction.type === "add_fund" ? "#3B9797" : "#BF092F" }]}>
                      {transaction.type === "add_fund" ? "+" : "-"} {(transaction.amount * 25000).toLocaleString('vi-VN')} VND
                    </Text>
                    <Text style={styles.subscriptionLabel}>
                      {transaction.type === "add_fund" ? t('wallet').income : transaction.type === "subscription" ? "Subscription" : "Withdrawal"}
                      </Text>
                  </View>
                </View>
              ))}
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

      {/* Add Funds Modal */}
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
                <Text style={styles.modalTitle}>Add Funds</Text>
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
              
              <TouchableOpacity style={styles.modalButton} onPress={handleAddFunds}>
                <Text style={styles.modalButtonText}>Add Funds</Text>
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
          onRequestClose={() => setShowWithdraw(false)}
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

      {/* Deposit/Withdraw Modal */}
      {showDepositWithdraw && (
        <Modal
          visible={showDepositWithdraw}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDepositWithdraw(false)}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isDepositMode ? 'Deposit Money' : 'Withdraw Money'}
                </Text>
              <TouchableOpacity onPress={() => setShowDepositWithdraw(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
              
            {/* Toggle Switch */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, isDepositMode && styles.toggleButtonActive]}
                onPress={() => setIsDepositMode(true)}
              >
                <Text style={[styles.toggleText, isDepositMode && styles.toggleTextActive]}>
                  Deposit
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toggleButton, !isDepositMode && styles.toggleButtonActive]}
                onPress={() => setIsDepositMode(false)}
              >
                <Text style={[styles.toggleText, !isDepositMode && styles.toggleTextActive]}>
                  Withdraw
                </Text>
              </TouchableOpacity>
            </View>
              
            <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>
                  {isDepositMode ? 'Deposit Amount (VND)' : 'Withdrawal Amount (VND)'}
                </Text>
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
              
              <TouchableOpacity 
                style={[styles.modalButton, isDepositMode ? styles.depositModalButton : styles.withdrawModalButton]} 
                onPress={isDepositMode ? handleAddFunds : handleWithdraw}
              >
                <Text style={styles.modalButtonText}>
                  {isDepositMode ? 'Deposit' : 'Withdraw'}
                </Text>
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
    backgroundColor: "#f8fafc",
  },
  heroHeaderArea: { 
    backgroundColor: '#00704A', 
    paddingHorizontal: 16, 
    paddingTop: 40, 
    paddingBottom: 32, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24 
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  },
  brandTitle: { 
    color: '#fff', 
    fontWeight: '800', 
    letterSpacing: 2, 
    fontSize: 14 
  },
  iconGhost: { 
    height: 36, 
    width: 36, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.15)' 
  },
  greetingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  greetingSub: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 14, 
    marginBottom: 4 
  },
  greetingName: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 24 
  },
  avatarLg: { 
    height: 56, 
    width: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.3)' 
  },
  avatarLgText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarLgImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionAmount: {
    alignItems: 'flex-end',
  },
  subscriptionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: '#6b7280',
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
});
