import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { materialsApi, type MaterialItem } from "../../../lib/api";

type Filter = 'all' | 'pending' | 'rejected';

export default function MyMaterialsPage() {
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
      const res = await materialsApi.listMy({ status: statusParam, page: nextPage, limit: 10 });
      console.log('📦 /materials/my response:', JSON.stringify(res)?.slice(0, 500));
      const root: any = res || {};
      const container = root.data ?? {};
      const list = Array.isArray(container)
        ? container
        : (container.docs || container.items || container.list || container.data || []);
      setItems(reset ? list : [...items, ...list]);
      const total = (root.total ?? container.totalDocs ?? container.total ?? container.pagination?.total) ?? list.length;
      const currentPage = (root.currentPage ?? container.page ?? container.pagination?.page ?? nextPage);
      const limit = (root.limit ?? container.limit ?? container.pagination?.limit ?? 10);
      const current = currentPage * limit;
      setHasMore(current < total);
      setPage(nextPage + 1);
    } catch (e: any) {
      console.log('❌ Failed to load my materials:', e?.message || e);
      Alert.alert('Lỗi', e?.message || 'Không tải được danh sách vật liệu của bạn');
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#009900" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vật liệu của tôi</Text>
      </View>

      <View style={styles.filterRow}>
        <FilterButton value="all" label="Tất cả" />
        <FilterButton value="pending" label="Chờ duyệt" />
        <FilterButton value="rejected" label="Bị từ chối" />
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
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Không có dữ liệu</Text> : null}
      />
    </SafeAreaView>
  );
}

function statusStyle(status?: string) {
  if (status === 'rejected') return { backgroundColor: '#FEE2E2' } as const;
  if (status === 'approved') return { backgroundColor: '#DCFCE7' } as const;
  return { backgroundColor: '#E5E7EB' } as const;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#009900' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
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



