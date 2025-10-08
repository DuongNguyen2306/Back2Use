import { Ionicons } from "@expo/vector-icons";
// import * as Location from 'expo-location';
import { useRef, useState } from "react";
import { Alert, Animated, Dimensions, Linking, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { mockStores } from "../../../lib/mock-data";

const { width } = Dimensions.get('window');

// Coordinates cho trường Đại học FPT Hồ Chí Minh
const FPT_HCM_COORDS = {
  latitude: 10.8412,
  longitude: 106.8099,
};

// Sử dụng coordinates từ mockStores
const storesWithCoords = mockStores;

// Thêm một số cửa hàng cố định quanh FPT HCM
const nearbyStores = [
  {
    id: 'fpt-campus',
    name: 'Trường Đại học FPT HCM',
    address: 'Lô E2a-7, Đường D1, Khu Công nghệ cao, Quận 9, TP.HCM',
    latitude: FPT_HCM_COORDS.latitude,
    longitude: FPT_HCM_COORDS.longitude,
    phone: '028 7300 5588',
    operatingHours: '24/7',
    packagingTypes: ['Cốc giấy', 'Hộp giấy', 'Túi giấy'],
    ownerId: 'fpt',
    isActive: true,
  },
  {
    id: 'coffee-nearby-1',
    name: 'Cà phê gần FPT',
    address: '123 Đường D1, Quận 9, TP.HCM',
    latitude: FPT_HCM_COORDS.latitude + 0.001,
    longitude: FPT_HCM_COORDS.longitude + 0.001,
    phone: '0901234567',
    operatingHours: '6:00 - 22:00',
    packagingTypes: ['Cốc giấy', 'Ống hút giấy'],
    ownerId: 'coffee1',
    isActive: true,
  },
  {
    id: 'restaurant-nearby-1',
    name: 'Nhà hàng gần FPT',
    address: '456 Đường D1, Quận 9, TP.HCM',
    latitude: FPT_HCM_COORDS.latitude - 0.002,
    longitude: FPT_HCM_COORDS.longitude + 0.001,
    phone: '0907654321',
    operatingHours: '10:00 - 23:00',
    packagingTypes: ['Hộp giấy', 'Túi giấy', 'Khay giấy'],
    ownerId: 'restaurant1',
    isActive: true,
  },
];

// Kết hợp stores từ mock data và nearby stores
const allStores = [...storesWithCoords, ...nearbyStores];

export default function CustomerStores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: FPT_HCM_COORDS.latitude,
    longitude: FPT_HCM_COORDS.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchLocation, setSearchLocation] = useState<{latitude: number, longitude: number, name: string} | null>(null);
  // const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const mapRef = useRef<MapView>(null);

  const getStoreRating = (storeId: string) => {
    return (Math.random() * 2 + 3).toFixed(1);
  };

  const getStoreDistance = (storeId: string) => {
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  // Lấy vị trí user - tạm thời comment out
  // useEffect(() => {
  //   (async () => {
  //     let { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== 'granted') {
  //       Alert.alert('Permission denied', 'Location permission is required to show your location on the map');
  //       return;
  //     }

  //     let location = await Location.getCurrentPositionAsync({});
  //     setUserLocation(location);
  //     setMapRegion({
  //       latitude: location.coords.latitude,
  //       longitude: location.coords.longitude,
  //       latitudeDelta: 0.0922,
  //       longitudeDelta: 0.0421,
  //     });
  //   })();
  // }, []);

  const filteredStores = allStores.filter((store) => {
    return store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           store.address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleStorePress = (store: any) => {
    setSelectedStore(store.id);
    setShowStoreDetails(true);
  };


  const handleDirections = (store: any) => {
    console.log('Opening directions to:', store.name, store.latitude, store.longitude);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    console.log('Google Maps URL:', url);
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở Google Maps");
    });
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

  // Xử lý tìm kiếm địa điểm
  const handlePlaceSelect = (data: any, details: any) => {
    if (details) {
      const newRegion = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      setSearchLocation({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        name: details.formatted_address || details.name
      });
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  };

  // Tìm kiếm địa chỉ đơn giản
  const handleSearchLocation = () => {
    if (searchTerm.trim()) {
      // Mock tìm kiếm - trong thực tế sẽ gọi Google Places API
      const mockLocations = [
        {
          name: "Trung tâm TP.HCM",
          latitude: 10.8231,
          longitude: 106.6297,
        },
        {
          name: "Sân bay Tân Sơn Nhất",
          latitude: 10.8188,
          longitude: 106.6519,
        },
        {
          name: "Chợ Bến Thành",
          latitude: 10.7720,
          longitude: 106.6983,
        }
      ];

      const foundLocation = mockLocations.find(loc => 
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (foundLocation) {
        setSearchLocation(foundLocation);
        const newRegion = {
          latitude: foundLocation.latitude,
          longitude: foundLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        Alert.alert("Không tìm thấy", "Không tìm thấy địa chỉ phù hợp. Thử tìm: Trung tâm TP.HCM, Sân bay Tân Sơn Nhất, Chợ Bến Thành");
      }
    }
  };

  const selectedStoreData = selectedStore ? allStores.find(s => s.id === selectedStore) : null;


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#009900" />
      
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


      {/* Store List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Real Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            toolbarEnabled={false}
            mapType="standard"
          >
            {/* Marker cho FPT HCM */}
            <Marker
              coordinate={{
                latitude: FPT_HCM_COORDS.latitude,
                longitude: FPT_HCM_COORDS.longitude,
              }}
              title="Trường Đại học FPT HCM"
              description="Lô E2a-7, Đường D1, Khu Công nghệ cao, Quận 9, TP.HCM"
              onPress={() => handleStorePress(nearbyStores[0])}
            >
              <View style={styles.fptMarker}>
                <Ionicons name="school" size={24} color="#fff" />
              </View>
            </Marker>

            {/* Markers cho các cửa hàng khác */}
            {filteredStores.filter(store => store.id !== 'fpt-campus').map((store) => (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.latitude,
                  longitude: store.longitude,
                }}
                title={store.name}
                description={store.address}
                onPress={() => handleStorePress(store)}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="location" size={24} color="#fff" />
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

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
    backgroundColor: "#009900",
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
    paddingVertical: 4,
    marginTop: -12,
    marginBottom: -8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  autocompleteContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1,
  },
  autocompleteList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autocompleteRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  autocompleteDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  clearButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  mapContainer: {
    height: 240,
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
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: "#6366f1",
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  fptMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F4D3A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});