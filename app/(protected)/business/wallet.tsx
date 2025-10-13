"use client"

import { Ionicons } from "@expo/vector-icons"
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const { width: screenWidth } = Dimensions.get('window')

export default function BusinessWalletPage() {
  console.log("BusinessWalletPage rendered")
  
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#009900" barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ví của tôi</Text>
            <TouchableOpacity style={styles.addFundsButton}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addFundsText}>Nạp tiền</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Text style={styles.balanceAmount}>$1,250.50</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="arrow-down" size={16} color="#10B981" />
                </View>
                <Text style={styles.statValue}>$1,247</Text>
                <Text style={styles.statLabel}>Tiền gửi</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="arrow-up" size={16} color="#EF4444" />
                </View>
                <Text style={styles.statValue}>$892</Text>
                <Text style={styles.statLabel}>Hoàn trả</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up" size={16} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>$355</Text>
                <Text style={styles.statLabel}>Lợi nhuận</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickActionButton, styles.addFundsAction]}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionButton, styles.withdrawAction]}>
              <Ionicons name="remove" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentMethodsCard}>
            <View style={styles.paymentMethodsHeader}>
              <Text style={styles.paymentMethodsTitle}>Phương thức thanh toán</Text>
            </View>
            <View style={styles.paymentMethodsContent}>
              <View style={styles.paymentMethodItem}>
                <View style={styles.paymentMethodInfo}>
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name="wallet" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.paymentMethodName}>Chase Bank ****1234</Text>
                    <Text style={styles.paymentMethodType}>BANK ACCOUNT</Text>
                  </View>
                </View>
                <View style={styles.paymentMethodActions}>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Mặc định</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </View>
            </View>
          </View>

          {/* Transactions */}
          <View style={styles.transactionsCard}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>Giao dịch gần đây</Text>
            </View>
            <View style={styles.transactionsContent}>
              {/* Tab Selector */}
              <View style={styles.tabSelector}>
                <TouchableOpacity style={[styles.tabButton, styles.activeTabButton]}>
                  <Text style={[styles.tabButtonText, styles.activeTabButtonText]}>
                    Nạp/Rút
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton}>
                  <Text style={styles.tabButtonText}>
                    Nhận/Trả
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Transactions List */}
              <View style={styles.transactionsList}>
                <View style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <View style={[styles.transactionIcon, styles.addFundsIcon]}>
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.transactionDescription}>Added funds to wallet</Text>
                      <Text style={styles.transactionDate}>1/15/2024</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, styles.positiveAmount]}>
                    +$500.00
                  </Text>
                </View>
                
                <View style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <View style={[styles.transactionIcon, styles.withdrawIcon]}>
                      <Ionicons name="remove" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.transactionDescription}>Withdrew funds</Text>
                      <Text style={styles.transactionDate}>1/14/2024</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, styles.negativeAmount]}>
                    -$200.00
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFundsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addFundsAction: {
    backgroundColor: '#10B981',
  },
  withdrawAction: {
    backgroundColor: '#F59E0B',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  paymentMethodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodsHeader: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  paymentMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentMethodsContent: {
    padding: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  paymentMethodType: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionsHeader: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionsContent: {
    padding: 0,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  transactionsList: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addFundsIcon: {
    backgroundColor: '#10B981',
  },
  withdrawIcon: {
    backgroundColor: '#EF4444',
  },
  receiveIcon: {
    backgroundColor: '#3B82F6',
  },
  returnIcon: {
    backgroundColor: '#F59E0B',
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
})