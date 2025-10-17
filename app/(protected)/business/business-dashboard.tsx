"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useAuth } from "../../../context/AuthProvider"
import { mockPackagingItems, mockStores, mockTransactions } from "../../../lib/mock-data"

export default function BusinessDashboard() {
  const { state: authState, actions: authActions } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [showReturnModal, setShowReturnModal] = useState(false)

  // Mock user data for business dashboard
  const user = { name: "Chủ doanh nghiệp", email: "business@example.com" }
  const isStaffUser = user?.email?.includes("staff") || user?.name?.toLowerCase().includes("staff")

  // Mock data for current store (assuming staff belongs to first store)
  const currentStore = mockStores[0]
  const storeItems = mockPackagingItems.filter((item) => item.storeId === currentStore.id)
  const storeTransactions = mockTransactions.filter((t) => t.storeId === currentStore.id)

  // Calculate stats with updated logic
  const totalItems = storeItems.length
  const availableItems = storeItems.filter((item) => item.status === "available").length
  const borrowedItems = storeItems.filter((item) => item.status === "borrowed").length
  const overdueItems = storeItems.filter((item) => item.status === "overdue").length
  const damagedItems = storeItems.filter((item) => item.condition === "damaged").length

  const businessAlerts =
    overdueItems > 0
      ? [
          {
            message: `You have ${overdueItems} items overdue that need attention.`,
          },
        ]
      : []

  const handleNotificationClick = (notification: any) => {
    // Navigate to transactions tab for all business notifications
    setActiveTab("transactions")
  }

  const handleLogout = () => {
    authActions.signOut()
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      <View style={styles.heroHeaderArea}>
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>BACK2USE</Text>
        </View>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingName}>Dashboard</Text>
            <Text style={styles.greetingNice}>Business Management</Text>
          </View>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{user?.name?.charAt(0) || "B"}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && (
          <View style={styles.overview}>
            {businessAlerts.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertGradient}>
                  <View style={styles.alertIconContainer}>
                    <Ionicons name="warning" size={24} color="#FF4444" />
                  </View>
                  <View style={styles.alertTextContainer}>
                    <Text style={styles.alertTitle}>Alert</Text>
                    <Text style={styles.alertMessage}>{businessAlerts[0]?.message}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#E8F5E9" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#C8E6C9" }]}>
                    <Ionicons name="checkmark-circle" size={28} color="#00704A" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#00704A" }]}>{availableItems}</Text>
                  <Text style={styles.kpiLabel}>Available</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#FFF8E1" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#FFE082" }]}>
                    <Ionicons name="people" size={28} color="#F57C00" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#F57C00" }]}>{borrowedItems}</Text>
                  <Text style={styles.kpiLabel}>Borrowed</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#FFEBEE" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#FFCDD2" }]}>
                    <Ionicons name="time" size={28} color="#D32F2F" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#D32F2F" }]}>{overdueItems}</Text>
                  <Text style={styles.kpiLabel}>Overdue</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#F5F5F5" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#E0E0E0" }]}>
                    <Ionicons name="close-circle" size={28} color="#666666" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#666666" }]}>{damagedItems}</Text>
                  <Text style={styles.kpiLabel}>Damaged</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.processButtonContainer}
              onPress={() => setShowReturnModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.processButton}>
                <View style={styles.processButtonIcon}>
                  <Ionicons name="scan" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.processButtonText}>Process Returns</Text>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" style={{ opacity: 0.8 }} />
              </View>
            </TouchableOpacity>

            <View style={styles.quickActionsCard}>
              <View style={styles.quickActionsHeader}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              </View>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.7}>
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Ionicons name="cube" size={32} color="#00704A" />
                    </View>
                    <Text style={styles.quickActionText}>Inventory</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.7}>
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Ionicons name="settings" size={32} color="#00704A" />
                    </View>
                    <Text style={styles.quickActionText}>Pricing</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.7}>
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Ionicons name="bar-chart" size={32} color="#00704A" />
                    </View>
                    <Text style={styles.quickActionText}>Reports</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.7}>
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionIconContainer}>
                      <Ionicons name="card" size={32} color="#00704A" />
                    </View>
                    <Text style={styles.quickActionText}>Subscription</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityTitleRow}>
                  <View style={styles.activityIconBadge}>
                    <Ionicons name="time-outline" size={20} color="#00704A" />
                  </View>
                  <Text style={styles.activityTitle}>Recent Activity</Text>
                </View>
                <Text style={styles.activityDescription}>Latest transactions and inventory changes</Text>
              </View>

              <View style={styles.activityContent}>
                {storeTransactions.slice(0, 5).map((transaction, index) => {
                  const item = mockPackagingItems.find((p) => p.id === transaction.packagingItemId)
                  return (
                    <View
                      key={transaction.id}
                      style={[
                        styles.activityItem,
                        index === storeTransactions.slice(0, 5).length - 1 && styles.activityItemLast,
                      ]}
                    >
                      <View style={styles.activityItemLeft}>
                        <View
                          style={[
                            styles.activityItemIconContainer,
                            transaction.type === "borrow"
                              ? { backgroundColor: "#FFF8E1" }
                              : { backgroundColor: "#E8F5E9" },
                          ]}
                        >
                          {transaction.type === "borrow" ? (
                            <Ionicons name="arrow-up-circle" size={24} color="#F57C00" />
                          ) : (
                            <Ionicons name="arrow-down-circle" size={24} color="#00704A" />
                          )}
                        </View>
                        <View style={styles.activityItemInfo}>
                          <Text style={styles.activityItemTitle}>
                            {transaction.type === "borrow" ? "Item Borrowed" : "Item Returned"}
                          </Text>
                          <Text style={styles.activityItemSubtitle}>
                            {item?.qrCode} •{" "}
                            {new Date(transaction.borrowedAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.activityItemRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            transaction.status === "complete"
                              ? styles.completeBadge
                              : transaction.status === "reject"
                                ? styles.rejectBadge
                                : styles.pendingBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              transaction.status === "complete"
                                ? styles.completeText
                                : transaction.status === "reject"
                                  ? styles.rejectText
                                  : styles.pendingText,
                            ]}
                          >
                            {transaction.status === "complete"
                              ? "Completed"
                              : transaction.status === "reject"
                                ? "Rejected"
                                : "Processing"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          </View>
        )}

        {activeTab === "wallet" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Business Wallet</Text>
            <Text style={styles.tabDescription}>Manage your business finances</Text>
          </View>
        )}

        {activeTab === "inventory" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Inventory Management</Text>
            <Text style={styles.tabDescription}>Manage your store inventory</Text>
          </View>
        )}

        {activeTab === "transactions" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Transaction Processing</Text>
            <Text style={styles.tabDescription}>Process customer transactions</Text>
          </View>
        )}

        {activeTab === "pricing" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Pricing Management</Text>
            <Text style={styles.tabDescription}>Set and manage pricing</Text>
          </View>
        )}

        {activeTab === "reports" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Store Reports</Text>
            <Text style={styles.tabDescription}>View business analytics</Text>
          </View>
        )}

        {activeTab === "settings" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Store Settings</Text>
            <Text style={styles.tabDescription}>Configure store settings</Text>
          </View>
        )}

        {activeTab === "subscription" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Subscription Management</Text>
            <Text style={styles.tabDescription}>Manage your subscription</Text>
          </View>
        )}

        {activeTab === "vouchers" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Voucher Redemption</Text>
            <Text style={styles.tabDescription}>Redeem customer vouchers</Text>
          </View>
        )}

        {!isStaffUser && activeTab === "assistant" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Business AI Assistant</Text>
            <Text style={styles.tabDescription}>
              Get help with inventory management, customer analytics, return processing, and business operations.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  heroHeaderArea: { 
    backgroundColor: '#00704A', 
    paddingHorizontal: 16, 
    paddingTop: 40, 
    paddingBottom: 16 
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  },
  brandTitle: { 
    color: '#fff', 
    fontWeight: '800', 
    letterSpacing: 2, 
    fontSize: 14 
  },
  greetingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  greetingName: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 20 
  },
  greetingNice: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12, 
    marginTop: 2 
  },
  avatarLg: { 
    height: 64, 
    width: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.3)', 
    overflow: 'hidden' 
  },
  avatarLgText: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 18 
  },
  content: {
    flex: 1,
  },
  overview: {
    padding: 20,
    gap: 20,
  },
  alertCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  alertGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFE6E6",
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D32F2F",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: "47%",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  kpiGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  kpiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
    textAlign: "center",
  },
  processButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
    backgroundColor: "#00704A",
  },
  processButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  processButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.3,
  },
  quickActionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionsHeader: {
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    width: "47%",
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionContent: {
    padding: 20,
    alignItems: "center",
    gap: 12,
    minHeight: 100,
    justifyContent: "center",
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00704A",
    textAlign: "center",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  activityHeader: {
    marginBottom: 20,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  activityIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  activityDescription: {
    fontSize: 14,
    color: "#999999",
    marginLeft: 48,
  },
  activityContent: {
    gap: 0,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  activityItemLast: {
    borderBottomWidth: 0,
  },
  activityItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  activityItemSubtitle: {
    fontSize: 13,
    color: "#999999",
  },
  activityItemRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completeBadge: {
    backgroundColor: "#E8F5E9",
  },
  rejectBadge: {
    backgroundColor: "#FFEBEE",
  },
  pendingBadge: {
    backgroundColor: "#FFF8E1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  completeText: {
    color: "#00704A",
  },
  rejectText: {
    color: "#D32F2F",
  },
  pendingText: {
    color: "#F57C00",
  },
  tabContent: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  tabDescription: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
})