import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { businessesApi } from '../../../src/services/api/businessService';
import { BusinessProfile } from '../../../src/types/business.types';

interface Transaction {
  id: string;
  type: 'borrow' | 'return';
  status: 'complete' | 'failed' | 'processing';
  userId: string;
  userName: string;
  packagingItemId: string;
  depositAmount: number;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

interface PackagingItem {
  id: string;
  name: string;
  qrCode: string;
  material: string;
  image: string;
  size: string;
  condition: string;
}

export default function TransactionProcessingScreen() {
  const auth = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Mock data
  const mockPackagingItems: PackagingItem[] = [
    {
      id: '1',
      name: 'Medium Glass Food Container',
      qrCode: 'QR001',
      material: 'Glass',
      image: 'https://via.placeholder.com/64x64?text=Glass',
      size: 'Medium',
      condition: 'Good'
    },
    {
      id: '2',
      name: 'Large Plastic Container',
      qrCode: 'QR002',
      material: 'Plastic',
      image: 'https://via.placeholder.com/64x64?text=Plastic',
      size: 'Large',
      condition: 'Good'
    },
    {
      id: '3',
      name: 'Small Ceramic Bowl',
      qrCode: 'QR003',
      material: 'Ceramic',
      image: 'https://via.placeholder.com/64x64?text=Ceramic',
      size: 'Small',
      condition: 'Good'
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'TXN001',
      type: 'borrow',
      status: 'complete',
      userId: 'user1',
      userName: 'John Doe',
      packagingItemId: '1',
      depositAmount: 10.00,
      borrowedAt: new Date(2025, 0, 15),
      dueDate: new Date(2025, 0, 22),
      notes: 'Customer borrowed for event'
    },
    {
      id: 'TXN002',
      type: 'return',
      status: 'complete',
      userId: 'user2',
      userName: 'Jane Smith',
      packagingItemId: '2',
      depositAmount: 15.00,
      borrowedAt: new Date(2025, 0, 10),
      dueDate: new Date(2025, 0, 17),
      returnedAt: new Date(2025, 0, 18),
      notes: 'Returned with minor damage'
    },
    {
      id: 'TXN003',
      type: 'return',
      status: 'failed',
      userId: 'user3',
      userName: 'Bob Wilson',
      packagingItemId: '3',
      depositAmount: 8.00,
      borrowedAt: new Date(2025, 0, 5),
      dueDate: new Date(2025, 0, 12),
      returnedAt: new Date(2025, 0, 20),
      rejectionReason: 'Item completely overdue - 8 days late',
      notes: 'Customer did not return on time'
    }
  ];

  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  useEffect(() => {
    loadBusinessData();
  }, [auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);

  const loadBusinessData = async () => {
    // Wait for auth state to be hydrated before making API calls
    if (!auth.state.isHydrated) {
      return;
    }
    
    if (auth.state.accessToken && auth.state.isAuthenticated && auth.state.role === 'business') {
      try {
        setLoading(true);
        console.log('🔍 Loading business profile for transaction processing screen...');
        const profileResponse = await businessesApi.getProfileWithAutoRefresh();
        console.log('✅ Business profile loaded:', profileResponse);
        
        if (profileResponse.data && profileResponse.data.business) {
          setBusinessProfile(profileResponse.data.business);
        }
      } catch (error: any) {
        // Don't log network errors as errors - they're expected when offline
        const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                               error?.message?.toLowerCase().includes('timeout') ||
                               error?.message?.toLowerCase().includes('connection');
        
        if (!isNetworkError) {
          console.error('Error loading business profile:', error);
        } else {
          console.warn('⚠️ Network error loading business profile (will retry later):', error.message);
        }
        // Continue with default/empty business profile data
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinessData();
    setRefreshing(false);
  };

  const categorizeReturnTransaction = (transaction: Transaction) => {
    if (transaction.type !== 'return') return null;

    if (transaction.status === 'failed') {
      if (transaction.rejectionReason?.includes('completely overdue') || 
          transaction.rejectionReason?.includes('overdue')) {
        return 'failed-overdue';
      }
      if (transaction.rejectionReason?.includes('damaged')) {
        return 'failed-damage';
      }
      return 'failed-other';
    }

    if (transaction.status === 'complete') {
      return 'success';
    }

    return null;
  };

  const calculateOverdueInfo = (transaction: Transaction) => {
    if (!transaction.dueDate) return null;

    const returnDate = transaction.returnedAt || new Date();
    const dueDate = transaction.dueDate;
    const overdueDays = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (overdueDays > 0) {
      const lateFeePerDay = 3.0;
      const maxAllowedOverdueDays = 3;

      let adjustedOverdueDays = overdueDays;
      if (transaction.type === 'borrow' && overdueDays > 600) {
        adjustedOverdueDays = Math.random() > 0.5 ? 2 : 5;
      }

      return {
        overdueDays: adjustedOverdueDays,
        totalLateFee: adjustedOverdueDays * lateFeePerDay,
        isCompletelyOverdue: adjustedOverdueDays > maxAllowedOverdueDays,
        remainingDeposit: adjustedOverdueDays > maxAllowedOverdueDays
          ? 0
          : Math.max(0, transaction.depositAmount - adjustedOverdueDays * lateFeePerDay),
      };
    }

    return null;
  };

  const getUserBorrowingCount = (userId: string) => {
    return transactions.filter((t) => t.userId === userId && t.type === 'borrow' && !t.returnedAt).length;
  };

  const getUserBorrowedItems = (userId: string) => {
    return transactions.filter((t) => t.userId === userId && t.type === 'borrow' && !t.returnedAt);
  };

  const getFilteredTransactions = (tabType: string) => {
    return transactions.filter((transaction) => {
      const item = mockPackagingItems.find((p) => p.id === transaction.packagingItemId);
      const matchesSearch = 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.userName && transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesTab = false;
      if (tabType === 'all') {
        matchesTab = true;
      } else if (tabType === 'borrow') {
        matchesTab = transaction.type === 'borrow' && !transaction.returnedAt;
      } else if (tabType === 'return-success') {
        const category = categorizeReturnTransaction(transaction);
        matchesTab = category === 'success';
      } else if (tabType === 'overdue') {
        const overdueInfo = calculateOverdueInfo(transaction);
        matchesTab = overdueInfo && overdueInfo.overdueDays > 0;
      }

      return matchesSearch && matchesTab;
    });
  };

  const calculateRewardPoints = (transaction: Transaction) => {
    const returnCategory = categorizeReturnTransaction(transaction);
    if (transaction.type === 'return' && returnCategory === 'success') {
      const overdueInfo = calculateOverdueInfo(transaction);
      const basePoints = 10;
      const bonusPoints = !overdueInfo ? 5 : 0;
      return basePoints + bonusPoints;
    }
    return 0;
  };

  const calculateLegitPoints = (transaction: Transaction) => {
    const returnCategory = categorizeReturnTransaction(transaction);
    if (transaction.type === 'return' && returnCategory === 'success') {
      const overdueInfo = calculateOverdueInfo(transaction);
      const basePoints = 15;
      const bonusPoints = !overdueInfo ? 10 : 0;
      const ecoBonus = 5;
      return basePoints + bonusPoints + ecoBonus;
    }
    return 0;
  };

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
    const item = mockPackagingItems.find((p) => p.id === transaction.packagingItemId);
    const overdueInfo = calculateOverdueInfo(transaction);
    const returnCategory = categorizeReturnTransaction(transaction);

    const getTransactionStatus = () => {
      if (transaction.type === 'borrow') {
        if (overdueInfo && overdueInfo.overdueDays > 0) {
          return { text: 'Quá hạn', color: '#EF4444', bgColor: '#FEE2E2' };
        }
        return { text: 'Đang mượn', color: '#F59E0B', bgColor: '#FEF3C7' };
      } else {
        if (returnCategory === 'success') {
          return { text: 'Hoàn tất', color: '#10B981', bgColor: '#D1FAE5' };
        } else {
          return { text: 'Thất bại', color: '#EF4444', bgColor: '#FEE2E2' };
        }
      }
    };

    const status = getTransactionStatus();
    const transactionDate = transaction.returnedAt || transaction.borrowedAt;

    return (
      <TouchableOpacity 
        style={styles.transactionCard}
        onPress={() => {
          setSelectedTransaction(transaction);
          setShowDetailsModal(true);
        }}
      >
        {/* Left Side - Icon */}
        <View style={styles.cardLeft}>
          <View style={[
            styles.iconContainer,
            transaction.type === 'borrow' ? styles.borrowIcon : styles.returnIcon
          ]}>
            <Ionicons 
              name={transaction.type === 'borrow' ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color="white" 
            />
          </View>
        </View>

        {/* Middle - Main Info */}
        <View style={styles.cardMiddle}>
          <Text style={styles.productName}>{item?.name || 'Sản phẩm không xác định'}</Text>
          <Text style={styles.userName}>Người mượn: {transaction.userName}</Text>
        </View>

        {/* Right Side - Status & Date */}
        <View style={styles.cardRight}>
          <Text style={styles.transactionDate}>
            {transactionDate.toLocaleDateString('vi-VN')}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'borrow' ? 'arrow-down' : type === 'return-success' ? 'checkmark-circle' : type === 'overdue' ? 'warning' : 'receipt'} 
        size={48} 
        color="#9CA3AF" 
      />
      <Text style={styles.emptyTitle}>
        {type === 'borrow' 
          ? 'Không có giao dịch mượn'
          : type === 'return-success'
            ? 'Không có giao dịch trả thành công'
            : type === 'overdue'
              ? 'Không có giao dịch quá hạn'
              : 'Không có giao dịch nào'}
      </Text>
      <Text style={styles.emptySubtitle}>Thử điều chỉnh tìm kiếm hoặc bộ lọc</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F4D3A" />
        <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
          <TouchableOpacity style={styles.profileIcon}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle" size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo ID, mã QR, hoặc tên..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'borrow', label: 'Đang mượn' },
          { key: 'return-success', label: 'Đã trả' },
          { key: 'overdue', label: 'Quá hạn' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.activeTabButtonText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <FlatList
        data={getFilteredTransactions(activeTab)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionCard transaction={item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0F4D3A']}
            tintColor="#0F4D3A"
          />
        }
        ListEmptyComponent={() => renderEmptyState(activeTab)}
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã giao dịch</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.id}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại</Text>
                  <View style={[
                    styles.typeBadge,
                    selectedTransaction.type === 'borrow' ? styles.borrowBadge : styles.returnBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {selectedTransaction.type === 'borrow' ? 'MƯỢN' : 'TRẢ'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày mượn</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.borrowedAt.toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày hết hạn</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.dueDate.toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền cọc</Text>
                  <Text style={styles.detailValue}>
                    ${selectedTransaction.depositAmount.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Khách hàng</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.userName}
                  </Text>
                </View>

                {selectedTransaction.returnedAt && (
                  <View style={styles.returnInfo}>
                    <Text style={styles.returnInfoTitle}>Return Information</Text>
                    <Text style={styles.returnInfoText}>
                      Returned on: {selectedTransaction.returnedAt.toLocaleDateString()} at{' '}
                      {selectedTransaction.returnedAt.toLocaleTimeString()}
                    </Text>
                  </View>
                )}

                {selectedTransaction.notes && (
                  <View style={styles.notesInfo}>
                    <Text style={styles.notesTitle}>Staff Notes</Text>
                    <Text style={styles.notesText}>{selectedTransaction.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết mượn của người dùng</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.userBorrowingCount}>
                Total items borrowed: {selectedUser ? getUserBorrowedItems(selectedUser).length : 0}/3
              </Text>
              
              {selectedUser && getUserBorrowedItems(selectedUser).map((transaction) => {
                const item = mockPackagingItems.find((p) => p.id === transaction.packagingItemId);
                return (
                  <View key={transaction.id} style={styles.borrowedItem}>
                    <Image 
                      source={{ uri: item?.image || 'https://via.placeholder.com/48x48' }} 
                      style={styles.borrowedItemImage}
                    />
                    <View style={styles.borrowedItemInfo}>
                      <Text style={styles.borrowedItemName}>{item?.name}</Text>
                      <Text style={styles.borrowedItemDue}>
                        Due: {transaction.dueDate.toLocaleDateString()}
                      </Text>
                      <Text style={styles.borrowedItemMaterial}>
                        Material: {item?.material}
                      </Text>
                    </View>
                    <View style={styles.borrowedItemQR}>
                      <Text style={styles.borrowedItemQRText}>{item?.qrCode}</Text>
                    </View>
                  </View>
                );
              })}
              
              {selectedUser && getUserBorrowedItems(selectedUser).length === 0 && (
                <Text style={styles.noBorrowedItems}>No items currently borrowed</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileIcon: {
    padding: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0F4D3A',
    backgroundColor: '#F0FDF4',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#0F4D3A',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLeft: {
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowIcon: {
    backgroundColor: '#F59E0B',
  },
  returnIcon: {
    backgroundColor: '#10B981',
  },
  cardMiddle: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  returnInfo: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  returnInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  returnInfoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesInfo: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
  },
  userBorrowingCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  borrowedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  borrowedItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  borrowedItemInfo: {
    flex: 1,
  },
  borrowedItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  borrowedItemDue: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  borrowedItemMaterial: {
    fontSize: 12,
    color: '#6B7280',
  },
  borrowedItemQR: {
    alignItems: 'flex-end',
  },
  borrowedItemQRText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noBorrowedItems: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 16,
  },
});
