import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMemo, useRef, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import { useAuth } from "../../../context/AuthProvider";
import { mockStores, mockTransactions } from "../../../lib/mock-data";
import { getTransactionSummary } from "../../../lib/transaction-utils";

export default function CustomerDashboard() {
  const [tab, setTab] = useState<"home" | "wallet" | "stores" | "rewards" | "profile">("home");
  const summary = useMemo(() => getTransactionSummary(mockTransactions as any), []);
  const { state } = useAuth();

  // --- Scanner state ---
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLock = useRef(false);

  const [customerProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    points: 1250,
    level: "Gold",
    activeBorrows: 3,
    totalSaved: 45.5,
    walletBalance: 125.50,
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

  const handleTabPress = (tabName: string) => {
    setTab(tabName as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{customerProfile.name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{customerProfile.name}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert("Notifications", "No new notifications") }>
            <Ionicons name="notifications" size={20} color="#0F4D3A" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => handleTabPress("profile")}>
            <Ionicons name="person-circle" size={32} color="#0F4D3A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Wallet and Points Info */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="wallet-outline" size={16} color="#0F4D3A" />
          </View>
          <View>
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statValue}>$25.50</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trophy-outline" size={16} color="#0F4D3A" />
          </View>
          <View>
            <Text style={styles.statLabel}>Points</Text>
            <Text style={styles.statValue}>{customerProfile.points.toLocaleString()}</Text>
          </View>
        </View>
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

        {tab === "wallet" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Wallet Balance</Text>
              <View style={styles.walletHeader}>
                <View>
                  <Text style={styles.walletAmount}>${customerProfile.walletBalance}</Text>
                  <Text style={styles.walletLabel}>Available Balance</Text>
                </View>
                <TouchableOpacity style={styles.addFundsButton}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addFundsText}>Add Funds</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Transactions</Text>
              {mockTransactions.slice(0, 5).map((t) => (
                <View key={t.id} style={styles.transactionRow}>
                  <View style={styles.transactionIcon}>
                    <Ionicons 
                      name={t.type === "borrow" ? "arrow-up" : "arrow-down"} 
                      size={16} 
                      color={t.type === "borrow" ? "#0F4D3A" : "#16a34a"} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.transactionTitle}>
                      {t.type === "borrow" ? "Borrowed Container" : "Returned Container"}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(t.borrowedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: t.type === "borrow" ? "#ef4444" : "#16a34a" }]}>
                    {t.type === "borrow" ? "-" : "+"}${t.depositAmount}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Methods</Text>
              <View style={styles.paymentMethodRow}>
                <Ionicons name="card" size={20} color="#0F4D3A" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.paymentMethodTitle}>Visa ****1234</Text>
                  <Text style={styles.paymentMethodSubtitle}>Default payment method</Text>
                </View>
                <TouchableOpacity>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
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

        {tab === "profile" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={32} color="#0F4D3A" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.profileName}>{customerProfile.name}</Text>
                  <Text style={styles.profileEmail}>{customerProfile.email}</Text>
                  <View style={styles.profileBadge}>
                    <Text style={styles.profileBadgeText}>{customerProfile.level} Member</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Settings</Text>
              <ProfileItem icon="person" title="Personal Information" onPress={() => Alert.alert("Profile", "Edit profile")} />
              <ProfileItem icon="notifications" title="Notifications" onPress={() => Alert.alert("Notifications", "Notification settings")} />
              <ProfileItem icon="shield-checkmark" title="Privacy & Security" onPress={() => Alert.alert("Privacy", "Privacy settings")} />
              <ProfileItem icon="help-circle" title="Help & Support" onPress={() => Alert.alert("Help", "Get help")} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Statistics</Text>
              <View style={styles.statsGrid}>
                <StatItem label="Total Borrows" value="47" />
                <StatItem label="Total Returns" value="44" />
                <StatItem label="Money Saved" value="$89.50" />
                <StatItem label="CO₂ Saved" value="23.5kg" />
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statItemValue}>{value}</Text>
      <Text style={styles.statItemLabel}>{label}</Text>
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

function ProfileItem({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color="#0F4D3A" />
      <Text style={styles.profileItemTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color="#6B7280" />
    </TouchableOpacity>
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0F4D3A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  greeting: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  userName: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0F4D3A20",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F4D3A",
  },
  profileButton: { padding: 4 },
  notificationButton: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: "#F9FAFB",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationCount: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },


  cardRow: { flexDirection: "row", gap: 12 },
  statIconWrap: { padding: 8, backgroundColor: "#E5E7EB", borderRadius: 8, marginBottom: 8 },
  
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

  // Wallet styles
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  walletAmount: { fontSize: 28, fontWeight: "800", color: "#0F4D3A" },
  walletLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  addFundsText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  transactionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  transactionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  transactionTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  transactionDate: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: "700" },

  paymentMethodRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  paymentMethodTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  paymentMethodSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },

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

  // Profile styles
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  profileEmail: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  profileBadge: { backgroundColor: "#0F4D3A", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: "flex-start" },
  profileBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  profileItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  profileItemTitle: { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827", marginLeft: 12 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  statItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  statItemValue: { fontSize: 18, fontWeight: "800", color: "#0F4D3A" },
  statItemLabel: { fontSize: 11, color: "#6B7280", marginTop: 2, textAlign: "center" },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#ef4444" },

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
