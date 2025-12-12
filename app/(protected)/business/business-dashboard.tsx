"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import BusinessWelcomeModal from "../../../components/BusinessWelcomeModal"
import NotificationBadge from "../../../components/NotificationBadge"
import { useAuth } from "../../../context/AuthProvider"
import { borrowTransactionsApi } from "../../../src/services/api/borrowTransactionService"
import { businessesApi, productsApi } from "../../../src/services/api/businessService"
import { BusinessProfile } from "../../../src/types/business.types"

const STORAGE_KEYS = {
  BUSINESS_WELCOME_SHOWN: 'BUSINESS_WELCOME_SHOWN',
};

export default function BusinessDashboard() {
  const { state: authState, actions: authActions } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState({
    availableItems: 0,
    borrowedItems: 0,
    overdueItems: 0,
    damagedItems: 0,
  })

  // Load business profile data
  useEffect(() => {
    const loadBusinessData = async () => {
      // Staff doesn't need business profile
      if (authState.role === 'staff' as any) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔍 Loading business profile...');
        const profileResponse = await businessesApi.getProfileWithAutoRefresh();
        console.log('✅ Business profile loaded:', profileResponse);
        
        if (profileResponse.data && profileResponse.data.business) {
          setBusinessProfile(profileResponse.data.business);
        }
      } catch (error: any) {
        // Silently handle 403 errors (staff trying to access business profile)
        if (error?.response?.status === 403) {
          console.log('⚠️ Staff role cannot access business profile API');
        } else if (error?.response?.status && error.response.status >= 500) {
          console.error('❌ Error loading business profile:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadBusinessData()
  }, [authState.role])

  // Check for welcome modal on mount (only show once)
  useEffect(() => {
    const checkWelcomeModal = async () => {
      try {
        // Check if welcome modal was set by useBusinessRoleCheck
        // If not, check if this is first time user enters business dashboard
        const welcomeShown = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_WELCOME_SHOWN);
        
        // Only show if not shown before and user is business
        if (!welcomeShown && authState.role === 'business') {
          // Small delay for smooth UI transition
          const timeout = setTimeout(() => {
            setShowWelcomeModal(true);
            AsyncStorage.setItem(STORAGE_KEYS.BUSINESS_WELCOME_SHOWN, 'true');
          }, 800);
          
          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Error checking welcome modal:', error);
      }
    };

    // Only check after loading is complete
    if (!loading && authState.role === 'business') {
      checkWelcomeModal();
    }
  }, [authState.role, loading])

  // Load real transactions and products data
  useEffect(() => {
    const loadRealData = async () => {
      if (!authState.isHydrated || !authState.accessToken || !authState.isAuthenticated) {
        return;
      }

      if (authState.role !== 'business' && authState.role !== 'staff') {
        return;
      }

      try {
        // Load transactions
        console.log('📊 Loading business transactions...');
        const transactionsResponse = await borrowTransactionsApi.getBusinessHistory({
          page: 1,
          limit: 100,
        });

        if (transactionsResponse.statusCode === 200) {
          const items = transactionsResponse.data?.items || transactionsResponse.data || [];
          
          // Sort transactions by most recent first (using updatedAt or createdAt)
          const sortedItems = items.sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA; // Most recent first
          });
          
          setTransactions(sortedItems);
          console.log('✅ Loaded transactions:', sortedItems.length);

          // Calculate overdue items from transactions
          const overdue = items.filter((t: any) => {
            if (t.status !== 'borrowing') return false;
            if (!t.expectedReturnDate) return false;
            return new Date(t.expectedReturnDate) < new Date();
          }).length;

          // Calculate borrowed items
          const borrowed = items.filter((t: any) => t.status === 'borrowing').length;

          setStats(prev => ({
            ...prev,
            overdueItems: overdue,
            borrowedItems: borrowed,
          }));
        }

        // Load products from all product groups
        if (businessProfile && businessProfile.productGroups && businessProfile.productGroups.length > 0) {
          console.log('📦 Loading products from product groups...');
          const allProducts: any[] = [];
          
          for (const group of businessProfile.productGroups) {
            try {
              const productsResponse = await productsApi.getAll(group._id, {
                page: 1,
                limit: 1000,
              });
              
              if (productsResponse.data?.items) {
                allProducts.push(...productsResponse.data.items);
              } else if (Array.isArray(productsResponse.data)) {
                allProducts.push(...productsResponse.data);
              }
            } catch (error) {
              console.error(`Error loading products for group ${group._id}:`, error);
            }
          }

          setProducts(allProducts);
          console.log('✅ Loaded products:', allProducts.length);

          // Calculate stats from products
          const available = allProducts.filter((p: any) => p.status === 'available').length;
          const damaged = allProducts.filter((p: any) => p.condition === 'damaged' || p.status === 'damaged').length;

          setStats(prev => ({
            ...prev,
            availableItems: available,
            damagedItems: damaged,
          }));
        }
      } catch (error: any) {
        // Silently handle Unauthorized errors
        if (error?.response?.status === 401 || 
            error?.message?.toLowerCase().includes('unauthorized')) {
          // Silently handle - don't show error to user
          console.log('⚠️ Unauthorized error loading data (silently handled)');
          return;
        }
        console.error('❌ Error loading real data:', error);
        // Silently fail - will show default values
      }
    };

    // For staff, load data immediately after loading is complete
    // For business, wait for businessProfile to be loaded
    if (!loading) {
      if (authState.role === 'staff' as any) {
        // Staff doesn't need businessProfile, load transactions directly
        loadRealData();
      } else if (businessProfile) {
        // Business needs businessProfile to load products
        loadRealData();
      }
    }
  }, [authState.isHydrated, authState.accessToken, authState.isAuthenticated, authState.role, loading, businessProfile]);
  
  // Get business name from profile
  const businessName = businessProfile?.businessName || "Business Owner";
  const businessOwnerName = businessProfile?.userId?.username || businessProfile?.userId?.email || "Business Owner";
  
  // Get greeting based on role
  const greeting = authState.role === 'staff' as any 
    ? "Hello Staff" 
    : `Hello, ${businessOwnerName || "Business Owner"}!`;
  
  // Build subtitle with rating if available
  let subtitle: string | null = null;
  if (authState.role === 'staff' as any) {
    subtitle = "Staff Dashboard";
  } else if (businessProfile) {
    if (businessProfile.averageRating && authState.role !== 'staff' as any) {
      const rating = businessProfile.averageRating.toFixed(1);
      const reviews = businessProfile.totalReviews || 0;
      subtitle = `${businessName} ⭐ ${rating} (${reviews} reviews)`;
    } else {
      subtitle = `${businessName} - Business Management`;
    }
  } else {
    subtitle = "Business Management";
  }
  
  // Ensure all string values are defined
  const safeGreeting = greeting || "Hello";
  const safeSubtitle = subtitle || "Business Management";

  const businessAlerts =
    stats.overdueItems > 0
      ? [
          {
            message: `You have ${String(stats.overdueItems || 0)} items overdue that need attention.`,
          },
        ]
      : []

  const handleNotificationClick = (notification: any) => {
    // Navigate to transactions tab for all business notifications
    setActiveTab("transactions")
  }

  const handleLogout = async () => {
    try {
      await authActions.logout();
      router.replace('/welcome');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/welcome');
    }
  }

  return (
    <View style={styles.container}>
      {/* Welcome Modal */}
      <BusinessWelcomeModal
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
      
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{loading ? "Loading..." : safeGreeting}</Text>
            {safeSubtitle ? (
              <Text style={styles.headerSubtitle}>{safeSubtitle}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <NotificationBadge />
            {businessProfile && (
              <TouchableOpacity 
                style={styles.avatarButton}
                onPress={() => router.push('/(protected)/business/menu')}
              >
                {businessProfile.businessLogoUrl ? (
                  <Image source={{ uri: businessProfile.businessLogoUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {((businessProfile.userId?.username || businessProfile.userId?.email || 'U').charAt(0).toUpperCase())}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

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
                    <Text style={styles.alertMessage}>{businessAlerts[0]?.message || ''}</Text>
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
                  <Text style={[styles.kpiValue, { color: "#00704A" }]}>{String(stats.availableItems ?? 0)}</Text>
                  <Text style={styles.kpiLabel}>Available</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#FFF8E1" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#FFE082" }]}>
                    <Ionicons name="people" size={28} color="#F57C00" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#F57C00" }]}>{String(stats.borrowedItems ?? 0)}</Text>
                  <Text style={styles.kpiLabel}>Borrowed</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#FFEBEE" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#FFCDD2" }]}>
                    <Ionicons name="time" size={28} color="#D32F2F" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#D32F2F" }]}>{String(stats.overdueItems ?? 0)}</Text>
                  <Text style={styles.kpiLabel}>Overdue</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiGradient, { backgroundColor: "#F5F5F5" }]}>
                  <View style={[styles.kpiIconContainer, { backgroundColor: "#E0E0E0" }]}>
                    <Ionicons name="close-circle" size={28} color="#666666" />
                  </View>
                  <Text style={[styles.kpiValue, { color: "#666666" }]}>{String(stats.damagedItems ?? 0)}</Text>
                  <Text style={styles.kpiLabel}>Damaged</Text>
                </View>
              </View>
            </View>

            {/* Eco Impact Card */}
            {businessProfile && (businessProfile.co2Reduced || businessProfile.ecoPoints) && authState.role !== 'staff' as any && (
              <View style={styles.ecoImpactCard}>
                <View style={styles.ecoImpactHeader}>
                  <View style={styles.ecoImpactIconContainer}>
                    <Ionicons name="leaf" size={28} color="#10B981" />
                  </View>
                  <Text style={styles.ecoImpactTitle}>Green Impact & Achievements</Text>
                </View>
                <View style={styles.ecoImpactStats}>
                  <View style={styles.ecoImpactStat}>
                    <Ionicons name="earth" size={20} color="#059669" />
                    <View style={styles.ecoImpactStatContent}>
                      <Text style={styles.ecoImpactValue}>
                        {businessProfile.co2Reduced ? String(businessProfile.co2Reduced.toFixed(2)) : '0.00'} kg
                      </Text>
                      <Text style={styles.ecoImpactLabel}>CO₂ Reduced</Text>
                    </View>
                  </View>
                  <View style={styles.ecoImpactStat}>
                    <Ionicons name="trophy" size={20} color="#059669" />
                    <View style={styles.ecoImpactStatContent}>
                      <Text style={styles.ecoImpactValue}>
                        {businessProfile.ecoPoints ? String(Math.round(businessProfile.ecoPoints)) : '0'}
                      </Text>
                      <Text style={styles.ecoImpactLabel}>Eco Points</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Actions for Business Owner */}
            {authState.role !== 'staff' as any && (
              <View style={styles.quickActionsCard}>
                <View style={styles.quickActionsHeader}>
                  <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                </View>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push('/(protected)/business/materials')}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name="cube" size={32} color="#00704A" />
                      </View>
                      <Text style={styles.quickActionText}>Inventory</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push('/(protected)/business/vouchers')}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name="ticket" size={32} color="#00704A" />
                      </View>
                      <Text style={styles.quickActionText}>Vouchers</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push('/(protected)/business/transaction-processing')}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name="receipt" size={32} color="#00704A" />
                      </View>
                      <Text style={styles.quickActionText}>Transactions</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push('/(protected)/business/menu')}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name="card" size={32} color="#00704A" />
                      </View>
                      <Text style={styles.quickActionText}>Subscription</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Staff Quick Actions - Voucher Scanner */}
            {authState.role === 'staff' as any && (
              <View style={styles.quickActionsCard}>
                <View style={styles.quickActionsHeader}>
                  <Text style={styles.quickActionsTitle}>Staff Actions</Text>
                </View>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push('/(protected)/business/voucher-scan')}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name="qr-code-outline" size={32} color="#00704A" />
                      </View>
                      <Text style={styles.quickActionText}>Quét Voucher</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickActionButton} 
                    activeOpacity={0.7}
                    onPress={() => router.push('/(protected)/business/transaction-processing')}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={styles.quickActionIconContainer}>
                        <Ionicons name="receipt-outline" size={32} color="#00704A" />
                      </View>
                      <Text style={styles.quickActionText}>Xử lý Trả hàng</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                {transactions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No recent transactions</Text>
                  </View>
                ) : (
                  transactions.slice(0, 5).map((transaction: any, index: number) => {
                    // Determine if it's a borrow or return transaction
                    const isBorrow = transaction.borrowTransactionType === 'borrow';
                    
                    // Get product name from nested structure (same as transaction-processing)
                    const productName = transaction.productId?.productGroupId?.name || 'Unknown Product';
                    
                    // Get customer name (same as transaction-processing)
                    const customerName = typeof transaction.customerId === 'object' && transaction.customerId?.fullName
                      ? transaction.customerId.fullName 
                      : 'Unknown Customer';
                    
                    // Calculate overdue info (same logic as transaction-processing)
                    const calculateOverdueInfo = (t: any) => {
                      if (t.borrowTransactionType !== 'borrow' || t.status !== 'borrowing' || !t.expectedReturnDate) {
                        return null;
                      }
                      const now = new Date();
                      const expectedReturn = new Date(t.expectedReturnDate);
                      const overdueDays = Math.max(0, Math.floor((now.getTime() - expectedReturn.getTime()) / (1000 * 60 * 60 * 24)));
                      return overdueDays > 0 ? { overdueDays } : null;
                    };
                    
                    // Categorize return transaction (same logic as transaction-processing)
                    const categorizeReturnTransaction = (t: any) => {
                      if (t.borrowTransactionType !== 'return') return null;
                      if (t.status === 'failed' || t.status === 'cancelled') {
                        return 'failed-other';
                      }
                      if (t.returnedAt) {
                        return 'success';
                      }
                      return null;
                    };
                    
                    // Get transaction status (same logic as transaction-processing)
                    const getTransactionStatus = () => {
                      if (transaction.borrowTransactionType === 'borrow') {
                        if (transaction.status === 'borrowing') {
                          const overdueInfo = calculateOverdueInfo(transaction);
                          if (overdueInfo && overdueInfo.overdueDays > 0) {
                            return { text: 'Overdue', color: '#EF4444', bgColor: '#FEE2E2' };
                          }
                          return { text: 'Borrowing', color: '#F59E0B', bgColor: '#FEF3C7' };
                        }
                        if (transaction.status === 'completed') {
                          return { text: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
                        }
                        if (transaction.status === 'cancelled' || transaction.status === 'rejected') {
                          return { text: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2' };
                        }
                      } else {
                        // Return transaction
                        const returnCategory = categorizeReturnTransaction(transaction);
                        if (returnCategory === 'success') {
                          return { text: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
                        } else if (returnCategory === 'failed-other') {
                          return { text: 'Failed', color: '#EF4444', bgColor: '#FEE2E2' };
                        } else {
                          // If returnedAt exists but returnCategory is null, still consider it successful
                          if (transaction.returnedAt) {
                            return { text: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
                          }
                          // If no returnedAt and status is unclear, show original status
                          return { text: transaction.status || 'Processing', color: '#6B7280', bgColor: '#F3F4F6' };
                        }
                      }
                      return { text: transaction.status || 'Processing', color: '#6B7280', bgColor: '#F3F4F6' };
                    };
                    
                    const status = getTransactionStatus();
                    
                    // Get transaction date - use returnedAt for return transactions, otherwise borrowDate
                    const transactionDate = transaction.returnedAt 
                      ? new Date(transaction.returnedAt) 
                      : (transaction.borrowDate ? new Date(transaction.borrowDate) : new Date());
                    
                    // Ensure transactionDate is valid
                    const safeTransactionDate = transactionDate && !isNaN(transactionDate.getTime()) 
                      ? transactionDate 
                      : new Date();
                    
                    return (
                      <TouchableOpacity
                        key={transaction._id || transaction.id || index}
                        style={[
                          styles.activityItem,
                          index === Math.min(transactions.length, 5) - 1 && styles.activityItemLast,
                        ]}
                        onPress={() => {
                          // Navigate to transaction processing screen with transaction ID
                          router.push({
                            pathname: '/(protected)/business/transaction-processing',
                            params: { transactionId: transaction._id || transaction.id }
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.activityItemLeft}>
                          <View
                            style={[
                              styles.activityItemIconContainer,
                              isBorrow
                                ? { backgroundColor: "#FFF8E1" }
                                : { backgroundColor: "#E8F5E9" },
                            ]}
                          >
                            {isBorrow ? (
                              <Ionicons name="arrow-down" size={20} color="#F59E0B" />
                            ) : (
                              <Ionicons name="arrow-up" size={20} color="#10B981" />
                            )}
                          </View>
                          <View style={styles.activityItemInfo}>
                            <Text style={styles.activityItemTitle}>
                              {String(productName || 'Unknown Product')}
                            </Text>
                            <Text style={styles.activityItemSubtitle}>
                              Borrower: {String(customerName || 'Unknown Customer')}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.activityItemRight}>
                          <Text style={styles.activityItemDate}>
                            {String(safeTransactionDate.toLocaleDateString('en-US'))}
                          </Text>
                          {status && status.text ? (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: status.bgColor || '#F3F4F6' }
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: status.color || '#6B7280' }
                                ]}
                              >
                                {String(status.text)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )
                  })
                )}
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

        {activeTab === "assistant" && (
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
  // Header Styles (Simple like Customer Wallet)
  headerSafeArea: {
    backgroundColor: '#00704A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#00704A',
    borderBottomLeftRadius: 20,
    minHeight: 80,
  },
  headerLeft: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00704A',
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
  activityItemDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
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
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  // Eco Impact Card
  ecoImpactCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ecoImpactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  ecoImpactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoImpactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    flex: 1,
  },
  ecoImpactStats: {
    flexDirection: 'row',
    gap: 16,
  },
  ecoImpactStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  ecoImpactStatContent: {
    flex: 1,
  },
  ecoImpactValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  ecoImpactLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
})