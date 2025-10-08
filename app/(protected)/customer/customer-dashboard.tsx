import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    ImageBackground,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from "react-native";
import { useAuth } from "../../../context/AuthProvider";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { mockPackagingItems, mockStores, mockTransactions } from "../../../lib/mock-data";
import { getCurrentUserProfile } from "../../../lib/user-service";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CustomerDashboard() {
  const { state, actions } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const scanLock = useRef(false);
  const lastScrollY = useRef(0);

  // Enable automatic token refresh
  useTokenRefresh();

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Chào buổi sáng";
    } else if (hour < 18) {
      return "Chào buổi trưa";
    } else {
      return "Chào buổi tối";
    }
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (state.accessToken) {
        try {
          const user = await getCurrentUserProfile(state.accessToken);
          setUserData(user);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [state.accessToken]);

  // Mock user data (fallback)
  const user = userData || {
    name: "John Doe",
    email: "john.doe@example.com",
    points: 1250,
    level: "Gold",
    activeBorrows: 3,
    totalSaved: 45.5,
    walletBalance: 125.50,
  };

  const userTransactions = mockTransactions.filter((t) => t.customerId === "1");
  const activeBorrows = userTransactions.filter((t) => t.type === "borrow" && t.status === "completed" && !t.returnedAt);



  const startScanning = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        scanLock.current = false;
        setShowQRScanner(true);
      } else {
        Alert.alert(
          "Quyền truy cập camera",
          "Vui lòng cấp quyền truy cập camera để quét mã QR",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở camera. Vui lòng thử lại.");
    }
  };

  const stopScanning = () => setShowQRScanner(false);

  const onBarcode = (e: { data?: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;

    const data = e?.data ?? "";
    Vibration.vibrate(Platform.OS === "ios" ? 30 : 50);
    setShowQRScanner(false);

    Alert.alert("QR Code Scanned", `Container ID: ${data}\n\nWould you like to borrow this container?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Borrow", onPress: () => handleBorrow(data) },
    ]);
  };

  const handleBorrow = (containerId: string) => {
    Alert.alert("Success", `Container ${containerId} borrowed successfully!`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* TokenInfo component removed */}
      
      {/* Header giống các trang khác */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name || 'U').charAt(0)}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.greeting}>{getTimeBasedGreeting()},</Text>
            <Text style={styles.userName}>{(user.name || 'User').split(" ")[0]} 👋</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={20} color="#0F4D3A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section với ImageBackground bo viền - có thể scroll */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
            style={styles.heroBackground}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.welcomeCard}>
                <View style={styles.welcomeContent}>
                  <View style={styles.welcomeIcon}>
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.welcomeText}>Chúc bạn một ngày tuyệt vời!</Text>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.walletCard]}>
          <View style={styles.statIcon}>
                <Ionicons name="wallet" size={20} color="#FFFFFF" />
          </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Số dư</Text>
                <Text style={styles.statValue}>${(user.walletBalance || 0).toFixed(2)}</Text>
          </View>
        </View>

            <View style={[styles.statCard, styles.pointsCard]}>
          <View style={styles.statIcon}>
                <Ionicons name="trophy" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Điểm thưởng</Text>
                <Text style={styles.statValue}>{(user.points || 0).toLocaleString()}</Text>
          </View>
          </View>
        </View>
      </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsCard}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
             <View style={styles.quickActionsGrid}>
               <TouchableOpacity style={styles.quickActionButton} onPress={startScanning}>
                 <View style={[styles.quickActionIcon, styles.scanIcon]}>
                   <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                 </View>
                 <Text style={styles.quickActionText}>Quét QR</Text>
            </TouchableOpacity>

               <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push("/(protected)/customer/rewards")}>
                 <View style={[styles.quickActionIcon, styles.giftIcon]}>
                   <Ionicons name="gift" size={24} color="#FFFFFF" />
          </View>
                 <Text style={styles.quickActionText}>Quà tặng</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push("/(protected)/customer/stores")}>
                 <View style={[styles.quickActionIcon, styles.storeIcon]}>
                   <Ionicons name="storefront" size={24} color="#FFFFFF" />
        </View>
                 <Text style={styles.quickActionText}>Cửa hàng</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push("/(protected)/customer/customer-wallet")}>
                 <View style={[styles.quickActionIcon, styles.historyIcon]}>
                   <Ionicons name="wallet" size={24} color="#FFFFFF" />
            </View>
                 <Text style={styles.quickActionText}>Ví</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        {/* Active Borrows */}
        <View style={styles.borrowsSection}>
          <View style={styles.borrowsCard}>
            <View style={styles.borrowsHeader}>
              <View style={styles.borrowsTitle}>
                <Ionicons name="cube" size={20} color="#0F4D3A" />
                <Text style={styles.borrowsTitleText}>Đang mượn</Text>
                </View>
              <View style={styles.borrowsBadge}>
                <Text style={styles.borrowsBadgeText}>{activeBorrows.length}</Text>
              </View>
            </View>

            <View style={styles.borrowsContent}>
              {activeBorrows.length === 0 ? (
                <View style={styles.emptyBorrows}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="cube" size={48} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có vật phẩm nào</Text>
                  <Text style={styles.emptySubtitle}>Quét mã QR để bắt đầu</Text>
                   <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
                     <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                     <Text style={styles.scanButtonText}>Quét mã QR</Text>
                </TouchableOpacity>
              </View>
              ) : (
                <View style={styles.borrowsList}>
                  {activeBorrows.map((transaction) => {
                    const item = mockPackagingItems.find((p) => p.id === transaction.packagingItemId);
                    const store = mockStores.find((s) => s.id === transaction.storeId);
                    const isOverdue = transaction.dueDate && new Date() > transaction.dueDate;

                    return (
                      <View key={transaction.id} style={styles.borrowItem}>
                        <View style={styles.borrowItemHeader}>
                          <View style={styles.borrowItemInfo}>
                            <View style={styles.borrowItemIcon}>
                              <Ionicons name="cube" size={20} color="#0F4D3A" />
                            </View>
                            <View style={styles.borrowItemDetails}>
                              <Text style={styles.borrowItemName}>
                                {item?.type} - {item?.size}
                              </Text>
                              <Text style={styles.borrowItemStore}>{store?.name}</Text>
            </View>
          </View>
                          <View style={[styles.borrowStatus, isOverdue && styles.overdueStatus]}>
                            <Text style={[styles.borrowStatusText, isOverdue && styles.overdueText]}>
                              {isOverdue ? "Quá hạn" : "Đang mượn"}
                            </Text>
                    </View>
                  </View>
                        <View style={styles.borrowItemFooter}>
                          <Text style={styles.borrowItemLabel}>Hạn trả</Text>
                          <Text style={styles.borrowItemDate}>
                            {transaction.dueDate?.toLocaleDateString("vi-VN")}
                          </Text>
              </View>
            </View>
                    );
                  })}
          </View>
        )}
                </View>
              </View>
            </View>

        {/* Impact Card */}
        <View style={styles.impactSection}>
          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <Ionicons name="leaf" size={20} color="#FFFFFF" />
              <Text style={styles.impactTitle}>Tác động của bạn</Text>
            </View>
            <View style={styles.impactStats}>
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>12</Text>
                <Text style={styles.impactStatLabel}>Lần trả hàng</Text>
            </View>
              <View style={styles.impactStat}>
                <Text style={styles.impactStatValue}>2.4kg</Text>
                <Text style={styles.impactStatLabel}>Nhựa tiết kiệm</Text>
                  </View>
                </View>
              </View>
            </View>
       </ScrollView>

       {/* Camera overlay (only when scanning) */}
       {showQRScanner && hasPermission && (
         <View style={styles.cameraSheet}>
           {/* Tap outside to close */}
           <TouchableOpacity 
             style={styles.cameraBackdrop}
             onPress={stopScanning}
             activeOpacity={1}
           />
           <View style={styles.cameraHeader}>
             <Text style={styles.cameraTitle}>Scan QR</Text>
             <TouchableOpacity 
               style={styles.closeButton}
               onPress={stopScanning}
               activeOpacity={0.7}
             >
               <Ionicons name="close" size={24} color="#fff" />
             </TouchableOpacity>
           </View>

           <View style={styles.cameraBox}>
             <CameraView
               style={styles.camera}
               barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
               onBarcodeScanned={onBarcode}
             />
             {/* khung ngắm đơn giản */}
             <View pointerEvents="none" style={styles.reticle} />
           </View>

           <Text style={styles.cameraHint}>Align the QR inside the frame to scan</Text>
         </View>
       )}
       
     </View>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroSection: {
    height: screenHeight * 0.35,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBackground: {
    flex: 1,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    flex: 1,
    padding: 24,
    paddingTop: 20,
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginLeft: -35,  },
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  welcomeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  walletCard: {
    backgroundColor: '#3B82F6',
  },
  pointsCard: {
    backgroundColor: '#F59E0B',
  },
  statIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  scanIcon: {
    backgroundColor: '#3B82F6',
  },
  giftIcon: {
    backgroundColor: '#EC4899',
  },
  storeIcon: {
    backgroundColor: '#10B981',
  },
  historyIcon: {
    backgroundColor: '#8B5CF6',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  borrowsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  borrowsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  borrowsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
  },
  borrowsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  borrowsTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  borrowsBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  borrowsBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  borrowsContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyBorrows: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    backgroundColor: '#F3F4F6',
    padding: 28,
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  borrowsList: {
    gap: 12,
  },
  borrowItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  borrowItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  borrowItemInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  borrowItemIcon: {
    backgroundColor: '#0F4D3A20',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  borrowItemDetails: {
    flex: 1,
  },
  borrowItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  borrowItemStore: {
    fontSize: 12,
    color: '#6B7280',
  },
  borrowStatus: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueStatus: {
    backgroundColor: '#FEF2F2',
  },
  borrowStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  overdueText: {
    color: '#EF4444',
  },
  borrowItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borrowItemLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  borrowItemDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  impactSection: {
    paddingHorizontal: 24,
    marginBottom: 120,
  },
  impactCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  impactStats: {
    flexDirection: 'row',
    gap: 16,
  },
  impactStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  impactStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  impactStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  // camera overlay
  cameraSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 50,
    paddingTop: 56,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cameraBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cameraHeader: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  cameraTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBox: { width: "100%", maxWidth: 420, aspectRatio: 3 / 4, borderRadius: 16, overflow: "hidden", marginTop: 24 },
  camera: { flex: 1 },
  reticle: {
    position: "absolute",
    left: "10%",
    top: "18%",
    width: "80%",
    height: "64%",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  cameraHint: { color: "#fff", opacity: 0.9, fontSize: 12, marginTop: 12 },
});
