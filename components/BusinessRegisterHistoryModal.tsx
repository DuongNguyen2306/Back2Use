import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ImageBackground,
    Image,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { businessApi } from "@/services/api/businessService";
import { BusinessFormHistory } from "@/types/business.types";

interface BusinessRegisterHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BusinessRegisterHistoryModal({ visible, onClose }: BusinessRegisterHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BusinessFormHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<BusinessFormHistory | null>(null);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await businessApi.getHistory({ page: 1, limit: 10 });
      if (response.data && response.data.length > 0) {
        setHistory(response.data);
        // Tự động chọn bản đăng ký pending đầu tiên nếu có
        const pendingForm = response.data.find(item => item.status === 'pending');
        if (pendingForm) {
          setSelectedHistory(pendingForm);
        } else {
          setSelectedHistory(response.data[0]);
        }
      }
    } catch (error: any) {
      // Silently handle 502 errors (server unavailable)
      if (error?.response?.status === 502 || error?.message === 'SERVER_UNAVAILABLE') {
        // Don't log or show alert for 502 errors
        setLoading(false);
        return;
      }
      console.error('Error loading business history:', error);
      Alert.alert("Lỗi", "Không thể tải lịch sử đăng ký. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ duyệt';
      case 'approved':
        return 'Đã được duyệt';
      case 'rejected':
        return 'Đã bị từ chối';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ImageBackground
        source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.titleContainer}>
                  <Ionicons name="time-outline" size={28} color="#0F4D3A" style={{ marginRight: 12 }} />
                  <Text style={styles.modalTitle}>Lịch sử đăng ký doanh nghiệp</Text>
                </View>
                <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0F4D3A" />
                  <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
                </View>
              ) : history.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                  <Text style={styles.emptyText}>Chưa có lịch sử đăng ký</Text>
                  <Text style={styles.emptySubtext}>Bạn chưa có đơn đăng ký doanh nghiệp nào</Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.scrollView} 
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* History List */}
                  <View style={styles.historyList}>
                    {history.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={[
                          styles.historyItem,
                          selectedHistory?._id === item._id && styles.historyItemSelected
                        ]}
                        onPress={() => setSelectedHistory(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.historyItemHeader}>
                          <View style={styles.historyItemLeft}>
                            <Ionicons name="business" size={24} color="#0F4D3A" />
                            <View style={styles.historyItemInfo}>
                              <Text style={styles.historyItemName}>{item.businessName}</Text>
                              <Text style={styles.historyItemType}>{item.businessType}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                              {getStatusText(item.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.historyItemDate}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Selected History Details */}
                  {selectedHistory && (
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailsHeader}>
                        <Ionicons name="information-circle-outline" size={24} color="#0F4D3A" />
                        <Text style={styles.detailsTitle}>Chi tiết đăng ký</Text>
                      </View>

                      <View style={styles.detailsContent}>
                        {/* Business Logo */}
                        {selectedHistory.businessLogoUrl && (
                          <View style={styles.logoContainer}>
                            <Image 
                              source={{ uri: selectedHistory.businessLogoUrl }} 
                              style={styles.logoImage} 
                            />
                          </View>
                        )}

                        {/* Business Information */}
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Tên doanh nghiệp:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.businessName}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Loại hình:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.businessType}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Email:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.businessMail}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Địa chỉ:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.businessAddress}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Số điện thoại:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.businessPhone}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Mã số thuế:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.taxCode}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Giờ mở cửa:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.openTime}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Giờ đóng cửa:</Text>
                          <Text style={styles.detailValue}>{selectedHistory.closeTime}</Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Trạng thái:</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedHistory.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(selectedHistory.status) }]}>
                              {getStatusText(selectedHistory.status)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Ngày đăng ký:</Text>
                          <Text style={styles.detailValue}>{formatDate(selectedHistory.createdAt)}</Text>
                        </View>

                        {/* Documents */}
                        <View style={styles.documentsSection}>
                          <Text style={styles.documentsTitle}>Tài liệu đã nộp:</Text>
                          
                          {selectedHistory.FoodSafetyCertUrl && (
                            <View style={styles.documentItem}>
                              <Ionicons name="document-text" size={20} color="#0F4D3A" />
                              <Text style={styles.documentText}>Giấy chứng nhận an toàn thực phẩm</Text>
                              <TouchableOpacity onPress={() => {}}>
                                <Ionicons name="eye-outline" size={20} color="#0F4D3A" />
                              </TouchableOpacity>
                            </View>
                          )}

                          {selectedHistory.businessLicenseUrl && (
                            <View style={styles.documentItem}>
                              <Ionicons name="document-attach" size={20} color="#0F4D3A" />
                              <Text style={styles.documentText}>Giấy phép đăng ký kinh doanh</Text>
                              <TouchableOpacity onPress={() => {}}>
                                <Ionicons name="eye-outline" size={20} color="#0F4D3A" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  keyboardView: {
    width: '100%',
    maxWidth: '100%',
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    width: '100%',
    maxWidth: '100%',
    flex: 1,
    maxHeight: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  historyList: {
    marginBottom: 24,
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  historyItemSelected: {
    borderColor: '#0F4D3A',
    backgroundColor: 'rgba(15, 77, 58, 0.05)',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyItemType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  detailsContent: {
    gap: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  documentsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});

