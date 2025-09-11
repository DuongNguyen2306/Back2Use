import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "returns" | "analytics">("overview");

  const stats = {
    ordersToday: 12,
    scansToday: 34,
    inventoryItems: 128,
    pendingReturns: 8,
    monthlyRevenue: 2450,
    returnRate: 92.5,
    lowStockItems: 5,
    customerSatisfaction: 4.8,
  };

  const handleInventoryAction = (action: string) => {
    Alert.alert("Inventory Action", `${action} selected`);
  };

  const handleReturnAction = (returnId: string) => {
    Alert.alert("Return Processing", `Processing return ${returnId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Business Dashboard</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert("Notifications", "No new notifications") }>
          <Ionicons name="notifications" size={20} color="#0F4D3A" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.activeTab]}
          onPress={() => setActiveTab("overview")}
        >
          <Ionicons name="home" size={16} color={activeTab === "overview" ? "#fff" : "#0F4D3A"} />
          <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "inventory" && styles.activeTab]}
          onPress={() => setActiveTab("inventory")}
        >
          <Ionicons name="cube" size={16} color={activeTab === "inventory" ? "#fff" : "#0F4D3A"} />
          <Text style={[styles.tabText, activeTab === "inventory" && styles.activeTabText]}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "returns" && styles.activeTab]}
          onPress={() => setActiveTab("returns")}
        >
          <Ionicons name="return-up-back" size={16} color={activeTab === "returns" ? "#fff" : "#0F4D3A"} />
          <Text style={[styles.tabText, activeTab === "returns" && styles.activeTabText]}>Returns</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "analytics" && styles.activeTab]}
          onPress={() => setActiveTab("analytics")}
        >
          <Ionicons name="bar-chart" size={16} color={activeTab === "analytics" ? "#fff" : "#0F4D3A"} />
          <Text style={[styles.tabText, activeTab === "analytics" && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {activeTab === "overview" && (
          <View style={{ gap: 12 }}>
            <View style={styles.cardRow}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Orders Today</Text>
                <Text style={styles.cardValue}>{stats.ordersToday}</Text>
                <View style={styles.trendRow}>
                  <Ionicons name="trending-up" size={12} color="#16a34a" />
                  <Text style={styles.trendText}>+15% from yesterday</Text>
                </View>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>QR Scans</Text>
                <Text style={styles.cardValue}>{stats.scansToday}</Text>
                <View style={styles.trendRow}>
                  <Ionicons name="trending-up" size={12} color="#16a34a" />
                  <Text style={styles.trendText}>+8% from yesterday</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardRow}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Inventory Items</Text>
                <Text style={styles.cardValue}>{stats.inventoryItems}</Text>
                <View style={styles.trendRow}>
                  <Ionicons name="warning" size={12} color="#ea580c" />
                  <Text style={styles.trendText}>{stats.lowStockItems} low stock</Text>
                </View>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pending Returns</Text>
                <Text style={styles.cardValue}>{stats.pendingReturns}</Text>
                <View style={styles.trendRow}>
                  <Ionicons name="time" size={12} color="#0F4D3A" />
                  <Text style={styles.trendText}>Process today</Text>
                </View>
              </View>
            </View>

            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleInventoryAction("Add Item")}>
                  <Ionicons name="add-circle" size={24} color="#0F4D3A" />
                  <Text style={styles.actionText}>Add Item</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleInventoryAction("Scan QR")}>
                  <Ionicons name="qr-code" size={24} color="#0F4D3A" />
                  <Text style={styles.actionText}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleReturnAction("process")}>
                  <Ionicons name="checkmark-circle" size={24} color="#0F4D3A" />
                  <Text style={styles.actionText}>Process Returns</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleInventoryAction("View Reports")}>
                  <Ionicons name="document-text" size={24} color="#0F4D3A" />
                  <Text style={styles.actionText}>View Reports</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === "inventory" && (
          <View style={{ gap: 12 }}>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Inventory Status</Text>
              <InventoryItem name="Reusable Containers" stock={45} lowStock={10} />
              <InventoryItem name="Glass Bottles" stock={23} lowStock={15} />
              <InventoryItem name="Food Containers" stock={8} lowStock={20} />
              <InventoryItem name="Shopping Bags" stock={67} lowStock={25} />
            </View>

            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Inventory Actions</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => handleInventoryAction("Restock")}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>Restock Items</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => handleInventoryAction("Audit")}>
                  <Ionicons name="clipboard" size={16} color="#0F4D3A" />
                  <Text style={styles.secondaryButtonText}>Audit Inventory</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === "returns" && (
          <View style={{ gap: 12 }}>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Pending Returns</Text>
              <ReturnItem id="R001" customer="John Doe" items="3 containers" time="2 hours ago" />
              <ReturnItem id="R002" customer="Jane Smith" items="1 bottle" time="4 hours ago" />
              <ReturnItem id="R003" customer="Mike Johnson" items="2 bags" time="6 hours ago" />
            </View>

            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Return Statistics</Text>
              <View style={styles.cardRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.returnRate}%</Text>
                  <Text style={styles.statLabel}>Return Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>2.3</Text>
                  <Text style={styles.statLabel}>Avg Days</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>156</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "analytics" && (
          <View style={{ gap: 12 }}>
            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Business Performance</Text>
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Monthly Revenue</Text>
                  <Text style={styles.cardValue}>${stats.monthlyRevenue}</Text>
                </View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Customer Rating</Text>
                  <Text style={styles.cardValue}>{stats.customerSatisfaction}★</Text>
                </View>
              </View>
            </View>

            <View style={styles.fullCard}>
              <Text style={styles.cardTitle}>Usage Trends</Text>
              <TrendItem metric="Daily Borrows" value="34" change="+12%" positive={true} />
              <TrendItem metric="Return Time" value="2.1 days" change="-0.3 days" positive={true} />
              <TrendItem metric="Customer Retention" value="87%" change="+5%" positive={true} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InventoryItem({ name, stock, lowStock }: { name: string; stock: number; lowStock: number }) {
  const isLowStock = stock <= lowStock;
  return (
    <View style={styles.listRow}>
      <Ionicons name="cube" size={18} color={isLowStock ? "#ea580c" : "#0F4D3A"} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{name}</Text>
        <Text style={styles.listSubtitle}>Stock: {stock} units</Text>
      </View>
      {isLowStock && (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>LOW</Text>
        </View>
      )}
    </View>
  );
}

function ReturnItem({ id, customer, items, time }: { id: string; customer: string; items: string; time: string }) {
  return (
    <View style={styles.listRow}>
      <Ionicons name="return-up-back" size={18} color="#0F4D3A" />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>
          {id} - {customer}
        </Text>
        <Text style={styles.listSubtitle}>
          {items} • {time}
        </Text>
      </View>
      <TouchableOpacity style={styles.processButton}>
        <Text style={styles.processButtonText}>Process</Text>
      </TouchableOpacity>
    </View>
  );
}

function TrendItem({
  metric,
  value,
  change,
  positive,
}: { metric: string; value: string; change: string; positive: boolean }) {
  return (
    <View style={styles.listRow}>
      <Ionicons name={positive ? "trending-up" : "trending-down"} size={18} color={positive ? "#16a34a" : "#dc2626"} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.listTitle}>{metric}</Text>
        <Text style={styles.listSubtitle}>Current: {value}</Text>
      </View>
      <Text style={[styles.changeText, { color: positive ? "#16a34a" : "#dc2626" }]}>{change}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  header: { fontSize: 22, fontWeight: "800", color: "#0F4D3A" },
  notificationButton: { padding: 8, borderRadius: 8, backgroundColor: "#F9FAFB" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  activeTab: { backgroundColor: "#0F4D3A", borderColor: "#0F4D3A" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#0F4D3A" },
  activeTabText: { color: "#fff" },
  cardRow: { flexDirection: "row", gap: 12 },
  card: { flex: 1, padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, backgroundColor: "#F9FAFB" },
  fullCard: { padding: 16, borderRadius: 12, borderColor: "#E5E7EB", borderWidth: 1, backgroundColor: "#fff" },
  cardTitle: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },
  cardValue: { fontSize: 20, color: "#111827", fontWeight: "700" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  trendText: { fontSize: 11, color: "#6B7280" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#0F4D3A", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#0F4D3A",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0F4D3A",
    backgroundColor: "#fff",
  },
  secondaryButtonText: { color: "#0F4D3A", fontWeight: "600", fontSize: 14 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  listSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  warningBadge: { backgroundColor: "#ea580c", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  warningText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  processButton: { backgroundColor: "#0F4D3A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  processButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: "600" },
});


