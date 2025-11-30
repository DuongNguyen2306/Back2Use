import { borrowTransactionsApi } from "@/services/api/borrowTransactionService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
          
          {transaction.totalConditionPoints !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Condition Points:</Text>
              <Text style={styles.infoValue}>{transaction.totalConditionPoints}</Text>
            </View>
          )}
        </View>

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
            <Image source={{ uri: transaction.productId.qrCode }} style={styles.qrCodeImage} />
          </View>
        )}
      </ScrollView>
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
});

