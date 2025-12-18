import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { Feedback, feedbackApi } from "@/services/api/feedbackService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/* -------------------------------------------------------------------------- */
/*                            STYLES ĐẶT Ở ĐẦU FILE                           */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#0F4D3A",
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterChipsContainer: { paddingHorizontal: 16, gap: 12 },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
  },
  filterChipActive: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  filterChipText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  filterChipTextActive: { color: "#FFFFFF" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6b7280" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#6b7280", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonsContainer: { flexDirection: "row", gap: 8, marginTop: 12 },
  extendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  extendButtonDisabled: { opacity: 0.6 },
  extendButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  cancelButtonOutlined: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
  },
  cancelButtonDisabled: { opacity: 0.5 },
  cancelButtonOutlinedText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },
  feedbackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F4D3A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  feedbackButtonEdit: { backgroundColor: "#F59E0B" },
  feedbackButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  businessInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  businessLogoSmall: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  businessInfoText: { flex: 1 },
  businessNameText: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 4 },
  businessTypeText: { fontSize: 14, color: "#6B7280" },
  ratingSection: { marginBottom: 24 },
  ratingLabel: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 },
  ratingContainer: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 },
  starButton: { padding: 4 },
  ratingText: { fontSize: 16, fontWeight: "600", color: "#0F4D3A", textAlign: "center" },
  commentSection: { marginBottom: 20 },
  commentLabel: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 },
  commentInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: "#1F2937",
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F4D3A",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  productThumbnail: { width: 72, height: 72, borderRadius: 12, marginRight: 16, backgroundColor: "#F3F4F6" },
  productThumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  productInfo: { flex: 1, marginRight: 12 },
  productTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  storeName: { fontSize: 14, color: "#6B7280", marginBottom: 6 },
  borrowDate: { fontSize: 13, color: "#6B7280" },
  rightSection: { alignItems: "flex-end" },
  priceText: { fontSize: 16, fontWeight: "700", color: "#0F4D3A", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgePending: { backgroundColor: "#FEF3C7" },
  statusBadgeActive: { backgroundColor: "#DBEAFE" },
  statusBadgeCompleted: { backgroundColor: "#D1FAE5" },
  statusBadgeDefault: { backgroundColor: "#F3F4F6" },
  statusBadgeCancelled: { backgroundColor: "#FEE2E2" },
  statusBadgeText: { fontSize: 12, fontWeight: "600" },
  statusBadgeTextPending: { color: "#D97706" },
  statusBadgeTextActive: { color: "#1E40AF" },
  statusBadgeTextCompleted: { color: "#059669" },
  statusBadgeTextDefault: { color: "#6B7280" },
  statusBadgeTextCancelled: { color: "#DC2626" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalBody: { padding: 20 },
  modalDescription: { fontSize: 14, color: "#374151", marginBottom: 8 },
  modalNote: { fontSize: 12, color: "#6B7280", marginBottom: 20, fontStyle: "italic" },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonDisabled: { opacity: 0.6 },
  modalConfirmButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
});

/* -------------------------------------------------------------------------- */
/*                               INTERFACES                                   */
/* -------------------------------------------------------------------------- */
interface CustomerBorrowHistoryItem {
  _id: string;
  customerId: string;
  productId: {
    _id: string;
    productGroupId: {
      _id: string;
      name: string;
      imageUrl?: string;
      materialId?: { _id: string; materialName: string };
    };
    productSizeId: { _id: string; sizeName: string };
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
  previousConditionImages?: { _id: string }[];
  currentConditionImages?: { _id: string }[];
  previousDamageFaces?: any[];
  currentDamageFaces?: any[];
  totalConditionPoints?: number;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  walletTransaction?: any;
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */
export default function CustomerTransactionHistory() {
  /* ----------------------------- State ----------------------------- */
  const [transactions, setTransactions] = useState<CustomerBorrowHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [additionalDays, setAdditionalDays] = useState("7");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedbackTransaction, setSelectedFeedbackTransaction] = useState<CustomerBorrowHistoryItem | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [transactionFeedbacks, setTransactionFeedbacks] = useState<Map<string, Feedback>>(new Map());

  /* ----------------------------- Load History ----------------------------- */
  const loadHistory = async () => {
    try {
      setLoading(true);
      const params: any = { page: 1, limit: 50 };

      if (statusFilter !== "all") {
        const statusMap: { [key: string]: string } = {
          borrowing: "borrowing",
          pending_pickup: "pending_pickup",
          completed: "returned", // API expects "returned" not "completed"
        };
        params.status = statusMap[statusFilter] || statusFilter;
      }

      const response = await borrowTransactionsApi.getCustomerHistory(params);

      if (response.statusCode === 200 && response.data?.items) {
        setTransactions(response.data.items);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      // Silently handle error - don't show alert to user
      console.log('Failed to load borrow history:', error?.message || error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ----------------------------- Load Feedbacks ----------------------------- */
  const loadFeedbacks = useCallback(async () => {
    try {
      const response = await feedbackApi.getMy({ page: 1, limit: 1000 });

      const feedbacksData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.items || [];

      const feedbackMap = new Map<string, Feedback>();
      feedbacksData.forEach((fb: Feedback) => {
        feedbackMap.set(fb.borrowTransactionId, fb);
      });

      setTransactionFeedbacks(feedbackMap);
    } catch (error: any) {
      console.error("Error loading feedbacks:", error);
    }
  }, []);

  /* ----------------------------- Effects ----------------------------- */
  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  /* ----------------------------- Helpers ----------------------------- */
  const filteredTransactions = transactions;

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
      case "returned":
        return "Returned";
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

  /* ----------------------------- Handlers ----------------------------- */
  const handleTransactionPress = (transaction: CustomerBorrowHistoryItem) => {
    router.push({
      pathname: "/(protected)/customer/transaction-detail/[id]",
      params: { id: transaction._id },
    });
  };

  const openExtendModal = (id: string) => {
    setSelectedTransactionId(id);
    setShowExtendModal(true);
    setAdditionalDays("7");
  };

  const openFeedbackModal = (transaction: CustomerBorrowHistoryItem) => {
    setSelectedFeedbackTransaction(transaction);
    const fb = transactionFeedbacks.get(transaction._id);
    if (fb) {
      setExistingFeedback(fb);
      setRating(fb.rating);
      setComment(fb.comment || "");
    } else {
      setExistingFeedback(null);
      setRating(5);
      setComment("");
    }
    setShowFeedbackModal(true);
  };

  const handleExtend = async (transactionId: string) => {
    const days = parseInt(additionalDays);
    if (isNaN(days) || days <= 0) {
      Alert.alert("Error", "Please enter a valid number of days (minimum 1)");
      return;
    }
    try {
      setExtendingId(transactionId);
      await borrowTransactionsApi.extend(transactionId, days);
      Alert.alert("Success", `Borrow duration extended by ${days} day(s)`);
      setShowExtendModal(false);
      setAdditionalDays("7");
      setSelectedTransactionId(null);
      loadHistory();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to extend");
    } finally {
      setExtendingId(null);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeedbackTransaction) return;
    if (rating < 1 || rating > 5) {
      Alert.alert("Error", "Please select a rating from 1 to 5");
      return;
    }

    try {
      setSubmittingFeedback(true);
      if (existingFeedback) {
        await feedbackApi.update(existingFeedback._id, { rating, comment: comment.trim() || undefined });
        Alert.alert("Success", "Feedback updated successfully!");
      } else {
        await feedbackApi.create({
          borrowTransactionId: selectedFeedbackTransaction._id,
          rating,
          comment: comment.trim() || undefined,
        });
        Alert.alert("Success", "Thank you for your feedback!");
      }
      setShowFeedbackModal(false);
      await loadFeedbacks();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCancel = async (transactionId: string) => {
    Alert.alert("Confirm Cancel", "Are you sure you want to cancel this borrow order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            setCancelingId(transactionId);
            await borrowTransactionsApi.cancel(transactionId);
            setTransactions((prev) =>
              prev.map((t) => (t._id === transactionId ? { ...t, status: "cancelled" } : t))
            );
            Alert.alert("Success", "Borrow order cancelled successfully.");
            await loadHistory();
          } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "";
            const errorStatus = error?.response?.status;

            if (
              errorStatus === 400 ||
              errorMessage.toLowerCase().includes("cannot cancel") ||
              errorMessage.toLowerCase().includes("không thể hủy") ||
              errorMessage.toLowerCase().includes("not allowed") ||
              errorMessage.toLowerCase().includes("invalid status")
            ) {
              Alert.alert(
                "Cannot Cancel",
                errorMessage || "This borrow order cannot be cancelled. It may have been confirmed or already processed."
              );
            } else if (errorStatus === 404) {
              Alert.alert("Error", "Transaction not found. It may have been deleted.");
            } else if (errorStatus === 403) {
              Alert.alert("Error", "You do not have permission to cancel this transaction.");
            } else {
              Alert.alert("Error", errorMessage || "Failed to cancel borrow order. Please try again later.");
            }
          } finally {
            setCancelingId(null);
          }
        },
      },
    ]);
  };

  /* ----------------------------- Render ----------------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrowing History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
          {["all", "borrowing", "pending_pickup", "completed"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}>
                {f === "all" ? "All" : f === "borrowing" ? "Borrowing" : f === "pending_pickup" ? "Pending Pickup" : "Returned"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
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
            const productName = transaction.productId?.productGroupId?.name || "N/A";
            const sizeName = transaction.productId?.productSizeId?.sizeName || "N/A";
            const businessName = transaction.businessId?.businessName || "N/A";
            const productImage = transaction.productId?.productGroupId?.imageUrl;
            const overdue = isOverdue(transaction.dueDate);
            const statusLabel = getStatusLabel(transaction.status);
            const isPendingPickup = transaction.status === "pending_pickup" || transaction.status === "pending";
            const isBorrowing = transaction.status === "borrowing";
            const isCompleted = transaction.status === "completed" || transaction.status === "returned";
            const isCancelled = ["cancelled", "canceled"].includes(transaction.status);
            const canCancel = isPendingPickup && !isCancelled;
            const canExtend = isBorrowing && !isCancelled && !overdue;
            const canFeedback = isCompleted && !isCancelled;
            const isCanceling = cancelingId === transaction._id;
            const isExtending = extendingId === transaction._id;
            const hasFeedback = transactionFeedbacks.has(transaction._id);

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
                    <Text style={styles.productTitle}>
                      {productName} - {sizeName}
                    </Text>
                    <Text style={styles.storeName}>{businessName}</Text>
                    <Text style={styles.borrowDate}>Borrowed: {new Date(transaction.borrowDate).toLocaleDateString("en-US")}</Text>
                    {/* Price per day */}
                    {(() => {
                      const basePrice = (transaction.productId?.productSizeId as any)?.basePrice;
                      if (basePrice) {
                        return (
                          <Text style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>
                            {basePrice.toLocaleString('vi-VN')} VND/day
                          </Text>
                        );
                      }
                      return null;
                    })()}
                    {/* CO2 Reduced */}
                    {(() => {
                      const co2Reduced = (transaction.productId as any)?.co2Reduced;
                      if (co2Reduced !== undefined && co2Reduced > 0) {
                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="leaf" size={12} color="#10B981" />
                            <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 4 }}>
                              CO₂: {co2Reduced.toFixed(3)} kg
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>

                  {/* Right: Price & Status */}
                  <View style={styles.rightSection}>
                    <Text style={styles.priceText}>{transaction.depositAmount.toLocaleString("vi-VN")} VNĐ</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isPendingPickup
                          ? styles.statusBadgePending
                          : isBorrowing
                            ? styles.statusBadgeActive
                            : isCompleted
                              ? styles.statusBadgeCompleted
                              : isCancelled
                                ? styles.statusBadgeCancelled
                                : styles.statusBadgeDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isPendingPickup
                            ? styles.statusBadgeTextPending
                            : isBorrowing
                              ? styles.statusBadgeTextActive
                              : isCompleted
                                ? styles.statusBadgeTextCompleted
                                : isCancelled
                                  ? styles.statusBadgeTextCancelled
                                  : styles.statusBadgeTextDefault,
                        ]}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer} onStartShouldSetResponder={() => true}>
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

                  {canCancel && !isCancelled && (
                    <TouchableOpacity
                      style={[styles.cancelButtonOutlined, isCanceling && styles.cancelButtonDisabled]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancel(transaction._id);
                      }}
                      disabled={isCanceling}
                    >
                      {isCanceling ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Text style={styles.cancelButtonOutlinedText}>Cancel</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {canFeedback && (
                    <TouchableOpacity
                      style={[styles.feedbackButton, hasFeedback && styles.feedbackButtonEdit]}
                      onPress={(e) => {
                        e.stopPropagation();
                        openFeedbackModal(transaction);
                      }}
                    >
                      <Ionicons name={hasFeedback ? "create-outline" : "star-outline"} size={18} color="#FFFFFF" />
                      <Text style={styles.feedbackButtonText}>{hasFeedback ? "Edit Feedback" : "Feedback"}</Text>
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
              <Text style={styles.modalDescription}>Enter the number of additional days you want to extend the borrow period.</Text>
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

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{existingFeedback ? "Edit Feedback" : "Leave Feedback"}</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Business Info */}
              {selectedFeedbackTransaction && (
                <View style={styles.businessInfoCard}>
                  {selectedFeedbackTransaction.businessId?.businessLogoUrl && (
                    <Image
                      source={{ uri: selectedFeedbackTransaction.businessId.businessLogoUrl }}
                      style={styles.businessLogoSmall}
                    />
                  )}
                  <View style={styles.businessInfoText}>
                    <Text style={styles.businessNameText}>
                      {selectedFeedbackTransaction.businessId?.businessName || "Business"}
                    </Text>
                    <Text style={styles.businessTypeText}>
                      {selectedFeedbackTransaction.businessId?.businessType || "Business"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                      <Ionicons name={star <= rating ? "star" : "star-outline"} size={40} color="#FCD34D" />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingText}>{rating}/5</Text>
              </View>

              {/* Comment */}
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>Comment (Optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share your experience..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitButton, submittingFeedback && styles.submitButtonDisabled]}
                onPress={handleSubmitFeedback}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>{existingFeedback ? "Update Feedback" : "Submit Feedback"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
