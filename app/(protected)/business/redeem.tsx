import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useAuth } from "../../../context/AuthProvider";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { businessesApi } from "../../../src/services/api/businessService";
import { BusinessProfile } from "../../../src/types/business.types";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BusinessRedeem() {
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
          console.log('🔍 Loading business profile for redeem screen...');
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
              <Text style={styles.loadingText}>Loading redeem vouchers...</Text>
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
              <Text style={styles.greetingNice}>Redeem Vouchers</Text>
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
              <Text style={styles.sectionTitle}>Redeem Vouchers</Text>
              <Text style={styles.sectionSubtitle}>Manage customer voucher redemptions</Text>
            </View>

            <View style={styles.sectionPad}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="gift" size={24} color="#00704A" />
                  <Text style={styles.statValue}>25</Text>
                  <Text style={styles.statLabel}>Active Vouchers</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#00704A" />
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Redeemed Today</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={24} color="#00704A" />
                  <Text style={styles.statValue}>8</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="trending-up" size={24} color="#00704A" />
                  <Text style={styles.statValue}>₫150K</Text>
                  <Text style={styles.statLabel}>Total Value</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionPad}>
              <Text style={styles.sectionTitle}>Recent Redemptions</Text>
              <View style={styles.voucherList}>
                {[
                  { id: 1, code: "VOUCHER001", value: "₫10,000", customer: "John Doe", status: "redeemed" },
                  { id: 2, code: "VOUCHER002", value: "₫25,000", customer: "Jane Smith", status: "pending" },
                  { id: 3, code: "VOUCHER003", value: "₫15,000", customer: "Mike Johnson", status: "redeemed" },
                ].map((voucher) => (
                  <View key={voucher.id} style={styles.voucherCard}>
                    <View style={styles.voucherHeader}>
                      <Text style={styles.voucherCode}>{voucher.code}</Text>
                      <View style={[styles.statusBadge, voucher.status === 'redeemed' ? styles.statusRedeemed : styles.statusPending]}>
                        <Text style={[styles.statusText, voucher.status === 'redeemed' ? styles.statusRedeemedText : styles.statusPendingText]}>
                          {voucher.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.voucherValue}>{voucher.value}</Text>
                    <Text style={styles.voucherCustomer}>{voucher.customer}</Text>
                  </View>
                ))}
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
  voucherList: { gap: 12 },
  voucherCard: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  voucherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  voucherCode: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusRedeemed: { backgroundColor: '#D1FAE5' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusRedeemedText: { color: '#059669' },
  statusPendingText: { color: '#D97706' },
  voucherValue: { fontSize: 18, fontWeight: '800', color: '#00704A', marginBottom: 4 },
  voucherCustomer: { fontSize: 14, color: '#6B7280' },
});
