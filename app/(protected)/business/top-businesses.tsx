import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ListRenderItem
} from "react-native";
import SimpleHeader from "../../../components/SimpleHeader";
import { useToast } from "../../../hooks/use-toast";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { topBusinessesApi, TopBusiness } from "../../../src/services/api/businessService";

export default function TopBusinessesScreen() {
  const { toast } = useToast();
  const [topBusinesses, setTopBusinesses] = useState<TopBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'co2Reduced' | 'ecoPoints' | 'averageRating'>('co2Reduced');
  const [top, setTop] = useState(5);

  useTokenRefresh();

  useEffect(() => {
    loadTopBusinesses();
  }, [sortBy, top]);

  const loadTopBusinesses = async () => {
    try {
      setLoading(true);
      const response = await topBusinessesApi.getTop({
        top,
        sortBy,
        order: 'desc',
      });

      if (response.status === 200 && response.data) {
        setTopBusinesses(response.data);
      }
    } catch (error: any) {
      console.error('Error loading top businesses:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load top businesses",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTopBusinesses();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toFixed(2);
  };

  const renderItem: ListRenderItem<TopBusiness> = ({ item, index }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>

      {/* Business Logo */}
      <Image
        source={{ 
          uri: item.businessLogoUrl || 'https://via.placeholder.com/60' 
        }}
        style={styles.businessLogo}
        defaultSource={require('../../../assets/images/icon.png')}
      />

      {/* Business Info */}
      <View style={styles.businessInfo}>
        <Text style={styles.businessName} numberOfLines={1}>
          {item.businessName}
        </Text>
        <Text style={styles.businessType} numberOfLines={1}>
          {item.businessType}
        </Text>
        <Text style={styles.businessAddress} numberOfLines={2}>
          {item.businessAddress}
        </Text>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Ionicons name="leaf" size={14} color="#10B981" />
            <Text style={styles.metricValue}>
              {formatNumber(item.co2Reduced)} kg
            </Text>
            <Text style={styles.metricLabel}>CO₂</Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons name="trophy" size={14} color="#F59E0B" />
            <Text style={styles.metricValue}>
              {formatNumber(item.ecoPoints)}
            </Text>
            <Text style={styles.metricLabel}>Points</Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons name="star" size={14} color="#FCD34D" />
            <Text style={styles.metricValue}>
              {item.averageRating > 0 ? item.averageRating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>
              ({item.totalReviews} reviews)
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Top Businesses" />

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Top Businesses</Text>
          <Text style={styles.subtitle}>Leading businesses by environmental impact</Text>
        </View>

        {/* Filter Options */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'co2Reduced' && styles.filterButtonActive]}
              onPress={() => setSortBy('co2Reduced')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'co2Reduced' && styles.filterButtonTextActive]}>
                CO₂ Reduced
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'ecoPoints' && styles.filterButtonActive]}
              onPress={() => setSortBy('ecoPoints')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'ecoPoints' && styles.filterButtonTextActive]}>
                Eco Points
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'averageRating' && styles.filterButtonActive]}
              onPress={() => setSortBy('averageRating')}
            >
              <Text style={[styles.filterButtonText, sortBy === 'averageRating' && styles.filterButtonTextActive]}>
                Rating
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Show top:</Text>
          <View style={styles.filterButtons}>
            {[5, 10, 20].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.filterButton, top === num && styles.filterButtonActive]}
                onPress={() => setTop(num)}
              >
                <Text style={[styles.filterButtonText, top === num && styles.filterButtonTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Business List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00704A" />
          </View>
        ) : (
          <FlatList
            data={topBusinesses}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Data</Text>
                <Text style={styles.emptySubtitle}>No businesses found</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  
  // Title Section
  titleSection: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#00704A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280' },
  
  // Filter Container
  filterContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8,
    marginTop: 4,
  },
  filterButtons: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#00704A',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Loading & Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#00704A',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    marginTop: 8,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    marginTop: 8,
  },
  businessType: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
});
