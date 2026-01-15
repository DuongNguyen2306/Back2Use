import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { singleUseProductUsageApi } from "@/services/api/businessService";
import { Feedback, feedbackApi } from "@/services/api/feedbackService";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface TransactionDetail {
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
      materialId: {
        _id: string;
        materialName: string;
      };
      name: string;
      imageUrl?: string;
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
  returnDate?: string;
  depositAmount: number;
  status: string;
  extensionCount?: number;
  isLateProcessed: boolean;
  previousConditionImages?: {
    _id: string;
    topImage?: string;
    bottomImage?: string;
    frontImage?: string;
    backImage?: string;
    leftImage?: string;
    rightImage?: string;
  };
  currentConditionImages?: {
    _id: string;
    topImage?: string;
    bottomImage?: string;
    frontImage?: string;
    backImage?: string;
    leftImage?: string;
    rightImage?: string;
  };
  previousDamageFaces?: Array<{
    _id: string;
    face: string;
    issue: string;
  }>;
  currentDamageFaces?: Array<{
    _id: string;
    face: string;
    issue: string;
  }>;
  totalConditionPoints?: number;
  dueNotificationSent?: boolean;
  dueDateNotificationSent?: boolean;
  dueNotificationSentAt?: string;
  co2Changed?: number;
  ecoPointChanged?: number;
  rankingPointChanged?: number;
  rewardPointChanged?: number;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  walletTransactions?: Array<{
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
  }>;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [singleUseProductUsages, setSingleUseProductUsages] = useState<any[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  useEffect(() => {
    if (id) {
      loadTransactionDetail();
    }
  }, [id]);

  const loadTransactionDetail = async () => {
    try {
      setLoading(true);
      const response = await borrowTransactionsApi.getCustomerDetail(id);
      
      if (response.statusCode === 200 && response.data) {
        setTransaction(response.data);
        // Check if feedback exists for this transaction
        await checkExistingFeedback();
        // Load single-use product usages
        await loadSingleUseProductUsages(id);
      } else {
        Alert.alert('Error', 'Failed to load transaction detail');
        router.back();
      }
    } catch (error: any) {
      console.error('Error loading transaction detail:', error);
      Alert.alert('Error', error.message || 'Failed to load transaction detail');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkExistingFeedback = async () => {
    if (!id) return;
    try {
      setLoadingFeedback(true);
      const response = await feedbackApi.getMy({ page: 1, limit: 100 });
      const feedbacks = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.items || [];
      
      const feedback = feedbacks.find((f: Feedback) => f.borrowTransactionId === id);
      if (feedback) {
        setExistingFeedback(feedback);
        setRating(feedback.rating);
        setComment(feedback.comment || '');
      }
    } catch (error) {
      console.error('Error checking existing feedback:', error);
      // Silently fail - user can still create feedback
    } finally {
      setLoadingFeedback(false);
    }
  };

  const loadSingleUseProductUsages = async (borrowTransactionId: string) => {
    try {
      setLoadingUsages(true);
      const response = await singleUseProductUsageApi.getByBorrowTransaction(borrowTransactionId);
      
      let responseData = (response as any)?.data || response;
      let usagesArray: any[] = [];
      
      if (Array.isArray(responseData)) {
        usagesArray = responseData;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        usagesArray = responseData.data;
      } else if (responseData?.usages && Array.isArray(responseData.usages)) {
        usagesArray = responseData.usages;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        usagesArray = responseData.items;
      }
      
      setSingleUseProductUsages(usagesArray);
    } catch (error: any) {
      console.error('Error loading single-use product usages:', error);
      setSingleUseProductUsages([]);
    } finally {
      setLoadingUsages(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!transaction || !id) return;
    
    if (rating < 1 || rating > 5) {
      Alert.alert('Error', 'Please select a rating from 1 to 5');
      return;
    }

    try {
      setSubmittingFeedback(true);
      
      if (existingFeedback) {
        // Update existing feedback
        await feedbackApi.update(existingFeedback._id, {
          rating,
          comment: comment.trim() || undefined,
        });
        Alert.alert('Success', 'Feedback updated successfully!');
      } else {
        // Create new feedback
        await feedbackApi.create({
          borrowTransactionId: id,
          rating,
          comment: comment.trim() || undefined,
        });
        Alert.alert('Success', 'Thank you for your feedback!');
      }
      
      setShowFeedbackModal(false);
      await checkExistingFeedback(); // Reload feedback
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCopyTxHash = async (txHash: string) => {
    try {
      await Clipboard.setStringAsync(txHash);
      Alert.alert("Đã sao chép", "Blockchain transaction hash đã được sao chép vào clipboard");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert("Lỗi", "Không thể sao chép");
    }
  };

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
        return "Pending";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(transaction.status);
  const statusLabel = getStatusLabel(transaction.status);
  const overdue = isOverdue(transaction.dueDate);
  const productName = transaction.productId?.productGroupId?.name || 'N/A';
  const sizeName = transaction.productId?.productSizeId?.sizeName || 'N/A';
  const materialName = transaction.productId?.productGroupId?.materialId?.materialName || 'N/A';
  const businessName = transaction.businessId?.businessName || 'N/A';
  const productImage = transaction.productId?.productGroupId?.imageUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Product Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={24} color="#0F4D3A" />
            <Text style={styles.cardTitle}>Product Information</Text>
          </View>
          
          {productImage && (
            <Image source={{ uri: productImage }} style={styles.productImage} />
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product Name:</Text>
            <Text style={styles.infoValue}>{productName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Size:</Text>
            <Text style={styles.infoValue}>{sizeName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Material:</Text>
            <Text style={styles.infoValue}>{materialName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Serial Number:</Text>
            <Text style={styles.infoValue}>{transaction.productId?.serialNumber || 'N/A'}</Text>
          </View>
          
          {/* Blockchain Transaction Hash - Hiển thị từ single-use usages nếu có */}
          {singleUseProductUsages.length > 0 && singleUseProductUsages[0]?.blockchainTxHash && (
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleCopyTxHash(singleUseProductUsages[0].blockchainTxHash)}
              activeOpacity={0.7}
            >
              <Text style={styles.infoLabel}>Blockchain Tx Hash:</Text>
              <View style={styles.txHashContainer}>
                <Text style={[styles.infoValue, styles.txHashValue]} numberOfLines={1}>
                  {singleUseProductUsages[0].blockchainTxHash}
                </Text>
                <Ionicons name="copy-outline" size={16} color="#6B7280" style={styles.copyIcon} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Business Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront-outline" size={24} color="#0F4D3A" />
            <Text style={styles.cardTitle}>Business Information</Text>
          </View>
          
          {transaction.businessId?.businessLogoUrl && (
            <Image source={{ uri: transaction.businessId.businessLogoUrl }} style={styles.businessLogo} />
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{businessName}</Text>
          </View>
          
          {transaction.businessId?.businessType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{transaction.businessId.businessType}</Text>
            </View>
          )}
          
          {transaction.businessId?.businessAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{transaction.businessId.businessAddress}</Text>
            </View>
          )}
          
          {transaction.businessId?.businessPhone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{transaction.businessId.businessPhone}</Text>
            </View>
          )}
        </View>

        {/* Transaction Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color="#0F4D3A" />
            <Text style={styles.cardTitle}>Transaction Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID:</Text>
            <Text style={styles.infoValue}>{transaction._id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Borrow Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(transaction.borrowDate).toLocaleString('vi-VN')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={[styles.infoValue, overdue && styles.overdueText]}>
              {new Date(transaction.dueDate).toLocaleString('vi-VN')}
              {overdue && ' (Overdue)'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Deposit Amount:</Text>
            <Text style={[styles.infoValue, styles.amountText]}>
              {transaction.depositAmount.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
          
          {transaction.extensionCount !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Extension Count:</Text>
              <Text style={styles.infoValue}>{transaction.extensionCount}</Text>
            </View>
          )}
          
          
          {transaction.returnDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Return Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(transaction.returnDate).toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
          
          {transaction.extensionCount !== undefined && transaction.extensionCount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Extension Count:</Text>
              <Text style={styles.infoValue}>{transaction.extensionCount}</Text>
            </View>
          )}
          
          {transaction.totalConditionPoints !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Condition Points:</Text>
              <Text style={styles.infoValue}>{transaction.totalConditionPoints}</Text>
            </View>
          )}
        </View>

        {/* Rewards & Points Card */}
        {(transaction.co2Changed !== undefined || 
          transaction.ecoPointChanged !== undefined || 
          transaction.rankingPointChanged !== undefined || 
          transaction.rewardPointChanged !== undefined) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Rewards & Points</Text>
            </View>
            
            {transaction.co2Changed !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CO₂ Saved:</Text>
                <Text style={[styles.infoValue, styles.positiveValue]}>
                  {transaction.co2Changed.toFixed(3)} kg
                </Text>
              </View>
            )}
            
            {transaction.ecoPointChanged !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Eco Points:</Text>
                <Text style={[styles.infoValue, styles.positiveValue]}>
                  +{transaction.ecoPointChanged.toFixed(1)}
                </Text>
              </View>
            )}
            
            {transaction.rankingPointChanged !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ranking Points:</Text>
                <Text style={[styles.infoValue, styles.positiveValue]}>
                  +{transaction.rankingPointChanged}
                </Text>
              </View>
            )}
            
            {transaction.rewardPointChanged !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reward Points:</Text>
                <Text style={[styles.infoValue, styles.positiveValue]}>
                  +{transaction.rewardPointChanged}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Single-Use Products Card */}
        {singleUseProductUsages.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="leaf-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Single-Use Products Used</Text>
            </View>
            
            {loadingUsages ? (
              <ActivityIndicator size="small" color="#0F4D3A" style={{ marginVertical: 16 }} />
            ) : (
              singleUseProductUsages.map((usage) => {
                // Extract product data
                let product: any = null;
                let productName = 'N/A';
                let sizeName = 'N/A';
                let productImage: string | null = null;
                let co2PerUnit = 0;

                // Check for populated product in usage
                if (usage.product) {
                  product = usage.product;
                } else if (usage.singleUseProductId && typeof usage.singleUseProductId === 'object') {
                  product = usage.singleUseProductId;
                }

                if (product) {
                  productName = product.name || product.productName || 'N/A';
                  sizeName = product.size || (product.productSizeId?.name || product.productSizeId?.sizeName) || 'N/A';
                  productImage = product.imageUrl || product.image || null;
                  co2PerUnit = usage.co2PerUnit || product.co2Emission || 0;
                }

                return (
                  <View key={usage._id} style={styles.usageCard}>
                    <View style={styles.usageCardContent}>
                      {productImage && (
                        <Image source={{ uri: productImage }} style={styles.usageProductImage} />
                      )}
                      <View style={{ flex: 1, marginLeft: productImage ? 12 : 0 }}>
                        <Text style={styles.usageProductName}>{productName}</Text>
                        <Text style={styles.usageProductSize}>Size: {sizeName}</Text>
                        {usage.note && (
                          <Text style={styles.usageNote}>Note: {usage.note}</Text>
                        )}
                        <View style={styles.co2Row}>
                          <Ionicons name="leaf" size={16} color="#10B981" />
                          <Text style={styles.co2Text}>
                            CO₂ Saved: {co2PerUnit.toFixed(3)} kg
                          </Text>
                        </View>
                        {usage.blockchainTxHash && (
                          <TouchableOpacity 
                            style={styles.txHashRow}
                            onPress={() => handleCopyTxHash(usage.blockchainTxHash)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="link" size={14} color="#6B7280" />
                            <Text style={styles.txHashText} numberOfLines={1}>
                              {usage.blockchainTxHash}
                            </Text>
                            <Ionicons name="copy-outline" size={14} color="#6B7280" style={styles.copyIcon} />
                          </TouchableOpacity>
                        )}
                        {usage.createdAt && (
                          <Text style={styles.usageDate}>
                            {new Date(usage.createdAt).toLocaleString('en-US')}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Condition Images Card */}
        {(transaction.previousConditionImages || transaction.currentConditionImages) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="images-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Condition Images</Text>
            </View>
            
            {transaction.previousConditionImages && (
              <View style={styles.imageSection}>
                <Text style={styles.imageSectionTitle}>Before Borrowing</Text>
                <View style={styles.imageGrid}>
                  {transaction.previousConditionImages.frontImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Front</Text>
                      <Image 
                        source={{ uri: transaction.previousConditionImages.frontImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.previousConditionImages.backImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Back</Text>
                      <Image 
                        source={{ uri: transaction.previousConditionImages.backImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.previousConditionImages.leftImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Left</Text>
                      <Image 
                        source={{ uri: transaction.previousConditionImages.leftImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.previousConditionImages.rightImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Right</Text>
                      <Image 
                        source={{ uri: transaction.previousConditionImages.rightImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.previousConditionImages.topImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Top</Text>
                      <Image 
                        source={{ uri: transaction.previousConditionImages.topImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.previousConditionImages.bottomImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Bottom</Text>
                      <Image 
                        source={{ uri: transaction.previousConditionImages.bottomImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {transaction.currentConditionImages && (
              <View style={styles.imageSection}>
                <Text style={styles.imageSectionTitle}>After Returning</Text>
                <View style={styles.imageGrid}>
                  {transaction.currentConditionImages.frontImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Front</Text>
                      <Image 
                        source={{ uri: transaction.currentConditionImages.frontImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.currentConditionImages.backImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Back</Text>
                      <Image 
                        source={{ uri: transaction.currentConditionImages.backImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.currentConditionImages.leftImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Left</Text>
                      <Image 
                        source={{ uri: transaction.currentConditionImages.leftImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.currentConditionImages.rightImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Right</Text>
                      <Image 
                        source={{ uri: transaction.currentConditionImages.rightImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.currentConditionImages.topImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Top</Text>
                      <Image 
                        source={{ uri: transaction.currentConditionImages.topImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                  {transaction.currentConditionImages.bottomImage && (
                    <View style={styles.imageItem}>
                      <Text style={styles.imageLabel}>Bottom</Text>
                      <Image 
                        source={{ uri: transaction.currentConditionImages.bottomImage }} 
                        style={styles.conditionImage} 
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Damage Faces Card */}
        {(transaction.previousDamageFaces && transaction.previousDamageFaces.length > 0) ||
         (transaction.currentDamageFaces && transaction.currentDamageFaces.length > 0) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Damage Assessment</Text>
            </View>
            
            {transaction.previousDamageFaces && transaction.previousDamageFaces.length > 0 && (
              <View style={styles.damageSection}>
                <Text style={styles.damageSectionTitle}>Before Borrowing</Text>
                {transaction.previousDamageFaces.map((face, index) => (
                  <View key={face._id || index} style={styles.damageItem}>
                    <Text style={styles.damageFace}>{face.face.toUpperCase()}</Text>
                    <Text style={[
                      styles.damageIssue,
                      face.issue === 'none' ? styles.noDamage : styles.hasDamage
                    ]}>
                      {face.issue === 'none' ? 'No Damage' : face.issue}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {transaction.currentDamageFaces && transaction.currentDamageFaces.length > 0 && (
              <View style={styles.damageSection}>
                <Text style={styles.damageSectionTitle}>After Returning</Text>
                {transaction.currentDamageFaces.map((face, index) => (
                  <View key={face._id || index} style={styles.damageItem}>
                    <Text style={styles.damageFace}>{face.face.toUpperCase()}</Text>
                    <Text style={[
                      styles.damageIssue,
                      face.issue === 'none' ? styles.noDamage : styles.hasDamage
                    ]}>
                      {face.issue === 'none' ? 'No Damage' : face.issue}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Wallet Transactions Card */}
        {transaction.walletTransactions && transaction.walletTransactions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Wallet Transactions</Text>
            </View>
            
            {transaction.walletTransactions.map((walletTx) => (
              <View key={walletTx._id} style={styles.walletTxCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>{walletTx.transactionType}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount:</Text>
                  <Text style={[
                    styles.infoValue,
                    walletTx.direction === 'in' ? styles.amountIn : styles.amountOut
                  ]}>
                    {walletTx.direction === 'in' ? '+' : '-'}
                    {walletTx.amount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    walletTx.status === 'completed' 
                      ? { backgroundColor: '#16a34a20' }
                      : { backgroundColor: '#f59e0b20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: walletTx.status === 'completed' ? '#16a34a' : '#f59e0b' }
                    ]}>
                      {walletTx.status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Description:</Text>
                  <Text style={styles.infoValue}>{walletTx.description}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(walletTx.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* QR Code Card */}
        {transaction.productId?.qrCode && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="qr-code-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Product QR Code</Text>
            </View>
            <Image 
              source={{ uri: transaction.productId.qrCode }} 
              style={styles.qrCodeImage} 
            />
          </View>
        )}

        {/* Feedback Section - Show for returned transactions */}
        {(transaction.status === 'returned' || transaction.status === 'completed') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-outline" size={24} color="#0F4D3A" />
              <Text style={styles.cardTitle}>Feedback</Text>
            </View>
            
            {existingFeedback ? (
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.ratingDisplay}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= existingFeedback.rating ? "star" : "star-outline"}
                        size={24}
                        color="#FCD34D"
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>{existingFeedback.rating}/5</Text>
                </View>
                {existingFeedback.comment && (
                  <Text style={styles.feedbackComment}>{existingFeedback.comment}</Text>
                )}
                <Text style={styles.feedbackDate}>
                  {new Date(existingFeedback.createdAt).toLocaleDateString('en-US')}
                </Text>
                <TouchableOpacity
                  style={styles.editFeedbackButton}
                  onPress={() => setShowFeedbackModal(true)}
                >
                  <Ionicons name="create-outline" size={18} color="#0F4D3A" />
                  <Text style={styles.editFeedbackButtonText}>Edit Feedback</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={() => setShowFeedbackModal(true)}
              >
                <Ionicons name="star-outline" size={20} color="#FFFFFF" />
                <Text style={styles.feedbackButtonText}>Leave Feedback</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.modalTitle}>
                {existingFeedback ? 'Edit Feedback' : 'Leave Feedback'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Business Info */}
              <View style={styles.businessInfoCard}>
                {transaction.businessId?.businessLogoUrl && (
                  <Image
                    source={{ uri: transaction.businessId.businessLogoUrl }}
                    style={styles.businessLogoSmall}
                  />
                )}
                <View style={styles.businessInfoText}>
                  <Text style={styles.businessNameText}>{businessName}</Text>
                  <Text style={styles.businessTypeText}>{transaction.businessId?.businessType || 'Business'}</Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={40}
                        color="#FCD34D"
                      />
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
                    <Text style={styles.submitButtonText}>
                      {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                    </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  businessLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountText: {
    fontWeight: '600',
    color: '#0F4D3A',
  },
  amountIn: {
    color: '#16a34a',
    fontWeight: '600',
  },
  amountOut: {
    color: '#ef4444',
    fontWeight: '600',
  },
  overdueText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  walletTxCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  qrCodeImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  // Feedback Styles
  feedbackCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingDisplay: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  editFeedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4EA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  editFeedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4D3A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    maxHeight: '70%',
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  businessInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  businessLogoSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  businessInfoText: {
    flex: 1,
  },
  businessNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessTypeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4D3A',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positiveValue: {
    color: '#16a34a',
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageItem: {
    width: '48%',
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  conditionImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  damageSection: {
    marginBottom: 20,
  },
  damageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  damageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  damageFace: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  damageIssue: {
    fontSize: 14,
    fontWeight: '500',
  },
  noDamage: {
    color: '#16a34a',
  },
  hasDamage: {
    color: '#ef4444',
  },
  // Single-Use Product Usage Styles
  usageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  usageCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  usageProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  usageProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  usageProductSize: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  usageNote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  co2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  co2Text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  usageDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  txHashValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#6B7280',
  },
  txHashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  txHashText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    flex: 1,
  },
  txHashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  copyIcon: {
    marginLeft: 4,
  },
});

