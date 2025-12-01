import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { businessVoucherApi, BusinessVoucherCode } from '../../../src/services/api/businessVoucherService';

const { width, height } = Dimensions.get('window');

export default function VoucherScanScreen() {
  const auth = useAuth();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [voucher, setVoucher] = useState<BusinessVoucherCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [showVoucherDetail, setShowVoucherDetail] = useState(false);
  const scanLock = useRef(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
      if (status === 'granted') {
        setShowQRScanner(true);
      } else {
        Alert.alert(
          'Camera Permission',
          'Cần quyền truy cập camera để quét mã QR voucher',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasCameraPermission(false);
    }
  };

  const handleBarcodeScanned = async (e: any) => {
    if (scanLock.current) return;
    scanLock.current = true;

    const scannedData = e?.data ?? '';
    console.log('📱 QR Code scanned:', scannedData);

    if (!scannedData || scannedData.trim() === '') {
      Alert.alert('Lỗi', 'Mã QR không hợp lệ');
      scanLock.current = false;
      return;
    }

    Vibration.vibrate(Platform.OS === 'ios' ? 30 : 50);
    setShowQRScanner(false);

    // Extract voucher code ID from QR code
    // QR code might be URL or direct ID
    let voucherCodeId = scannedData;
    if (scannedData.includes('/')) {
      const parts = scannedData.split('/');
      voucherCodeId = parts[parts.length - 1];
    }

    await loadVoucherDetail(voucherCodeId);
    scanLock.current = false;
  };

  const loadVoucherDetail = async (voucherCodeId: string) => {
    try {
      setLoading(true);
      const response = await businessVoucherApi.getVoucherByCodeId(voucherCodeId);
      
      if (response.statusCode === 200 && response.data) {
        setVoucher(response.data);
        setVoucherCode(response.data.fullCode || '');
        setShowVoucherDetail(true);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy voucher với mã này');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải thông tin voucher';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUse = async () => {
    if (!voucherCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã voucher');
      return;
    }

    if (!voucher) {
      Alert.alert('Lỗi', 'Không có thông tin voucher');
      return;
    }

    // Verify code matches
    if (voucherCode.trim() !== voucher.fullCode) {
      Alert.alert('Lỗi', 'Mã voucher không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    try {
      setConfirming(true);
      const response = await businessVoucherApi.useVoucherCode(voucherCode.trim());
      
      if (response.statusCode === 201 || response.statusCode === 200) {
        Alert.alert(
          'Thành công',
          'Voucher đã được sử dụng thành công!',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowVoucherDetail(false);
                setVoucher(null);
                setVoucherCode('');
                setShowQRScanner(true);
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể sử dụng voucher');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể sử dụng voucher';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'redeemed':
        return 'Đã nhận';
      case 'used':
        return 'Đã sử dụng';
      case 'expired':
        return 'Đã hết hạn';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'redeemed':
        return '#10B981';
      case 'used':
        return '#6B7280';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét Voucher</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" />
          <SafeAreaView style={styles.scannerSafeArea}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.scannerBackButton}
                onPress={() => {
                  setShowQRScanner(false);
                  router.back();
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Quét mã QR voucher</Text>
              <View style={styles.placeholder} />
            </View>

            {hasCameraPermission === null ? (
              <View style={styles.scannerContent}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.scannerText}>Đang kiểm tra quyền camera...</Text>
              </View>
            ) : hasCameraPermission === false ? (
              <View style={styles.scannerContent}>
                <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
                <Text style={styles.scannerText}>Cần quyền truy cập camera</Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestCameraPermission}
                >
                  <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.scannerContent}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  <Text style={styles.scannerHint}>
                    Đưa mã QR vào khung để quét
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Voucher Detail Modal */}
      <Modal
        visible={showVoucherDetail}
        animationType="slide"
        onRequestClose={() => {
          setShowVoucherDetail(false);
          setVoucher(null);
          setVoucherCode('');
        }}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#00704A" />
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => {
                  setShowVoucherDetail(false);
                  setVoucher(null);
                  setVoucherCode('');
                  setShowQRScanner(true);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Thông tin Voucher</Text>
              <View style={styles.placeholder} />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00704A" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : voucher ? (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Voucher Card */}
                <View style={[styles.voucherCard, { backgroundColor: '#FF6B35' }]}>
                  <View style={styles.watermarkContainer}>
                    <View style={styles.watermark}>
                      <Text style={styles.watermarkText}>%</Text>
                      <View style={styles.watermarkDots}>
                        <View style={styles.watermarkDot} />
                        <View style={styles.watermarkDot} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.voucherCardContent}>
                    <Text style={styles.voucherCardTitle}>Up to</Text>
                    <Text style={styles.voucherCardDiscount}>
                      {voucher.voucherInfo?.discountPercent || 0}% OFF
                    </Text>
                    <Text style={styles.voucherCardDescription}>
                      {voucher.voucherInfo?.customDescription || 'Voucher giảm giá'}
                    </Text>

                    <View style={styles.voucherCodeContainer}>
                      <Text style={styles.voucherCodeLabel}>Mã voucher</Text>
                      <Text style={styles.voucherCode}>{voucher.fullCode}</Text>
                    </View>

                    <View style={styles.voucherCardFooter}>
                      <View>
                        <Text style={styles.validUntilLabel}>Hạn sử dụng</Text>
                        <Text style={styles.validUntil}>
                          {formatDate(voucher.voucherInfo?.endDate)}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(voucher.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(voucher.status) }
                        ]}>
                          {getStatusText(voucher.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* QR Code Image */}
                {voucher.qrCode && (
                  <View style={styles.qrCodeSection}>
                    <Text style={styles.sectionTitle}>Mã QR</Text>
                    <View style={styles.qrCodeContainer}>
                      <Image source={{ uri: voucher.qrCode }} style={styles.qrCodeImage} />
                    </View>
                  </View>
                )}

                {/* Business Info */}
                {voucher.businessInfo && (
                  <View style={styles.businessSection}>
                    <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>
                    <View style={styles.businessCard}>
                      {voucher.businessInfo.businessLogoUrl && (
                        <Image
                          source={{ uri: voucher.businessInfo.businessLogoUrl }}
                          style={styles.businessLogo}
                        />
                      )}
                      <View style={styles.businessInfo}>
                        <Text style={styles.businessName}>
                          {voucher.businessInfo.businessName}
                        </Text>
                        {voucher.businessInfo.businessAddress && (
                          <View style={styles.businessRow}>
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text style={styles.businessText}>
                              {voucher.businessInfo.businessAddress}
                            </Text>
                          </View>
                        )}
                        {voucher.businessInfo.businessPhone && (
                          <View style={styles.businessRow}>
                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                            <Text style={styles.businessText}>
                              {voucher.businessInfo.businessPhone}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Confirm Use Section */}
                <View style={styles.confirmSection}>
                  <Text style={styles.sectionTitle}>Xác nhận sử dụng</Text>
                  <View style={styles.confirmCard}>
                    <Text style={styles.confirmLabel}>
                      Nhập mã voucher để xác nhận:
                    </Text>
                    <TextInput
                      style={styles.codeInput}
                      value={voucherCode}
                      onChangeText={setVoucherCode}
                      placeholder="Nhập mã voucher"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      editable={!confirming}
                    />
                    <Text style={styles.codeHint}>
                      Mã: {voucher.fullCode}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        (confirming || voucher.status === 'used' || voucher.status === 'expired') && styles.confirmButtonDisabled
                      ]}
                      onPress={handleConfirmUse}
                      disabled={confirming || voucher.status === 'used' || voucher.status === 'expired'}
                    >
                      {confirming ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmButtonText}>
                          {voucher.status === 'used' ? 'Đã sử dụng' : 
                           voucher.status === 'expired' ? 'Đã hết hạn' : 
                           'Xác nhận sử dụng'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Không tìm thấy voucher</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Main Content - Instructions */}
      {!showQRScanner && !showVoucherDetail && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsCard}>
            <Ionicons name="qr-code-outline" size={64} color="#00704A" />
            <Text style={styles.instructionsTitle}>Quét mã QR voucher</Text>
            <Text style={styles.instructionsText}>
              Nhấn nút bên dưới để bắt đầu quét mã QR voucher của khách hàng
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                if (hasCameraPermission) {
                  setShowQRScanner(true);
                } else {
                  requestCameraPermission();
                }
              }}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Bắt đầu quét</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerSafeArea: {
    flex: 1,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scannerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scannerHint: {
    marginTop: width * 0.7 + 20,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#00704A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00704A',
    borderBottomLeftRadius: 20,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
  },
  voucherCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.3,
  },
  watermark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  watermarkDots: {
    flexDirection: 'row',
    marginTop: 4,
  },
  watermarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  voucherCardContent: {
    zIndex: 1,
  },
  voucherCardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  voucherCardDiscount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  voucherCardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    lineHeight: 22,
  },
  voucherCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  voucherCodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  voucherCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validUntilLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  validUntil: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrCodeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCodeImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  businessSection: {
    marginBottom: 20,
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  businessText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  confirmSection: {
    marginBottom: 20,
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  codeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#00704A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: width * 0.9,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

