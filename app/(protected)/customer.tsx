import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from "react-native";
import { mockStores, mockTransactions } from "../../lib/mock-data";
import { getTransactionSummary } from "../../lib/transaction-utils";

export default function CustomerHome() {
  const [tab, setTab] = useState<"home" | "stores" | "history" | "rewards">("home");
  const summary = useMemo(() => getTransactionSummary(mockTransactions as any), []);

  // --- Scanner state ---
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLock = useRef(false);

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

    // TODO: xử lý QR thực tế ở đây (điều hướng, check container, gọi API…)
    console.log("QR:", data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Customer</Text>

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
              <StatCard title="Active Borrows" value={String(summary.totalTransactions)} icon="bag-check" />
              <StatCard title="Return Rate" value={`${summary.returnRate.toFixed(0)}%`} icon="refresh" />
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
                  Camera permission required — tap “Start Scanning” to allow.
                </Text>
              )}
            </View>
          </View>
        )}

        {tab === "stores" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nearby Stores</Text>
            {mockStores.map((s) => (
              <View key={s.id} style={styles.listRow}>
                <Ionicons name="storefront" size={18} color="#0F4D3A" />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.listTitle}>{s.name}</Text>
                  <Text style={styles.muted}>{s.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </View>
            ))}
          </View>
        )}

        {tab === "history" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {mockTransactions.map((t) => {
              // Ưu tiên returnedAt nếu có, không thì borrowedAt
              const when = ("returnedAt" in t && t.returnedAt) ? t.returnedAt : t.borrowedAt;
              return (
                <View key={t.id} style={styles.listRow}>
                  <Ionicons
                    name={t.type === "borrow" ? "arrow-up" : "arrow-down"}
                    size={18}
                    color={t.type === "borrow" ? "#0F4D3A" : "#16a34a"}
                  />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.listTitle}>{t.type === "borrow" ? "Borrow" : "Return"}</Text>
                    <Text style={styles.muted}>{new Date(when).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.badge}>{t.status}</Text>
                </View>
              );
            })}
          </View>
        )}

        {tab === "rewards" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rewards</Text>
            <Text style={styles.muted}>Earn points for on-time returns and redeem at partner stores.</Text>
          </View>
        )}
      </ScrollView>
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
  header: { fontSize: 22, fontWeight: "800", color: "#0F4D3A", marginBottom: 12 },
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
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, backgroundColor: "#F9FAFB" },
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
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  listTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  muted: { color: "#6B7280", fontSize: 12 },
  badge: { color: "#0F4D3A", backgroundColor: "#0F4D3A10", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: "hidden", fontSize: 12, fontWeight: "700" },

  // camera overlay
  cameraSheet: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 50,
    paddingTop: 56,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cameraHeader: {
    position: "absolute",
    top: 16, left: 16, right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  cameraBox: { width: "100%", maxWidth: 420, aspectRatio: 3/4, borderRadius: 16, overflow: "hidden", marginTop: 24 },
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
