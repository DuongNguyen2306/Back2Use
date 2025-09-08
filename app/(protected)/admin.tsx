import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabKey = "overview" | "users" | "stores" | "reports" | "security";

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("overview");

  const stats = useMemo(() => ({
    totalUsers: 3247,
    totalStores: 28,
    activeStores: 22,
    totalItems: 5820,
    totalTransactions: 15420,
  }), []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <View style={styles.tabRow}>
        {renderTabButton(tab, setTab, "overview", "Overview", "stats-chart")}
        {renderTabButton(tab, setTab, "users", "Users", "people")}
        {renderTabButton(tab, setTab, "stores", "Stores", "storefront")}
        {renderTabButton(tab, setTab, "reports", "Reports", "document-text")}
        {renderTabButton(tab, setTab, "security", "Security", "shield-checkmark")}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {tab === "overview" && (
          <View style={{ gap: 12 }}>
            <View style={styles.cardRow}>
              <StatCard title="Total Users" value={String(stats.totalUsers)} icon="people-circle" />
              <StatCard title="Active Stores" value={`${stats.activeStores}/${stats.totalStores}`} icon="business" />
            </View>
            <View style={styles.cardRow}>
              <StatCard title="Total Items" value={String(stats.totalItems)} icon="cube" />
              <StatCard title="Transactions" value={String(stats.totalTransactions)} icon="swap-vertical" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>System Alerts</Text>
              <AlertRow color="#ea580c" icon="warning" title="Pending Store Approvals" subtitle="3 stores waiting for approval" />
              <AlertRow color="#2563eb" icon="shield" title="Security Alert" subtitle="2 suspicious login attempts detected" />
            </View>
          </View>
        )}

        {tab === "users" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>User Management</Text>
            <Text style={styles.muted}>This is a mobile-friendly placeholder. Add list, filters, actions here.</Text>
          </View>
        )}

        {tab === "stores" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Store Management</Text>
            <Text style={styles.muted}>Approve stores, edit info, and view statuses.</Text>
          </View>
        )}

        {tab === "reports" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reports</Text>
            <Text style={styles.muted}>Generate system reports and view analytics.</Text>
          </View>
        )}

        {tab === "security" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security Monitoring</Text>
            <Text style={styles.muted}>Review alerts and recent security events.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function renderTabButton(active: TabKey, setTab: (t: TabKey) => void, key: TabKey, label: string, icon: any) {
  const isActive = active === key;
  return (
    <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
      <Ionicons name={icon as any} size={16} color={isActive ? "#fff" : "#0F4D3A"} />
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

function AlertRow({ color, icon, title, subtitle }: { color: string; icon: any; title: string; subtitle: string }) {
  return (
    <View style={[styles.alertRow, { borderColor: color, backgroundColor: "#F9FAFB" }] }>
      <Ionicons name={icon} size={18} color={color} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6B7280" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "800", color: "#0F4D3A", marginBottom: 12 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  tabBtnActive: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  tabText: { color: "#0F4D3A", fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: "#fff" },
  cardRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, backgroundColor: "#F9FAFB", alignItems: "flex-start" },
  statIconWrap: { padding: 8, backgroundColor: "#E5E7EB", borderRadius: 8, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#374151", marginTop: 2 },
  card: { padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, backgroundColor: "#fff", marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  muted: { color: "#6B7280", fontSize: 13 },
  alertRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, marginTop: 8 },
  alertTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  alertSubtitle: { fontSize: 12, color: "#6B7280" },
});


