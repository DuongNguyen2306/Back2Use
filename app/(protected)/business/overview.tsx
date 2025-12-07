import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import BusinessHeader from "../../../components/BusinessHeader";
import { useAuth } from "../../../context/AuthProvider";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { borrowTransactionsApi } from "../../../src/services/api/borrowTransactionService";
import { businessesApi, productsApi } from "../../../src/services/api/businessService";
import { BusinessProfile } from "../../../src/types/business.types";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BusinessOverview() {
  const { state } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
          
          if (profileResponse.data && profileResponse.data.business) {
            setBusinessProfile(profileResponse.data.business);
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
});
