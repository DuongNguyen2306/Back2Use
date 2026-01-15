import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    ListRenderItem,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import SimpleHeader from "../../../components/SimpleHeader";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../../hooks/use-toast";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { businessesApi, SingleUseProductUsage, singleUseProductUsageApi } from "../../../src/services/api/businessService";
import { BusinessProfile } from "../../../src/types/business.types";

// Interface giữ nguyên
interface UsageHistoryItem extends SingleUseProductUsage {
  blockchainTxHash?: string | null;
  co2PerUnit?: number;
  product?: {
    id?: string;
    _id?: string;
    name: string;
    image?: string;
    imageUrl?: string;
    weight?: number;
    co2Emission?: number;
    type?: string;
    size?: string;
    material?: string;
    productTypeId?: string | { _id: string; name: string; };
    productSizeId?: string | { _id: string; name: string; sizeName?: string; };
    materialId?: string | { _id: string; materialName: string; };
  };
  staff?: {
    id?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  borrowTransaction?: {
    _id: string;
    staffId?: {
      _id: string;
      fullName: string;
      email: string;
      phone: string;
    };
  };
}

export default function BusinessSingleUseUsageHistory() {
  const { state } = useAuth();
  const { toast } = useToast();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useTokenRefresh();

  useEffect(() => {
    if (state.isHydrated && state.accessToken && state.isAuthenticated && state.role === 'business') {
      loadBusinessProfile();
      loadUsageHistory(1, false);
    }
  }, [state.isHydrated, state.accessToken, state.isAuthenticated, state.role]);

  const loadBusinessProfile = async () => {
    try {
      const profileResponse = await businessesApi.getProfileWithAutoRefresh();
      if (profileResponse.data?.business) {
        setBusinessProfile(profileResponse.data.business);
      }
    } catch (error: any) {
      console.error('Error loading business profile:', error);
    }
  };

  const loadUsageHistory = async (pageNum: number, isRefreshing: boolean = false) => {
    try {
      if (pageNum === 1 && !isRefreshing) setLoading(true);

      const response = await singleUseProductUsageApi.getMy({
        page: pageNum,
        limit: 20,
      });

      let usagesArray: any[] = [];
      const responseData: any = response.data || response;
      
      if (Array.isArray(responseData)) {
        usagesArray = responseData;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        usagesArray = responseData.data;
      } else if (responseData?.usages && Array.isArray(responseData.usages)) {
        usagesArray = responseData.usages;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        usagesArray = responseData.items;
      }

      const allUsages: UsageHistoryItem[] = usagesArray.map((usage: any) => {
        return {
          ...usage,
          product: usage.product || (usage.singleUseProductId && typeof usage.singleUseProductId === 'object' ? usage.singleUseProductId : null),
          co2PerUnit: usage.co2PerUnit || usage.co2Emission || usage.product?.co2Emission || 0,
        };
      });

      allUsages.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      if (pageNum === 1) {
        setUsageHistory(allUsages);
      } else {
        setUsageHistory(prev => [...prev, ...allUsages]);
      }

      setHasMore(allUsages.length >= 20);
      setPage(pageNum);

    } catch (error: any) {
      console.error('Error loading usage history:', error);
      toast({
        title: "Error",
        description: "Failed to load usage history",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadUsageHistory(1, true);
  };

  const loadMore = () => {
    if (!loading && !refreshing && hasMore) {
      loadUsageHistory(page + 1, false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTxHash = (hash?: string) => {
    if (!hash || hash === 'N/A') return '---';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // 1. Lấy tên sản phẩm (Ưu tiên lấy trực tiếp từ product.name)
  const getProductName = (item: UsageHistoryItem) => {
    // Kiểm tra trực tiếp item.product.name từ JSON
    if (item.product && item.product.name) {
      const fullName = item.product.name;
      // Regex loại bỏ phần size (ví dụ: " - 8 oz")
      // Thêm kiểm tra an toàn: nếu replace ra chuỗi rỗng thì dùng tên gốc
      const cleanedName = fullName.replace(/\s*-\s*\d+\s*oz\s*/i, '').trim();
      return cleanedName || fullName; 
    }
    
    // Fallback các trường hợp khác
    return (item as any).product?.productName || 'Unnamed Product';
  };

  // 2. Helper lấy Size đơn vị từ tên (Chỉ dùng để hiển thị phần "8 oz")
  const getProductSizeUnit = (item: UsageHistoryItem) => {
    const name = item.product?.name;
    if (name) {
      // Tìm chuỗi kiểu "8 oz" hoặc "16 oz"
      const match = name.match(/(\d+\s*oz)/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // 3. Lấy Size (Ưu tiên trường size trực tiếp)
  const getProductSize = (item: UsageHistoryItem) => {
    // JSON của bạn trả về: "size": "Small (S)" -> Lấy luôn cái này
    if (item.product && item.product.size) {
      return item.product.size;
    }
    
    // Fallback: nếu size là null, thử lấy từ productSizeId nếu nó là object (logic cũ)
    const productSizeId = item.product?.productSizeId;
    if (productSizeId && typeof productSizeId === 'object') {
      const size = (productSizeId as any).name || (productSizeId as any).sizeName;
      if (size) {
        const sizeMap: Record<string, string> = {
          'S': 'Small (S)',
          'M': 'Medium (M)',
          'L': 'Large (L)',
          'XL': 'Extra Large (XL)',
        };
        return sizeMap[size] || size;
      }
    }
    
    return null; // Trả về null để logic hiển thị bên dưới xử lý
  };

  // 4. Lấy trọng lượng
  const getProductWeight = (item: UsageHistoryItem) => {
    if (item.product && item.product.weight !== undefined) {
      return `${item.product.weight}g`;
    }
    return null;
  };

  // 5. Lấy chất liệu
  const getMaterialName = (item: UsageHistoryItem) => {
    // JSON trả về: "material": "Nhựa PET" -> Lấy luôn
    if (item.product && item.product.material) {
      return item.product.material;
    }
    // Fallback cũ
    const materialId = item.product?.materialId;
    if (materialId && typeof materialId === 'object') {
       return (materialId as any).materialName;
    }
    return null;
  };

  const getProductDetailsString = (item: UsageHistoryItem) => {
    const parts = [];
    
    // 1. Size đơn vị (vd: 8 oz)
    const sizeUnit = getProductSizeUnit(item);
    if (sizeUnit) parts.push(sizeUnit);
    
    // 2. Size mô tả (vd: Small (S))
    const sizeDesc = getProductSize(item);
    if (sizeDesc) parts.push(sizeDesc);
    
    // 3. Chất liệu
    const material = getMaterialName(item);
    if (material) parts.push(material);
    
    // 4. Cân nặng
    const weight = getProductWeight(item);
    if (weight) parts.push(weight);

    return parts.length > 0 ? parts.join(' • ') : '';
  };

  const getStaffName = (item: UsageHistoryItem) => {
    return item.staff?.fullName || item.borrowTransaction?.staffId?.fullName || 'N/A';
  };

  const getCo2Reduced = (item: UsageHistoryItem) => {
    return item.co2PerUnit || item.product?.co2Emission || 0;
  };

  const handleItemPress = (item: UsageHistoryItem) => {
    if (item.borrowTransactionId) {
      router.push({
        pathname: '/(protected)/business/transaction-processing',
        params: { transactionId: item.borrowTransactionId }
      });
    }
  };

  const handleCopyTxHash = async (txHash: string, e: any) => {
    e?.stopPropagation(); // Prevent triggering card press
    try {
      await Clipboard.setStringAsync(txHash);
      toast({
        title: "Copied",
        description: "Blockchain transaction hash has been copied",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy",
      });
    }
  };

  // --- RENDER ITEM (CARD STYLE) ---
  const renderItem: ListRenderItem<UsageHistoryItem> = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      {/* HEADER: Ảnh + Thông tin sản phẩm + CO2 */}
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.product?.imageUrl || item.product?.image || 'https://via.placeholder.com/50' }}
          style={styles.productImage}
          defaultSource={require('../../../assets/images/icon.png')}
        />
        
        <View style={styles.cardHeaderContent}>
          <View style={styles.productTopRow}>
            <Text style={styles.productName} numberOfLines={1}>{getProductName(item)}</Text>
            
            {/* Badge CO2 nằm góc phải trên cùng */}
            <View style={styles.co2Badge}>
              <Ionicons name="leaf" size={10} color="#059669" />
              <Text style={styles.co2Text}>{getCo2Reduced(item).toFixed(3)} kg</Text>
            </View>
          </View>
          
          <Text style={styles.productDetails} numberOfLines={1}>{getProductDetailsString(item)}</Text>
          
          {/* Blockchain Tx Hash ngay dưới product details */}
          {item.blockchainTxHash && (
            <TouchableOpacity 
              style={styles.txHashRow}
              onPress={(e) => handleCopyTxHash(item.blockchainTxHash!, e)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="link-variant" size={12} color="#6B7280" />
              <Text style={styles.fullTxHashText} numberOfLines={1}>{item.blockchainTxHash}</Text>
              <Ionicons name="copy-outline" size={14} color="#6B7280" style={styles.copyIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DIVIDER */}
      <View style={styles.divider} />

      {/* FOOTER: Thời gian */}
      <View style={styles.cardFooter}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SimpleHeader title="Usage History" />

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Usage History</Text>
          <Text style={styles.subtitle}>Single-use product usage log at the business.</Text>
        </View>

        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00704A" />
          </View>
        ) : (
          <FlatList
            data={usageHistory}
            renderItem={renderItem}
            keyExtractor={(item, index) => item._id || index.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Data</Text>
                <Text style={styles.emptySubtitle}>Used products will appear here</Text>
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
  
  // Header Titles
  titleSection: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#00704A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280' },
  
  // Loading & Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  // --- CARD STYLES (NEW) ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  // Header của Card (Ảnh + Tên + Badge)
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  co2Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  co2Text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  productDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Dòng kẻ ngang
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },

  // Footer của Card
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  txHashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  fullTxHashText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyIcon: {
    marginLeft: 4,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
