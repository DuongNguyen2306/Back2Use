import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuthCore } from "../../../hooks/useAuth";
import { getCurrentUserProfileWithAutoRefresh } from "../../../lib/api";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const { width } = Dimensions.get('window');

export default function CustomerWallet() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "deposits">("subscriptions");
  const [subscriptionFilter, setSubscriptionFilter] = useState<"all" | "plus" | "minus">("all");
  const [depositFilter, setDepositFilter] = useState<"all" | "plus" | "minus">("all");
  const [showBalance, setShowBalance] = useState(false);
  const [userData, setUserData] = useState(null);
  const { state } = useAuthCore();

  useEffect(() => {
    const loadUserData = async () => {
      if (state.accessToken) {
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
          setUserData(user);
        } catch (error) {
          console.log('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [state.accessToken]);

  const user = userData || {
    name: "User",
    email: "user@example.com",
    avatar: "U",
  };

  const wallet = {
    balance: 125.50,
    paymentMethods: [
      { id: "1", name: "Visa ****1234", type: "credit_card", isDefault: true, isActive: true },
      { id: "2", name: "PayPal", type: "paypal", isDefault: false, isActive: true },
      { id: "3", name: "Bank Account ****5678", type: "bank_account", isDefault: false, isActive: false },
    ],
  };

  const subscriptionTransactions = [
    {
      id: "add-1",
      description: "Salary Payment",
      amount: 5000.0,
      type: "add_fund",
      createdAt: "2024-01-20T15:45:00Z",
      method: "Bank Transfer",
      status: "completed",
      transactionId: "TXN-ADD-001",
    },
    {
      id: "sub-1",
      description: "Netflix Subscription",
      amount: 15.99,
      type: "subscription",
      createdAt: "2024-01-15T10:30:00Z",
      method: "Wallet Balance",
      status: "completed",
      transactionId: "TXN-SUB-001",
      duration: "1 month",
    },
    {
      id: "with-1",
      description: "Cash Withdrawal",
      amount: 200.0,
      type: "withdrawal",
      createdAt: "2024-01-10T14:20:00Z",
      method: "ATM",
      status: "completed",
      transactionId: "TXN-WITH-001",
    },
    {
      id: "add-2",
      description: "Freelance Payment",
      amount: 800.0,
      type: "add_fund",
      createdAt: "2024-01-08T09:15:00Z",
      method: "PayPal",
      status: "completed",
      transactionId: "TXN-ADD-002",
    },
    {
      id: "sub-2",
      description: "Spotify Premium",
      amount: 9.99,
      type: "subscription",
      createdAt: "2024-01-05T09:15:00Z",
      method: "Wallet Balance",
      status: "completed",
      transactionId: "TXN-SUB-002",
      duration: "1 month",
    },
  ];

  const depositTransactions = [
    {
      id: "dep-1",
      description: "Glass Container Deposit",
      amount: 5.0,
      type: "deposit",
      createdAt: "2024-01-18T11:45:00Z",
      itemName: "Premium Glass Bottle",
      itemId: "ITEM-GL-001",
      status: "active",
      dueDate: "2024-01-25T11:45:00Z",
    },
    {
      id: "ref-1",
      description: "Refund - Returned Steel Bottle",
      amount: 8.5,
      type: "refund",
      createdAt: "2024-01-16T16:30:00Z",
      itemName: "Stainless Steel Water Bottle",
      itemId: "ITEM-SS-002",
      status: "completed",
      returnCondition: "Good",
    },
    {
      id: "dep-2",
      description: "Aluminum Can Deposit",
      amount: 2.0,
      type: "deposit",
      createdAt: "2024-01-12T13:20:00Z",
      itemName: "Aluminum Drink Can",
      itemId: "ITEM-AL-003",
      status: "overdue",
      dueDate: "2024-01-19T13:20:00Z",
    },
    {
      id: "ref-2",
      description: "Refund - Returned Plastic Container",
      amount: 3.5,
      type: "refund",
      createdAt: "2024-01-08T10:10:00Z",
      itemName: "Food Storage Container",
      itemId: "ITEM-PL-004",
      status: "completed",
      returnCondition: "Excellent",
    },
    {
      id: "dep-3",
      description: "Glass Jar Deposit",
      amount: 4.0,
      type: "deposit",
      createdAt: "2024-01-06T14:30:00Z",
      itemName: "Mason Glass Jar",
      itemId: "ITEM-GL-005",
      status: "returned",
      dueDate: "2024-01-13T14:30:00Z",
    },
    {
      id: "ref-3",
      description: "Partial Refund - Damaged Item",
      amount: 2.5,
      type: "refund",
      createdAt: "2024-01-04T12:00:00Z",
      itemName: "Plastic Lunch Box",
      itemId: "ITEM-PL-006",
      status: "completed",
      returnCondition: "Damaged",
      originalDeposit: 5.0,
    },
  ];

  const handleAddFunds = () => {
    if (!addAmount) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }
    Alert.alert("Success", `Added $${addAmount} to your wallet!`);
    setShowAddFunds(false);
    setAddAmount("");
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }
    Alert.alert("Success", `Withdrew $${withdrawAmount} from your wallet!`);
    setShowWithdraw(false);
    setWithdrawAmount("");
  };

  const filteredSubscriptionTransactions = subscriptionTransactions.filter((transaction) => {
    if (subscriptionFilter === "all") return true;
    if (subscriptionFilter === "plus") return transaction.type === "add_fund";
    if (subscriptionFilter === "minus") return transaction.type === "subscription" || transaction.type === "withdrawal";
    return true;
  });

  const filteredDepositTransactions = depositTransactions.filter((transaction) => {
    if (depositFilter === "all") return true;
    if (depositFilter === "plus") return transaction.type === "refund";
    if (depositFilter === "minus") return transaction.type === "deposit";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#16a34a";
      case "processing":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      case "active":
        return "#0F4D3A";
      case "overdue":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>Wallet</Text>
          </View>
            <View style={styles.avatarLg}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Credit Card Section */}
        <View style={styles.cardSection}>
          <TouchableOpacity style={styles.addCardButton}>
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.creditCard}>
            <View style={styles.cardPattern}>
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
              <View style={styles.patternCircle3} />
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardAccountNumber}>4006 5011 0255 xxxx</Text>
            </View>
            <Text style={styles.cardName}>{user.name}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.cardActionButton}
                onPress={() => setShowAddFunds(true)}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.cardActionText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cardActionButton}
                onPress={() => setShowWithdraw(true)}
              >
                <Ionicons name="remove" size={14} color="#fff" />
                <Text style={styles.cardActionText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.balanceContainer}>
                <Text style={styles.cardBalance}>
                  {showBalance ? `${(wallet.balance * 25000).toLocaleString('vi-VN')} VND` : '•••••••• VND'}
                </Text>
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowBalance(!showBalance)}
                >
                  <Ionicons 
                    name={showBalance ? "eye" : "eye-off"} 
                    size={16} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>


        {/* Income & Expenses Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Ionicons name="arrow-down" size={16} color="#fff" />
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
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Ionicons name="arrow-up" size={16} color="#fff" />
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
                  <Ionicons name="trending-up" size={14} color={subscriptionFilter === "plus" ? "#fff" : "#3B9797"} />
                  <Text style={[styles.filterText, subscriptionFilter === "plus" && styles.activeFilterText]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, subscriptionFilter === "minus" && styles.activeFilterButton]}
                  onPress={() => setSubscriptionFilter("minus")}
                >
                  <Ionicons name="trending-down" size={14} color={subscriptionFilter === "minus" ? "#fff" : "#BF092F"} />
                  <Text style={[styles.filterText, subscriptionFilter === "minus" && styles.activeFilterText]}>
                    Expenses
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredSubscriptionTransactions.map((transaction, index) => (
                <View key={transaction.id} style={styles.subscriptionCard}>
                  <View style={[styles.subscriptionIcon, { backgroundColor: transaction.type === "add_fund" ? "#E6F7F7" : "#FCE8E8" }]}>
                    <Ionicons 
                      name={transaction.type === "add_fund" ? "arrow-down" : "arrow-up"} 
                      size={18} 
                      color={transaction.type === "add_fund" ? "#3B9797" : "#BF092F"} 
                    />
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
                      {transaction.type === "add_fund" ? "Income" : transaction.type === "subscription" ? "Subscription" : "Withdrawal"}
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
                  <Ionicons name="trending-up" size={14} color={depositFilter === "plus" ? "#fff" : "#3B9797"} />
                  <Text style={[styles.filterText, depositFilter === "plus" && styles.activeFilterText]}>
                    Refunds
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, depositFilter === "minus" && styles.activeFilterButton]}
                  onPress={() => setDepositFilter("minus")}
                >
                  <Ionicons name="trending-down" size={14} color={depositFilter === "minus" ? "#fff" : "#BF092F"} />
                  <Text style={[styles.filterText, depositFilter === "minus" && styles.activeFilterText]}>
                    Deposits
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredDepositTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, { backgroundColor: transaction.type === "refund" ? "#E6F7F7" : "#FCE8E8" }]}>
                    <Ionicons
                      name={transaction.type === "refund" ? "arrow-down" : "arrow-up"}
                      size={18}
                      color={transaction.type === "refund" ? "#3B9797" : "#BF092F"}
                    />
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nạp tiền vào ví</Text>
              <TouchableOpacity onPress={() => setShowAddFunds(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Số tiền (VND)</Text>
              <TextInput
                style={styles.modalInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0"
                keyboardType="numeric"
              />
              <View style={styles.quickAmounts}>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setAddAmount("100000")}>
                  <Text style={styles.quickAmountText}>100,000 VND</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setAddAmount("500000")}>
                  <Text style={styles.quickAmountText}>500,000 VND</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setAddAmount("1000000")}>
                  <Text style={styles.quickAmountText}>1,000,000 VND</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddFunds}>
                <Text style={styles.modalButtonText}>Nạp {addAmount ? `${parseInt(addAmount).toLocaleString('vi-VN')} VND` : "0 VND"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rút tiền từ ví</Text>
              <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Số tiền (VND)</Text>
              <TextInput
                style={styles.modalInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="0"
                keyboardType="numeric"
              />
              <View style={styles.quickAmounts}>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setWithdrawAmount("250000")}>
                  <Text style={styles.quickAmountText}>250,000 VND</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setWithdrawAmount("500000")}>
                  <Text style={styles.quickAmountText}>500,000 VND</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setWithdrawAmount("1000000")}>
                  <Text style={styles.quickAmountText}>1,000,000 VND</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handleWithdraw}>
                <Text style={styles.modalButtonText}>Rút {withdrawAmount ? `${parseInt(withdrawAmount).toLocaleString('vi-VN')} VND` : "0 VND"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  heroHeaderArea: { backgroundColor: '#00704A', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandTitle: { color: '#fff', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  iconGhost: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 },
  greetingName: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarLg: { height: 56, width: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
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
    flex: 1,
    height: 200,
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
    width: 15,
    height: 15,
    borderRadius: 7.5,
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
    backgroundColor: '#C0C0C0',
    borderRadius: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardExpiry: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cardNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  cardLogo: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  summarySection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#3B9797',
    borderRadius: 16,
    padding: 20,
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
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wiseLogo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  subscriptionAmount: {
    alignItems: 'flex-end',
  },
  subscriptionAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 2,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
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
    flex: 1,
    height: 200,
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
    width: 15,
    height: 15,
    borderRadius: 7.5,
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
    backgroundColor: '#C0C0C0',
    borderRadius: 4,
  },
  cardName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardExpiry: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cardNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  cardLogo: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  addFundsButton: {
    backgroundColor: "#3B9797",
    borderColor: "#3B9797",
  },
  withdrawButton: {
    backgroundColor: "#BF092F",
    borderColor: "#BF092F",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  paymentMethodType: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  paymentMethodBadges: {
    flexDirection: "row",
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: "#667eea",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    gap: 8,
  },
  addPaymentText: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#fff",
  },
  transactionsSection: {
    gap: 12,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    gap: 4,
  },
  activeFilterButton: {
    backgroundColor: "#667eea",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeFilterText: {
    color: "#fff",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  transactionMethod: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionDuration: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionItem: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionDue: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionCondition: {
    fontSize: 12,
    color: "#6b7280",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    gap: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  modalInput: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: "#f9fafb",
    textAlign: "center",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#667eea",
  },
  modalButton: {
    backgroundColor: "#667eea",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addFundsButton: {
    backgroundColor: '#3B9797',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B9797',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addFundsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  withdrawButton: {
    backgroundColor: '#BF092F',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BF092F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  withdrawText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
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
  cardAccountNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardBalance: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    padding: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
