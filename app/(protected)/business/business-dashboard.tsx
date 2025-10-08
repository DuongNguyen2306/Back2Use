"use client"

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../context/AuthProvider";
import { mockPackagingItems, mockStores, mockTransactions } from "../../../lib/mock-data";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export default function BusinessDashboard() {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showReturnModal, setShowReturnModal] = useState(false);

  const currentStore = mockStores[0]
  const storeItems = mockPackagingItems.filter((item: any) => item.storeId === currentStore.id)
  const storeTransactions = mockTransactions.filter((t: any) => t.storeId === currentStore.id)

  const totalItems = storeItems.length
  const availableItems = storeItems.filter((item: any) => item.status === "available").length
  const borrowedItems = storeItems.filter((item: any) => item.status === "borrowed").length
  const overdueItems = storeItems.filter((item: any) => item.status === "overdue").length

  const bottomNavItems = [
    { id: "overview", label: "Tổng quan", icon: "home" },
    { id: "wallet", label: "Ví", icon: "wallet" },
    { id: "inventory", label: "Kho", icon: "cube" },
    { id: "transactions", label: "Giao dịch", icon: "qr-code" },
    { id: "more", label: "Thêm", icon: "settings" },
  ]

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#009900" barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {"B"}
              </Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Xin chào, Business</Text>
              <Text style={styles.headerSubtitle}>{currentStore.name}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {activeTab === "overview" && (
          <>
            {/* Wallet Card */}
            <View style={styles.walletCard}>
              <View style={styles.walletContent}>
                <View style={styles.walletHeader}>
                  <View>
                    <Text style={styles.walletLabel}>Số dư ví</Text>
                    <Text style={styles.walletAmount}>$0.00</Text>
                  </View>
                  <Ionicons name="wallet" size={40} color="rgba(255,255,255,0.8)" />
                </View>
                <View style={styles.walletActions}>
                  <TouchableOpacity style={styles.walletButton}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.walletButtonText}>Nạp tiền</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.walletButton}>
                    <Ionicons name="cash" size={16} color="#FFFFFF" />
                    <Text style={styles.walletButtonText}>Rút tiền</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.availableCard]}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statNumber}>{availableItems}</Text>
                    <Text style={styles.statLabel}>Có sẵn</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </View>

              <View style={[styles.statCard, styles.borrowedCard]}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statNumber}>{borrowedItems}</Text>
                    <Text style={styles.statLabel}>Đang mượn</Text>
                  </View>
                  <Ionicons name="people" size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </View>

              <View style={[styles.statCard, styles.overdueCard]}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statNumber}>{overdueItems}</Text>
                    <Text style={styles.statLabel}>Quá hạn</Text>
                  </View>
                  <Ionicons name="warning" size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </View>

              <View style={[styles.statCard, styles.totalCard]}>
                <View style={styles.statContent}>
                  <View>
                    <Text style={styles.statNumber}>{totalItems}</Text>
                    <Text style={styles.statLabel}>Tổng số</Text>
                  </View>
                  <Ionicons name="cube" size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.quickActionsTitle}>Thao tác nhanh</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity 
                  style={[styles.quickActionButton, styles.scanButton]}
                  onPress={() => setShowReturnModal(true)}
                >
                  <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Quét QR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, styles.addButton]}
                  onPress={() => setActiveTab("inventory")}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Thêm mới</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, styles.reportButton]}
                  onPress={() => setActiveTab("transactions")}
                >
                  <Ionicons name="bar-chart" size={24} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Báo cáo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.recentActivityCard}>
              <Text style={styles.recentActivityTitle}>Hoạt động gần đây</Text>
              <View style={styles.activityList}>
                {storeTransactions.slice(0, 5).map((transaction: any) => {
                  const item = mockPackagingItems.find((p: any) => p.id === transaction.packagingItemId)
                  return (
                    <View key={transaction.id} style={styles.activityItem}>
                      <View style={[
                        styles.activityIcon,
                        transaction.type === "borrow" ? styles.borrowIcon : styles.returnIcon
                      ]}>
                        <Ionicons 
                          name={transaction.type === "borrow" ? "cube" : "checkmark-circle"} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>
                          {transaction.type === "borrow" ? "Đã mượn" : "Đã trả"}
                        </Text>
                        <Text style={styles.activitySubtitle}>{item?.qrCode}</Text>
                      </View>
                      <View style={[
                        styles.activityBadge,
                        transaction.status === "completed" ? styles.completedBadge : styles.pendingBadge
                      ]}>
                        <Text style={styles.activityBadgeText}>{transaction.status}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {/* Other tabs content */}
        {activeTab === "wallet" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Ví</Text>
            <Text style={styles.tabSubtitle}>Chức năng ví sẽ được thêm sau</Text>
          </View>
        )}

        {activeTab === "inventory" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Kho</Text>
            <Text style={styles.tabSubtitle}>Quản lý kho sẽ được thêm sau</Text>
          </View>
        )}

        {activeTab === "transactions" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Giao dịch</Text>
            <Text style={styles.tabSubtitle}>Xử lý giao dịch sẽ được thêm sau</Text>
          </View>
        )}

        {activeTab === "more" && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Thêm</Text>
            <Text style={styles.tabSubtitle}>Các chức năng khác sẽ được thêm sau</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomNavItem}
              onPress={() => setActiveTab(item.id)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={isActive ? "#009900" : "#666"} 
              />
              <Text style={[
                styles.bottomNavLabel,
                isActive && styles.bottomNavLabelActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#009900',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  notificationButton: {
    padding: 8,
  },
  walletCard: {
    margin: 20,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletContent: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  walletButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  walletButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 52) / 2,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  availableCard: {
    backgroundColor: '#10B981',
  },
  borrowedCard: {
    backgroundColor: '#F59E0B',
  },
  overdueCard: {
    backgroundColor: '#EF4444',
  },
  totalCard: {
    backgroundColor: '#8B5CF6',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  quickActionsCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
  },
  addButton: {
    backgroundColor: '#10B981',
  },
  reportButton: {
    backgroundColor: '#8B5CF6',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  recentActivityCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  borrowIcon: {
    backgroundColor: '#F59E0B',
  },
  returnIcon: {
    backgroundColor: '#10B981',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  tabContent: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomNavLabelActive: {
    color: '#009900',
    fontWeight: '600',
  },
})