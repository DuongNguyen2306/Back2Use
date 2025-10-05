import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { mockTransactions } from "../../../lib/mock-data";

export default function CustomerTransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "#16a34a";
      case "active":
        return "#0F4D3A";
      case "failed":
        return "#ef4444";
      case "overdue":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "complete":
        return "Completed";
      case "active":
        return "Active";
      case "failed":
        return "Failed";
      case "overdue":
        return "Overdue";
      default:
        return status;
    }
  };

  const handleTransactionPress = (transaction: any) => {
    Alert.alert(
      "Transaction Details",
      `ID: ${transaction.id}\nType: ${transaction.type}\nStatus: ${transaction.status}\nAmount: $${transaction.depositAmount}`,
      [{ text: "OK" }]
    );
  };

  const handleFeedbackPress = (transactionId: string) => {
    Alert.alert("Feedback", `Leave feedback for transaction ${transactionId}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: () => Alert.alert("Success", "Feedback submitted!") },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#0F4D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Filter options")}>
          <Ionicons name="filter" size={20} color="#0F4D3A" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#6b7280"
          />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Type</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, typeFilter === "all" && styles.activeFilterButton]}
                onPress={() => setTypeFilter("all")}
              >
                <Text style={[styles.filterButtonText, typeFilter === "all" && styles.activeFilterButtonText]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, typeFilter === "borrow" && styles.activeFilterButton]}
                onPress={() => setTypeFilter("borrow")}
              >
                <Text style={[styles.filterButtonText, typeFilter === "borrow" && styles.activeFilterButtonText]}>
                  Borrow
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, typeFilter === "return" && styles.activeFilterButton]}
                onPress={() => setTypeFilter("return")}
              >
                <Text style={[styles.filterButtonText, typeFilter === "return" && styles.activeFilterButtonText]}>
                  Return
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "all" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("all")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "all" && styles.activeFilterButtonText]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "complete" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("complete")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "complete" && styles.activeFilterButtonText]}>
                  Complete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "active" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("active")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "active" && styles.activeFilterButtonText]}>
                  Active
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt" size={48} color="#6b7280" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionCard}
              onPress={() => handleTransactionPress(transaction)}
            >
              <View style={styles.transactionHeader}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === "borrow" ? "arrow-up" : "arrow-down"}
                    size={20}
                    color={transaction.type === "borrow" ? "#0F4D3A" : "#16a34a"}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type === "borrow" ? "Borrowed Container" : "Returned Container"}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.borrowedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.transactionId}>ID: {transaction.id}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={styles.amountText}>${transaction.depositAmount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                      {getStatusLabel(transaction.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {transaction.lateFee && (
                <View style={styles.lateFeeContainer}>
                  <Text style={styles.lateFeeText}>Late fee: +${transaction.lateFee.toFixed(2)}</Text>
                </View>
              )}

              {transaction.rejectionReason && (
                <View style={styles.rejectionContainer}>
                  <Text style={styles.rejectionText}>Rejection reason: {transaction.rejectionReason}</Text>
                </View>
              )}

              <View style={styles.transactionActions}>
                {transaction.status === "complete" && transaction.type === "return" && (
                  <TouchableOpacity
                    style={styles.feedbackButton}
                    onPress={() => handleFeedbackPress(transaction.id)}
                  >
                    <Ionicons name="star" size={16} color="#0F4D3A" />
                    <Text style={styles.feedbackButtonText}>Rate</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.detailsButton}>
                  <Ionicons name="eye" size={16} color="#6b7280" />
                  <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  searchSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  filterRow: {
    marginBottom: 12,
  },
  filterContainer: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  activeFilterButton: {
    backgroundColor: "#0F4D3A",
    borderColor: "#0F4D3A",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  transactionId: {
    fontSize: 12,
    color: "#9ca3af",
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lateFeeContainer: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  lateFeeText: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "600",
  },
  rejectionContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },
  transactionActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  feedbackButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F4D3A",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
});
