import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
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

  useTokenRefresh();

  useEffect(() => {
    loadTopBusinesses();
  }, [sortBy]);

  const loadTopBusinesses = async () => {
    try {
      setLoading(true);
      const response = await topBusinessesApi.getTop({
        top: 20,
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

  const getMedalIcon = (index: number) => {
    if (index === 0) return { name: 'medal' as const, color: '#FFD700' }; // Gold
    if (index === 1) return { name: 'medal' as const, color: '#C0C0C0' }; // Silver
    if (index === 2) return { name: 'medal' as const, color: '#CD7F32' }; // Bronze
    return null;
  };

  const getShortAddress = (address: string) => {
    // Extract District and City from address
    // Format: "... District, City, ..." or "... Ward, District, City, ..."
    const parts = address.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    // Fallback: limit to 30 characters
    return address.length > 30 ? address.substring(0, 30) + '...' : address;
  };

  const getPrimaryMetric = (item: TopBusiness) => {
    if (sortBy === 'co2Reduced') return { value: formatNumber(item.co2Reduced), unit: 'kg CO₂', icon: 'leaf' as const, color: '#10B981' };
    if (sortBy === 'ecoPoints') return { value: formatNumber(item.ecoPoints), unit: 'Points', icon: 'trophy' as const, color: '#F59E0B' };
    return { value: item.averageRating > 0 ? item.averageRating.toFixed(1) : 'N/A', unit: `(${item.totalReviews})`, icon: 'star' as const, color: '#FCD34D' };
  };

  const renderItem: ListRenderItem<TopBusiness> = ({ item, index }) => {
    const isTopThree = index < 3;
    const medal = getMedalIcon(index);
    const primaryMetric = getPrimaryMetric(item);

    return (
      <View style={[styles.card, index === 0 && styles.championCard]}>
        {/* Medal/Rank Badge */}
        <View style={[styles.rankContainer, isTopThree && styles.medalContainer]}>
          {medal ? (
            <MaterialCommunityIcons name={medal.name} size={28} color={medal.color} />
          ) : (
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
          )}
        </View>

        {/* Business Logo */}
        <Image
          source={{ 
            uri: item.businessLogoUrl || 'https://via.placeholder.com/60' 
          }}
          style={[styles.businessLogo, index === 0 && styles.championLogo]}
          defaultSource={require('../../../assets/images/icon.png')}
        />

        {/* Business Info */}
        <View style={styles.businessInfo}>
          <Text style={[styles.businessName, index === 0 && styles.championName]} numberOfLines={1}>
            {item.businessName}
          </Text>
          
          <View style={styles.businessMeta}>
            <Text style={styles.businessType}>{item.businessType}</Text>
            <Text style={styles.businessAddress} numberOfLines={1}>
              {getShortAddress(item.businessAddress)}
            </Text>
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsContainer}>
            {/* Primary Metric (Highlighted) */}
            <View style={[styles.primaryMetric, { backgroundColor: `${primaryMetric.color}15` }]}>
              <Ionicons name={primaryMetric.icon} size={16} color={primaryMetric.color} />
              <View style={styles.metricContent}>
                <Text style={[styles.metricValue, { color: primaryMetric.color }]}>
                  {primaryMetric.value}
                </Text>
                <Text style={styles.metricUnit}>{primaryMetric.unit}</Text>
              </View>
            </View>

            {/* Secondary Metrics */}
            <View style={styles.secondaryMetrics}>
              {sortBy !== 'co2Reduced' && (
                <View style={styles.secondaryMetric}>
                  <Ionicons name="leaf" size={14} color="#6B7280" />
                  <Text style={styles.secondaryValue}>{formatNumber(item.co2Reduced)}</Text>
                </View>
              )}
              {sortBy !== 'ecoPoints' && (
                <View style={styles.secondaryMetric}>
                  <Ionicons name="trophy" size={14} color="#6B7280" />
                  <Text style={styles.secondaryValue}>{formatNumber(item.ecoPoints)}</Text>
                </View>
              )}
              {sortBy !== 'averageRating' && item.averageRating > 0 && (
                <View style={styles.secondaryMetric}>
                  <Ionicons name="star" size={14} color="#6B7280" />
                  <Text style={styles.secondaryValue}>{item.averageRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const sortOptions = [
    { key: 'co2Reduced' as const, label: 'CO₂ Reduced', icon: 'leaf' },
    { key: 'ecoPoints' as const, label: 'Eco Points', icon: 'trophy' },
    { key: 'averageRating' as const, label: 'Rating', icon: 'star' },
  ];

  return (
    <View style={styles.container}>
      <SimpleHeader title="Top Businesses" />

      <View style={styles.content}>
        {/* Sort Filters - Horizontal Scrollable Chips */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScrollView}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.chip,
                  sortBy === option.key && styles.chipActive
                ]}
                onPress={() => setSortBy(option.key)}
                activeOpacity={1}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={16} 
                  color={sortBy === option.key ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.chipText,
                  sortBy === option.key && styles.chipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
            contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="trophy-outline" size={64} color="#9CA3AF" />
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
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  content: { 
    flex: 1, 
    paddingTop: 16 
  },
  
  // Filter Wrapper
  filterWrapper: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  chipsScrollView: {
    flexGrow: 0,
  },
  // Chips Container (Horizontal Scrollable)
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 44,
  },
  chipActive: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  
  // Loading & Empty
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#6B7280', 
    marginTop: 16 
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#9CA3AF', 
    marginTop: 8 
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  championCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#FFFBEB',
  },
  
  // Rank/Medal Container
  rankContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  medalContainer: {
    // Medal icons don't need background
  },
  rankBadge: {
    backgroundColor: '#00704A',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Business Logo
  businessLogo: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  championLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  
  // Business Info
  businessInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    marginTop: 4,
  },
  championName: {
    fontSize: 20,
    color: '#00704A',
  },
  businessMeta: {
    marginBottom: 12,
  },
  businessType: {
    fontSize: 13,
    color: '#00704A',
    fontWeight: '600',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Metrics Container
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secondaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});
