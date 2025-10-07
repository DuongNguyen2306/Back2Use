import { Ionicons } from "@expo/vector-icons";
import { useState, useRef } from "react";
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get('window');

export default function CustomerWallet() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "deposits">("subscriptions");
  const [subscriptionFilter, setSubscriptionFilter] = useState<"all" | "plus" | "minus">("all");
  const [depositFilter, setDepositFilter] = useState<"all" | "plus" | "minus">("all");
  

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
      description: "Add Funds via Credit Card",
      amount: 100.0,
      type: "add_fund",
      createdAt: "2024-01-20T15:45:00Z",
      method: "Visa ****1234",
      status: "completed",
      transactionId: "TXN-ADD-001",
    },
    {
      id: "sub-1",
      description: "Premium Subscription Extension",
      amount: 29.99,
      type: "subscription",
      createdAt: "2024-01-15T10:30:00Z",
      method: "Wallet Balance",
      status: "completed",
      transactionId: "TXN-SUB-001",
      duration: "1 month",
    },
    {
      id: "with-1",
      description: "Wallet Withdrawal to Bank",
      amount: 50.0,
      type: "withdrawal",
      createdAt: "2024-01-10T14:20:00Z",
      method: "Bank Account ****5678",
      status: "processing",
      transactionId: "TXN-WITH-001",
    },
    {
      id: "add-2",
      description: "Add Funds via PayPal",
      amount: 75.0,
      type: "add_fund",
      createdAt: "2024-01-08T09:15:00Z",
      method: "PayPal",
      status: "completed",
      transactionId: "TXN-ADD-002",
    },
    {
      id: "sub-2",
      description: "Basic Plan Extension",
      amount: 15.99,
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header without back button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert("Thông báo", "Không có thông báo mới")}>
          <Ionicons name="notifications" size={20} color="#0F4D3A" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Balance Card with Gradient */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet" size={24} color="#fff" />
            </View>
            <Text style={styles.balanceTitle}>Số dư ví</Text>
            <Text style={styles.balanceAmount}>${wallet.balance.toFixed(2)}</Text>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowAddFunds(true)}>
              <Ionicons name="add" size={18} color="#667eea" />
              <Text style={styles.actionButtonText}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowWithdraw(true)}>
              <Ionicons name="arrow-up" size={18} color="#667eea" />
              <Text style={styles.actionButtonText}>Rút tiền</Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          {wallet.paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodInfo}>
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="card" size={20} color="#667eea" />
                </View>
                <View style={styles.paymentMethodDetails}>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Text style={styles.paymentMethodType}>{method.type.replace("_", " ").toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.paymentMethodBadges}>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Mặc định</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: method.isActive ? "#dcfce7" : "#f3f4f6" }]}>
                  <Text style={[styles.statusBadgeText, { color: method.isActive ? "#16a34a" : "#6b7280" }]}>
                    {method.isActive ? "Hoạt động" : "Không hoạt động"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addPaymentButton}>
            <Ionicons name="add" size={16} color="#667eea" />
            <Text style={styles.addPaymentText}>Thêm phương thức thanh toán</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "subscriptions" && styles.activeTab]}
            onPress={() => setActiveTab("subscriptions")}
          >
            <Text style={[styles.tabText, activeTab === "subscriptions" && styles.activeTabText]}>
              Giao dịch & Rút tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "deposits" && styles.activeTab]}
            onPress={() => setActiveTab("deposits")}
          >
            <Text style={[styles.tabText, activeTab === "deposits" && styles.activeTabText]}>
              Ký gửi & Hoàn tiền
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
                    Tất cả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, subscriptionFilter === "plus" && styles.activeFilterButton]}
                  onPress={() => setSubscriptionFilter("plus")}
                >
                  <Ionicons name="trending-up" size={14} color={subscriptionFilter === "plus" ? "#fff" : "#16a34a"} />
                  <Text style={[styles.filterText, subscriptionFilter === "plus" && styles.activeFilterText]}>
                    Thu nhập
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, subscriptionFilter === "minus" && styles.activeFilterButton]}
                  onPress={() => setSubscriptionFilter("minus")}
                >
                  <Ionicons name="trending-down" size={14} color={subscriptionFilter === "minus" ? "#fff" : "#ef4444"} />
                  <Text style={[styles.filterText, subscriptionFilter === "minus" && styles.activeFilterText]}>
                    Chi tiêu
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredSubscriptionTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, { backgroundColor: transaction.type === "add_fund" ? "#dcfce7" : "#fef2f2" }]}>
                    <Ionicons
                      name={transaction.type === "add_fund" ? "arrow-down" : "arrow-up"}
                      size={18}
                      color={transaction.type === "add_fund" ? "#16a34a" : "#ef4444"}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.transactionMethod}>{transaction.method}</Text>
                    {transaction.duration && (
                      <Text style={styles.transactionDuration}>Thời hạn: {transaction.duration}</Text>
                    )}
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: transaction.type === "add_fund" ? "#16a34a" : "#ef4444" }]}>
                      {transaction.type === "add_fund" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status === "completed" ? "Hoàn thành" : 
                         transaction.status === "processing" ? "Đang xử lý" : 
                         transaction.status === "failed" ? "Thất bại" : transaction.status}
                      </Text>
                    </View>
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
                    Tất cả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, depositFilter === "plus" && styles.activeFilterButton]}
                  onPress={() => setDepositFilter("plus")}
                >
                  <Ionicons name="trending-up" size={14} color={depositFilter === "plus" ? "#fff" : "#16a34a"} />
                  <Text style={[styles.filterText, depositFilter === "plus" && styles.activeFilterText]}>
                    Hoàn tiền
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, depositFilter === "minus" && styles.activeFilterButton]}
                  onPress={() => setDepositFilter("minus")}
                >
                  <Ionicons name="trending-down" size={14} color={depositFilter === "minus" ? "#fff" : "#ef4444"} />
                  <Text style={[styles.filterText, depositFilter === "minus" && styles.activeFilterText]}>
                    Ký gửi
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredDepositTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, { backgroundColor: transaction.type === "refund" ? "#dcfce7" : "#fef2f2" }]}>
                    <Ionicons
                      name={transaction.type === "refund" ? "arrow-down" : "arrow-up"}
                      size={18}
                      color={transaction.type === "refund" ? "#16a34a" : "#ef4444"}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.transactionItem}>{transaction.itemName}</Text>
                    {transaction.dueDate && (
                      <Text style={styles.transactionDue}>Hạn: {new Date(transaction.dueDate).toLocaleDateString()}</Text>
                    )}
                    {transaction.returnCondition && (
                      <Text style={styles.transactionCondition}>Tình trạng: {transaction.returnCondition}</Text>
                    )}
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: transaction.type === "refund" ? "#16a34a" : "#ef4444" }]}>
                      {transaction.type === "refund" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status === "completed" ? "Hoàn thành" : 
                         transaction.status === "active" ? "Đang hoạt động" : 
                         transaction.status === "overdue" ? "Quá hạn" : 
                         transaction.status === "returned" ? "Đã trả" : transaction.status}
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
              <Text style={styles.modalLabel}>Số tiền</Text>
              <TextInput
                style={styles.modalInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <View style={styles.quickAmounts}>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setAddAmount("10")}>
                  <Text style={styles.quickAmountText}>$10</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setAddAmount("25")}>
                  <Text style={styles.quickAmountText}>$25</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setAddAmount("50")}>
                  <Text style={styles.quickAmountText}>$50</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddFunds}>
                <Text style={styles.modalButtonText}>Nạp ${addAmount || "0.00"}</Text>
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
              <Text style={styles.modalLabel}>Số tiền</Text>
              <TextInput
                style={styles.modalInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <View style={styles.quickAmounts}>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setWithdrawAmount("25")}>
                  <Text style={styles.quickAmountText}>$25</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setWithdrawAmount("50")}>
                  <Text style={styles.quickAmountText}>$50</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAmountButton} onPress={() => setWithdrawAmount("100")}>
                  <Text style={styles.quickAmountText}>$100</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handleWithdraw}>
                <Text style={styles.modalButtonText}>Rút ${withdrawAmount || "0.00"}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  notificationButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    backgroundColor: "#667eea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    marginBottom: 20,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    color: "#667eea",
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
});
