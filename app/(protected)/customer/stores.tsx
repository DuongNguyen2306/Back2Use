import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Alert, Animated, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { mockStores } from "../../../lib/mock-data";

const { width } = Dimensions.get('window');

export default function CustomerStores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">("distance");
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const getStoreRating = (storeId: string) => {
    // Mock rating calculation
    return (Math.random() * 2 + 3).toFixed(1);
  };

  const getStoreDistance = (storeId: string) => {
    // Mock distance calculation
    return (Math.random() * 5 + 0.5).toFixed(1);
  };


  const categories = [
    { id: "all", name: "Tất cả", icon: "grid", count: mockStores.length },
    { id: "restaurant", name: "Nhà hàng", icon: "restaurant", count: 12 },
    { id: "grocery", name: "Tạp hóa", icon: "storefront", count: 8 },
    { id: "cafe", name: "Cà phê", icon: "cafe", count: 15 },
    { id: "retail", name: "Bán lẻ", icon: "bag", count: 6 },
  ];

  const filteredStores = mockStores
    .filter((store) => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === "all" || 
        store.packagingTypes.some(type => type.toLowerCase().includes(selectedCategory));
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return parseFloat(getStoreDistance(a.id)) - parseFloat(getStoreDistance(b.id));
        case "rating":
          return parseFloat(getStoreRating(b.id)) - parseFloat(getStoreRating(a.id));
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleStorePress = (store: any) => {
    setSelectedStore(store.id);
    setShowStoreDetails(true);
  };

  const handleDirections = (store: any) => {
    Alert.alert("Directions", `Opening directions to ${store.name}`);
  };

  const handleCallStore = (store: any) => {
    Alert.alert("Call Store", `Calling ${store.phone}`);
  };

  const handleStoreDetails = (store: any) => {
    Alert.alert(
      "Store Details",
      `${store.name}\n${store.address}\n${store.phone}\n${store.email}\n\nOperating Hours: ${store.operatingHours}`
    );
  };

  const selectedStoreData = selectedStore ? mockStores.find(s => s.id === selectedStore) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header with gradient background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Cửa hàng đối tác</Text>
            <Text style={styles.headerSubtitle}>Tìm cửa hàng gần bạn</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Bộ lọc", "Tùy chọn bộ lọc")}>
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search với design đẹp hơn */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6366f1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cửa hàng hoặc địa điểm..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#94a3b8"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoryScrollContainer}
        style={styles.categoryScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? "#fff" : "#667eea"} 
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.selectedCategoryChipText
            ]}>
              {category.name}
            </Text>
            <View style={[
              styles.categoryCount,
              selectedCategory === category.id && styles.selectedCategoryCount
            ]}>
              <Text style={[
                styles.categoryCountText,
                selectedCategory === category.id && styles.selectedCategoryCountText
              ]}>
                {category.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sắp xếp theo:</Text>
        <View style={styles.sortButtons}>
          {[
            { key: "distance", label: "Khoảng cách", icon: "location" },
            { key: "rating", label: "Đánh giá", icon: "star" },
            { key: "name", label: "Tên", icon: "text" }
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.selectedSortButton
              ]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Ionicons 
                name={option.icon as any} 
                size={14} 
                color={sortBy === option.key ? "#fff" : "#667eea"} 
              />
              <Text style={[
                styles.sortButtonText,
                sortBy === option.key && styles.selectedSortButtonText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapIconContainer}>
            <Ionicons name="map" size={32} color="#667eea" />
          </View>
          <Text style={styles.mapText}>Bản đồ tương tác</Text>
          <Text style={styles.mapSubtext}>Chạm vào các điểm đánh dấu để xem chi tiết</Text>
        </View>
        
        {/* Store Markers */}
        {filteredStores.map((store, index) => (
          <TouchableOpacity
            key={store.id}
            style={[
              styles.storeMarker,
              {
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`,
              },
            ]}
            onPress={() => handleStorePress(store)}
          >
            <Ionicons name="location" size={16} color="#fff" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Store List */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cửa hàng gần đây</Text>
            <Text style={styles.sectionSubtitle}>{filteredStores.length} cửa hàng được tìm thấy</Text>
          </View>
          
          {filteredStores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={[
                styles.storeCard,
                selectedStore === store.id && styles.selectedStoreCard
              ]}
              onPress={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
            >
              <View style={styles.storeCardContent}>
              <View style={styles.storeInfo}>
                <View style={styles.storeIcon}>
                    <Ionicons name="storefront" size={24} color="#fff" />
                </View>
                <View style={styles.storeDetails}>
                    <View style={styles.storeHeader}>
                  <Text style={styles.storeName}>{store.name}</Text>
                      <View style={styles.storeBadges}>
                        <View style={styles.distanceBadge}>
                          <Ionicons name="location" size={12} color="#667eea" />
                          <Text style={styles.distanceText}>{getStoreDistance(store.id)} km</Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>Mở cửa</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.storeAddress} numberOfLines={2}>{store.address}</Text>
                  <View style={styles.storeMeta}>
                    <View style={styles.storeRating}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.ratingText}>{getStoreRating(store.id)}</Text>
                        <Text style={styles.reviewCount}>({Math.floor(Math.random() * 50 + 10)} đánh giá)</Text>
                      </View>
                      <View style={styles.storeHours}>
                        <Ionicons name="time" size={12} color="#6b7280" />
                        <Text style={styles.hoursText}>{store.operatingHours}</Text>
                    </View>
                  </View>
                </View>
              </View>
                
              <View style={styles.storeActions}>
                <TouchableOpacity
                    style={styles.primaryAction}
                  onPress={() => handleDirections(store)}
                >
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.primaryActionText}>Chỉ đường</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.secondaryAction}
                  onPress={() => handleCallStore(store)}
                >
                    <Ionicons name="call" size={16} color="#667eea" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => handleStorePress(store)}
                  >
                    <Ionicons name="eye" size={16} color="#667eea" />
                </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Store Details Modal */}
      {showStoreDetails && selectedStoreData && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết cửa hàng</Text>
              <TouchableOpacity onPress={() => setShowStoreDetails(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Store Header */}
              <View style={styles.storeHeader}>
                <View style={styles.storeAvatar}>
                  <Ionicons name="storefront" size={32} color="#0F4D3A" />
                </View>
                <View style={styles.storeHeaderInfo}>
                  <Text style={styles.storeHeaderName}>{selectedStoreData.name}</Text>
                  <View style={styles.storeHeaderRating}>
                    <Ionicons name="star" size={16} color="#fbbf24" />
                    <Text style={styles.storeHeaderRatingText}>{getStoreRating(selectedStoreData.id)}</Text>
                    <Text style={styles.storeHeaderReviews}>({Math.floor(Math.random() * 50 + 10)} reviews)</Text>
                  </View>
                </View>
              </View>

              {/* Store Information */}
              <View style={styles.infoSection}>
                <InfoItem icon="location" label="Địa chỉ" value={selectedStoreData.address} />
                <InfoItem icon="call" label="Điện thoại" value={selectedStoreData.phone} />
                <InfoItem icon="mail" label="Email" value="contact@store.com" />
                <InfoItem icon="time" label="Giờ mở cửa" value={selectedStoreData.operatingHours} />
              </View>

              {/* Available Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.itemsTitle}>Sản phẩm có sẵn</Text>
                <View style={styles.itemsList}>
                  {selectedStoreData.packagingTypes.slice(0, 3).map((type, index) => (
                    <View key={index} style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{type}</Text>
                    </View>
                  ))}
                  {selectedStoreData.packagingTypes.length > 3 && (
                    <View style={styles.itemTag}>
                      <Text style={styles.itemTagText}>+{selectedStoreData.packagingTypes.length - 3} khác</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => handleDirections(selectedStoreData)}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                  <Text style={styles.primaryActionText}>Chỉ đường</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleCallStore(selectedStoreData)}
                >
                  <Ionicons name="call" size={16} color="#667eea" />
                  <Text style={styles.secondaryActionText}>Gọi cửa hàng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleStoreDetails(selectedStoreData)}
                >
                  <Ionicons name="mail" size={16} color="#667eea" />
                  <Text style={styles.secondaryActionText}>Gửi email</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
      
    </View>
  );
}

function CategoryItem({ icon, name, count }: { icon: string; name: string; count: number }) {
  return (
    <TouchableOpacity style={styles.categoryItem}>
      <Ionicons name={icon as any} size={20} color="#0F4D3A" />
      <Text style={styles.categoryName}>{name}</Text>
      <Text style={styles.categoryCount}>{count} stores</Text>
    </TouchableOpacity>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={16} color="#6b7280" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#8B5CF6",
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: -12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  clearButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  categoryScroll: {
    backgroundColor: "#fff",
    paddingBottom: 16,
  },
  categoryScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryChip: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  selectedCategoryChipText: {
    color: "#ffffff",
  },
  categoryCount: {
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  selectedCategoryCount: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  selectedCategoryCountText: {
    color: "#fff",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 4,
  },
  selectedSortButton: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667eea",
  },
  selectedSortButtonText: {
    color: "#fff",
  },
  mapContainer: {
    height: 240,
    backgroundColor: "#f8fafc",
    position: "relative",
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
  },
  mapIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mapText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  mapSubtext: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
  },
  storeMarker: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  storeCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedStoreCard: {
    borderColor: "#6366f1",
    borderWidth: 3,
    shadowColor: "#6366f1",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  storeCardContent: {
    padding: 20,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  storeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  storeDetails: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  storeBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667eea",
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  storeAddress: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  storeMeta: {
    gap: 8,
  },
  storeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  storeHours: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hoursText: {
    fontSize: 12,
    color: "#6b7280",
  },
  storeActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    padding: 24,
  },
  storeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
  },
  storeHeaderInfo: {
    flex: 1,
  },
  storeHeaderName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  storeHeaderRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeHeaderRatingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  storeHeaderReviews: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoSection: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  itemsSection: {
    marginBottom: 24,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemTag: {
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemTagText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  modalActions: {
    gap: 16,
  },
  secondaryActionText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "600",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
    marginRight: 8,
  },
});