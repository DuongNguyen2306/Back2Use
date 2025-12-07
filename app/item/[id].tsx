import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  View
} from 'react-native';
import { useAuth } from '../../context/AuthProvider';
import { borrowTransactionsApi } from '../../src/services/api/borrowTransactionService';
import { productsApi } from '../../src/services/api/productService';
import { Product } from '../../src/types/product.types';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowDays, setBorrowDays] = useState('3');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch product
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await productsApi.getByIdWithAutoRefresh(id);
        if (response?.data) {
          setProduct(response.data);
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy sản phẩm');
        }
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Không tải được sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(loadProduct, 100);
    return () => clearTimeout(timer);
  }, [id]);

  // Tính toán realtime – useMemo để đảm bảo re-render khi cần
  const borrowInfo = useMemo(() => {
    if (!product) {
      return { days: 3, depositValue: 0, totalAmount: 0, walletBalance: 0, remaining: 0, isEnough: false };
    }

    const days = Math.max(1, Math.min(30, parseInt(borrowDays) || 1));

    // Lấy giá thuê 1 ngày (từ productSizeId hoặc productGroupId)
    const pricePerDay = 
      (product.productSizeId as any)?.rentalPrice ??
      (product.productGroupId as any)?.rentalPrice ??
      (product.productGroupId as any)?.rentalPricePerDay ??
      3200; // fallback nếu backend lỗi

    // TIỀN CỌC = GIÁ THUÊ 1 NGÀY × SỐ NGÀY
    const depositValue = pricePerDay * days;
    const totalAmount = depositValue; // chỉ có tiền cọc

    const walletBalance = state.user?.wallet?.availableBalance ?? state.user?.wallet?.balance ?? 0;
    const remaining = walletBalance - totalAmount;

    return {
      days,
      pricePerDay,
      depositValue,
      totalAmount,
      walletBalance,
      remaining: remaining >= 0 ? remaining : 0,
      isEnough: remaining >= 0
    };
  }, [product, borrowDays, state.user]);

  // Xử lý mượn
  const handleBorrow = async () => {
    if (!product || !state.isAuthenticated || product.status !== 'available') {
      Alert.alert('Thông báo', 'Sản phẩm không khả dụng hoặc bạn chưa đăng nhập');
      return;
    }

    const info = borrowInfo;

    // Lấy businessId chắc chắn
    let businessId: string = '';
    if (product.businessId) {
      businessId = typeof product.businessId === 'string'
        ? product.businessId
        : (product.businessId as any)._id || (product.businessId as any).id || '';
    }

    if (!businessId && typeof product.productGroupId === 'object') {
      const pg = product.productGroupId as any;
      businessId = pg.businessId?._id || pg.businessId || pg.business?._id || '';
    }

    if (!businessId) {
      Alert.alert('Lỗi', 'Không xác định được cửa hàng');
      return;
    }

    // Mở custom modal thay vì Alert (iOS không hỗ trợ xuống dòng đẹp)
    setShowConfirmModal(true);
  };

  // Xử lý xác nhận mượn từ modal
  const handleConfirmBorrow = async () => {
    if (!product) return;

    const info = borrowInfo;
    let businessId: string = '';
    if (product.businessId) {
      businessId = typeof product.businessId === 'string'
        ? product.businessId
        : (product.businessId as any)._id || (product.businessId as any).id || '';
    }
    if (!businessId && typeof product.productGroupId === 'object') {
      const pg = product.productGroupId as any;
      businessId = pg.businessId?._id || pg.businessId || pg.business?._id || '';
    }

    try {
      setBorrowing(true);
      setShowConfirmModal(false);
      const dto = {
        productId: product._id,
        businessId,
        depositValue: info.depositValue,
        durationInDays: info.days,
        type: 'online' as const,
      };

      await borrowTransactionsApi.createWithAutoRefresh(dto);

      Alert.alert('Thành công!', 'Đã đặt mượn thành công!', [
        { text: 'OK', onPress: () => router.replace('/(protected)/customer') }
      ]);
    } catch (err: any) {
      // Silently handle 400 validation errors (e.g., "property type should not exist")
      const errorStatus = err?.response?.status;
      const isValidationError = errorStatus === 400;
      
      if (!isValidationError) {
        Alert.alert('Lỗi', err.message || 'Không thể đặt mượn');
      }
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  const businessName = typeof product.businessId === 'object' ? product.businessId.businessName || 'Cửa hàng' : 'Cửa hàng';
  const productName = typeof product.productGroupId === 'object' ? product.productGroupId.name || 'Sản phẩm' : 'Sản phẩm';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin sản phẩm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={80} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.serial}>Serial Number: {product.serialNumber}</Text>
        </View>
      </ScrollView>

      {/* Footer - Chỉ hiện khi đã đăng nhập và sản phẩm có sẵn */}
      {state.isAuthenticated && product.status === 'available' && (
        <View style={styles.footer}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Thời gian mượn (ngày) *</Text>
            <TextInput
              style={styles.inputField}
              value={borrowDays}
              onChangeText={setBorrowDays}
              keyboardType="numeric"
              placeholder="3"
            />
          </View>

          {/* REALTIME CALCULATION - ĐẸP NHƯ ẢNH BẠN GỬI */}
          <View style={styles.calculationSection}>
            <Text style={styles.calcText}>
              Giá cọc/ngày:{' '}
              <Text style={styles.calcValueGreen}>
                {borrowInfo.pricePerDay.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Text>

            <View style={styles.divider} />

            <Text style={styles.totalText}>
              Tiền cọc ({borrowInfo.days} ngày):{' '}
              <Text style={styles.totalValue}>
                {borrowInfo.depositValue.toLocaleString('vi-VN')} VNĐ
              </Text>
            </Text>

            <Text style={[styles.remainingText, { color: borrowInfo.isEnough ? '#059669' : '#DC2626' }]}>
              Số dư sau khi trừ:{' '}
              <Text style={styles.remainingValue}>
                {borrowInfo.remaining.toLocaleString('vi-VN')} VNĐ
              </Text>
              {!borrowInfo.isEnough && ' (Không đủ)'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.borrowButton, borrowing && { opacity: 0.6 }]}
            onPress={handleBorrow}
            disabled={borrowing}
          >
            {borrowing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#fff" />
                <Text style={styles.borrowButtonText}>Mượn sản phẩm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Confirm Modal - Thay thế Alert.alert() cho iOS */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận đặt mượn</Text>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalQuestion}>
                Bạn có chắc chắn muốn đặt mượn sản phẩm này?
              </Text>

              <View style={styles.modalInfoSection}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Tiền cọc:</Text>
                  <Text style={styles.modalInfoValue}>
                    {borrowInfo.depositValue.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                
                <Text style={styles.modalInfoFormula}>
                  (= {borrowInfo.pricePerDay.toLocaleString('vi-VN')} VNĐ/ngày × {borrowInfo.days} ngày)
                </Text>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalInfoSection}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Số dư hiện tại:</Text>
                  <Text style={styles.modalInfoValue}>
                    {borrowInfo.walletBalance.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Số dư sau khi trừ:</Text>
                  <Text style={[styles.modalInfoValue, { color: borrowInfo.isEnough ? '#059669' : '#DC2626' }]}>
                    {borrowInfo.remaining.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalInfoSection}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Thời gian mượn:</Text>
                  <Text style={styles.modalInfoValue}>{borrowInfo.days} ngày</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, borrowing && { opacity: 0.6 }]}
                onPress={handleConfirmBorrow}
                disabled={borrowing}
              >
                {borrowing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Xác nhận</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#00704A', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButtonHeader: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  productImage: { width: '100%', height: 300 },
  productImagePlaceholder: { width: '100%', height: 300, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  productName: { fontSize: 24, fontWeight: '800', color: '#111827' },
  serial: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  inputSection: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputField: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#F9FAFB' },
  calculationSection: { marginVertical: 16 },
  calcText: { fontSize: 15, color: '#374151', marginBottom: 6 },
  calcValueGreen: { fontWeight: '700', color: '#00704A' },
  calcValueRed: { fontWeight: '700', color: '#DC2626' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  totalText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  totalValue: { color: '#DC2626', fontSize: 20 },
  remainingText: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  remainingValue: { fontWeight: '700' },
  borrowButton: { backgroundColor: '#00704A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  borrowButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalQuestion: {
    fontSize: 16,
    color: '#374151',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    lineHeight: 24,
  },
  modalInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  modalInfoFormula: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonConfirm: {
    backgroundColor: '#00704A',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
