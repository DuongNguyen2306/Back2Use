import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import BusinessHeader from "../../../components/BusinessHeader";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../../hooks/use-toast";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { borrowTransactionsApi } from "../../../src/services/api/borrowTransactionService";
import { businessesApi, productsApi, subscriptionsApi } from "../../../src/services/api/businessService";
import { BusinessProfile } from "../../../src/types/business.types";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BusinessOverview() {
  const { state } = useAuth();
  const { toast } = useToast();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<any[]>([]);
  const [autoRenewStates, setAutoRenewStates] = useState<Record<string, boolean>>({});
  const [togglingAutoRenew, setTogglingAutoRenew] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    rating: 0,
    available: 0,
    borrowed: 0,
    overdue: 0,
    damaged: 0,
  });

  useTokenRefresh();

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const loadBusinessData = async () => {
      // Wait for auth state to be hydrated before making API calls
      if (!state.isHydrated) {
        return;
      }
      
      if (state.accessToken && state.isAuthenticated && state.role === 'business') {
        try {
          console.log('🔍 Loading business profile for overview screen...');
          const profileResponse = await businessesApi.getProfileWithAutoRefresh();
          console.log('✅ Business profile loaded:', profileResponse);
          
          if (profileResponse.data) {
            if (profileResponse.data.business) {
            setBusinessProfile(profileResponse.data.business);
            }
            // Load active subscription
            if (profileResponse.data.activeSubscription) {
              const subscriptions = Array.isArray(profileResponse.data.activeSubscription) 
                ? profileResponse.data.activeSubscription 
                : [profileResponse.data.activeSubscription];
              setActiveSubscription(subscriptions);
              
              // Load auto-renew states from active subscriptions
              const autoRenewMap: Record<string, boolean> = {};
              subscriptions.forEach((sub: any) => {
                const subId = sub._id;
                if (subId) {
                  autoRenewMap[subId] = sub.autoRenew || false;
                }
              });
              setAutoRenewStates(prev => ({ ...prev, ...autoRenewMap }));
            } else {
              setActiveSubscription([]);
            }
          }
        } catch (error: any) {
          // Silently handle 403 errors (Access denied - role mismatch)
          if (error?.response?.status === 403 || error?.message === 'ACCESS_DENIED_403') {
            console.log('⚠️ Access denied (403) - silently handled');
          } else {
          console.error('❌ Error loading business profile:', error);
          }
          // ignore - will show default values
        }
      }
      setLoading(false);
    };
    loadBusinessData();
  }, [state.accessToken, state.isAuthenticated, state.isHydrated, state.role]);

  // Load real transaction and product statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!state.isHydrated || !state.accessToken || !state.isAuthenticated || state.role !== 'business') {
        return;
      }

      try {
        console.log('📊 Loading statistics...');
        
        // Load all transactions to calculate stats
        const response = await borrowTransactionsApi.getBusinessHistory({
          page: 1,
          limit: 1000, // Get a large number to calculate accurate stats
        });

        console.log('📡 Transaction stats response:', response);

        let transactions: any[] = [];
        if (response.statusCode === 200) {
          if (response.data?.items && Array.isArray(response.data.items)) {
            transactions = response.data.items;
          } else if (Array.isArray(response.data)) {
            transactions = response.data;
          }
        }

        console.log('📊 Total transactions found:', transactions.length);

        // Calculate revenue from completed transactions (depositAmount)
        const completedTransactions = transactions.filter(t => t.status === 'completed');
        const revenue = completedTransactions.reduce((sum, t) => sum + (t.depositAmount || 0), 0);

        // Count total orders
        const orders = transactions.length;

        // Count unique customers
        const uniqueCustomers = new Set(
          transactions
            .map(t => t.customerId?._id || t.customerId)
            .filter(id => id)
        );
        const customers = uniqueCustomers.size;

        // Calculate borrowed items
        const borrowed = transactions.filter((t: any) => t.status === 'borrowing').length;

        // Calculate overdue items from transactions
        const overdue = transactions.filter((t: any) => {
          if (t.status !== 'borrowing') return false;
          if (!t.expectedReturnDate) return false;
          return new Date(t.expectedReturnDate) < new Date();
        }).length;

        console.log('📊 Calculated transaction stats:', { revenue, orders, customers, borrowed, overdue });

        // Load products from all product groups
        let available = 0;
        let damaged = 0;

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

          console.log('✅ Loaded products:', allProducts.length);

          // Calculate stats from products
          available = allProducts.filter((p: any) => p.status === 'available').length;
          damaged = allProducts.filter((p: any) => p.condition === 'damaged' || p.status === 'damaged').length;

          console.log('📊 Calculated product stats:', { available, damaged });
        }

        setStats({
          revenue,
          orders,
          customers,
          rating: 0, // Rating not available from transactions
          available,
          borrowed,
          overdue,
          damaged,
        });
      } catch (error: any) {
        // Silently handle Unauthorized errors
        if (error?.response?.status === 401 || 
            error?.message?.toLowerCase().includes('unauthorized')) {
          // Silently handle - don't show error to user
          console.log('⚠️ Unauthorized error loading stats (silently handled)');
          return;
        }
        console.error('❌ Error loading stats:', error);
        // Silently fail - will show default values
      }
    };

    loadStats();
  }, [state.isHydrated, state.accessToken, state.isAuthenticated, state.role, businessProfile]);

  // Get user info from business profile
  const businessOwnerName = businessProfile?.userId?.username || businessProfile?.userId?.email || "Business Owner";
  const businessLogo = businessProfile?.businessLogoUrl;

  // Toggle auto-renew handler
  const handleToggleAutoRenew = async (subscriptionId: string, currentValue: boolean) => {
    try {
      setTogglingAutoRenew(prev => ({ ...prev, [subscriptionId]: true }));
      console.log('🔄 Toggling auto-renew for subscription:', subscriptionId);
      
      const newValue = !currentValue;
      const response = await subscriptionsApi.toggleAutoRenew(subscriptionId, {
        autoRenew: newValue,
      });
      
      console.log('✅ Toggle auto-renew response:', response);
      
      // Update local state
      setAutoRenewStates(prev => ({
        ...prev,
        [subscriptionId]: newValue,
      }));
      
      // Update active subscription data
      setActiveSubscription(prev => prev.map(sub => {
        if (sub._id === subscriptionId) {
          return { ...sub, autoRenew: newValue };
        }
        return sub;
      }));
      
      toast({
        title: "Success",
        description: newValue 
          ? "Auto-renewal has been enabled" 
          : "Auto-renewal has been disabled",
      });
    } catch (error: any) {
      console.error('❌ Error toggling auto-renew:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Unable to change auto-renewal settings. Please try again.",
      });
    } finally {
      setTogglingAutoRenew(prev => ({ ...prev, [subscriptionId]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BusinessHeader
          title={getTimeBasedGreeting()}
          subtitle="Loading..."
          user={null}
        />
        <View style={styles.whiteBackground}>
          <View style={styles.contentWrapper}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading business overview...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BusinessHeader
        title={getTimeBasedGreeting()}
        subtitle="Business Overview"
        user={businessProfile ? {
          _id: businessProfile.userId._id,
          email: businessProfile.userId.email,
          name: businessProfile.userId.username,
          fullName: businessProfile.businessName,
          avatar: businessProfile.businessLogoUrl || undefined,
          role: 'business' as const,
        } : null}
      />

      <View style={styles.whiteBackground}>
        <View style={styles.contentWrapper}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 24, paddingTop: 24 }}>
            <View style={styles.sectionPad}>
              <Text style={styles.sectionTitle}>Business Overview</Text>
              <Text style={styles.sectionSubtitle}>Monitor your business performance and key metrics</Text>
            </View>

            {/* Business Info Card with Rating */}
            {businessProfile && (
              <View style={styles.sectionPad}>
                <View style={styles.businessInfoCard}>
                  <View style={styles.businessInfoHeader}>
                    <View style={styles.businessInfoLeft}>
                      <Text style={styles.businessName}>{businessProfile.businessName}</Text>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={18} color="#F59E0B" />
                        <Text style={styles.ratingValue}>
                          {businessProfile.averageRating ? businessProfile.averageRating.toFixed(1) : '0.0'}
                        </Text>
                        <Text style={styles.reviewsCount}>
                          ({businessProfile.totalReviews || 0} reviews)
                        </Text>
                      </View>
                    </View>
                    {businessLogo && (
                      <View style={styles.businessLogoContainer}>
                        <Image 
                          source={{ uri: businessLogo }} 
                          style={styles.businessLogoImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Subscription Card with Auto-Renew Toggle */}
            {activeSubscription.length > 0 && (
              <View style={styles.sectionPad}>
                <View style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <Ionicons name="card" size={24} color="#00704A" />
                    <Text style={styles.subscriptionTitle}>Current Subscription Plan</Text>
                  </View>
                  {activeSubscription.map((sub: any, index: number) => {
                    const subscriptionId = sub._id;
                    const subscriptionName = sub.subscriptionId?.name || sub.subscription?.name || sub.name || 'Unknown Plan';
                    const subscriptionPrice = sub.subscriptionId?.price || sub.subscription?.price || sub.price || 0;
                    const startDate = sub.startDate || sub.startAt || sub.createdAt;
                    const endDate = sub.endDate || sub.endAt || sub.expiresAt;
                    const status = sub.status || (sub.isActive ? 'active' : 'inactive');
                    const currentAutoRenew = autoRenewStates[subscriptionId] ?? sub.autoRenew ?? false;
                    const isToggling = togglingAutoRenew[subscriptionId] || false;
                    
                    return (
                      <View key={index} style={styles.subscriptionItem}>
                        <View style={styles.subscriptionInfo}>
                          <Text style={styles.subscriptionName}>{subscriptionName}</Text>
                          {subscriptionPrice > 0 && (
                            <Text style={styles.subscriptionPrice}>
                              {subscriptionPrice.toLocaleString('en-US')} VND
                            </Text>
                          )}
                          {startDate && endDate && (
                            <Text style={styles.subscriptionDate}>
                              {new Date(startDate).toLocaleDateString('en-US')} - {new Date(endDate).toLocaleDateString('en-US')}
                            </Text>
                          )}
                          <View style={[
                            styles.subscriptionStatus,
                            status === 'active' && styles.subscriptionStatusActive,
                            status === 'expired' && styles.subscriptionStatusExpired,
                          ]}>
                            <Text style={styles.subscriptionStatusText}>
                              {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : status}
                            </Text>
                          </View>
                          
                          {/* Auto Renew Toggle - Only show for active subscriptions */}
                          {status === 'active' && subscriptionId && (
                            <View style={styles.subscriptionAutoRenewContainer}>
                              <View style={styles.subscriptionAutoRenewInfo}>
                                <Ionicons name="refresh" size={18} color="#00704A" />
                                <Text style={styles.subscriptionAutoRenewLabel}>Auto Renew</Text>
                              </View>
                              <TouchableOpacity
                                style={[
                                  styles.subscriptionToggleSwitch,
                                  currentAutoRenew && styles.subscriptionToggleSwitchActive,
                                  isToggling && styles.subscriptionToggleSwitchDisabled
                                ]}
                                onPress={() => handleToggleAutoRenew(subscriptionId, currentAutoRenew)}
                                disabled={isToggling}
                              >
                                <View style={[
                                  styles.subscriptionToggleThumb,
                                  currentAutoRenew && styles.subscriptionToggleThumbActive
                                ]} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.sectionPad}>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.availableCard]}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  <Text style={[styles.statValue, styles.availableValue]}>{stats.available}</Text>
                  <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={[styles.statCard, styles.borrowedCard]}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="people" size={24} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statValue, styles.borrowedValue]}>{stats.borrowed}</Text>
                  <Text style={styles.statLabel}>Borrowed</Text>
                </View>
                <View style={[styles.statCard, styles.overdueCard]}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.statValue, styles.overdueValue]}>{stats.overdue}</Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </View>
                <View style={[styles.statCard, styles.damagedCard]}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="close-circle" size={24} color="#6B7280" />
                  </View>
                  <Text style={[styles.statValue, styles.damagedValue]}>{stats.damaged}</Text>
                  <Text style={styles.statLabel}>Damaged</Text>
                </View>
              </View>
            </View>

            {/* Eco Impact Card */}
            {businessProfile && (businessProfile.co2Reduced || businessProfile.ecoPoints) && (
              <View style={styles.sectionPad}>
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
                          {businessProfile.co2Reduced ? businessProfile.co2Reduced.toFixed(2) : '0.00'} kg
                        </Text>
                        <Text style={styles.ecoImpactLabel}>CO₂ Reduced</Text>
                      </View>
                    </View>
                    <View style={styles.ecoImpactStat}>
                      <Ionicons name="trophy" size={20} color="#059669" />
                      <View style={styles.ecoImpactStatContent}>
                        <Text style={styles.ecoImpactValue}>
                          {businessProfile.ecoPoints ? Math.round(businessProfile.ecoPoints) : 0}
                        </Text>
                        <Text style={styles.ecoImpactLabel}>Eco Points</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.sectionPad}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(protected)/business/inventory")}>
                  <Ionicons name="cube" size={32} color="#00704A" />
                  <Text style={styles.actionText}>Inventory</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(protected)/business/transaction-processing")}>
                  <Ionicons name="receipt" size={32} color="#00704A" />
                  <Text style={styles.actionText}>Transactions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(protected)/business/pricing")}>
                  <Ionicons name="pricetag" size={32} color="#00704A" />
                  <Text style={styles.actionText}>Pricing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(protected)/business/reports")}>
                  <Ionicons name="analytics" size={32} color="#00704A" />
                  <Text style={styles.actionText}>Reports</Text>
                </TouchableOpacity>
              </View>
            </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00704A' },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 20,
  },
  heroHeaderArea: { backgroundColor: '#00704A', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandTitle: { color: '#fff', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 },
  greetingName: { color: '#fff', fontWeight: '800', fontSize: 24 },
  greetingNice: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  avatarLg: { height: 64, width: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  avatarLgImage: { width: 60, height: 60, borderRadius: 30 },
  avatarLgText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  sectionPad: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { 
    width: (screenWidth - 32 - 12) / 2, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  availableCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  availableValue: {
    color: '#10B981',
  },
  borrowedCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  borrowedValue: {
    color: '#F59E0B',
  },
  overdueCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  overdueValue: {
    color: '#EF4444',
  },
  damagedCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  damagedValue: {
    color: '#6B7280',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 4, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  // Business Info Card
  businessInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  businessInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessInfoLeft: {
    flex: 1,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  reviewsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  businessLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  businessLogoImage: {
    width: '100%',
    height: '100%',
  },
  // Eco Impact Card
  ecoImpactCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 20,
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
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { 
    width: (screenWidth - 32 - 12) / 2, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 8 },
  // Subscription Card styles
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  subscriptionItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#00704A',
    fontWeight: '500',
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  subscriptionStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  subscriptionStatusActive: {
    backgroundColor: '#D1FAE5',
  },
  subscriptionStatusExpired: {
    backgroundColor: '#FEE2E2',
  },
  subscriptionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  subscriptionAutoRenewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subscriptionAutoRenewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionAutoRenewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  subscriptionToggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  subscriptionToggleSwitchActive: {
    backgroundColor: '#00704A',
  },
  subscriptionToggleSwitchDisabled: {
    opacity: 0.5,
  },
  subscriptionToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  subscriptionToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
