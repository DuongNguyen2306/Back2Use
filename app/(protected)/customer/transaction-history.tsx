import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CustomerBorrowHistoryItem {
  _id: string;
  customerId: string;
  productId: {
    _id: string;
    productGroupId: {
      _id: string;
      name: string;
      imageUrl?: string;
      materialId?: {
        _id: string;
        materialName: string;
      };
    };
    productSizeId: {
      _id: string;
      sizeName: string;
    };
    qrCode?: string;
    serialNumber: string;
    status?: string;
    reuseCount?: number;
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
  extensionCount?: number;
  isLateProcessed: boolean;
  previousConditionImages?: {
    _id: string;
  };
  currentConditionImages?: {
    _id: string;
  };
  previousDamageFaces?: any[];
  currentDamageFaces?: any[];
  totalConditionPoints?: number;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  walletTransaction?: {
    _id: string;
    walletId: string;
    relatedUserId: string;
    relatedUserType: string;
    transactionType: string;
    amount: number;
    direction: string;
    referenceId: string;
    referenceType: string;
    balanceType: string;
    toBalanceType?: string | null;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

export default function CustomerTransactionHistory() {
  const [transactions, setTransactions] = useState<CustomerBorrowHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [additionalDays, setAdditionalDays] = useState("7");

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
      Alert.alert('Error', 'Failed to load borrow history');
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
        return "Cancelled";
      default:
        return "Pending Pickup";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleTransactionPress = (transaction: CustomerBorrowHistoryItem) => {
    router.push({
      pathname: '/(protected)/customer/transaction-detail/[id]',
      params: { id: transaction._id }
    });
  };

  const handleExtend = async (transactionId: string) => {
    const days = parseInt(additionalDays);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Error', 'Please enter a valid number of days (minimum 1)');
      return;
    }

    try {
      setExtendingId(transactionId);
      await borrowTransactionsApi.extend(transactionId, days);
      Alert.alert('Success', `Borrow duration extended by ${days} day(s)`);
      setShowExtendModal(false);
      setAdditionalDays("7");
      setSelectedTransactionId(null);
      loadHistory();
    } catch (error: any) {
      console.error('❌ Error extending borrow transaction:', error);
      Alert.alert('Error', error.message || 'Failed to extend borrow duration');
    } finally {
      setExtendingId(null);
    }
  };

  const openExtendModal = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setShowExtendModal(true);
    setAdditionalDays("7");
  };

  const handleCancel = async (transactionId: string) => {
    Alert.alert(
      'Confirm Cancel',
      'Are you sure you want to cancel this borrow order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelingId(transactionId);
              await borrowTransactionsApi.cancel(transactionId);
              
              // Update transaction status locally immediately
              setTransactions(prevTransactions =>
                prevTransactions.map(t =>
                  t._id === transactionId
                    ? { ...t, status: 'cancelled' }
                    : t
                )
              );
              
              Alert.alert('Success', 'Borrow order cancelled successfully.');
              
              // Reload history to get latest data
              await loadHistory();
            } catch (error: any) {
              console.error('❌ Cancel transaction error:', error);
              console.error('❌ Error details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
              });
              
              const errorMessage = error?.response?.data?.message || error?.message || '';
              const errorStatus = error?.response?.status;
              
              if (errorStatus === 400 || errorMessage.toLowerCase().includes('cannot cancel') || 
                  errorMessage.toLowerCase().includes('không thể hủy') ||
                  errorMessage.toLowerCase().includes('not allowed') ||
                  errorMessage.toLowerCase().includes('invalid status')) {
                Alert.alert(
                  'Cannot Cancel',
                  errorMessage || 'This borrow order cannot be cancelled. It may have been confirmed or already processed.'
                );
              } else if (errorStatus === 404) {
                Alert.alert('Error', 'Transaction not found. It may have been deleted.');
              } else if (errorStatus === 403) {
                Alert.alert('Error', 'You do not have permission to cancel this transaction.');
              } else {
                Alert.alert('Error', errorMessage || 'Failed to cancel borrow order. Please try again later.');
              }
            } finally {
              setCancelingId(null);
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
        <Text style={styles.headerTitle}>Borrowing History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
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
            const businessName = transaction.businessId?.businessName || 'N/A';
            const productImage = transaction.productId?.productGroupId?.imageUrl;
            const overdue = isOverdue(transaction.dueDate);
            
            const statusLabel = getStatusLabel(transaction.status);
            const isPendingPickup = transaction.status === 'pending_pickup' || transaction.status === 'pending';
            const isCancelled = transaction.status === 'cancelled' || transaction.status === 'canceled';
            const isBorrowing = transaction.status === 'borrowing';
            
            const canCancel = isPendingPickup && !isCancelled;
            const canExtend = isBorrowing && !isCancelled && !overdue;
            const isCanceling = cancelingId === transaction._id;
            const isExtending = extendingId === transaction._id;
            
            return (
              <TouchableOpacity
                key={transaction._id}
                style={styles.transactionCard}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.7}
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
                      Borrowed: {new Date(transaction.borrowDate).toLocaleDateString('en-US')}
                    </Text>
                  </View>
                  
                  {/* Right: Price & Status */}
                  <View style={styles.rightSection}>
                    <Text style={styles.priceText}>
                      {transaction.depositAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      isPendingPickup ? styles.statusBadgePending : 
                      isCancelled ? styles.statusBadgeCancelled :
                      styles.statusBadgeDefault
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        isPendingPickup ? styles.statusBadgeTextPending : 
                        isCancelled ? styles.statusBadgeTextCancelled :
                        styles.statusBadgeTextDefault
                      ]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer} onStartShouldSetResponder={() => true}>
                  {/* Extend Button - Only show for borrowing transactions (not cancelled, not overdue) */}
                  {canExtend && (
                    <TouchableOpacity
                      style={[styles.extendButton, isExtending && styles.extendButtonDisabled]}
                      onPress={(e) => {
                        e.stopPropagation();
                        openExtendModal(transaction._id);
                      }}
                      disabled={isExtending}
                    >
                      {isExtending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.extendButtonText}>Extend</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                
                {/* Cancel Button - Only show for pending transactions (not cancelled) */}
                {canCancel && !isCancelled && (
                  <TouchableOpacity
                    style={[styles.cancelButton, isCanceling && styles.cancelButtonDisabled]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancel(transaction._id);
                    }}
                    disabled={isCanceling}
                  >
                    {isCanceling ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.cancelButtonText}>Cancel Order</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Extend Duration Modal */}
      <Modal
        visible={showExtendModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowExtendModal(false);
          setSelectedTransactionId(null);
          setAdditionalDays("7");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extend Borrow Duration</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowExtendModal(false);
                  setSelectedTransactionId(null);
                  setAdditionalDays("7");
                }}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Enter the number of additional days you want to extend the borrow period.
              </Text>
              <Text style={styles.modalNote}>
                Note: Maximum 3 extensions allowed, 24h cooldown between extensions, cannot extend overdue transactions.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Additional Days</Text>
                <TextInput
                  style={styles.input}
                  value={additionalDays}
                  onChangeText={setAdditionalDays}
                  placeholder="7"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowExtendModal(false);
                    setSelectedTransactionId(null);
                    setAdditionalDays("7");
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, (extendingId || !selectedTransactionId) && styles.modalConfirmButtonDisabled]}
                  onPress={() => selectedTransactionId && handleExtend(selectedTransactionId)}
                  disabled={!!extendingId || !selectedTransactionId}
                >
                  {extendingId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Extend</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  extendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  extendButtonDisabled: {
    opacity: 0.6,
  },
  extendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  statusBadgeCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeTextCancelled: {
    color: "#EF4444",
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  extendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  extendButtonDisabled: {
    opacity: 0.6,
  },
  extendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  modalNote: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.6,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
