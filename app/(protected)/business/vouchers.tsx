import { businessVoucherApi, type BusinessVoucher, type VoucherCode } from '@/services/api/businessVoucherService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  View,
} from 'react-native';

export default function BusinessVouchersScreen() {
  const [vouchers, setVouchers] = useState<BusinessVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<BusinessVoucher | null>(null);
  const [voucherCodes, setVoucherCodes] = useState<VoucherCode[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    customName: '',
    customDescription: '',
    discountPercent: '',
    baseCode: '',
    rewardPointCost: '',
    maxUsage: '',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await businessVoucherApi.getMy({ page: 1, limit: 100 });
      if (response.statusCode === 200 && response.data) {
        setVouchers(Array.isArray(response.data) ? response.data : []);
      } else {
        setVouchers([]);
      }
    } catch (error: any) {
      console.error('Error loading vouchers:', error);
      setVouchers([]);
      if (error?.response?.status && error.response.status >= 500) {
        Alert.alert('Error', 'Failed to load vouchers');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVouchers(false);
  };

  // Helper function to format date to YYYY-MM-DD
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to create date at start of day (00:00:00) in local timezone
  const createDateAtStartOfDay = (dateString: string): Date => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Helper function to get tomorrow at start of day
  const getTomorrowAtStartOfDay = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  const handleCreateVoucher = () => {
    const tomorrow = getTomorrowAtStartOfDay();
    const tenDaysLater = new Date(tomorrow);
    tenDaysLater.setDate(tomorrow.getDate() + 10);
    
    setFormData({
      customName: '',
      customDescription: '',
      discountPercent: '',
      baseCode: '',
      rewardPointCost: '',
      maxUsage: '',
      startDate: formatDateForInput(tomorrow),
      endDate: formatDateForInput(tenDaysLater),
    });
    setShowCreateModal(true);
  };

  const handleEditVoucher = (voucher: BusinessVoucher) => {
    setSelectedVoucher(voucher);
    setFormData({
      customName: voucher.customName,
      customDescription: voucher.customDescription,
      discountPercent: voucher.discountPercent.toString(),
      baseCode: voucher.baseCode,
      rewardPointCost: voucher.rewardPointCost?.toString() || '',
      maxUsage: voucher.maxUsage?.toString() || '',
      startDate: voucher.startDate.split('T')[0],
      endDate: voucher.endDate.split('T')[0],
    });
    setShowEditModal(true);
  };

  const handleViewCodes = async (voucher: BusinessVoucher) => {
    setSelectedVoucher(voucher);
    setShowCodesModal(true);
    setLoadingCodes(true);
    try {
      const response = await businessVoucherApi.getVoucherCodes(voucher._id, { page: 1, limit: 100 });
      if (response.statusCode === 200 && response.data) {
        setVoucherCodes(Array.isArray(response.data) ? response.data : []);
      } else {
        setVoucherCodes([]);
      }
    } catch (error) {
      console.error('Error loading voucher codes:', error);
      setVoucherCodes([]);
      Alert.alert('Error', 'Failed to load voucher codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.customName.trim()) {
      Alert.alert('Error', 'Please enter voucher name');
      return;
    }
    if (!formData.discountPercent || isNaN(Number(formData.discountPercent)) || Number(formData.discountPercent) <= 0) {
      Alert.alert('Error', 'Please enter a valid discount percentage');
      return;
    }
    if (!formData.baseCode.trim()) {
      Alert.alert('Error', 'Please enter base code');
      return;
    }

    try {
      setSubmitting(true);
      
      // Auto-set dates if not provided
      let startDate = formData.startDate;
      let endDate = formData.endDate;
      
      if (!startDate) {
        const tomorrow = getTomorrowAtStartOfDay();
        startDate = formatDateForInput(tomorrow);
      }
      
      if (!endDate) {
        const startDateObj = createDateAtStartOfDay(startDate);
        const tenDaysLater = new Date(startDateObj);
        tenDaysLater.setDate(startDateObj.getDate() + 10);
        endDate = formatDateForInput(tenDaysLater);
      }

      // Create dates at start of day to avoid timezone issues
      const startDateObj = createDateAtStartOfDay(startDate);
      const endDateObj = createDateAtStartOfDay(endDate);
      
      // Set end date to end of day (23:59:59) to include the full day
      endDateObj.setHours(23, 59, 59, 999);

      const payload: any = {
        customName: formData.customName.trim(),
        customDescription: formData.customDescription.trim(),
        discountPercent: Number(formData.discountPercent),
        baseCode: formData.baseCode.trim(),
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
      };

      if (formData.rewardPointCost) {
        payload.rewardPointCost = Number(formData.rewardPointCost);
      }
      if (formData.maxUsage) {
        payload.maxUsage = Number(formData.maxUsage);
      }

      if (showEditModal && selectedVoucher) {
        // Update
        const response = await businessVoucherApi.update(selectedVoucher._id, payload);
        if (response.statusCode === 200) {
          Alert.alert('Success', 'Voucher updated successfully');
          setShowEditModal(false);
          loadVouchers(false);
        } else {
          Alert.alert('Error', response.message || 'Failed to update voucher');
        }
      } else {
        // Create
        const response = await businessVoucherApi.create(payload);
        if (response.statusCode === 200 || response.statusCode === 201) {
          Alert.alert('Success', 'Voucher created successfully');
          setShowCreateModal(false);
          loadVouchers(false);
        } else {
          Alert.alert('Error', response.message || 'Failed to create voucher');
        }
      }
    } catch (error: any) {
      console.error('Error submitting voucher:', error);
      Alert.alert('Error', error.message || 'Failed to save voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Tạm dừng';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Vouchers</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Vouchers</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleCreateVoucher}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {vouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No vouchers yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first voucher to get started</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleCreateVoucher}
            >
              <Text style={styles.emptyStateButtonText}>Create Voucher</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vouchers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.voucherCard}
                onPress={() => handleViewCodes(item)}
              >
                <View style={styles.voucherHeader}>
                  <View style={styles.voucherInfo}>
                    <Text style={styles.voucherName}>{item.customName}</Text>
                    <Text style={styles.voucherDescription} numberOfLines={2}>
                      {item.customDescription}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.voucherDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="pricetag" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Giảm {item.discountPercent}%
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="code" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.baseCode}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                  </View>
                  {item.maxUsage && (
                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {item.redeemedCount || 0}/{item.maxUsage} đã sử dụng
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.voucherActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleViewCodes(item);
                    }}
                  >
                    <Ionicons name="qr-code" size={18} color="#00704A" />
                    <Text style={styles.actionButtonText}>Codes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditVoucher(item);
                    }}
                  >
                    <Ionicons name="create" size={18} color="#00704A" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#00704A']}
                tintColor="#00704A"
              />
            }
          />
        )}
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal || showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showEditModal ? 'Edit Voucher' : 'Create Voucher'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Voucher Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter voucher name"
                  value={formData.customName}
                  onChangeText={(text) => setFormData({ ...formData, customName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description"
                  value={formData.customDescription}
                  onChangeText={(text) => setFormData({ ...formData, customDescription: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Percentage *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  value={formData.discountPercent}
                  onChangeText={(text) => setFormData({ ...formData, discountPercent: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Base Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., SUMMER2024"
                  value={formData.baseCode}
                  onChangeText={(text) => setFormData({ ...formData, baseCode: text.toUpperCase() })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reward Point Cost (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 100"
                  value={formData.rewardPointCost}
                  onChangeText={(text) => setFormData({ ...formData, rewardPointCost: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Max Usage (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 100"
                  value={formData.maxUsage}
                  onChangeText={(text) => setFormData({ ...formData, maxUsage: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date * (auto: tomorrow if empty)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`YYYY-MM-DD (default: ${formatDateForInput(getTomorrowAtStartOfDay())})`}
                  value={formData.startDate}
                  onChangeText={(text) => {
                    const newFormData = { ...formData, startDate: text };
                    // Auto-update endDate if startDate changes
                    if (text) {
                      const startDateObj = new Date(text);
                      if (!isNaN(startDateObj.getTime())) {
                        const tenDaysLater = new Date(startDateObj);
                        tenDaysLater.setDate(startDateObj.getDate() + 10);
                        newFormData.endDate = formatDateForInput(tenDaysLater);
                      }
                    }
                    setFormData(newFormData);
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date * (auto: start date + 10 days if empty)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`YYYY-MM-DD (default: ${(() => {
                    const startDate = formData.startDate ? new Date(formData.startDate) : getTomorrowAtStartOfDay();
                    const tenDaysLater = new Date(startDate);
                    tenDaysLater.setDate(startDate.getDate() + 10);
                    return formatDateForInput(tenDaysLater);
                  })()})`}
                  value={formData.endDate}
                  onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {showEditModal ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Voucher Codes Modal */}
      <Modal
        visible={showCodesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCodesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Voucher Codes - {selectedVoucher?.customName}
              </Text>
              <TouchableOpacity onPress={() => setShowCodesModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loadingCodes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00704A" />
              </View>
            ) : voucherCodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="qr-code-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No codes found</Text>
              </View>
            ) : (
              <FlatList
                data={voucherCodes}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.codeCard}>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeText}>{item.fullCode}</Text>
                      <View style={[styles.codeStatusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.codeStatusText, { color: getStatusColor(item.status) }]}>
                          {item.status === 'redeemed' ? 'Đã đổi' : item.status === 'used' ? 'Đã dùng' : 'Hết hạn'}
                        </Text>
                      </View>
                    </View>
                    {item.redeemedAt && (
                      <Text style={styles.codeDate}>
                        Used: {formatDate(item.redeemedAt)}
                      </Text>
                    )}
                  </View>
                )}
                contentContainerStyle={styles.codesListContent}
              />
            )}
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
  // Header Styles (Simple like Customer Wallet)
  headerSafeArea: {
    backgroundColor: '#00704A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00704A',
    borderBottomLeftRadius: 20,
  },
  headerLeft: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: 20,
  },
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  voucherInfo: {
    flex: 1,
    marginRight: 12,
  },
  voucherName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  voucherDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  voucherActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#E8F5E9',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00704A',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 24,
    backgroundColor: '#00704A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#00704A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  codesListContent: {
    padding: 20,
  },
  codeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  codeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  codeDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});
