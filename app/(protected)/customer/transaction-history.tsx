import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading customer borrow history...');
      
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (statusFilter !== 'all') {
        // Map filter values to API status values
        const statusMap: { [key: string]: string } = {
          'borrowing': 'borrowing',
          'pending_pickup': 'pending_pickup',
          'completed': 'completed',
        };
        params.status = statusMap[statusFilter] || statusFilter;
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
  }, [statusFilter]);

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
      case "returned":
        return "Hoàn thành";
      case "pending_pickup":
        return "Chờ nhận";
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
        return "Chờ nhận";
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
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header - Dark Green Branded Style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử mượn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
            onSubmitEditing={loadHistory}
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
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "borrowing" && styles.filterChipActive]}
            onPress={() => setStatusFilter("borrowing")}
          >
            <Text style={[styles.filterChipText, statusFilter === "borrowing" && styles.filterChipTextActive]}>
              Đang mượn
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "pending_pickup" && styles.filterChipActive]}
            onPress={() => setStatusFilter("pending_pickup")}
          >
            <Text style={[styles.filterChipText, statusFilter === "pending_pickup" && styles.filterChipTextActive]}>
              Chờ nhận
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === "completed" && styles.filterChipActive]}
            onPress={() => setStatusFilter("completed")}
          >
            <Text style={[styles.filterChipText, statusFilter === "completed" && styles.filterChipTextActive]}>
              Hoàn thành
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
            
            const statusLabel = getStatusLabel(transaction.status);
            const isPendingPickup = transaction.status === 'pending_pickup';
            
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
                  
                  {/* Middle: Product Info */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>{productName} - {sizeName}</Text>
                    <Text style={styles.storeName}>{businessName}</Text>
                    <Text style={styles.borrowDate}>
                      Mượn: {new Date(transaction.borrowDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  
                  {/* Right: Price & Status */}
                  <View style={styles.rightSection}>
                    <Text style={styles.priceText}>
                      {transaction.depositAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      isPendingPickup ? styles.statusBadgePending : styles.statusBadgeDefault
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        isPendingPickup ? styles.statusBadgeTextPending : styles.statusBadgeTextDefault
                      ]}>
                        {statusLabel}
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
    marginHorizontal: 16,
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
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  storeName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  borrowDate: {
    fontSize: 13,
    color: "#6B7280",
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
  statusBadgePending: {
    backgroundColor: "#DBEAFE",
  },
  statusBadgeDefault: {
    backgroundColor: "#F3F4F6",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadgeTextPending: {
    color: "#3B82F6",
  },
  statusBadgeTextDefault: {
    color: "#6B7280",
  },
});
