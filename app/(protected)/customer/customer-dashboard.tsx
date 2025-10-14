import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { StandaloneAIChecker } from "../../../components/StandaloneAIChecker";
import { useAuth } from "../../../context/AuthProvider";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { getCurrentUserProfileWithAutoRefresh } from "../../../lib/api";
import { mockTransactions } from "../../../lib/mock-data";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CustomerDashboard() {
  const { state } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showAIQualityCheck, setShowAIQualityCheck] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  // use layout navigation; no local tab state here
  const scanLock = useRef(false);

  useTokenRefresh();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (state.accessToken) {
        try {
          const user = await getCurrentUserProfileWithAutoRefresh();
          setUserData(user);
        } catch {
          // ignore
        }
      }
    };
    loadUserData();
  }, [state.accessToken]);

  const user = userData || {
    id: "1",
    name: "User",
    rank: 8,
    maxRank: 10,
    level: "Green",
    walletBalance: 125.5,
  };

  const userTransactions = mockTransactions.filter((t) => t.customerId === user?.id);
  // Mock data for active borrows
  const mockActiveBorrows = [
    {
      id: "borrow-1",
      customerId: "1",
      storeId: "store-1",
      packagingItemId: "item-1",
      type: "borrow",
      status: "completed",
      borrowedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      returnedAt: null,
    },
    {
      id: "borrow-2", 
      customerId: "1",
      storeId: "store-2",
      packagingItemId: "item-2",
      type: "borrow",
      status: "completed",
      borrowedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      returnedAt: null,
    }
  ];

  const mockBorrowItems = [
    { id: "item-1", name: "Coffee Cup", type: "cup", size: "Medium" },
    { id: "item-2", name: "Food Container", type: "container", size: "Large" }
  ];

  const mockBorrowStores = [
    { id: "store-1", name: "Starbucks Coffee" },
    { id: "store-2", name: "McDonald's" }
  ];

  const activeBorrows = mockActiveBorrows;

  const startScanning = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status === "granted") {
        scanLock.current = false;
        setShowQRScanner(true);
      } else {
        Alert.alert("Quyền truy cập camera", "Vui lòng cấp quyền truy cập camera để quét mã QR", [{ text: "OK" }]);
      }
    } catch {
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
    
    // Simulate processing and show AI Quality Check
    setTimeout(() => {
      const mockItem = {
        id: Math.random().toString(),
        name: "Food Container",
        type: "container",
        data: data,
      };
      setScannedItem(mockItem);
      setShowAIQualityCheck(true);
      scanLock.current = false;
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />

      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>{user?.name || "User"}</Text>
          </View>
            <View style={styles.avatarLg}>
              <Text style={styles.avatarLgText}>{(user?.name || "U").charAt(0)}</Text>
          </View>
        </View>
          <View style={styles.pointsCard}>
            <View style={{ position: "absolute", right: 16, top: 16, opacity: 0.08 }}>
              <Image source={require("../../../assets/images/logo2.png")} style={{ width: 120, height: 120 }} />
            </View>
            <Text style={styles.rewardHeader}>BACK2USE RANKS</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsValue}>{user?.rank || 8}</Text>
            </View>
            <TouchableOpacity onPress={startScanning}>
              <Text style={styles.pointsCta}>Scan to borrow more to rank up</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.whiteBackground}>
        <View style={styles.contentWrapper}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 24, paddingTop: 24 }}>
            <View style={styles.sectionPad}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Card Balance</Text>
                <Text style={styles.balanceValue}>{(user?.walletBalance ?? 0 * 25000).toLocaleString('vi-VN')} VND</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardScrollContainer}
                contentInset={{ left: 0, right: 0 }}
                contentInsetAdjustmentBehavior="never"
              >
                <View style={[styles.cardTile, { backgroundColor: "#0f172a", marginRight: 8 }]}>
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>BACK2USE</Text>
                </View>
                {[
                  "https://i.pinimg.com/originals/23/4f/9b/234f9bbee27cd84a0a1ffba559d5bb4b.gif",
                  "https://i.pinimg.com/736x/15/f3/78/15f378382068f1695de5a8f1a73a81e2.jpg",
                  "https://i.pinimg.com/736x/ac/b8/ed/acb8edfe7de480f3de889444d3079ca1.jpg",
                  "https://i.pinimg.com/1200x/f0/d8/ac/f0d8ac3b671863d6473cec480755cf47.jpg",
                  
                ].map((uri, i, arr) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={[styles.cardTileImg, { marginRight: i === arr.length - 1 ? 0 : 8 }]}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionPad}>
              <View style={styles.recoHeader}>
                <Text style={styles.recoTitle}>Quick Actions</Text>
                <TouchableOpacity>
                  <Text style={styles.recoCta}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickScrollContainer}
              >
                <TouchableOpacity style={styles.quickBtn} onPress={startScanning}>
                  <View style={[styles.quickIcon, { backgroundColor: "#00704A" }]}>
                    <Image source={require("../../../assets/images/qr.png")} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.quickText}>QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(protected)/customer/customer-wallet")}>
                  <View style={[styles.quickIcon, { backgroundColor: "#00704A" }]}>
                    <Image source={require("../../../assets/images/wallet.png")} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.quickText}>Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(protected)/customer/stores")}>
                  <View style={[styles.quickIcon, { backgroundColor: "#00704A" }]}>
                    <Image source={require("../../../assets/images/store.png")} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.quickText}>Store</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickBtn} 
                  onPress={() => {
                    const mockItem = {
                      id: Math.random().toString(),
                      name: "AI Quality Check",
                      type: "container",
                      data: "ai-quality-check",
                    };
                    setScannedItem(mockItem);
                    setShowAIQualityCheck(true);
                  }}
                >
                  <View style={[styles.quickIcon, { backgroundColor: "#00704A" }]}>
                    <Image source={require("../../../assets/images/AI.png")} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.quickText}>AI Check</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={() => router.push("/(protected)/customer/rewards")}>
                  <View style={[styles.quickIcon, { backgroundColor: "#00704A" }]}>
                    <Image source={require("../../../assets/images/rank.png")} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.quickText}>Rank</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} onPress={() => {
                  // Add AI chatbot functionality here
                  Alert.alert("AI Chatbot", "AI Chatbot feature coming soon!");
                }}>
                  <View style={[styles.quickIcon, { backgroundColor: "#00704A" }]}>
                    <Image source={require("../../../assets/images/chatbot.png")} style={{ width: 28, height: 28 }} />
                  </View>
                  <Text style={styles.quickText}>AI Chat</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.sectionPad}>
              <View style={styles.recoHeader}>
                <Text style={styles.recoTitle}>Recommended</Text>
                <TouchableOpacity>
                  <Text style={styles.recoCta}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.recoGrid, { marginTop: 12 }]}>
                {[
                  "https://i.pinimg.com/736x/c2/22/59/c22259cd5eea08886a0642857da34345.jpg",
                  "https://i.pinimg.com/736x/66/fe/de/66fedec04f3aba15c6892be93406481d.jpg",
                  "https://i.pinimg.com/736x/cb/66/84/cb668448a69f7917c91cd06c0943901a.jpg",
                  "https://i.pinimg.com/1200x/2e/13/a2/2e13a2c8a786bb5eeebb3531c4709a18.jpg"
                ].map((uri, index) => (
                  <View key={uri} style={styles.recoCard}>
                    <Image
                      source={{ uri }}
                      style={styles.recoImg}
                      resizeMode="cover"
                    />
                    <View style={styles.recoOverlay}>
                      <Text style={styles.recoCardTitle}>Coffee Cup {index + 1}</Text>
                      <Text style={styles.recoSubtitle}>Eco-friendly</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
      </View>


            <View style={[styles.sectionPad, { marginTop: 8 }]}>
              <View style={styles.cardPlain}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="cube" size={16} color="#111827" />
                    <Text style={styles.cardHeaderTitle}>Currently Borrowing</Text>
                </View>
                  <View style={styles.badgeSmall}><Text style={styles.badgeSmallText}>{activeBorrows.length}</Text></View>
            </View>
              {activeBorrows.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <View style={styles.emptyIconBox}>
                      <Ionicons name="cube" size={40} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyTitle}>No items available</Text>
                    <Text style={styles.emptySub}>Scan QR code to start</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={startScanning}>
                      <Ionicons name="qr-code" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>Scan QR Code</Text>
                </TouchableOpacity>
              </View>
              ) : (
                  <View style={{ gap: 10 }}>
                  {activeBorrows.map((transaction) => {
                    const item = mockBorrowItems.find((p) => p.id === transaction.packagingItemId);
                    const store = mockBorrowStores.find((s) => s.id === transaction.storeId);
                    const isOverdue = transaction.dueDate && new Date() > transaction.dueDate;
                    return (
                        <View key={transaction.id} style={styles.borrowCard}>
                          <View style={styles.borrowHead}>
                            <View style={styles.borrowLeft}>
                              <View style={styles.borrowIcon}><Ionicons name="cube" size={18} color="#0F4D3A" /></View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.borrowTitle}>{item?.name} - {item?.size}</Text>
                                <Text style={styles.borrowStore}>{store?.name}</Text>
            </View>
          </View>
                            <View style={[styles.statusPill, isOverdue && styles.statusPillDanger]}>
                              <Text style={[styles.statusPillText, isOverdue && styles.statusPillDangerText]}>{isOverdue ? "Overdue" : "Borrowing"}</Text>
                    </View>
                  </View>
                          <View style={styles.borrowFoot}>
                            <Text style={styles.borrowLabel}>Due Date</Text>
                            <Text style={styles.borrowDate}>{transaction.dueDate?.toLocaleDateString("vi-VN")}</Text>
              </View>
            </View>
                    );
                  })}
          </View>
        )}
              </View>
            </View>

            <View style={styles.sectionPad}>
          <View style={styles.impactCard}>
                <View style={styles.impactHead}>
                  <Ionicons name="leaf" size={18} color="#fff" />
              <Text style={styles.impactTitle}>Your Impact</Text>
            </View>
                <View style={styles.impactGrid}>
              <View style={styles.impactStat}>
                    <Text style={styles.impactValue}>12</Text>
                    <Text style={styles.impactLabel}>Returns</Text>
            </View>
              <View style={styles.impactStat}>
                    <Text style={styles.impactValue}>2.4kg</Text>
                    <Text style={styles.impactLabel}>Plastic Saved</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* bottom navigation removed; using layout navigation */}

      {showQRScanner && hasPermission && (
         <View style={styles.cameraSheet}>
          <TouchableOpacity style={styles.cameraBackdrop} onPress={stopScanning} activeOpacity={1} />
           <View style={styles.cameraHeader}>
             <Text style={styles.cameraTitle}>Scan QR</Text>
            <TouchableOpacity style={styles.closeButton} onPress={stopScanning} activeOpacity={0.7}>
               <Ionicons name="close" size={24} color="#fff" />
             </TouchableOpacity>
           </View>
           <View style={styles.cameraBox}>
            <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onBarcode} />
             <View pointerEvents="none" style={styles.reticle} />
           </View>
           <Text style={styles.cameraHint}>Align the QR inside the frame to scan</Text>
         </View>
       )}

       {showAIQualityCheck && (
         <View style={styles.aiQualityOverlay}>
           <View style={styles.aiQualityContainer}>
             <View style={styles.aiQualityHeader}>
               <Text style={styles.aiQualityTitle}>AI Quality Check</Text>
               <TouchableOpacity 
                 style={styles.aiQualityCloseButton} 
                 onPress={() => setShowAIQualityCheck(false)}
                 activeOpacity={0.7}
               >
                 <Ionicons name="close" size={24} color="#6B7280" />
               </TouchableOpacity>
             </View>
             <StandaloneAIChecker />
           </View>
         </View>
       )}
     </View>
   );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00704A' },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 20,
  },
  heroHeaderArea: { backgroundColor: '#00704A', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandTitle: { color: '#fff', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  iconGhost: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  iconGhostDark: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F4F6' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 },
  greetingName: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarLg: { height: 64, width: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarLgText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  pointsCard: { backgroundColor: '#fff', borderRadius: 24, marginTop: 16, padding: 20, overflow: 'hidden' },
  rewardHeader: { color: '#00704A', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  rewardLevel: { color: 'rgba(0,112,74,0.7)', fontSize: 11, marginTop: 4, fontWeight: '600' },
  pointsRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 },
  pointsValue: { color: '#FFA500', fontSize: 56, fontWeight: '900', lineHeight: 56 },
  pointsMax: { color: 'rgba(0,112,74,0.6)', fontSize: 18, fontWeight: '700', marginLeft: 6, marginBottom: 6 },
  pointsCta: { color: '#00704A', fontSize: 12, fontWeight: '600', marginTop: 8 },
  aiTestButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  aiTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stickyHeader: { position: 'relative', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  stickyHeaderInner: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stickyHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sectionPad: { paddingHorizontal: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  balanceLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  balanceValue: { fontSize: 16, fontWeight: '800', color: '#00704A' },
  cardGrid: { flexDirection: 'row', gap: 10 },
  cardScrollContainer: {
    paddingHorizontal: 0,
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardTile: {
    width: 160,
    height: 107,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTileImg: {
    width: 160,
    height: 107,
    borderRadius: 14,
  },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  quickScrollContainer: { paddingVertical: 8, gap: 16 },
  quickBtn: { alignItems: 'center', marginRight: 16 },
  quickIcon: { padding: 14, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  quickText: { fontSize: 10, color: '#111827', marginTop: 6, fontWeight: '600', fontFamily: 'Poppins' },
  recoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  recoTitle: { fontWeight: '800', fontSize: 16, color: '#111827' },
  recoCta: { color: '#00704A', fontWeight: '700', fontSize: 12 },
  recoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recoCard: { 
    width: (Dimensions.get('window').width - 16*2 - 10) / 2, 
    aspectRatio: 4/3, 
    borderRadius: 16, 
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recoImg: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 16,
  },
  recoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  recoCardTitle: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '700',
    marginBottom: 2,
  },
  recoSubtitle: { 
    color: 'rgba(255, 255, 255, 0.8)', 
    fontSize: 12, 
    fontWeight: '500',
  },
  iconRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 12 },
  iconBtn: { padding: 8 },
  cardPlain: { backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  badgeSmall: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeSmallText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyIconBox: { backgroundColor: '#F3F4F6', padding: 20, borderRadius: 16, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#00704A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  borrowCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  borrowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  borrowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 10 },
  borrowIcon: { backgroundColor: '#0F4D3A20', padding: 8, borderRadius: 10 },
  borrowTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  borrowStore: { fontSize: 11, color: '#6B7280' },
  statusPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  statusPillDanger: { backgroundColor: '#FEF2F2' },
  statusPillDangerText: { color: '#EF4444' },
  borrowFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borrowLabel: { fontSize: 11, color: '#6B7280' },
  borrowDate: { fontSize: 11, fontWeight: '600', color: '#111827' },
  impactCard: { backgroundColor: '#00704A', borderRadius: 16, padding: 16, overflow: 'hidden' },
  impactHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  impactTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  impactGrid: { flexDirection: 'row', gap: 12 },
  impactStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  impactValue: { color: '#fff', fontWeight: '900', fontSize: 20, marginBottom: 4 },
  impactLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10, paddingTop: 10 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, marginTop: 4, color: '#6B7280', fontWeight: '700' },
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
  aiQualityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  aiQualityContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 16,
    maxHeight: '95%',
    width: '95%',
    overflow: 'hidden',
    flex: 1,
  },
  aiQualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  aiQualityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  aiQualityCloseButton: {
    padding: 8,
  },
});
