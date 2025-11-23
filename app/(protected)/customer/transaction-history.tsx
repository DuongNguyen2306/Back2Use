import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import CustomerHeader from "../../../components/CustomerHeader";

interface CustomerBorrowHistoryItem {
  _id: string;
  customerId: string;
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
  businessId: {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    businessType?: string;
    businessLogoUrl?: string;
  };
  borrowTransactionType: string;
  borrowDate: string;
  dueDate: string;
  depositAmount: number;
  status: string;
  isLateProcessed: boolean;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
}

export default function CustomerTransactionHistory() {
  const [transactions, setTransactions] = useState<CustomerBorrowHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading customer borrow history...');
      
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (typeFilter !== 'all') {
        params.borrowTransactionType = typeFilter;
      }
      
      if (searchTerm.trim()) {
        params.productName = searchTerm.trim();
      }
      
      const response = await borrowTransactionsApi.getCustomerHistory(params);
      
      console.log('📡 Customer Borrow History Response:', response);
      
      if (response.statusCode === 200 && response.data?.items) {
        console.log('✅ Customer borrow history items:', response.data.items.length);
        setTransactions(response.data.items);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading borrow history:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải lịch sử mượn');
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [statusFilter, typeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (searchTerm.trim()) {
      const productName = transaction.productId?.productGroupId?.name?.toLowerCase() || '';
      const businessName = transaction.businessId?.businessName?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      return productName.includes(searchLower) || businessName.includes(searchLower);
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
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "returned":
        return "Đã trả";
      case "pending_pickup":
        return "Chờ nhận";
      case "pending":
        return "Chờ xử lý";
      case "active":
      case "borrowing":
        return "Đang mượn";
      case "overdue":
        return "Quá hạn";
      case "rejected":
        return "Từ chối";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleTransactionPress = (transaction: CustomerBorrowHistoryItem) => {
    const productName = transaction.productId?.productGroupId?.name || 'N/A';
    const sizeName = transaction.productId?.productSizeId?.sizeName || 'N/A';
    const businessName = transaction.businessId?.businessName || 'N/A';
    const borrowDate = new Date(transaction.borrowDate).toLocaleDateString('vi-VN');
    const dueDate = new Date(transaction.dueDate).toLocaleDateString('vi-VN');
    
    Alert.alert(
      "Chi tiết giao dịch",
      `Sản phẩm: ${productName} - ${sizeName}\n` +
      `Cửa hàng: ${businessName}\n` +
      `Ngày mượn: ${borrowDate}\n` +
      `Hạn trả: ${dueDate}\n` +
      `Tiền cọc: ${transaction.depositAmount.toLocaleString('vi-VN')} VNĐ\n` +
      `Trạng thái: ${getStatusLabel(transaction.status)}`,
      [{ text: "Đóng" }]
    );
  };

  return (
    <View style={styles.container}>
      <CustomerHeader />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F4D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử mượn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm hoặc cửa hàng..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#6b7280"
            onSubmitEditing={loadHistory}
          />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Loại</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, typeFilter === "all" && styles.activeFilterButton]}
                onPress={() => setTypeFilter("all")}
              >
                <Text style={[styles.filterButtonText, typeFilter === "all" && styles.activeFilterButtonText]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, typeFilter === "borrow" && styles.activeFilterButton]}
                onPress={() => setTypeFilter("borrow")}
              >
                <Text style={[styles.filterButtonText, typeFilter === "borrow" && styles.activeFilterButtonText]}>
                  Mượn
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Trạng thái</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "all" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("all")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "all" && styles.activeFilterButtonText]}>
                  Tất cả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "pending_pickup" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("pending_pickup")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "pending_pickup" && styles.activeFilterButtonText]}>
                  Chờ nhận
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "borrowing" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("borrowing")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "borrowing" && styles.activeFilterButtonText]}>
                  Đang mượn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === "completed" && styles.activeFilterButton]}
                onPress={() => setStatusFilter("completed")}
              >
                <Text style={[styles.filterButtonText, statusFilter === "completed" && styles.activeFilterButtonText]}>
                  Hoàn thành
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F4D3A" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyTitle}>Không tìm thấy giao dịch</Text>
            <Text style={styles.emptySubtitle}>Thử điều chỉnh bộ lọc hoặc tìm kiếm</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => {
            const productName = transaction.productId?.productGroupId?.name || 'N/A';
            const sizeName = transaction.productId?.productSizeId?.sizeName || 'N/A';
            const businessName = transaction.businessId?.businessName || 'N/A';
            const productImage = transaction.productId?.productGroupId?.imageUrl;
            const overdue = isOverdue(transaction.dueDate);
            
            return (
              <TouchableOpacity
                key={transaction._id}
                style={styles.transactionCard}
                onPress={() => handleTransactionPress(transaction)}
              >
                <View style={styles.transactionHeader}>
                  {productImage && (
                    <Image source={{ uri: productImage }} style={styles.productImage} />
                  )}
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{productName}</Text>
                    <Text style={styles.transactionSubtitle}>Kích thước: {sizeName}</Text>
                    <Text style={styles.businessName}>{businessName}</Text>
                    <Text style={styles.transactionDate}>
                      Mượn: {new Date(transaction.borrowDate).toLocaleDateString('vi-VN')}
                    </Text>
                    <Text style={[styles.dueDate, overdue && styles.dueDateOverdue]}>
                      Hạn trả: {new Date(transaction.dueDate).toLocaleDateString('vi-VN')}
                      {overdue && ' ⚠️'}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.amountText}>
                      {transaction.depositAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {getStatusLabel(transaction.status)}
                      </Text>
                    </View>
                  </View>
                </View>
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
    flexWrap: "wrap",
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
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
  transactionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  businessName: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  dueDateOverdue: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  transactionAmount: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
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
});
