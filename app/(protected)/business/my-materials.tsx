import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { materialsApi } from "../../../src/services/api/businessService";
import type { MaterialItem } from "../../../src/services/api/businessService";

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function MyMaterialsPage() {
  const { top } = useSafeAreaInsets();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const loadMy = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page;
      const statusParam = filter === 'all' ? undefined : filter;
      
      // Use new API endpoint /materials/my-request
      const res = await materialsApi.getMyRequests({ 
        status: statusParam as 'pending' | 'approved' | 'rejected' | undefined, 
        page: nextPage, 
        limit: 10 
      });
      
      console.log('📦 /materials/my-request response:', JSON.stringify(res)?.slice(0, 500));
      
      // Handle response structure
      const root: any = res || {};
      const container = root.data ?? {};
      const list = Array.isArray(container)
        ? container
        : (container.docs || container.items || container.list || container.data || []);
      
      // Map response to MaterialItem format
      // API returns: requestedMaterialName, description, status
      const mappedList = list.map((item: any) => ({
        _id: item._id,
        materialName: item.requestedMaterialName || item.materialName || item.material?.materialName || 'Unknown',
        description: item.description || item.material?.description || '',
        status: item.status?.toLowerCase() || 'pending',
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      }));
      
      setItems(reset ? mappedList : [...items, ...mappedList]);
      const total = (root.total ?? container.totalDocs ?? container.total ?? container.pagination?.total) ?? mappedList.length;
      const currentPage = (root.currentPage ?? container.page ?? container.pagination?.page ?? nextPage);
      const limit = (root.limit ?? container.limit ?? container.pagination?.limit ?? 10);
      const current = currentPage * limit;
      setHasMore(current < total);
      setPage(nextPage + 1);
    } catch (e: any) {
      console.log('❌ Failed to load my material requests:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to load your material requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMy(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const FilterButton = ({ value, label }: { value: Filter; label: string }) => {
    const active = filter === value;
    return (
      <TouchableOpacity onPress={() => { setFilter(value); }} style={[styles.filterBtn, active && styles.filterBtnActive]}>
        <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: MaterialItem }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cube" size={18} color="#92400E" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.materialName}</Text>
          {!!item.description && <Text style={styles.cardSub}>{item.description}</Text>}
        </View>
      </View>
      <View style={[styles.statusBadge, statusStyle(item.status)]}>
        <Text style={styles.statusText}>{item.status?.toUpperCase() || 'PENDING'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#00704A" barStyle="light-content" />
      <SafeAreaView style={styles.headerSafeArea}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(top, 8) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Materials</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.filterRow}>
        <FilterButton value="all" label="All" />
        <FilterButton value="pending" label="Pending" />
        <FilterButton value="approved" label="Approved" />
        <FilterButton value="rejected" label="Rejected" />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it, idx) => it._id || String(idx)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={() => hasMore && loadMy()}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={() => loadMy(true)}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No data available</Text> : null}
      />
    </View>
  );
}

function statusStyle(status?: string) {
  if (status === 'rejected') return { backgroundColor: '#FEE2E2' } as const;
  if (status === 'approved') return { backgroundColor: '#DCFCE7' } as const;
  return { backgroundColor: '#E5E7EB' } as const;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerSafeArea: {
    backgroundColor: '#00704A',
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#00704A',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  headerSpacer: {
    width: 40,
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#0F4D3A', borderColor: '#0F4D3A' },
  filterText: { color: '#111827', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, backgroundColor: '#F9FAFB' },
  iconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#111827' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
});



