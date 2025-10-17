import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';
import { getCurrentUserProfileWithAutoRefresh, User } from '../../../lib/api';

const { width: screenWidth } = Dimensions.get('window')

export default function BusinessWalletPage() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'add-funds' | 'receive-return'>('add-funds');
  const [addFundsFilter, setAddFundsFilter] = useState<'all' | 'add_funds' | 'withdraw'>('all');
  const [receiveReturnFilter, setReceiveReturnFilter] = useState<'all' | 'receive' | 'return'>('all');

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (auth.state.accessToken) {
          const userData = await getCurrentUserProfileWithAutoRefresh();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [auth.state.accessToken]);

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
  
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#00704A" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Business Wallet</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
            <Text style={styles.cardAccountNumber}>Available Balance</Text>
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
                5.420.000 VNĐ
              </Text>
            ) : (
              <Text style={styles.balanceHidden}>•••••••• VNĐ</Text>
            )}
          </View>
          
          <Text style={styles.cardName}>Business Account</Text>
          
          {/* Action Button - Right aligned */}
          <View style={styles.cardActionsRight}>
            <TouchableOpacity 
              style={styles.depositWithdrawButton}
              onPress={() => {/* Handle deposit/withdraw */}}
            >
              <Ionicons name="card" size={16} color="#FFFFFF" />
              <Text style={styles.depositWithdrawText}>Deposit/Withdraw</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Monthly Overview Cards */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewRow}>
            <View style={[styles.overviewCard, styles.depositsCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>This Month Deposits</Text>
                <Ionicons name="information-circle" size={16} color="#00704A" />
              </View>
              <Text style={styles.cardValue}>1.247.500 VNĐ</Text>
            </View>
            <View style={[styles.overviewCard, styles.refundsCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>This Month Refunds</Text>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.cardValue}>892.300 VNĐ</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods Section */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.paymentMethodsTitle}>Payment Methods</Text>
          <View style={styles.paymentMethodItem}>
            <View style={styles.paymentMethodInfo}>
              <View style={styles.paymentMethodIcon}>
                <Ionicons name="card" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.paymentMethodName}>Vietcombank ****1234</Text>
                <Text style={styles.paymentMethodType}>BANK ACCOUNT</Text>
              </View>
            </View>
            <View style={styles.paymentMethodActions}>
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </View>
          <TouchableOpacity style={styles.addPaymentMethodButton}>
            <Ionicons name="add" size={16} color="#00704A" />
            <Text style={styles.addPaymentMethodText}>+ Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.transactionsCard}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          
          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity 
              style={[styles.filterTab, activeTab === 'add-funds' && styles.activeFilterTab]}
              onPress={() => setActiveTab('add-funds')}
            >
              <Text style={[styles.filterTabText, activeTab === 'add-funds' && styles.activeFilterTabText]}>
                Add Funds & Withdraw
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeTab === 'receive-return' && styles.activeFilterTab]}
              onPress={() => setActiveTab('receive-return')}
            >
              <Text style={[styles.filterTabText, activeTab === 'receive-return' && styles.activeFilterTabText]}>
                Receive & Return
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionList}>
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
                          name={transaction.type === 'add_funds' ? 'add' : 'remove'} 
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
                      Receive
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterButton, receiveReturnFilter === 'return' && styles.activeFilterButton]}
                    onPress={() => setReceiveReturnFilter('return')}
                  >
                    <Text style={[styles.filterButtonText, receiveReturnFilter === 'return' && styles.activeFilterButtonText]}>
                      Return
                    </Text>
                  </TouchableOpacity>
                </View>

                {filterReceiveReturnTransactions(mockTransactions).map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionIcon}>
                        <Ionicons 
                          name={transaction.type === 'receive' ? 'arrow-down-left' : 'arrow-up-right'} 
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
        </View>
      </ScrollView>
    </View>
  )
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#00704A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
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
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  eyeButton: {
    padding: 4,
    zIndex: 10,
    elevation: 10,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addFundsAction: {
    backgroundColor: '#00704A',
  },
  withdrawAction: {
    backgroundColor: '#F59E0B',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  paymentMethodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodsHeader: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  paymentMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentMethodsContent: {
    padding: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethodType: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionsHeader: {
    backgroundColor: '#00704A',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionsContent: {
    padding: 0,
  },
  filterSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    margin: 16,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#00704A',
    fontWeight: '600',
  },
  transactionsList: {
    padding: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  heroHeaderArea: {
    backgroundColor: '#00704A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingSub: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarLg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLgImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarLgText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00704A',
  },
  cardSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  creditCard: {
    backgroundColor: '#00704A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
  },
  patternCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardAccountNumber: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceHidden: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  cardName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 20,
  },
  cardActionsRight: {
    alignItems: 'flex-end',
  },
  depositWithdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  depositWithdrawText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 4,
  },
  statsContainer: {
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  withdrawSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  withdrawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  withdrawTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  businessAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00704A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    color: '#6B7280',
  },
  accountStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#00704A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00704A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  creditCard: {
    backgroundColor: '#00704A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
  },
  patternCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardAccountNumber: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceHidden: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  cardName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 20,
  },
  cardActionsRight: {
    alignItems: 'flex-end',
  },
  depositWithdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  depositWithdrawText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 4,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00704A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addFundsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  overviewContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  depositsCard: {
    backgroundColor: '#F0FDF4',
  },
  refundsCard: {
    backgroundColor: '#FEF3C7',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  depositButton: {
    backgroundColor: '#00704A',
  },
  withdrawButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentMethodsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  addPaymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#00704A',
    borderRadius: 8,
    marginTop: 12,
  },
  addPaymentMethodText: {
    color: '#00704A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterTab: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  transactionList: {
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  activeFilterButton: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refundIcon: {
    backgroundColor: '#10B981',
  },
  receiveIcon: {
    backgroundColor: '#3B82F6',
  },
  returnIcon: {
    backgroundColor: '#F59E0B',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
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
  incomeIcon: {
    backgroundColor: '#10B981',
  },
  expenseIcon: {
    backgroundColor: '#EF4444',
  },
  withdrawIcon: {
    backgroundColor: '#8B5CF6',
  },
  refundIcon: {
    backgroundColor: '#F59E0B',
  },
  addFundsIcon: {
    backgroundColor: '#10B981',
  },
  receiveIcon: {
    backgroundColor: '#3B82F6',
  },
  returnIcon: {
    backgroundColor: '#F59E0B',
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
})