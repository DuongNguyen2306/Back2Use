import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { materialsApi, type MaterialItem } from "../../../lib/api";

export default function BusinessMaterialsPage() {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ materialName: "", maximumReuse: "", description: "" });

  const loadApproved = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page;
      const res = await materialsApi.listApproved(nextPage, 10);
      const container = (res as any)?.data ?? {};
      const list = container.docs || container.items || container.list || container.data || [];
      setItems(reset ? list : [...items, ...list]);
      const total = (container.totalDocs ?? container.total ?? container.pagination?.total) ?? list.length;
      const currentPage = container.page ?? container.pagination?.page ?? nextPage;
      const limit = container.limit ?? container.pagination?.limit ?? 10;
      const current = currentPage * limit;
      setHasMore(current < total);
      setPage(nextPage + 1);
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không tải được danh sách vật liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApproved(true);
  }, []);

  const handleCreate = async () => {
    if (!form.materialName.trim()) {
      Alert.alert("Thiếu dữ liệu", "Tên vật liệu là bắt buộc");
      return;
    }
    try {
      setLoading(true);
      await materialsApi.create({
        materialName: form.materialName.trim(),
        maximumReuse: form.maximumReuse ? Number(form.maximumReuse) : undefined,
        description: form.description.trim() || undefined,
      });
      setShowCreate(false);
      setForm({ materialName: "", maximumReuse: "", description: "" });
      await loadApproved(true);
      Alert.alert("Thành công", "Đã gửi vật liệu, chờ duyệt");
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Tạo vật liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: MaterialItem }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
          <Ionicons name="cube" size={18} color="#0369A1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.materialName}</Text>
          {!!item.description && <Text style={styles.cardSub}>{item.description}</Text>}
        </View>
      </View>
      {!!item.maximumReuse && (
        <View style={styles.badge}><Text style={styles.badgeText}>x{item.maximumReuse}</Text></View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#009900" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vật liệu đã duyệt</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={() => hasMore && loadApproved()}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={() => loadApproved(true)}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Chưa có vật liệu</Text> : null}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm vật liệu</Text>
            <TextInput
              placeholder="Tên vật liệu"
              style={styles.input}
              value={form.materialName}
              onChangeText={(t) => setForm({ ...form, materialName: t })}
            />
            <TextInput
              placeholder="Số lần tái sử dụng tối đa (tuỳ chọn)"
              keyboardType="number-pad"
              style={styles.input}
              value={form.maximumReuse}
              onChangeText={(t) => setForm({ ...form, maximumReuse: t })}
            />
            <TextInput
              placeholder="Mô tả (tuỳ chọn)"
              style={[styles.input, { height: 80 }]} multiline
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} onPress={() => setShowCreate(false)}>
                <Text style={[styles.modalBtnText, { color: '#111827' }]}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#009900' }]} onPress={handleCreate}>
                <Text style={styles.modalBtnText}>{loading ? 'Đang lưu...' : 'Tạo'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#009900', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0F4D3A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, backgroundColor: '#F9FAFB' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#166534', fontWeight: '700', fontSize: 12 },

  empty: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'flex-end' },
  modalCard: { width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});


