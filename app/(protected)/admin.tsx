import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
} as any);

type TabKey = "overview" | "users" | "stores" | "reports" | "security";

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notifications, setNotifications] = useState<any[]>([]);

  const stats = useMemo(
    () => ({
      totalUsers: 3247,
      totalStores: 28,
      activeStores: 22,
      totalItems: 5820,
      totalTransactions: 15420,
      pendingApprovals: 3,
      securityAlerts: 2,
      monthlyRevenue: 45200,
      returnRate: 87.5,
    }),
    [],
  );

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log("[v0] Admin push token:", token);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[v0] Admin notification tapped:", response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token: string | undefined;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  };

  const sendAdminNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔧 Admin: ${title}`,
        body: body,
        data: { type: "admin", timestamp: Date.now() },
        sound: "default",
      },
      trigger: null,
    });
  };

  const testNotifications = () => {
    sendAdminNotification("Test Notification", "This is a test admin notification!");
  };

  const handleUserAction = (action: string, userId?: string) => {
    Alert.alert("User Action", `${action} ${userId ? `for user ${userId}` : ""}`);
  };

  const handleStoreAction = (action: string, storeId?: string) => {
    Alert.alert("Store Action", `${action} ${storeId ? `for store ${storeId}` : ""}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={testNotifications}>
          <Ionicons name="notifications" size={20} color="#0F4D3A" />
          {notifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notification Status</Text>
              <View style={styles.notificationStatus}>
                <Ionicons
                  name={expoPushToken ? "checkmark-circle" : "alert-circle"}
                  size={18}
                  color={expoPushToken ? "#16a34a" : "#ea580c"}
                />
                <Text style={styles.notificationStatusText}>
                  {expoPushToken ? "Push notifications enabled" : "Push notifications disabled"}
                </Text>
              </View>
              <Text style={styles.notificationCount}>Received {notifications.length} notifications today</Text>
            </View>
            <View style={styles.cardRow}>
              <StatCard title="Total Users" value={String(stats.totalUsers)} icon="people-circle" />
              <StatCard title="Active Stores" value={`${stats.activeStores}/${stats.totalStores}`} icon="business" />
            </View>
            <View style={styles.cardRow}>
              <StatCard title="Total Items" value={String(stats.totalItems)} icon="cube" />
              <StatCard title="Transactions" value={String(stats.totalTransactions)} icon="swap-vertical" />
            </View>
            <View style={styles.cardRow}>
              <StatCard title="Monthly Revenue" value={`$${(stats.monthlyRevenue / 1000).toFixed(1)}k`} icon="cash" />
              <StatCard title="Return Rate" value={`${stats.returnRate}%`} icon="refresh" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>System Alerts</Text>
              <AlertRow
                color="#ea580c"
                icon="warning"
                title="Pending Store Approvals"
                subtitle="3 stores waiting for approval"
                onPress={() => sendAdminNotification("Alert Action", "Checking pending approvals")}
              />
              <AlertRow
                color="#2563eb"
                icon="shield"
                title="Security Alert"
                subtitle="2 suspicious login attempts detected"
                onPress={() => sendAdminNotification("Security Action", "Investigating security alerts")}
              />
              <AlertRow
                color="#16a34a"
                icon="checkmark-circle"
                title="System Health"
                subtitle="All services running normally"
                onPress={() => sendAdminNotification("System Status", "System health check completed")}
              />
            </View>
          </View>
        )}

        {tab === "users" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>User Management</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleUserAction("View All Users")}>
                  <Ionicons name="people" size={16} color="#0F4D3A" />
                  <Text style={styles.actionText}>View All Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleUserAction("Add New User")}>
                  <Ionicons name="person-add" size={16} color="#0F4D3A" />
                  <Text style={styles.actionText}>Add User</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent User Activity</Text>
              <UserActivityRow user="John Doe" action="Registered" time="2 hours ago" />
              <UserActivityRow user="Jane Smith" action="Updated Profile" time="4 hours ago" />
              <UserActivityRow user="Mike Johnson" action="Suspended" time="1 day ago" />
            </View>
          </View>
        )}

        {tab === "stores" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Store Management</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleStoreAction("Approve Pending")}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text style={styles.actionText}>Approve ({stats.pendingApprovals})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleStoreAction("View All") }>
                  <Ionicons name="storefront" size={16} color="#0F4D3A" />
                  <Text style={styles.actionText}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Store Status</Text>
              <StoreStatusRow name="Green Market" status="Active" items="45" />
              <StoreStatusRow name="Eco Store" status="Pending" items="0" />
              <StoreStatusRow name="Fresh Foods" status="Active" items="32" />
            </View>
          </View>
        )}

        {tab === "reports" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Generate Reports</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="bar-chart" size={16} color="#0F4D3A" />
                  <Text style={styles.actionText}>Usage Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="cash" size={16} color="#0F4D3A" />
                  <Text style={styles.actionText}>Revenue Report</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>System Analytics</Text>
              <AnalyticsRow metric="Daily Active Users" value="1,247" trend="up" />
              <AnalyticsRow metric="Container Returns" value="89.2%" trend="up" />
              <AnalyticsRow metric="System Uptime" value="99.9%" trend="stable" />
            </View>
          </View>
        )}

        {tab === "security" && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Security Monitoring</Text>
              <SecurityEventRow
                event="Failed Login Attempt"
                user="unknown@email.com"
                time="5 min ago"
                severity="medium"
              />
              <SecurityEventRow event="Admin Access" user="admin@back2use.com" time="1 hour ago" severity="low" />
              <SecurityEventRow event="Data Export" user="manager@store.com" time="3 hours ago" severity="low" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Security Actions</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="lock-closed" size={16} color="#dc2626" />
                  <Text style={styles.actionText}>Lock Accounts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="refresh" size={16} color="#0F4D3A" />
                  <Text style={styles.actionText}>Reset Passwords</Text>
                </TouchableOpacity>
              </View>
            </View>
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

function AlertRow({ color, icon, title, subtitle, onPress }: { color: string; icon: any; title: string; subtitle: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.alertRow, { borderColor: color, backgroundColor: "#F9FAFB" }]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6B7280" />
    </TouchableOpacity>
  );
}

function UserActivityRow({ user, action, time }: { user: string; action: string; time: string }) {
  return (
    <View style={styles.listRow}>
      <Ionicons name="person-circle" size={18} color="#0F4D3A" />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{user}</Text>
        <Text style={styles.muted}>
          {action} • {time}
        </Text>
      </View>
    </View>
  );
}

function StoreStatusRow({ name, status, items }: { name: string; status: string; items: string }) {
  const statusColor = status === "Active" ? "#16a34a" : "#ea580c";
  return (
    <View style={styles.listRow}>
      <Ionicons name="storefront" size={18} color="#0F4D3A" />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{name}</Text>
        <Text style={styles.muted}>{items} items</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

function AnalyticsRow({ metric, value, trend }: { metric: string; value: string; trend: "up" | "down" | "stable" }) {
  const trendIcon = trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "remove";
  const trendColor = trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#6B7280";

  return (
    <View style={styles.listRow}>
      <Ionicons name={trendIcon as any} size={18} color={trendColor} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{metric}</Text>
        <Text style={styles.muted}>Current value</Text>
      </View>
      <Text style={[styles.valueText, { color: trendColor }]}>{value}</Text>
    </View>
  );
}

function SecurityEventRow({
  event,
  user,
  time,
  severity,
}: { event: string; user: string; time: string; severity: "low" | "medium" | "high" }) {
  const severityColor = severity === "high" ? "#dc2626" : severity === "medium" ? "#ea580c" : "#16a34a";

  return (
    <View style={styles.listRow}>
      <Ionicons name="shield" size={18} color={severityColor} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{event}</Text>
        <Text style={styles.muted}>
          {user} • {time}
        </Text>
      </View>
      <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
        <Text style={styles.statusText}>{severity.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  header: { fontSize: 22, fontWeight: "800", color: "#0F4D3A" },
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
  notificationButton: { position: "relative", padding: 8, borderRadius: 8, backgroundColor: "#F9FAFB" },
  notificationBadge: { position: "absolute", top: 2, right: 2, backgroundColor: "#dc2626", borderRadius: 10, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
  notificationBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  notificationStatus: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  notificationStatusText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  notificationCount: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#0F4D3A" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  valueText: { fontSize: 14, fontWeight: "700" },
});


