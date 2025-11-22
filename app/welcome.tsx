import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import MapView, { Marker, Region } from "react-native-maps";
import { useAuth } from "../context/AuthProvider";
import { businessesApi } from "@/services/api/businessService";
import { Business, NearbyBusiness } from "@/types/business.types";

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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const mapRef = React.useRef<MapView | null>(null);

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

  const filteredStores = businesses.filter(
    (store) =>
      store.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.businessAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchAllBusinesses = async () => {
    try {
      setLoading(true);
      console.log('🔄 Welcome page: Fetching all businesses...');
      
      const response = await businessesApi.getAll({
        page: 1,
        limit: 100, // Get more businesses to display on map
      });
      
      console.log('📡 Welcome page API Response:', response);
      
      if (response.statusCode === 200 && response.data) {
        // Filter only active businesses
        const activeBusinesses = response.data.filter(business => business.isActive && !business.isBlocked);
        setBusinesses(activeBusinesses);
        console.log('✅ Welcome page: Fetched businesses:', activeBusinesses.length);
      } else {
        console.log('❌ Welcome page: Invalid response:', response);
        setBusinesses([]);
      }
    } catch (error) {
      console.error('❌ Welcome page: Error fetching businesses:', error);
      // Fallback to empty array on error
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('📍 Getting user location...');
      
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        Alert.alert(
          'Location Access',
          'The app needs location access to find stores near you. Please grant permission in settings.',
          [{ text: 'OK' }]
        );
        // Use fallback location
        useFallbackLocation();
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      console.log('📍 User location obtained:', userLocation);
      setUserLocation(userLocation);
      setMapRegion({
        ...userLocation,
        latitudeDelta: 0.05, // Wider view to show more businesses
        longitudeDelta: 0.05,
      });
      
      // Fetch all businesses
      console.log('🔍 Fetching all businesses...');
      await fetchAllBusinesses();
    } catch (error) {
      console.error('❌ Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get current location. Using default location.',
        [{ text: 'OK' }]
      );
      useFallbackLocation();
    }
  };

  const useFallbackLocation = async () => {
    // Fallback to default location in Ho Chi Minh City
    const fallbackLocation = {
      latitude: 10.7769, // District 1, HCMC
      longitude: 106.7009,
    };
    console.log('📍 Using fallback location:', fallbackLocation);
    setUserLocation(fallbackLocation);
    setMapRegion({
      ...fallbackLocation,
      latitudeDelta: 0.05, // Wider view to show more businesses
      longitudeDelta: 0.05,
    });
    await fetchAllBusinesses();
  };

  // Calculate distance between two coordinates (Haversine formula)
  // Returns distance in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Convert degrees to radians
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    // Haversine formula
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.5,
        longitudeDelta: mapRegion.longitudeDelta * 0.5,
      }, 300);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 2,
        longitudeDelta: mapRegion.longitudeDelta * 2,
      }, 300);
    }
  };

  const handleDirections = (store: Business) => {
    // API trả về [longitude, latitude] nên cần đảo ngược
    const [longitude, latitude] = store.location.coordinates;
    console.log('🗺️ Opening directions to:', store.businessName, 'at', latitude, longitude);
    
    // Build URL with origin if user location is available
    let url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    if (userLocation) {
      url += `&origin=${userLocation.latitude},${userLocation.longitude}`;
    }
    
    console.log('🔗 Google Maps URL:', url);
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
            <Text style={styles.heroTitle}>Find Stores Near You</Text>
            <Text style={styles.heroSubtitle}>Discover the Back2Use store network</Text>
          </Animated.View>

          {/* Login button at bottom right */}
          <Animated.View style={[styles.heroFooter, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.loginButtonBottom}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.loginButtonBottomText}>Login</Text>
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
              placeholder="Search stores, addresses..."
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
              <Text style={styles.statNumber}>{businesses.length}</Text>
              <Text style={styles.statLabel}>Stores</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="refresh" size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>2.8K</Text>
              <Text style={styles.statLabel}>Kg Reduced</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="trending-up" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>3.2K</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
            >
              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="Your Location"
                  description="This is your current location"
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
                description="FPT University Ho Chi Minh City"
                pinColor="#0F4D3A"
              />
              
              {/* Store Markers */}
              {filteredStores.map((store) => {
                // API trả về [longitude, latitude] nên cần đảo ngược
                const [longitude, latitude] = store.location.coordinates;
                const isOpen = new Date().getHours() >= parseInt(store.openTime.split(':')[0]) && 
                               new Date().getHours() < parseInt(store.closeTime.split(':')[0]);
                console.log('📍 Welcome page business marker:', {
                  name: store.businessName,
                  coordinates: [longitude, latitude],
                  hasLogo: !!store.businessLogoUrl
                });
                
                return (
                  <Marker
                    key={store._id}
                    coordinate={{
                      latitude,
                      longitude,
                    }}
                    title={store.businessName}
                    description={store.businessAddress}
                    onPress={() => setSelectedStore(selectedStore === store._id ? null : store._id)}
                  >
                    {store.businessLogoUrl ? (
                      <View style={styles.markerLogoContainer}>
                        <Image 
                          source={{ uri: store.businessLogoUrl }} 
                          style={styles.markerLogo}
                          resizeMode="cover"
                        />
                        <View style={[styles.markerStatusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
                      </View>
                    ) : null}
                  </Marker>
                );
              })}
            </MapView>
            
            {/* Map Controls */}
            <View style={styles.mapControls}>
              {/* Zoom Controls */}
              <View style={styles.zoomControls}>
                <TouchableOpacity 
                  style={styles.zoomButton}
                  onPress={handleZoomIn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#0F4D3A" />
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity 
                  style={styles.zoomButton}
                  onPress={handleZoomOut}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color="#0F4D3A" />
                </TouchableOpacity>
              </View>
              
              {/* Location Button */}
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="locate" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stores List */}
        <View style={styles.storesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stores Near You</Text>
            <Text style={styles.sectionSubtitle}>{filteredStores.length} stores</Text>
          </View>

          <View style={styles.storesList}>
            {filteredStores.slice(0, 5).map((store) => (
              <TouchableOpacity
                key={store._id}
                style={[
                  styles.storeCard,
                  selectedStore === store._id && styles.selectedStoreCard,
                ]}
                onPress={() => setSelectedStore(selectedStore === store._id ? null : store._id)}
              >
                <View style={styles.storeIcon}>
                  {store.businessLogoUrl ? (
                    <Image 
                      source={{ uri: store.businessLogoUrl }} 
                      style={styles.storeLogo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.storeIconFallback}>
                      <Ionicons name="storefront" size={24} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.storeInfo}>
                  <View style={styles.storeHeader}>
                    <Text style={styles.storeName}>{store.businessName}</Text>
                    {userLocation && (() => {
                      const [longitude, latitude] = store.location.coordinates;
                      // Đảm bảo đúng thứ tự: lat1, lon1, lat2, lon2
                      const distance = calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        latitude,
                        longitude
                      );
                      console.log(`📏 Distance from user to ${store.businessName}:`, {
                        userLocation: { lat: userLocation.latitude, lon: userLocation.longitude },
                        storeLocation: { lat: latitude, lon: longitude },
                        distance: `${distance.toFixed(2)} km`
                      });
                      return (
                        <View style={styles.distanceBadge}>
                          <Ionicons name="location" size={12} color="#0F4D3A" style={{ marginRight: 4 }} />
                          <Text style={styles.distanceText}>
                            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                  <View style={styles.storeAddress}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.addressText}>{store.businessAddress}</Text>
                  </View>
                  <View style={styles.storeFooter}>
                    <View style={styles.operatingHours}>
                      <Ionicons name="time" size={14} color="#6B7280" />
                      <Text style={styles.hoursText}>{store.openTime} - {store.closeTime}</Text>
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
                    <Text style={styles.directionsText}>Directions</Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))}

            {filteredStores.length > 5 && (
              <TouchableOpacity style={styles.moreStoresButton}>
                <Text style={styles.moreStoresText}>
                  View {filteredStores.length - 5} more stores
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
              <Text style={styles.offerBadgeText}>Special Offer</Text>
            </View>
            <Text style={styles.offerTitle}>Get 50 Points</Text>
            <Text style={styles.offerSubtitle}>
              When you register a new account today
            </Text>
            <TouchableOpacity
              style={styles.offerButton}
              onPress={() => router.push("/auth/register")}
            >
              <Ionicons name="gift" size={16} color="#7C3AED" />
              <Text style={styles.offerButtonText}>Get Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Choose Back2Use?</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#0F4D3A20' }]}>
                <Ionicons name="qr-code" size={24} color="#0F4D3A" />
              </View>
              <Text style={styles.featureTitle}>Scan & Borrow</Text>
              <Text style={styles.featureSubtitle}>Easy with just QR code</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="gift" size={24} color="#10B981" />
              </View>
              <Text style={styles.featureTitle}>Earn Points</Text>
              <Text style={styles.featureSubtitle}>Get rewards every return</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="leaf" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.featureTitle}>Greener</Text>
              <Text style={styles.featureSubtitle}>Reduce plastic waste</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#0F4D3A20' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#0F4D3A" />
              </View>
              <Text style={styles.featureTitle}>Safe</Text>
              <Text style={styles.featureSubtitle}>Guaranteed hygiene</Text>
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
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 12,
  },
  zoomControls: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  locationButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4D3A',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeLogo: {
    width: '100%',
    height: '100%',
  },
  storeIconFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F4D3A',
    alignItems: 'center',
    justifyContent: 'center',
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLogoContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLogo: {
    width: '100%',
    height: '100%',
  },
  markerStatusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
