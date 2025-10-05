import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CustomerWallet() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "deposits">("subscriptions");

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#0F4D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert("Notifications", "No new notifications")}>
          <Ionicons name="notifications" size={20} color="#0F4D3A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Wallet Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Wallet Balance</Text>
            <Text style={styles.balanceAmount}>${wallet.balance.toFixed(2)}</Text>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <TouchableOpacity style={styles.addFundsButton} onPress={() => setShowAddFunds(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addFundsText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {wallet.paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodInfo}>
                <Ionicons name="card" size={20} color="#0F4D3A" />
                <View style={styles.paymentMethodDetails}>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Text style={styles.paymentMethodType}>{method.type.replace("_", " ").toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.paymentMethodBadges}>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: method.isActive ? "#dcfce7" : "#f3f4f6" }]}>
                  <Text style={[styles.statusBadgeText, { color: method.isActive ? "#16a34a" : "#6b7280" }]}>
                    {method.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addPaymentButton}>
            <Ionicons name="add" size={16} color="#0F4D3A" />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity style={styles.withdrawButton} onPress={() => setShowWithdraw(true)}>
          <Ionicons name="arrow-up" size={16} color="#fff" />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>

        {/* Transaction Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "subscriptions" && styles.activeTab]}
            onPress={() => setActiveTab("subscriptions")}
          >
            <Text style={[styles.tabText, activeTab === "subscriptions" && styles.activeTabText]}>
              Subscriptions & Withdrawals
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
              {subscriptionTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={transaction.type === "add_fund" ? "arrow-down" : "arrow-up"}
                      size={16}
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
                      <Text style={styles.transactionDuration}>Duration: {transaction.duration}</Text>
                    )}
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: transaction.type === "add_fund" ? "#16a34a" : "#ef4444" }]}>
                      {transaction.type === "add_fund" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeTab === "deposits" && (
            <>
              {depositTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={transaction.type === "refund" ? "arrow-down" : "arrow-up"}
                      size={16}
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
                      <Text style={styles.transactionDue}>Due: {new Date(transaction.dueDate).toLocaleDateString()}</Text>
                    )}
                    {transaction.returnCondition && (
                      <Text style={styles.transactionCondition}>Condition: {transaction.returnCondition}</Text>
                    )}
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.amountText, { color: transaction.type === "refund" ? "#16a34a" : "#ef4444" }]}>
                      {transaction.type === "refund" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status}
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
              <Text style={styles.modalTitle}>Add Funds to Wallet</Text>
              <TouchableOpacity onPress={() => setShowAddFunds(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Amount</Text>
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
                <Text style={styles.modalButtonText}>Add ${addAmount || "0.00"}</Text>
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
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Amount</Text>
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
                <Text style={styles.modalButtonText}>Withdraw ${withdrawAmount || "0.00"}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  balanceHeader: {
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F4D3A",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFundsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  paymentMethodCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  paymentMethodType: {
    fontSize: 12,
    color: "#6b7280",
  },
  paymentMethodBadges: {
    flexDirection: "row",
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    gap: 8,
  },
  addPaymentText: {
    color: "#0F4D3A",
    fontSize: 14,
    fontWeight: "600",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F4D3A",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  withdrawText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#0F4D3A",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#fff",
  },
  transactionsSection: {
    gap: 8,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
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
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F4D3A",
  },
  modalButton: {
    backgroundColor: "#0F4D3A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
