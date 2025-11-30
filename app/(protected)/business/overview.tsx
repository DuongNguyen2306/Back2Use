import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../../../context/AuthProvider";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { businessesApi } from "../../../src/services/api/businessService";
import { BusinessProfile } from "../../../src/types/business.types";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BusinessOverview() {
  const { state } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        } catch (error) {
          console.error('❌ Error loading business profile:', error);
          // ignore - will show default values
        }
      }
      setLoading(false);
    };
    loadBusinessData();
  }, [state.accessToken, state.isAuthenticated, state.isHydrated, state.role]);

  // Get user info from business profile
  const businessOwnerName = businessProfile?.userId?.username || businessProfile?.userId?.email || "Business Owner";
  const businessLogo = businessProfile?.businessLogoUrl;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00704A" />
        <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>Loading...</Text>
            </View>
          </View>
        </View>
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
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />

      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>{businessOwnerName}</Text>
              <Text style={styles.greetingNice}>Business Overview</Text>
          </View>
            <View style={styles.avatarLg}>
              {businessLogo ? (
                <Image source={{ uri: businessLogo }} style={styles.avatarLgImage} />
              ) : (
                <Text style={styles.avatarLgText}>{businessOwnerName.charAt(0).toUpperCase()}</Text>
              )}
          </View>
        </View>
      </View>

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
                <View style={styles.statCard}>
                  <Ionicons name="trending-up" size={24} color="#00704A" />
                  <Text style={styles.statValue}>₫2.5M</Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="receipt" size={24} color="#00704A" />
                  <Text style={styles.statValue}>150</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color="#00704A" />
                  <Text style={styles.statValue}>45</Text>
                  <Text style={styles.statLabel}>Customers</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="star" size={24} color="#00704A" />
                  <Text style={styles.statValue}>4.8</Text>
                  <Text style={styles.statLabel}>Rating</Text>
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
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 4 },
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
