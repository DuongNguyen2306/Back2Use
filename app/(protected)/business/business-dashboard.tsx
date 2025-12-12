"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import BusinessWelcomeModal from "../../../components/BusinessWelcomeModal"
import NotificationBadge from "../../../components/NotificationBadge"
import ProgressBar from "../../../components/charts/ProgressBar"
import SimpleBarChart from "../../../components/charts/SimpleBarChart"
import SimpleLineChart from "../../../components/charts/SimpleLineChart"
import { useAuth } from "../../../context/AuthProvider"
import { borrowTransactionsApi } from "../../../src/services/api/borrowTransactionService"
import { businessesApi, productsApi } from "../../../src/services/api/businessService"
import { walletTransactionsApi } from "../../../src/services/api/walletService"
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
  
  // Analytics data states
  const [overviewData, setOverviewData] = useState<any>(null)
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([])
  const [monthlyTotals, setMonthlyTotals] = useState<any>(null) // Store totals from monthly API
  const [topBorrowedItems, setTopBorrowedItems] = useState<any[]>([])
  const [walletMonthlyData, setWalletMonthlyData] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  
  // Staff overview data (simple stats only)
  const [staffOverviewData, setStaffOverviewData] = useState<any>(null)
  const [staffTopBorrowedItems, setStaffTopBorrowedItems] = useState<any[]>([])

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

  // Load staff overview data (simple stats only)
  useEffect(() => {
    const loadStaffOverview = async () => {
      if (!authState.isAuthenticated || authState.role !== 'staff' as any) {
        return;
      }

      try {
        const overviewResponse = await businessesApi.getOverview();
        console.log('📊 Staff Overview API response:', JSON.stringify(overviewResponse, null, 2));
        if (overviewResponse?.statusCode === 200 && overviewResponse?.data) {
          setStaffOverviewData(overviewResponse.data);
        } else if (overviewResponse?.data) {
          setStaffOverviewData(overviewResponse.data);
        }
      } catch (error) {
        console.log('⚠️ Staff Overview API not available:', error);
      }

      // Load top borrowed items for staff
      try {
        const topBorrowedResponse = await businessesApi.getTopBorrowed({ top: 5 });
        console.log('📊 Staff Top borrowed response:', JSON.stringify(topBorrowedResponse, null, 2));
        if (topBorrowedResponse?.statusCode === 200 && topBorrowedResponse?.data) {
          const products = topBorrowedResponse.data.products || topBorrowedResponse.data;
          setStaffTopBorrowedItems(Array.isArray(products) ? products : []);
        } else if (topBorrowedResponse?.data) {
          const products = topBorrowedResponse.data.products || topBorrowedResponse.data;
          setStaffTopBorrowedItems(Array.isArray(products) ? products : []);
        }
      } catch (error) {
        console.log('⚠️ Staff Top borrowed API not available:', error);
      }
    };

    if (!loading) {
      loadStaffOverview();
    }
  }, [authState.isAuthenticated, authState.role, loading]);

  // Load analytics data (for business owners only)
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!authState.isAuthenticated || authState.role === 'staff' as any) {
        return;
      }

      setAnalyticsLoading(true);
      try {
        // Load overview stats
        try {
          const overviewResponse = await businessesApi.getOverview();
          console.log('📊 Overview API response:', JSON.stringify(overviewResponse, null, 2));
          if (overviewResponse?.statusCode === 200 && overviewResponse?.data) {
            setOverviewData(overviewResponse.data);
          } else if (overviewResponse?.data) {
            // Handle case where data is directly in response
            setOverviewData(overviewResponse.data);
          }
        } catch (error) {
          console.log('⚠️ Overview API not available, using profile data:', error);
        }

        // Load monthly transactions
        try {
          // Only send year parameter - backend will return all types and statuses by default
          const monthlyResponse = await borrowTransactionsApi.getMonthlyTransactions({ 
            year: selectedYear,
          });
          console.log('📊 Monthly transactions response:', JSON.stringify(monthlyResponse, null, 2));
          if (monthlyResponse?.statusCode === 200) {
            // API returns: { statusCode: 200, data: [{ month: 1-12, count: number }], totals: {...} }
            if (monthlyResponse.data && Array.isArray(monthlyResponse.data)) {
              setMonthlyTransactions(monthlyResponse.data);
            }
            // Store totals for overview (if overview API not available)
            if (monthlyResponse.totals) {
              setMonthlyTotals(monthlyResponse.totals);
            }
          }
        } catch (error: any) {
          // Silently handle 400 and 403 errors (invalid parameters or forbidden)
          if (error?.response?.status === 400) {
            console.log('⚠️ Monthly transactions API returned 400 (invalid parameters)');
          } else if (error?.response?.status === 403) {
            // Silently handle 403 (forbidden) - don't show error to user
            console.log('⚠️ Monthly transactions API returned 403 (forbidden - silently handled)');
          } else {
            // Only log other errors, don't show to user
            console.log('⚠️ Monthly transactions API not available:', error?.message || error);
          }
        }

        // Load top borrowed items
        try {
          const topBorrowedResponse = await businessesApi.getTopBorrowed({ top: 5 });
          console.log('📊 Top borrowed response:', JSON.stringify(topBorrowedResponse, null, 2));
          if (topBorrowedResponse?.statusCode === 200 && topBorrowedResponse?.data) {
            // API returns: { statusCode: 200, data: { top: 5, products: [...] } }
            const products = topBorrowedResponse.data.products || topBorrowedResponse.data;
            setTopBorrowedItems(Array.isArray(products) ? products : []);
          } else if (topBorrowedResponse?.data) {
            // Handle case where data structure is different
            const products = topBorrowedResponse.data.products || topBorrowedResponse.data;
            setTopBorrowedItems(Array.isArray(products) ? products : []);
          }
        } catch (error) {
          console.log('⚠️ Top borrowed API not available:', error);
        }

        // Load wallet monthly data
        try {
          const walletMonthlyResponse = await walletTransactionsApi.getMonthly({ year: selectedYear, walletType: 'business' });
          console.log('📊 Wallet monthly response:', JSON.stringify(walletMonthlyResponse, null, 2));
          if (walletMonthlyResponse?.statusCode === 200 && walletMonthlyResponse?.data) {
            // API returns: { statusCode: 200, data: [...], totals: {...} }
            setWalletMonthlyData({
              months: walletMonthlyResponse.data,
              totals: walletMonthlyResponse.totals,
            });
          } else if (walletMonthlyResponse?.data) {
            // Handle case where data structure is different
            setWalletMonthlyData({
              months: Array.isArray(walletMonthlyResponse.data) ? walletMonthlyResponse.data : [],
              totals: walletMonthlyResponse.totals || null,
            });
          }
        } catch (error) {
          console.log('⚠️ Wallet monthly API not available:', error);
        }
      } catch (error: any) {
        console.error('❌ Error loading analytics data:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (!loading && businessProfile) {
      loadAnalyticsData();
    }
  }, [authState.isAuthenticated, authState.role, loading, businessProfile, selectedYear]);
  
  // Get business name from profile - ensure it's always a string
  const businessName = String(businessProfile?.businessName || "Business Owner");
  const businessOwnerName = String(businessProfile?.userId?.username || businessProfile?.userId?.email || "Business Owner");
  
  // Get greeting based on role - ensure it's always a string
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
      subtitle = `${businessName || "Business"} ⭐ ${rating} (${reviews} reviews)`;
    } else {
      subtitle = `${businessName || "Business"} - Business Management`;
    }
  } else {
    subtitle = "Business Management";
  }
  
  // Ensure all string values are defined and not null/undefined
  const safeGreeting = String(greeting || "Hello");
  const safeSubtitle = String(subtitle || "Business Management");

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
            <Text style={styles.headerTitle}>{loading ? "Loading..." : (safeGreeting || "Hello")}</Text>
            {safeSubtitle ? (
              <Text style={styles.headerSubtitle}>{String(safeSubtitle)}</Text>
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

            {/* Section 1: Overview Cards (Upgraded Style) - Business Only */}
            {authState.role !== 'staff' as any && (
              <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.kpiGrid}>
                {/* CO2 Reduced */}
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewCardContent, { backgroundColor: "#ECFDF5" }]}>
                    <View style={[styles.overviewIconContainer, { backgroundColor: "#D1FAE5" }]}>
                      <Ionicons name="earth" size={32} color="#10B981" />
                    </View>
                    <Text style={styles.overviewValue}>
                      {overviewData?.co2Reduced !== undefined
                        ? String(overviewData.co2Reduced.toFixed(2))
                        : monthlyTotals?.totalCo2Reduced !== undefined
                          ? String(monthlyTotals.totalCo2Reduced.toFixed(2))
                          : businessProfile?.co2Reduced 
                            ? String(businessProfile.co2Reduced.toFixed(2))
                            : '0.00'} kg
                    </Text>
                    <Text style={styles.overviewLabel}>CO₂ Reduced</Text>
                  </View>
                </View>

                {/* Eco Points */}
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewCardContent, { backgroundColor: "#FEF3C7" }]}>
                    <View style={[styles.overviewIconContainer, { backgroundColor: "#FDE68A" }]}>
                      <Ionicons name="trophy" size={32} color="#F59E0B" />
                    </View>
                    <Text style={styles.overviewValue}>
                      {overviewData?.ecoPoints !== undefined
                        ? String(Math.round(overviewData.ecoPoints))
                        : monthlyTotals?.totalEcoPoints !== undefined
                          ? String(Math.round(monthlyTotals.totalEcoPoints))
                          : businessProfile?.ecoPoints 
                            ? String(Math.round(businessProfile.ecoPoints))
                            : '0'}
                    </Text>
                    <Text style={styles.overviewLabel}>Eco Points</Text>
                  </View>
                </View>

                {/* Rating */}
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewCardContent, { backgroundColor: "#FEE2E2" }]}>
                    <View style={[styles.overviewIconContainer, { backgroundColor: "#FECACA" }]}>
                      <Ionicons name="star" size={32} color="#EF4444" />
                    </View>
                    <Text style={styles.overviewValue}>
                      {overviewData?.averageRating 
                        ? String(overviewData.averageRating.toFixed(1))
                        : businessProfile?.averageRating 
                          ? String(businessProfile.averageRating.toFixed(1))
                          : '0.0'}
                    </Text>
                    <Text style={styles.overviewLabel}>Rating</Text>
                  </View>
                </View>

                {/* Reviews */}
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewCardContent, { backgroundColor: "#DBEAFE" }]}>
                    <View style={[styles.overviewIconContainer, { backgroundColor: "#BFDBFE" }]}>
                      <Ionicons name="chatbubbles" size={32} color="#3B82F6" />
                    </View>
                    <Text style={styles.overviewValue}>
                      {overviewData?.totalReviews 
                        ? String(overviewData.totalReviews)
                        : businessProfile?.totalReviews 
                          ? String(businessProfile.totalReviews)
                          : '0'}
                    </Text>
                    <Text style={styles.overviewLabel}>Reviews</Text>
                  </View>
                </View>
              </View>
            </View>
            )}

            {/* Staff Overview - Simple Stats */}
            {authState.role === 'staff' as any && staffOverviewData && (
              <View style={styles.operationalStatsSection}>
                <Text style={styles.sectionTitle}>Operational Stats</Text>
                <View style={styles.kpiGrid}>
                  {/* Order Information Cards */}
                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiGradient, { backgroundColor: "#E3F2FD" }]}>
                      <View style={[styles.kpiIconContainer, { backgroundColor: "#BBDEFB" }]}>
                        <Ionicons name="receipt-outline" size={28} color="#1976D2" />
                      </View>
                      <Text style={[styles.kpiValue, { color: "#1976D2" }]}>
                        {String(staffOverviewData.borrowTransactions || 0)}
                      </Text>
                      <Text style={styles.kpiLabel}>Borrowed Orders</Text>
                    </View>
                  </View>
                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiGradient, { backgroundColor: "#FFF8E1" }]}>
                      <View style={[styles.kpiIconContainer, { backgroundColor: "#FFE082" }]}>
                        <Ionicons name="people" size={28} color="#F57C00" />
                      </View>
                      <Text style={[styles.kpiValue, { color: "#F57C00" }]}>
                        {String(stats.borrowedItems || 0)}
                      </Text>
                      <Text style={styles.kpiLabel}>Currently Borrowed</Text>
                    </View>
                  </View>
                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiGradient, { backgroundColor: "#F3E5F5" }]}>
                      <View style={[styles.kpiIconContainer, { backgroundColor: "#E1BEE7" }]}>
                        <Ionicons name="ticket-outline" size={28} color="#7B1FA2" />
                      </View>
                      <Text style={[styles.kpiValue, { color: "#7B1FA2" }]}>
                        {String(staffOverviewData.businessVouchers || 0)}
                      </Text>
                      <Text style={styles.kpiLabel}>Vouchers</Text>
                    </View>
                  </View>
                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiGradient, { backgroundColor: "#E8F5E9" }]}>
                      <View style={[styles.kpiIconContainer, { backgroundColor: "#C8E6C9" }]}>
                        <Ionicons name="folder-outline" size={28} color="#00704A" />
                      </View>
                      <Text style={[styles.kpiValue, { color: "#00704A" }]}>
                        {String(staffOverviewData.productGroups || 0)}
                      </Text>
                      <Text style={styles.kpiLabel}>Product Groups</Text>
                    </View>
                  </View>
                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiGradient, { backgroundColor: "#FFF8E1" }]}>
                      <View style={[styles.kpiIconContainer, { backgroundColor: "#FFE082" }]}>
                        <Ionicons name="cube-outline" size={28} color="#F57C00" />
                      </View>
                      <Text style={[styles.kpiValue, { color: "#F57C00" }]}>
                        {String(staffOverviewData.products || 0)}
                      </Text>
                      <Text style={styles.kpiLabel}>Products</Text>
                    </View>
                  </View>
                  
                  {/* Product Condition Stats */}
                  {staffOverviewData.productConditionStats && (
                    <>
                      <View style={styles.kpiCard}>
                        <View style={[styles.kpiGradient, { backgroundColor: "#E8F5E9" }]}>
                          <View style={[styles.kpiIconContainer, { backgroundColor: "#C8E6C9" }]}>
                            <Ionicons name="checkmark-circle" size={28} color="#00704A" />
                          </View>
                          <Text style={[styles.kpiValue, { color: "#00704A" }]}>
                            {String(staffOverviewData.productConditionStats.good || 0)}
                          </Text>
                          <Text style={styles.kpiLabel}>Good</Text>
                        </View>
                      </View>
                      <View style={styles.kpiCard}>
                        <View style={[styles.kpiGradient, { backgroundColor: "#FFEBEE" }]}>
                          <View style={[styles.kpiIconContainer, { backgroundColor: "#FFCDD2" }]}>
                            <Ionicons name="warning" size={28} color="#D32F2F" />
                          </View>
                          <Text style={[styles.kpiValue, { color: "#D32F2F" }]}>
                            {String(staffOverviewData.productConditionStats.damaged || 0)}
                          </Text>
                          <Text style={styles.kpiLabel}>Damaged</Text>
                        </View>
                      </View>
                      <View style={styles.kpiCard}>
                        <View style={[styles.kpiGradient, { backgroundColor: "#FFF8E1" }]}>
                          <View style={[styles.kpiIconContainer, { backgroundColor: "#FFE082" }]}>
                            <Ionicons name="time" size={28} color="#F57C00" />
                          </View>
                          <Text style={[styles.kpiValue, { color: "#F57C00" }]}>
                            {String(staffOverviewData.productConditionStats.expired || 0)}
                          </Text>
                          <Text style={styles.kpiLabel}>Expired</Text>
                        </View>
                      </View>
                      <View style={styles.kpiCard}>
                        <View style={[styles.kpiGradient, { backgroundColor: "#F5F5F5" }]}>
                          <View style={[styles.kpiIconContainer, { backgroundColor: "#E0E0E0" }]}>
                            <Ionicons name="close-circle" size={28} color="#666666" />
                          </View>
                          <Text style={[styles.kpiValue, { color: "#666666" }]}>
                            {String(staffOverviewData.productConditionStats.lost || 0)}
                          </Text>
                          <Text style={styles.kpiLabel}>Lost</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Top Borrowed Items - Staff */}
            {authState.role === 'staff' as any && staffTopBorrowedItems.length > 0 && (
              <View style={styles.topBorrowedSection}>
                <Text style={styles.sectionTitle}>Top Borrowed Items</Text>
                <View style={styles.topBorrowedCard}>
                  {staffTopBorrowedItems.map((item: any, index: number) => {
                    // API returns: { _id, reuseCount, group: { name, imageUrl }, size: { sizeName }, ... }
                    const productName = item.group?.name || item.name || 'Unknown Product';
                    const productImage = item.group?.imageUrl || item.imageUrl;
                    const reuseCount = item.reuseCount || 0;
                    const maxCount = Math.max(...staffTopBorrowedItems.map((i: any) => i.reuseCount || 0), 1);
                    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    
                    return (
                      <View key={item._id || index} style={styles.topBorrowedItem}>
                        <View style={styles.topBorrowedLeft}>
                          <Text style={styles.rankEmoji}>{rankEmoji}</Text>
                          {productImage ? (
                            <Image source={{ uri: productImage }} style={styles.productThumbnail} />
                          ) : (
                            <View style={[styles.productThumbnail, styles.productThumbnailPlaceholder]}>
                              <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                            </View>
                          )}
                          <View style={styles.productNameContainer}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {productName}
                            </Text>
                            {item.size?.sizeName && (
                              <Text style={styles.productSize} numberOfLines={1}>
                                {item.size.sizeName}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.topBorrowedRight}>
                          <ProgressBar
                            value={reuseCount}
                            maxValue={maxCount}
                            height={8}
                            color="#00704A"
                            showLabel={true}
                            label={`${reuseCount} times`}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Section 2: Monthly Activity Chart - Business Only */}
            {authState.role !== 'staff' as any && monthlyTransactions.length > 0 && (
              <View style={styles.chartSection}>
                <View style={styles.chartHeader}>
                  <Text style={styles.sectionTitle}>Monthly Activity</Text>
                  <TouchableOpacity 
                    style={styles.yearSelector}
                    onPress={() => {
                      // Simple year selector - can be enhanced with modal
                      const currentYear = new Date().getFullYear();
                      setSelectedYear(selectedYear === currentYear ? currentYear - 1 : currentYear);
                    }}
                  >
                    <Text style={styles.yearText}>{selectedYear}</Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.chartCard}>
                  <SimpleBarChart
                    data={monthlyTransactions.map((item: any) => {
                      // API returns: { month: 1-12, count: number }
                      const monthNumber = item.month;
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const monthLabel = monthNumber ? monthNames[monthNumber - 1] : 'N/A';
                      const count = item.count || 0;
                      
                      return {
                        label: monthLabel,
                        value: count,
                        color: '#00704A',
                      };
                    })}
                    height={200}
                  />
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#00704A' }]} />
                      <Text style={styles.legendText}>Transactions</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Section 3: Top Borrowed Items - Business Only */}
            {authState.role !== 'staff' as any && topBorrowedItems.length > 0 && (
              <View style={styles.topBorrowedSection}>
                <Text style={styles.sectionTitle}>Top Borrowed Items</Text>
                <View style={styles.topBorrowedCard}>
                  {topBorrowedItems.map((item: any, index: number) => {
                    // API returns: { _id, reuseCount, group: { name, imageUrl }, size: { sizeName }, ... }
                    const productName = item.group?.name || item.name || 'Unknown Product';
                    const productImage = item.group?.imageUrl || item.imageUrl;
                    const reuseCount = item.reuseCount || 0;
                    const maxCount = Math.max(...topBorrowedItems.map((i: any) => i.reuseCount || 0), 1);
                    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    
                    return (
                      <View key={item._id || index} style={styles.topBorrowedItem}>
                        <View style={styles.topBorrowedLeft}>
                          <Text style={styles.rankEmoji}>{rankEmoji}</Text>
                          {productImage ? (
                            <Image source={{ uri: productImage }} style={styles.productThumbnail} />
                          ) : (
                            <View style={[styles.productThumbnail, styles.productThumbnailPlaceholder]}>
                              <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                            </View>
                          )}
                          <View style={styles.productNameContainer}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {productName}
                            </Text>
                            {item.size?.sizeName && (
                              <Text style={styles.productSize} numberOfLines={1}>
                                {item.size.sizeName}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.topBorrowedRight}>
                          <ProgressBar
                            value={reuseCount}
                            maxValue={maxCount}
                            height={8}
                            color="#00704A"
                            showLabel={true}
                            label={`${reuseCount} times`}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Section 4: Revenue Trend - Business Only */}
            {authState.role !== 'staff' as any && walletMonthlyData && walletMonthlyData.months && walletMonthlyData.months.length > 0 && (
              <View style={styles.revenueSection}>
                <View style={styles.revenueHeader}>
                  <Text style={styles.sectionTitle}>Cash Flow</Text>
                  <TouchableOpacity onPress={() => router.push('/(protected)/business/wallet')}>
                    <Text style={styles.goToWalletLink}>Go to Wallet →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.revenueCard}>
                  <SimpleLineChart
                    datasets={[
                      {
                        data: walletMonthlyData.months.map((item: any) => {
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return {
                            label: monthNames[item.month - 1] || String(item.month),
                            value: item.totalIn || 0, // Income
                          };
                        }),
                        color: '#10B981',
                        label: 'Income',
                      },
                      {
                        data: walletMonthlyData.months.map((item: any) => {
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return {
                            label: monthNames[item.month - 1] || String(item.month),
                            value: item.totalOut || 0, // Expenses
                          };
                        }),
                        color: '#EF4444',
                        label: 'Expenses',
                      },
                    ]}
                    height={150}
                  />
                  <View style={styles.revenueLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.legendText}>Income</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={styles.legendText}>Expenses</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Operational Stats (Keep existing) */}
            <View style={styles.operationalStatsSection}>
              <Text style={styles.sectionTitle}>Operational Stats</Text>
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <View style={[styles.kpiGradient, { backgroundColor: "#E8F5E9" }]}>
                    <View style={[styles.kpiIconContainer, { backgroundColor: "#C8E6C9" }]}>
                      <Ionicons name="checkmark-circle" size={28} color="#00704A" />
                    </View>
                    <Text style={[styles.kpiValue, { color: "#00704A" }]}>
                      {String(
                        overviewData?.productConditionStats?.good !== undefined
                          ? overviewData.productConditionStats.good
                          : stats.availableItems ?? 0
                      )}
                    </Text>
                    <Text style={styles.kpiLabel}>Available</Text>
                  </View>
                </View>

                <View style={styles.kpiCard}>
                  <View style={[styles.kpiGradient, { backgroundColor: "#FFF8E1" }]}>
                    <View style={[styles.kpiIconContainer, { backgroundColor: "#FFE082" }]}>
                      <Ionicons name="people" size={28} color="#F57C00" />
                    </View>
                    <Text style={[styles.kpiValue, { color: "#F57C00" }]}>
                      {String(
                        overviewData?.borrowTransactions !== undefined
                          ? overviewData.borrowTransactions
                          : stats.borrowedItems ?? 0
                      )}
                    </Text>
                    <Text style={styles.kpiLabel}>Borrowed</Text>
                  </View>
                </View>

                <View style={styles.kpiCard}>
                  <View style={[styles.kpiGradient, { backgroundColor: "#FFEBEE" }]}>
                    <View style={[styles.kpiIconContainer, { backgroundColor: "#FFCDD2" }]}>
                      <Ionicons name="time" size={28} color="#D32F2F" />
                    </View>
                    <Text style={[styles.kpiValue, { color: "#D32F2F" }]}>
                      {String(stats.overdueItems ?? 0)}
                    </Text>
                    <Text style={styles.kpiLabel}>Overdue</Text>
                  </View>
                </View>

                <View style={styles.kpiCard}>
                  <View style={[styles.kpiGradient, { backgroundColor: "#F5F5F5" }]}>
                    <View style={[styles.kpiIconContainer, { backgroundColor: "#E0E0E0" }]}>
                      <Ionicons name="close-circle" size={28} color="#666666" />
                    </View>
                    <Text style={[styles.kpiValue, { color: "#666666" }]}>
                      {String(
                        overviewData?.productConditionStats?.damaged !== undefined
                          ? overviewData.productConditionStats.damaged
                          : stats.damagedItems ?? 0
                      )}
                    </Text>
                    <Text style={styles.kpiLabel}>Damaged</Text>
                  </View>
                </View>
              </View>
            </View>

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
                      <Text style={styles.quickActionText}>Scan Voucher</Text>
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
                      <Text style={styles.quickActionText}>Process Returns</Text>
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
  // New Analytics Sections Styles
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  overviewCard: {
    flex: 1,
    minWidth: '47%',
    marginBottom: 12,
  },
  overviewCardContent: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  topBorrowedSection: {
    marginBottom: 24,
  },
  topBorrowedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topBorrowedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  topBorrowedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  productThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productThumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productNameContainer: {
    flex: 1,
    marginLeft: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  productSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  topBorrowedRight: {
    flex: 1,
    maxWidth: 120,
  },
  revenueSection: {
    marginBottom: 24,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goToWalletLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00704A',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  revenueLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  operationalStatsSection: {
    marginBottom: 24,
  },
  staffOverviewSection: {
    marginBottom: 24,
  },
  staffStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  staffStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  staffStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  staffStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  productConditionSection: {
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conditionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  conditionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
})