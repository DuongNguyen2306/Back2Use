import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from "react";
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
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState("Ho Chi Minh City, Vietnam");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{name: string, latitude: number, longitude: number} | null>(null);
  const [storeFilter, setStoreFilter] = useState<"all" | "nearby" | "rating" | "distance">("all");
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const mapRef = useRef<MapView>(null);

  const getStoreRating = (storeId: string) => {
    return (Math.random() * 2 + 3).toFixed(1);
  };

  const getStoreDistance = (storeId: string) => {
    if (userLocation) {
      const store = allStores.find(s => s.id === storeId);
      if (store) {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          store.latitude,
          store.longitude
        );
        return distance.toFixed(1);
      }
    }
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  // Lấy vị trí user và reverse geocoding
  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('Starting location request at:', new Date().toLocaleTimeString());
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Permission status:', status);
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          Alert.alert("Error", "Please grant location access in app settings.");
          setCurrentLocationName("Location unavailable");
          return;
        }

        console.log('Getting current position...');
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });
        
        console.log('Location obtained:', location.coords);
        setUserLocation(location);
        
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setMapRegion(newRegion);

        try {
          console.log('Starting reverse geocoding...');
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          console.log('Reverse geocode result:', reverseGeocode);

          if (reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const city = address.city || address.district || address.subregion || 'Unknown City';
            const country = address.country || 'Unknown Country';
            const locationName = `${city}, ${country}`;
            console.log('Setting location name:', locationName);
            setCurrentLocationName(locationName);
          } else {
            console.log('No reverse geocode results');
            const fallbackName = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
            console.log('Using fallback location name:', fallbackName);
            setCurrentLocationName(fallbackName);
          }
        } catch (reverseGeocodeError) {
          console.log('Reverse geocoding failed:', reverseGeocodeError);
          const fallbackName = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
          console.log('Using fallback location name:', fallbackName);
          setCurrentLocationName(fallbackName);
        }

        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } catch (error) {
        console.log('Error getting location:', error);
        Alert.alert("Error", "Unable to get current location. Using default location.");
        setCurrentLocationName("Location unknown");
      }
    };

    const timer = setTimeout(() => {
      getLocation();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Debug info
  console.log('Current filter:', storeFilter);
  console.log('User location:', userLocation ? `${userLocation.coords.latitude}, ${userLocation.coords.longitude}` : 'No location');
  console.log('Total stores:', allStores.length);

  let filteredStores = allStores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           store.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (storeFilter === "nearby") {
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          store.latitude,
          store.longitude
        );
        console.log(`Store ${store.name}: ${distance.toFixed(2)}km`);
        return distance < 5.0; // Tăng lên 5km để có kết quả
      }
      // Nếu không có vị trí user, hiển thị tất cả
      return true;
    } else if (storeFilter === "rating") {
      return parseFloat(getStoreRating(store.id)) >= 4.0;
    } else if (storeFilter === "distance") {
      // "Closest" - chỉ hiển thị store gần nhất
      return true; // Sẽ được xử lý sau khi sắp xếp
    }
    
    return true;
  });

  // Sort by distance for "distance" filter and show only closest
  if (storeFilter === "distance") {
    if (userLocation) {
      filteredStores = filteredStores.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      });
    } else {
      // Nếu không có vị trí user, sắp xếp theo distance giả lập
      filteredStores = filteredStores.sort((a, b) => {
        const distanceA = parseFloat(getStoreDistance(a.id));
        const distanceB = parseFloat(getStoreDistance(b.id));
        return distanceA - distanceB;
      });
    }
    // Chỉ hiển thị store gần nhất
    filteredStores = filteredStores.slice(0, 1);
  }

  console.log('Filtered stores count:', filteredStores.length);

  const handleStorePress = (store: any) => {
    setSelectedStore(store.id);
    setShowStoreDetails(true);
  };

  const handleDirections = (store: any) => {
    console.log('Opening directions to:', store.name, store.latitude, store.longitude);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    console.log('Google Maps URL:', url);
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open Google Maps");
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

  const handleMapPress = (event: any) => {
    try {
      const coordinate = event.nativeEvent?.coordinate;
      if (coordinate && coordinate.latitude && coordinate.longitude) {
        setSelectedLocation({
          name: "Selected Location",
          latitude: coordinate.latitude,
          longitude: coordinate.longitude
        });
      }
    } catch (error) {
      console.log('Error handling map press:', error);
    }
  };

  const selectedStoreData = selectedStore ? allStores.find(s => s.id === selectedStore) : null;


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Location Bar with Search */}
      <View style={styles.locationBar}>
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>BACK2USE</Text>
        </View>
        <Text style={styles.locationLabel}>Location</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={20} color="#fff" />
          <Text style={styles.locationText}>{currentLocationName || "Default Location"}</Text>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </View>
        
        {/* Search Bar inside green area */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Here"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#6B7280" />
          </TouchableOpacity>
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
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            zoomControlEnabled={true}
            customMapStyle={[
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#00704A"
                  }
                ]
              },
              {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#f5f5f5"
                  }
                ]
              }
            ]}
          >
            {/* Marker cho vị trí người dùng */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                }}
                title="Vị trí của bạn"
                description={currentLocationName}
              >
                <View style={styles.userMarker}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              </Marker>
            )}

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
          
          {/* Fullscreen Button */}
          <TouchableOpacity 
            style={styles.fullscreenButton}
            onPress={() => setIsMapFullscreen(true)}
          >
            <Ionicons name="expand" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Stores</Text>
            <Text style={styles.sectionSubtitle}>{filteredStores.length} stores found</Text>
          </View>
          
          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                storeFilter === "all" && styles.filterButtonActive
              ]}
              onPress={() => setStoreFilter("all")}
            >
              <Text style={[
                styles.filterButtonText,
                storeFilter === "all" && styles.filterButtonTextActive
              ]}>All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                storeFilter === "nearby" && styles.filterButtonActive
              ]}
              onPress={() => setStoreFilter("nearby")}
            >
              <Text style={[
                styles.filterButtonText,
                storeFilter === "nearby" && styles.filterButtonTextActive
              ]}>Nearby</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                storeFilter === "rating" && styles.filterButtonActive
              ]}
              onPress={() => setStoreFilter("rating")}
            >
              <Text style={[
                styles.filterButtonText,
                storeFilter === "rating" && styles.filterButtonTextActive
              ]}>Top Rated</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                storeFilter === "distance" && styles.filterButtonActive
              ]}
              onPress={() => setStoreFilter("distance")}
            >
              <Text style={[
                styles.filterButtonText,
                storeFilter === "distance" && styles.filterButtonTextActive
              ]}>Closest</Text>
            </TouchableOpacity>
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
                          <Ionicons name="location" size={12} color="#00704A" />
                          <Text style={styles.distanceText}>{getStoreDistance(store.id)} km</Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>Open</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.storeAddress} numberOfLines={2}>{store.address}</Text>
                  <View style={styles.storeMeta}>
                    <View style={styles.storeRating}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.ratingText}>{getStoreRating(store.id)}</Text>
                        <Text style={styles.reviewCount}>({Math.floor(Math.random() * 50 + 10)} reviews)</Text>
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
                    <Text style={styles.primaryActionText}>Directions</Text>
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

      {/* Fullscreen Map Modal */}
      {isMapFullscreen && (
        <View style={styles.fullscreenMapContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Header with close button */}
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsMapFullscreen(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle}>Map View</Text>
            <TouchableOpacity 
              style={styles.directionsButton}
              onPress={() => {
                if (userLocation) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${userLocation.coords.latitude},${userLocation.coords.longitude}`;
                  Linking.openURL(url).catch(() => {
                    Alert.alert("Error", "Unable to open Google Maps");
                  });
                }
              }}
            >
              <Ionicons name="navigate" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Fullscreen Map */}
          <MapView
            ref={mapRef}
            style={styles.fullscreenMap}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            toolbarEnabled={false}
            mapType="standard"
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            customMapStyle={[
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#00704A"
                  }
                ]
              },
              {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#f5f5f5"
                  }
                ]
              }
            ]}
          >
            {/* Marker cho vị trí người dùng */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                }}
                title="Vị trí của bạn"
                description={currentLocationName}
              >
                <View style={styles.userMarker}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              </Marker>
            )}

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

          {/* Selected Location Info */}
          {selectedLocation && (
            <View style={styles.selectedLocationCard}>
              <View style={styles.selectedLocationInfo}>
                <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
                <Text style={styles.selectedLocationCoords}>
                  {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.directionsButtonCard}
                onPress={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`;
                  Linking.openURL(url).catch(() => {
                    Alert.alert("Error", "Unable to open Google Maps");
                  });
                }}
              >
                <Ionicons name="navigate" size={24} color="#fff" />
                <Text style={styles.directionsButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>
          )}
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
    backgroundColor: "#F8FAFC",
  },
  locationBar: {
    backgroundColor: "#00704A",
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  },
  brandTitle: { 
    color: '#fff', 
    fontWeight: '800', 
    letterSpacing: 2, 
    fontSize: 14 
  },
  locationLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    minHeight: 48, // Đảm bảo có chiều cao tối thiểu
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "left",
    lineHeight: 20, // Đảm bảo line height
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 16,
    marginTop: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginLeft: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
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
  filterContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterButtonActive: {
    backgroundColor: "#00704A",
    borderColor: "#00704A",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  mapContainer: {
    height: 280,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#00704A",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: "#00704A",
    padding: 8,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  storeCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: "#00704A",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedStoreCard: {
    borderColor: "#00704A",
    borderWidth: 3,
    shadowColor: "#00704A",
    shadowOpacity: 0.3,
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
    backgroundColor: "#00704A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#00704A",
    shadowColor: "#00704A",
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
    backgroundColor: "#e6f7f7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00704A",
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
    backgroundColor: "#00704A",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: "#00704A",
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
  userMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10B981",
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
  fullscreenButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00704A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  fullscreenMapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 1, // Cách navigation layout 80px
    backgroundColor: "#000",
    zIndex: 1000,
    borderRadius: 20,
    overflow: "hidden",
  },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  directionsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00704A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  fullscreenMap: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  selectedLocationCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#00704A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#00704A",
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  selectedLocationCoords: {
    fontSize: 12,
    color: "#6B7280",
  },
  directionsButtonCard: {
    backgroundColor: "#00704A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  directionsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});