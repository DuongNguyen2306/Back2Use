import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMemo, useRef, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import { mockStores, mockTransactions } from "../../lib/mock-data";
import { getTransactionSummary } from "../../lib/transaction-utils";

export default function CustomerHome() {
  const [tab, setTab] = useState<"home" | "stores" | "history" | "rewards">("home");
  const summary = useMemo(() => getTransactionSummary(mockTransactions as any), []);

  // --- Scanner state ---
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLock = useRef(false);

  const [customerProfile] = useState({
    name: "John Doe",
    points: 1250,
    level: "Gold",
    activeBorrows: 3,
    totalSaved: 45.5,
  });

  const startScanning = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    scanLock.current = false;
    setScanning(true);
  };

  const stopScanning = () => setScanning(false);

  const onBarcode = (e: { data?: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;

    const data = e?.data ?? "";
    Vibration.vibrate(Platform.OS === "ios" ? 30 : 50);
    setScanning(false);

    Alert.alert("QR Code Scanned", `Container ID: ${data}\n\nWould you like to borrow this container?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Borrow", onPress: () => handleBorrow(data) },
    ]);
  };

  const handleBorrow = (containerId: string) => {
    Alert.alert("Success", `Container ${containerId} borrowed successfully!`);
  };

  const handleRewardRedeem = (reward: string) => {
    Alert.alert("Redeem Reward", `Redeem ${reward} for ${customerProfile.points} points?`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hello, {customerProfile.name}!</Text>
          <Text style={styles.subGreeting}>
            {customerProfile.level} Member • {customerProfile.points} points
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert("Notifications", "No new notifications") }>
            <Ionicons name="notifications" size={20} color="#0F4D3A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#0F4D3A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {renderTab(tab, setTab, "home", "Home", "qr-code")}
        {renderTab(tab, setTab, "stores", "Stores", "location")}
        {renderTab(tab, setTab, "history", "History", "time")}
        {renderTab(tab, setTab, "rewards", "Rewards", "gift")}
      </View>

      {/* Camera overlay (only when scanning) */}
      {scanning && (
        <View style={styles.cameraSheet}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>Scan QR</Text>
            <TouchableOpacity onPress={stopScanning} hitSlop={10}>
              <Ionicons name="close" size={22} color="#fff" />
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

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {tab === "home" && (
          <View style={{ gap: 12 }}>
            <View style={styles.cardRow}>
              <StatCard title="Active Borrows" value={String(customerProfile.activeBorrows)} icon="bag-check" />
              <StatCard title="Money Saved" value={`$${customerProfile.totalSaved}`} icon="cash" />
            </View>

            <View style={styles.cardRow}>
              <StatCard title="Return Rate" value={`${summary.returnRate.toFixed(0)}%`} icon="refresh" />
              <StatCard title="CO₂ Saved" value="12.5kg" icon="leaf" />
            </View>

            <View style={styles.scanCard}>
              <Ionicons name="qr-code" size={24} color="#0F4D3A" />
              <Text style={styles.scanTitle}>Scan to Borrow</Text>
              <Text style={styles.scanSub}>Borrow reusable packaging quickly</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={startScanning}>
                <Text style={styles.primaryBtnText}>Start Scanning</Text>
              </TouchableOpacity>
              {!permission?.granted && (
                <Text style={{ color: "#6B7280", marginTop: 8, fontSize: 12 }}>
                  Camera permission required — tap "Start Scanning" to allow.
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickAction}>
                  <Ionicons name="return-up-back" size={20} color="#0F4D3A" />
                  <Text style={styles.quickActionText}>Return Items</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction}>
                  <Ionicons name="location" size={20} color="#0F4D3A" />
                  <Text style={styles.quickActionText}>Find Stores</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction}>
                  <Ionicons name="help-circle" size={20} color="#0F4D3A" />
                  <Text style={styles.quickActionText}>Get Help</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {tab === "stores" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nearby Stores</Text>
              {mockStores.map((s) => (
                <View key={s.id} style={styles.listRow}>
                  <Ionicons name="storefront" size={18} color="#0F4D3A" />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.listTitle}>{s.name}</Text>
                    <Text style={styles.muted}>{s.address}</Text>
                    <View style={styles.storeDetails}>
                      <Text style={styles.storeDetailText}>Open • 0.5km</Text>
                      <Text style={styles.storeDetailText}>★ 4.8</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.directionButton}>
                    <Ionicons name="navigate" size={16} color="#0F4D3A" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Store Categories</Text>
              <View style={styles.categoryGrid}>
                <CategoryItem icon="restaurant" name="Restaurants" count={12} />
                <CategoryItem icon="storefront" name="Grocery" count={8} />
                <CategoryItem icon="cafe" name="Cafes" count={15} />
                <CategoryItem icon="bag" name="Retail" count={6} />
              </View>
            </View>
          </View>
        )}

        {tab === "history" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <View style={styles.historyHeader}>
                <Text style={styles.cardTitle}>Recent Transactions</Text>
                <TouchableOpacity style={styles.filterButton}>
                  <Ionicons name="filter" size={16} color="#0F4D3A" />
                  <Text style={styles.filterText}>Filter</Text>
                </TouchableOpacity>
              </View>

              {mockTransactions.map((t) => {
                const when = "returnedAt" in t && t.returnedAt ? t.returnedAt : t.borrowedAt;
                return (
                  <View key={t.id} style={styles.listRow}>
                    <Ionicons
                      name={t.type === "borrow" ? "arrow-up" : "arrow-down"}
                      size={18}
                      color={t.type === "borrow" ? "#0F4D3A" : "#16a34a"}
                    />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.listTitle}>{t.type === "borrow" ? "Borrowed" : "Returned"}</Text>
                      <Text style={styles.muted}>{new Date(when).toLocaleDateString()}</Text>
                      <Text style={styles.transactionDetail}>Container ID: {t.id}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <Text style={[styles.badge, { backgroundColor: t.status === "active" ? "#0F4D3A" : "#16a34a" }]}>
                        {t.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>This Month Summary</Text>
              <View style={styles.summaryGrid}>
                <SummaryItem label="Items Borrowed" value="15" />
                <SummaryItem label="Items Returned" value="12" />
                <SummaryItem label="Money Saved" value="$23.50" />
                <SummaryItem label="Points Earned" value="180" />
              </View>
            </View>
          </View>
        )}

        {tab === "rewards" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Rewards</Text>
              <View style={styles.pointsHeader}>
                <View>
                  <Text style={styles.pointsValue}>{customerProfile.points}</Text>
                  <Text style={styles.pointsLabel}>Available Points</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{customerProfile.level}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Available Rewards</Text>
              <RewardItem
                title="$5 Store Credit"
                points={500}
                description="Use at any partner store"
                onRedeem={() => handleRewardRedeem("$5 Store Credit")}
              />
              <RewardItem
                title="Free Coffee"
                points={300}
                description="At participating cafes"
                onRedeem={() => handleRewardRedeem("Free Coffee")}
              />
              <RewardItem
                title="10% Discount"
                points={800}
                description="Next purchase discount"
                onRedeem={() => handleRewardRedeem("10% Discount")}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Achievements</Text>
              <AchievementItem title="Eco Warrior" description="Returned 50+ containers" completed={true} icon="leaf" />
              <AchievementItem
                title="Loyal Customer"
                description="Used service for 6 months"
                completed={true}
                icon="heart"
              />
              <AchievementItem
                title="Perfect Return"
                description="100% return rate this month"
                completed={false}
                icon="trophy"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CategoryItem({ icon, name, count }: { icon: string; name: string; count: number }) {
  return (
    <TouchableOpacity style={styles.categoryItem}>
      <Ionicons name={icon as any} size={20} color="#0F4D3A" />
      <Text style={styles.categoryName}>{name}</Text>
      <Text style={styles.categoryCount}>{count} stores</Text>
    </TouchableOpacity>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function RewardItem({
  title,
  points,
  description,
  onRedeem,
}: { title: string; points: number; description: string; onRedeem: () => void }) {
  return (
    <View style={styles.rewardRow}>
      <Ionicons name="gift" size={18} color="#0F4D3A" />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.muted}>{description}</Text>
        <Text style={styles.pointsCost}>{points} points</Text>
      </View>
      <TouchableOpacity style={styles.redeemButton} onPress={onRedeem}>
        <Text style={styles.redeemButtonText}>Redeem</Text>
      </TouchableOpacity>
    </View>
  );
}

function AchievementItem({
  title,
  description,
  completed,
  icon,
}: { title: string; description: string; completed: boolean; icon: string }) {
  return (
    <View style={styles.achievementRow}>
      <Ionicons name={icon as any} size={18} color={completed ? "#16a34a" : "#6B7280"} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={[styles.listTitle, { color: completed ? "#111827" : "#6B7280" }]}>{title}</Text>
        <Text style={styles.muted}>{description}</Text>
      </View>
      {completed && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
    </View>
  );
}

function renderTab(active: string, setTab: (t: any) => void, key: any, label: string, icon: any) {
  const isActive = active === key;
  return (
    <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
      <Ionicons name={icon} size={16} color={isActive ? "#fff" : "#0F4D3A"} />
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: any }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color="#0F4D3A" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: "800", color: "#0F4D3A" },
  subGreeting: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  profileButton: { padding: 4 },
  notificationButton: { padding: 8, borderRadius: 8, backgroundColor: "#F9FAFB" },

  tabRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  tabBtnActive: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  tabText: { color: "#0F4D3A", fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: "#fff" },

  cardRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    backgroundColor: "#F9FAFB",
  },
  statIconWrap: { padding: 8, backgroundColor: "#E5E7EB", borderRadius: 8, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#374151", marginTop: 2 },
  
  scanCard: {
    padding: 16,
    borderRadius: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    backgroundColor: "#fff",
    alignItems: "flex-start",
  },
  scanTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 8 },
  scanSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0F4D3A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  
  card: { padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, backgroundColor: "#fff" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  muted: { color: "#6B7280", fontSize: 12 },
  badge: {
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },

  quickActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  quickAction: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  quickActionText: { fontSize: 11, fontWeight: "600", color: "#0F4D3A", marginTop: 4, textAlign: "center" },

  storeDetails: { flexDirection: "row", gap: 12, marginTop: 2 },
  storeDetailText: { fontSize: 11, color: "#16a34a", fontWeight: "500" },
  directionButton: { padding: 8, borderRadius: 8, backgroundColor: "#F9FAFB" },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  categoryItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  categoryName: { fontSize: 12, fontWeight: "600", color: "#111827", marginTop: 4 },
  categoryCount: { fontSize: 10, color: "#6B7280", marginTop: 2 },

  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#F9FAFB",
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#0F4D3A" },
  transactionDetail: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  statusContainer: { alignItems: "flex-end" },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  summaryItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#0F4D3A" },
  summaryLabel: { fontSize: 11, color: "#6B7280", marginTop: 2, textAlign: "center" },

  pointsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  pointsValue: { fontSize: 24, fontWeight: "800", color: "#0F4D3A" },
  pointsLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  levelBadge: { backgroundColor: "#0F4D3A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  levelText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pointsCost: { fontSize: 11, color: "#0F4D3A", fontWeight: "600", marginTop: 2 },
  redeemButton: { backgroundColor: "#0F4D3A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  redeemButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
  cameraHeader: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
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
