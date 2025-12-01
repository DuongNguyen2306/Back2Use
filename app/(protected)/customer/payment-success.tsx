import { walletTransactionsApi, type WalletTransaction } from '@/services/api/walletService';
import { getCurrentUserProfileWithAutoRefresh } from '@/services/api/userService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PaymentSuccessScreen() {
  const { txnRef, amount, failed, reason } = useLocalSearchParams<{ txnRef?: string; amount?: string; failed?: string; reason?: string }>();
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isFailed, setIsFailed] = useState(failed === 'true');

  const findTransaction = async (): Promise<WalletTransaction | null> => {
    try {
      // Fetch all recent transactions
      const [personalResponse, depositRefundResponse] = await Promise.all([
        walletTransactionsApi.getMy({
          walletType: 'customer',
          typeGroup: 'personal',
          page: 1,
          limit: 50,
        }),
        walletTransactionsApi.getMy({
          walletType: 'customer',
          typeGroup: 'deposit_refund',
          page: 1,
          limit: 50,
        }),
      ]);

      // Handle different response structures
      const personalTransactions = personalResponse.statusCode === 200 && personalResponse.data 
        ? personalResponse.data 
        : Array.isArray(personalResponse.data) 
          ? personalResponse.data 
          : [];
      
      const depositRefundTransactions = depositRefundResponse.statusCode === 200 && depositRefundResponse.data 
        ? depositRefundResponse.data 
        : Array.isArray(depositRefundResponse.data) 
          ? depositRefundResponse.data 
          : [];

      const allTransactions = [
        ...personalTransactions,
        ...depositRefundTransactions,
      ];

      // Priority 1: Find transaction by ID (txnRef from backend)
      if (txnRef && txnRef.trim() !== '') {
        const foundById = allTransactions.find((t) => {
          // Try exact match first
          if (t._id === txnRef || t._id.toString() === txnRef.toString()) {
            return true;
          }
          // Try string comparison (in case of type mismatch)
          return String(t._id) === String(txnRef);
        });
        if (foundById) {
          console.log('✅ Found transaction by ID:', foundById._id);
          return foundById;
        }
        console.log('⚠️ Transaction not found by ID, will retry...', { txnRef, totalTransactions: allTransactions.length });
      }

      // Priority 2: If not found by ID, try to find by amount and type (for top_up)
      // This is useful when txnRef is not provided or transaction is very new
      if (amount) {
        const amountValue = Number(amount);
        const foundByAmount = allTransactions.find(
          (t) =>
            (t.transactionType === 'top_up' || t.transactionType === 'deposit') &&
            t.direction === 'in' &&
            Math.abs(t.amount - amountValue) < 1 && // Exact match (no tolerance for amount)
            new Date(t.createdAt).getTime() > Date.now() - 10 * 60 * 1000 // Within last 10 minutes
        );
        if (foundByAmount) {
          console.log('✅ Found transaction by amount:', foundByAmount._id);
          return foundByAmount;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding transaction:', error);
      return null;
    }
  };

  const loadTransaction = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      let found = await findTransaction();
      
      // If we have txnRef but transaction not found, retry once after a short delay
      // This handles the case where backend just updated but API hasn't synced yet
      if (txnRef && txnRef.trim() !== '' && !found && retryCount < 2) {
        console.log(`⏳ Transaction not found, retrying... (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        found = await findTransaction();
      }
      
      setTransaction(found);

      // Load wallet balance
      try {
        const userProfile = await getCurrentUserProfileWithAutoRefresh();
        if (userProfile?.walletId) {
          // We can get balance from user profile if available
          // Otherwise, we'll need to call wallet API
        }
      } catch (error) {
        // Silent fail for wallet balance
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pollTransactionStatus = async () => {
    if (pollCount >= 15) {
      // Max 15 polls (30 seconds)
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setPollCount((prev) => prev + 1);

    try {
      const found = await findTransaction();
      if (found) {
        setTransaction(found);

        // If transaction is completed, stop polling
        if (found.status === 'completed') {
          setIsPolling(false);
          // Refresh wallet balance
          try {
            const userProfile = await getCurrentUserProfileWithAutoRefresh();
            if (userProfile?.walletId) {
              // Refresh balance if available
            }
          } catch (error) {
            // Silent fail
          }
        } else if (found.status === 'failed') {
          setIsPolling(false);
        } else {
          // Continue polling
          setTimeout(() => {
            pollTransactionStatus();
          }, 2000);
        }
      } else {
        // Transaction not found yet, continue polling
        setTimeout(() => {
          pollTransactionStatus();
        }, 2000);
      }
    } catch (error) {
      console.error('Error polling transaction:', error);
      // Continue polling on error
      setTimeout(() => {
        pollTransactionStatus();
      }, 2000);
    }
  };

  useEffect(() => {
    if (isFailed) {
      setIsLoading(false);
      // Create a mock failed transaction
      if (amount) {
        setTransaction({
          _id: txnRef || 'unknown',
          walletId: '',
          userId: '',
          amount: Number(amount),
          transactionType: 'top_up',
          direction: 'in',
          status: 'failed',
          description: reason || 'Giao dịch thất bại',
          referenceType: 'wallet',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        });
      }
    } else {
      // Load transaction with retry logic
      loadTransaction(0);
    }
  }, [txnRef, amount, failed, reason]);

  useEffect(() => {
    // Start polling if transaction is still processing
    if (transaction && transaction.status === 'processing' && !isPolling) {
      console.log('🔄 Starting polling for processing transaction:', transaction._id);
      // Start polling after 2 seconds
      const timeoutId = setTimeout(() => {
        pollTransactionStatus();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Also start polling if we have txnRef but no transaction found yet
    if (!transaction && txnRef && txnRef.trim() !== '' && !isPolling && pollCount < 15) {
      console.log('🔄 Starting polling to find transaction:', txnRef);
      const timeoutId = setTimeout(() => {
        pollTransactionStatus();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [transaction, txnRef, isPolling, pollCount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'processing':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (isLoading && !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả thanh toán</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  transaction?.status === 'completed'
                    ? '#10B981'
                    : transaction?.status === 'failed'
                    ? '#EF4444'
                    : '#F59E0B',
              },
            ]}
          >
            <Ionicons
              name={
                transaction?.status === 'completed'
                  ? 'checkmark-circle'
                  : transaction?.status === 'failed'
                  ? 'close-circle'
                  : 'time'
              }
              size={64}
              color="#FFF"
            />
          </View>
        </View>

        {/* Status Text */}
        <Text style={styles.statusTitle}>
          {transaction?.status === 'completed'
            ? 'Nạp tiền thành công!'
            : transaction?.status === 'failed'
            ? 'Nạp tiền thất bại'
            : 'Đang xử lý...'}
        </Text>

        {transaction?.status === 'processing' && (
          <Text style={styles.statusSubtitle}>
            Vui lòng đợi trong giây lát, chúng tôi đang xử lý giao dịch của bạn.
          </Text>
        )}

        {/* Transaction Details Card */}
        {transaction && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã giao dịch</Text>
              <Text style={styles.detailValue}>{transaction._id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số tiền</Text>
              <Text style={[styles.detailValue, styles.amountValue]}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trạng thái</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(transaction.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(transaction.status) },
                  ]}
                >
                  {getStatusText(transaction.status)}
                </Text>
                {transaction.status === 'processing' && isPolling && (
                  <ActivityIndicator size="small" color="#F59E0B" style={styles.pollingIndicator} />
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Loại giao dịch</Text>
              <Text style={styles.detailValue}>
                {transaction.transactionType === 'top_up' ? 'Nạp tiền' : 'Gửi tiền'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mô tả</Text>
              <Text style={styles.detailValue}>{transaction.description || 'Nạp tiền vào ví'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thời gian</Text>
              <Text style={styles.detailValue}>{formatDate(transaction.createdAt)}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {transaction?.status === 'completed' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/(protected)/customer/customer-wallet')}
            >
              <Text style={styles.primaryButtonText}>Về ví của tôi</Text>
            </TouchableOpacity>
          )}

          {transaction?.status === 'failed' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/(protected)/customer/customer-wallet')}
            >
              <Text style={styles.primaryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          )}

          {transaction?.status === 'processing' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/(protected)/customer/customer-wallet')}
            >
              <Text style={styles.secondaryButtonText}>Về ví của tôi</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pollingIndicator: {
    marginLeft: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});

