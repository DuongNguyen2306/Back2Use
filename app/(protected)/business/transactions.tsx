import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface BusinessBorrowTransactionItem {
  _id: string;
  customerId: {
    _id: string;
    userId: string;
    fullName: string;
    phone: string;
  };
  productId: {
    _id: string;
    productGroupId: {
      _id: string;
      name: string;
      imageUrl?: string;
    };
    productSizeId: {
      _id: string;
      sizeName: string;
    };
    qrCode?: string;
    serialNumber: string;
    status: string;
    reuseCount: number;
  };
  businessId: string;
  borrowTransactionType: string;
  borrowDate: string;
  dueDate: string;
  depositAmount: number;
  status: string;
  isLateProcessed: boolean;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  walletTransaction?: any;
}

export default function BusinessTransactionsPage() {
  const [transactions, setTransactions] = useState<BusinessBorrowTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading business borrow transactions...');
      
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (searchTerm.trim()) {
        params.productName = searchTerm.trim();
      }
      
      const response = await borrowTransactionsApi.getBusinessHistory(params);
      
      console.log('📡 Business Borrow Transactions Response:', JSON.stringify(response, null, 2));
      console.log('📡 Response statusCode:', response.statusCode);
      console.log('📡 Response data:', response.data);
      console.log('📡 Response data.items:', response.data?.items);
      
      if (response.statusCode === 200 && response.data?.items) {
        console.log('✅ Business borrow transactions items:', response.data.items.length);
        setTransactions(response.data.items);
      } else if (response.statusCode === 200 && response.data && Array.isArray(response.data)) {
        // Handle case where data is directly an array
        console.log('✅ Business borrow transactions (array format):', response.data.length);
        setTransactions(response.data);
      } else {
        console.warn('⚠️ No items found in response:', response);
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading borrow transactions:', error);
      Alert.alert('Error', error.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (searchTerm.trim()) {
      const productName = transaction.productId?.productGroupId?.name?.toLowerCase() || '';
      const customerName = transaction.customerId?.fullName?.toLowerCase() || '';
      const serialNumber = transaction.productId?.serialNumber?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      return productName.includes(searchLower) || customerName.includes(searchLower) || serialNumber.includes(searchLower);
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "returned":
        return "#16a34a";
      case "pending_pickup":
      case "pending":
        return "#3B82F6";
      case "active":
      case "borrowing":
        return "#0F4D3A";
      case "overdue":
        return "#f59e0b";
      case "rejected":
      case "cancelled":
      case "canceled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
      case "returned":
        return "Completed";
      case "pending_pickup":
        return "Pending Pickup";
      case "active":
      case "borrowing":
        return "Borrowing";
      case "overdue":
        return "Overdue";
      case "rejected":
        return "Rejected";
      case "cancelled":
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleTransactionPress = (transaction: BusinessBorrowTransactionItem) => {
    const productName = transaction.productId?.productGroupId?.name || 'N/A';
    const sizeName = transaction.productId?.productSizeId?.sizeName || 'N/A';
    const customerName = transaction.customerId?.fullName || 'N/A';
    const customerPhone = transaction.customerId?.phone || 'N/A';
    const borrowDate = new Date(transaction.borrowDate).toLocaleDateString('vi-VN');
    const dueDate = new Date(transaction.dueDate).toLocaleDateString('vi-VN');
    
    Alert.alert(
      "Transaction Details",
      `Product: ${productName} - ${sizeName}\n` +
      `Serial: ${transaction.productId?.serialNumber || 'N/A'}\n` +
      `Customer: ${customerName}\n` +
      `Phone: ${customerPhone}\n` +
      `Borrow Date: ${borrowDate}\n` +
      `Due Date: ${dueDate}\n` +
      `Deposit: ${transaction.depositAmount.toLocaleString('vi-VN')} VNĐ\n` +
      `Status: ${getStatusLabel(transaction.status)}`,
      [{ text: "Close" }]
    );
  };

  const handleConfirm = async (transactionId: string) => {
    Alert.alert(
      'Confirm Acceptance',
      'Are you sure you want to accept this borrow transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setProcessingId(transactionId);
              await borrowTransactionsApi.confirm(transactionId);
              Alert.alert('Success', 'Borrow transaction accepted successfully.');
              loadTransactions(); // Reload transactions
            } catch (error: any) {
              console.error('❌ Error confirming transaction:', error);
              Alert.alert('Error', error.message || 'Failed to accept transaction. Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (transactionId: string) => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this borrow transaction?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Cancel Transaction',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(transactionId);
              await borrowTransactionsApi.cancel(transactionId);
              Alert.alert('Success', 'Borrow transaction canceled successfully.');
              loadTransactions(); // Reload transactions
            } catch (error: any) {
              console.error('❌ Error canceling transaction:', error);
              Alert.alert('Error', error.message || 'Failed to cancel transaction. Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header - Dark Green Branded Style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrow Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name, customer, serial..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
            onSubmitEditing={loadTransactions}
          />
        </View>
      </View>

      {/* Filter Chips - Horizontal Scrollable */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "all" && styles.filterChipActive]}
            onPress={() => setStatusFilter("all")}
          >
            <Text style={[styles.filterChipText, statusFilter === "all" && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "borrowing" && styles.filterChipActive]}
            onPress={() => setStatusFilter("borrowing")}
          >
            <Text style={[styles.filterChipText, statusFilter === "borrowing" && styles.filterChipTextActive]}>
              Borrowing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "pending_pickup" && styles.filterChipActive]}
            onPress={() => setStatusFilter("pending_pickup")}
          >
            <Text style={[styles.filterChipText, statusFilter === "pending_pickup" && styles.filterChipTextActive]}>
              Pending Pickup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "completed" && styles.filterChipActive]}
            onPress={() => setStatusFilter("completed")}
          >
            <Text style={[styles.filterChipText, statusFilter === "completed" && styles.filterChipTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "canceled" && styles.filterChipActive]}
            onPress={() => setStatusFilter("canceled")}
          >
            <Text style={[styles.filterChipText, statusFilter === "canceled" && styles.filterChipTextActive]}>
              Canceled
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F4D3A" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting filters or search</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => {
            const productName = transaction.productId?.productGroupId?.name || 'N/A';
            const sizeName = transaction.productId?.productSizeId?.sizeName || 'N/A';
            const customerName = transaction.customerId?.fullName || 'N/A';
            const productImage = transaction.productId?.productGroupId?.imageUrl;
            const overdue = isOverdue(transaction.dueDate);
            const statusColor = getStatusColor(transaction.status);
            const statusLabel = getStatusLabel(transaction.status);
            
            return (
              <TouchableOpacity
                key={transaction._id}
                style={styles.transactionCard}
                onPress={() => handleTransactionPress(transaction)}
              >
                <View style={styles.cardContent}>
                  {/* Left: Product Thumbnail */}
                  {productImage ? (
                    <Image source={{ uri: productImage }} style={styles.productThumbnail} />
                  ) : (
                    <View style={styles.productThumbnailPlaceholder}>
                      <Ionicons name="cube-outline" size={24} color="#9ca3af" />
                    </View>
                  )}
                  
                  {/* Middle: Transaction Info */}
                  <View style={styles.transactionInfo}>
                    <Text style={styles.productTitle}>{productName} - {sizeName}</Text>
                    <Text style={styles.customerName}>Customer: {customerName}</Text>
                    <Text style={styles.serialNumber}>
                      Serial: {transaction.productId?.serialNumber || 'N/A'}
                    </Text>
                    <Text style={styles.borrowDate}>
                      Borrowed: {new Date(transaction.borrowDate).toLocaleDateString('en-US')}
                    </Text>
                    {overdue && transaction.status !== 'completed' && transaction.status !== 'canceled' && (
                      <Text style={styles.overdueWarning}>⚠️ Overdue</Text>
                    )}
                  </View>
                  
                  {/* Right: Price & Status */}
                  <View style={styles.rightSection}>
                    <Text style={styles.priceText}>
                      {transaction.depositAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor}20` }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        { color: statusColor }
                      ]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons - Only show for pending_pickup status */}
                {transaction.status === 'pending_pickup' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => handleConfirm(transaction._id)}
                      disabled={processingId === transaction._id}
                    >
                      {processingId === transaction._id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancel(transaction._id)}
                      disabled={processingId === transaction._id}
                    >
                      {processingId === transaction._id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#0F4D3A", // Dark Green
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF", // White
    flex: 1,
    textAlign: "center",
  },
  searchSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#0F4D3A",
    borderColor: "#0F4D3A",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  productThumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  serialNumber: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  borrowDate: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  overdueWarning: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "600",
    marginTop: 4,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
