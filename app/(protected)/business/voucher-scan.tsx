import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { businessVoucherApi, BusinessVoucherCode } from '../../../src/services/api/businessVoucherService';
import { staffApi } from '../../../src/services/api/staffService';

const { width, height } = Dimensions.get('window');

export default function VoucherScanScreen() {
  const auth = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [voucher, setVoucher] = useState<BusinessVoucherCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [showVoucherDetail, setShowVoucherDetail] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [laserLinePosition, setLaserLinePosition] = useState(0);
  const [staffBusinessId, setStaffBusinessId] = useState<string | null>(null);
  const scanLock = useRef(false);
  const laserAnimationRef = useRef<any>(null);

  useEffect(() => {
    const initCamera = async () => {
      const result = await requestPermission();
      // Auto open QR scanner after permission granted
      if (result?.granted) {
        setShowQRScanner(true);
      }
    };
    initCamera();
    // Load staff businessId if user is staff
    if (auth.state.role === 'staff') {
      loadStaffBusinessId();
    }
  }, [auth.state.role]);

  const loadStaffBusinessId = async () => {
    try {
      const staffProfile = await staffApi.getProfile();
      if (staffProfile.data?.businessId) {
        const businessId = typeof staffProfile.data.businessId === 'object' 
          ? staffProfile.data.businessId._id || staffProfile.data.businessId 
          : staffProfile.data.businessId;
        setStaffBusinessId(businessId);
        console.log('✅ Staff businessId loaded:', businessId);
      }
    } catch (error) {
      console.error('❌ Error loading staff businessId:', error);
    }
  };

  // Laser scanning line animation
  useEffect(() => {
    if (showQRScanner && permission?.granted) {
      const frameSize = width * 0.7;
      let direction = 1;
      let position = 10;
      
      laserAnimationRef.current = setInterval(() => {
        position += direction * 3;
        if (position >= frameSize - 10 || position <= 10) {
          direction *= -1;
        }
        setLaserLinePosition(position);
      }, 16);
      
      return () => {
        if (laserAnimationRef.current) {
          clearInterval(laserAnimationRef.current);
          laserAnimationRef.current = null;
        }
        setLaserLinePosition(0);
      };
    } else {
      setLaserLinePosition(0);
    }
  }, [showQRScanner, permission?.granted]);

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
      // Get voucher details by ID to get fullCode
      const response = await businessVoucherApi.getVoucherByCodeId(voucherCodeId);
      
      if (response.statusCode === 200 && response.data) {
        const voucherData = response.data;
        const fullCode = voucherData.fullCode;
        
        if (!fullCode) {
          Alert.alert('Lỗi', 'Voucher không có mã code hợp lệ');
          setLoading(false);
          return;
        }
        
        // Set voucher data and show detail modal (don't auto-use)
        setVoucher(voucherData);
        setVoucherCode(fullCode);
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

    // Check if voucher is already used or expired
    if (voucher.status === 'used') {
      Alert.alert('Cảnh báo', 'Voucher này đã được sử dụng rồi.');
      return;
    }

    if (voucher.status === 'expired') {
      Alert.alert('Cảnh báo', 'Voucher này đã hết hạn.');
      return;
    }

    try {
      setConfirming(true);
      
      // Log for debugging
      console.log('🔍 Using voucher with code:', voucherCode.trim());
      console.log('🔍 User role:', auth.state.role);
      console.log('🔍 Voucher businessId:', voucher.businessId);
      console.log('🔍 Staff businessId:', staffBusinessId);
      
      // Verify staff belongs to the voucher's business
      if (auth.state.role === 'staff' && voucher.businessId && staffBusinessId) {
        const voucherBusinessId = typeof voucher.businessId === 'object' 
          ? voucher.businessId._id || voucher.businessId 
          : voucher.businessId;
        
        if (voucherBusinessId !== staffBusinessId) {
          Alert.alert(
            'Lỗi quyền truy cập',
            'Bạn không có quyền sử dụng voucher của business này. Voucher thuộc về business khác.',
            [{ text: 'OK' }]
          );
          setConfirming(false);
          return;
        }
      }
      
      const response = await businessVoucherApi.useVoucherCode(voucherCode.trim());
      
      if (response.statusCode === 201 || response.statusCode === 200) {
        // Update voucher status to 'used'
        setVoucher({ ...voucher, status: 'used' });
        
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
      // Log detailed error for debugging
      console.error('❌ Error using voucher:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể sử dụng voucher';
      
      // More specific error message
      if (errorMessage.includes('cannot act on any business') || errorMessage.includes('User cannot act')) {
        Alert.alert(
          'Lỗi quyền truy cập',
          'Staff không có quyền sử dụng voucher này. Vui lòng đảm bảo bạn đang đăng nhập với tài khoản staff của business sở hữu voucher này.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(protected)/business/business-dashboard')}>
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
                  router.replace('/(protected)/business/business-dashboard');
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Quét mã QR voucher</Text>
              <View style={styles.placeholder} />
            </View>

            {!permission ? (
              <View style={styles.scannerContent}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.scannerText}>Đang kiểm tra quyền camera...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.scannerContent}>
                <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
                <Text style={styles.scannerText}>Cần quyền truy cập camera</Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
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
                  enableTorch={flashEnabled}
                />
                
                {/* Overlay Mask with transparent cutout for scanning area */}
                <View style={styles.overlayContainer}>
                  {/* Top dark area */}
                  <View style={styles.overlayRowTop} />
                  {/* Middle row with left-transparent-right */}
                  <View style={styles.overlayRowMiddle}>
                    <View style={styles.overlaySide} />
                    <View style={styles.transparentCenter} />
                    <View style={styles.overlaySide} />
                  </View>
                  {/* Bottom dark area */}
                  <View style={styles.overlayRowBottom} />
                </View>

                {/* Branding - Top */}
                <View style={styles.brandingContainer}>
                  <Text style={styles.brandingText}>Powered by Back2Use</Text>
                </View>

                {/* Close Button - Top Right */}
                <TouchableOpacity 
                  style={styles.closeButtonTop} 
                  onPress={() => {
                    setShowQRScanner(false);
                    setFlashEnabled(false);
                    if (laserAnimationRef.current) {
                      clearInterval(laserAnimationRef.current);
                      laserAnimationRef.current = null;
                    }
                    router.replace('/(protected)/business/business-dashboard');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Scanning Frame with Rounded Corner Brackets */}
                <View style={styles.scanningFrameContainer}>
                  <View style={styles.scanningFrame}>
                    {/* Top Left Corner */}
                    <View style={[styles.cornerBracket, styles.topLeftCorner]}>
                      <View style={[styles.cornerBracketHorizontal, { top: 0, left: 0 }]} />
                      <View style={[styles.cornerBracketVertical, { top: 0, left: 0 }]} />
                    </View>
                    {/* Top Right Corner */}
                    <View style={[styles.cornerBracket, styles.topRightCorner]}>
                      <View style={[styles.cornerBracketHorizontal, { top: 0, right: 0 }]} />
                      <View style={[styles.cornerBracketVertical, { top: 0, right: 0 }]} />
                    </View>
                    {/* Bottom Left Corner */}
                    <View style={[styles.cornerBracket, styles.bottomLeftCorner]}>
                      <View style={[styles.cornerBracketHorizontal, { bottom: 0, left: 0 }]} />
                      <View style={[styles.cornerBracketVertical, { bottom: 0, left: 0 }]} />
                    </View>
                    {/* Bottom Right Corner */}
                    <View style={[styles.cornerBracket, styles.bottomRightCorner]}>
                      <View style={[styles.cornerBracketHorizontal, { bottom: 0, right: 0 }]} />
                      <View style={[styles.cornerBracketVertical, { bottom: 0, right: 0 }]} />
                    </View>
                    
                    {/* Laser Scanning Line */}
                    <View 
                      style={[
                        styles.laserLine,
                        { top: laserLinePosition }
                      ]}
                    />
                  </View>
                </View>

                {/* Instructions Text */}
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsText}>
                    Align the QR code within the frame to scan
                  </Text>
                </View>

                {/* Floating Controls - Bottom */}
                <View style={styles.floatingControls}>
                  {/* My QR Button */}
                  <TouchableOpacity 
                    style={styles.floatingButton}
                    onPress={() => {
                      Alert.alert('My QR', 'Feature coming soon');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Flash/Torch Button - Center (Large) */}
                  <TouchableOpacity 
                    style={[styles.floatingButton, styles.flashButton]}
                    onPress={() => setFlashEnabled(!flashEnabled)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={flashEnabled ? "flash" : "flash-outline"} 
                      size={28} 
                      color={flashEnabled ? "#FCD34D" : "#FFFFFF"} 
                    />
                  </TouchableOpacity>

                  {/* Upload Image Button */}
                  <TouchableOpacity 
                    style={styles.floatingButton}
                    onPress={() => {
                      Alert.alert('Upload Image', 'Feature coming soon');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
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

                {/* Voucher Status Section */}
                <View style={styles.confirmSection}>
                  <Text style={styles.sectionTitle}>Trạng thái Voucher</Text>
                  <View style={styles.confirmCard}>
                    <View style={styles.statusInfoContainer}>
                      <Ionicons 
                        name={voucher.status === 'used' ? "checkmark-circle" : voucher.status === 'expired' ? "close-circle" : "time"} 
                        size={48} 
                        color={getStatusColor(voucher.status)} 
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(voucher.status), fontSize: 18, marginTop: 12 }]}>
                        {getStatusText(voucher.status)}
                      </Text>
                      {voucher.status === 'used' && (
                        <Text style={styles.statusDescription}>
                          Voucher đã được sử dụng thành công
                        </Text>
                      )}
                      {voucher.status === 'expired' && (
                        <Text style={styles.statusDescription}>
                          Voucher đã hết hạn sử dụng
                        </Text>
                      )}
                      {voucher.status === 'redeemed' && (
                        <Text style={styles.statusDescription}>
                          Voucher đã được nhận nhưng chưa sử dụng
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.codeDisplayContainer}>
                      <Text style={styles.codeLabel}>Mã voucher:</Text>
                      <Text style={styles.codeDisplay}>{voucher.fullCode}</Text>
                    </View>

                    {/* Confirm use button */}
                    {voucher.status !== 'used' && voucher.status !== 'expired' && (
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          confirming && styles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirmUse}
                        disabled={confirming}
                      >
                        {confirming ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.confirmButtonText}>
                            Xác nhận sử dụng voucher
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
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
        <View style={styles.instructionsMainContainer}>
          <View style={styles.instructionsCard}>
            <Ionicons name="qr-code-outline" size={64} color="#00704A" />
            <Text style={styles.instructionsTitle}>Quét mã QR voucher</Text>
            <Text style={styles.instructionsText}>
              Nhấn nút bên dưới để bắt đầu quét mã QR voucher của khách hàng
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={async () => {
                if (!permission?.granted) {
                  const result = await requestPermission();
                  if (result.granted) {
                    setShowQRScanner(true);
                  } else {
                    Alert.alert(
                      'Camera Permission',
                      'Cần quyền truy cập camera để quét mã QR voucher',
                      [{ text: 'OK' }]
                    );
                  }
                } else {
                  setShowQRScanner(true);
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
  // QR Scanner - Professional Redesign with proper overlay
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayRowTop: {
    flex: 0,
    height: height * 0.25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayRowMiddle: {
    flex: 0,
    height: width * 0.7,
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 0,
    width: width * 0.15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  transparentCenter: {
    flex: 0,
    width: width * 0.7,
    backgroundColor: 'transparent',
  },
  overlayRowBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  brandingContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  brandingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButtonTop: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scanningFrameContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: width * 0.15,
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  scanningFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  cornerBracketHorizontal: {
    position: 'absolute',
    width: 40,
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  cornerBracketVertical: {
    position: 'absolute',
    width: 4,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  topLeftCorner: {
    top: -2,
    left: -2,
  },
  topRightCorner: {
    top: -2,
    right: -2,
  },
  bottomLeftCorner: {
    bottom: -2,
    left: -2,
  },
  bottomRightCorner: {
    bottom: -2,
    right: -2,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
    opacity: 0.9,
  },
  instructionsContainer: {
    position: 'absolute',
    top: height * 0.25 + width * 0.7 + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flashButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  statusInfoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  codeDisplayContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  codeDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  instructionsMainContainer: {
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

