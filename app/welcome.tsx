import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "../context/AuthProvider";
import { mockStores } from "../lib/mock-data";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { state } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.8412,
    longitude: 106.8099,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Auto get location when app opens
    getCurrentLocation();
  }, []);

  // Redirect if already authenticated (only after hydration)
  useEffect(() => {
    if (state.isHydrated && state.isAuthenticated && state.role) {
      const destination = state.role === "customer" 
        ? "/(protected)/customer" 
        : state.role === "business" 
        ? "/(protected)/business" 
        : "/(protected)/admin";
      router.replace(destination);
    }
  }, [state.isHydrated, state.isAuthenticated, state.role]);

  const filteredStores = mockStores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentLocation = () => {
    // Simulate getting current location (in real app, use expo-location)
    const mockLocation = {
      latitude: 10.8412 + (Math.random() - 0.5) * 0.005,
      longitude: 106.8099 + (Math.random() - 0.5) * 0.005,
    };
    console.log('Setting user location:', mockLocation);
    setUserLocation(mockLocation);
    setMapRegion({
      ...mockLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleDirections = (store: any) => {
    console.log('Opening directions to:', store.name, store.latitude, store.longitude);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    console.log('Google Maps URL:', url);
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở Google Maps");
    });
  };


  // Show loading while hydrating or if already authenticated
  if (!state.isHydrated || state.isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F4D3A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <ImageBackground
        source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <SafeAreaView style={styles.heroSafeArea}>
          {/* Top row: Logo, Brand Text */}
          <Animated.View style={[styles.heroTopRow, { opacity: fadeAnim }]}>
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <Image source={require("../assets/images/logo2.png")} style={styles.logo} />
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTitle}>Back2Use</Text>
                <Text style={styles.brandSubtitle}>Reusable Packaging</Text>
              </View>
            </View>
          </Animated.View>

          {/* Title and subtitle */}
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim }]}>
            <Text style={styles.heroTitle}>Tìm cửa hàng gần bạn</Text>
            <Text style={styles.heroSubtitle}>Khám phá mạng lưới cửa hàng Back2Use</Text>
          </Animated.View>

          {/* Login button at bottom right */}
          <Animated.View style={[styles.heroFooter, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.loginButtonBottom}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.loginButtonBottomText}>Đăng nhập</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm cửa hàng, địa chỉ..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#0F4D3A20' }]}>
                <Ionicons name="storefront" size={20} color="#0F4D3A" />
              </View>
              <Text style={styles.statNumber}>{mockStores.length}</Text>
              <Text style={styles.statLabel}>Cửa hàng</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="refresh" size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>2.8K</Text>
              <Text style={styles.statLabel}>Kg giảm</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="trending-up" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>3.2K</Text>
              <Text style={styles.statLabel}>Người dùng</Text>
            </View>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              onRegionChangeComplete={setMapRegion}
            >
              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="Vị trí của bạn"
                  description="Đây là vị trí hiện tại của bạn"
                  pinColor="#3B82F6"
                />
              )}
              
              {/* FPT HCM Marker */}
              <Marker
                coordinate={{
                  latitude: 10.8412,
                  longitude: 106.8099,
                }}
                title="FPT University HCM"
                description="Trường Đại học FPT TP.HCM"
                pinColor="#0F4D3A"
              />
              
              {/* Store Markers */}
              {filteredStores.slice(0, 6).map((store) => (
                <Marker
                  key={store.id}
                  coordinate={{
                    latitude: store.latitude,
                    longitude: store.longitude,
                  }}
                  title={store.name}
                  description={store.address}
                  onPress={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
                />
              ))}
            </MapView>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.locationButtonText}>Vị trí của tôi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stores List */}
        <View style={styles.storesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cửa hàng gần bạn</Text>
            <Text style={styles.sectionSubtitle}>{filteredStores.length} cửa hàng</Text>
          </View>

          <View style={styles.storesList}>
            {filteredStores.slice(0, 5).map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[
                  styles.storeCard,
                  selectedStore === store.id && styles.selectedStoreCard,
                ]}
                onPress={() => setSelectedStore(selectedStore === store.id ? null : store.id)}
              >
                <View style={styles.storeIcon}>
                  <Ionicons name="storefront" size={24} color="#0F4D3A" />
                </View>
                <View style={styles.storeInfo}>
                  <View style={styles.storeHeader}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>
                        {(Math.random() * 3 + 0.5).toFixed(1)} km
                      </Text>
                    </View>
                  </View>
                  <View style={styles.storeAddress}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.addressText}>{store.address}</Text>
                  </View>
                  <View style={styles.storeFooter}>
                    <View style={styles.operatingHours}>
                      <Ionicons name="time" size={14} color="#6B7280" />
                      <Text style={styles.hoursText}>{store.operatingHours}</Text>
                    </View>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={14} color="#FBBF24" />
                      <Text style={styles.ratingText}>
                        4.{Math.floor(Math.random() * 5 + 5)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.storeActions}>
                  <TouchableOpacity 
                    style={styles.directionsButton}
                    onPress={() => handleDirections(store)}
                  >
                    <Ionicons name="navigate" size={16} color="#0F4D3A" />
                    <Text style={styles.directionsText}>Chỉ đường</Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))}

            {filteredStores.length > 5 && (
              <TouchableOpacity style={styles.moreStoresButton}>
                <Text style={styles.moreStoresText}>
                  Xem thêm {filteredStores.length - 5} cửa hàng
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#0F4D3A" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Special Offer */}
        <View style={styles.offerSection}>
          <View style={styles.offerCard}>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>Ưu đãi đặc biệt</Text>
            </View>
            <Text style={styles.offerTitle}>Nhận 50 điểm</Text>
            <Text style={styles.offerSubtitle}>
              Khi đăng ký tài khoản mới ngay hôm nay
            </Text>
            <TouchableOpacity
              style={styles.offerButton}
              onPress={() => router.push("/auth/register")}
            >
              <Ionicons name="gift" size={16} color="#7C3AED" />
              <Text style={styles.offerButtonText}>Nhận ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Tại sao chọn Back2Use?</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#0F4D3A20' }]}>
                <Ionicons name="qr-code" size={24} color="#0F4D3A" />
              </View>
              <Text style={styles.featureTitle}>Quét & Mượn</Text>
              <Text style={styles.featureSubtitle}>Dễ dàng chỉ với QR code</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="gift" size={24} color="#10B981" />
              </View>
              <Text style={styles.featureTitle}>Tích điểm</Text>
              <Text style={styles.featureSubtitle}>Nhận thưởng mỗi lần trả</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="leaf" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.featureTitle}>Xanh hơn</Text>
              <Text style={styles.featureSubtitle}>Giảm rác thải nhựa</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#0F4D3A20' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#0F4D3A" />
              </View>
              <Text style={styles.featureTitle}>An toàn</Text>
              <Text style={styles.featureSubtitle}>Đảm bảo vệ sinh</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  heroSection: {
    height: screenHeight * 0.32,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  brandTextContainer: {
    marginLeft: -8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    marginLeft: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 12,
  },
  heroFooter: {
    alignItems: 'flex-end',
    paddingTop: 20,
  },
  loginButtonBottom: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  loginButtonBottomText: {
    fontSize: 16,
    color: '#0F4D3A',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
    marginTop: -5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,77,58,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  storesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    
  },
  storesList: {
    gap: 12,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedStoreCard: {
    borderWidth: 2,
    borderColor: '#0F4D3A',
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0F4D3A20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  storeAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operatingHours: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directionsText: {
    fontSize: 12,
    color: '#0F4D3A',
    fontWeight: '600',
    marginLeft: 4,
  },
  moreStoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
  },
  moreStoresText: {
    fontSize: 16,
    color: '#0F4D3A',
    fontWeight: '600',
    marginRight: 8,
  },
  offerSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  offerCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  offerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  offerBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  heroSafeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
