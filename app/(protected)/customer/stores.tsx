import { businessesApi } from '@/services/api/businessService';
import { getCurrentUserProfileWithAutoRefresh } from '@/services/api/userService';
import { User } from '@/types/auth.types';
import { Business } from '@/types/business.types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';

const { width } = Dimensions.get('window');


export default function Stores() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'top-rated' | 'closest'>('all');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const router = useRouter();
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Pagination for stores
  const [storePage, setStorePage] = useState(1);
  const [storeTotalPages, setStoreTotalPages] = useState(1);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapRef = React.useRef<MapView | null>(null);

  // Load user data and nearby businesses
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUserProfileWithAutoRefresh();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
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
            'Location Permission',
            'The app needs location permission to find stores near you. Please grant permission in settings.',
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
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        
        // Fetch all businesses
        await loadAllBusinesses(1, false);
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
        latitude: fallbackLocation.latitude,
        longitude: fallbackLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      await loadAllBusinesses(1, false);
    };

    const loadAllBusinesses = async (page: number = 1, append: boolean = false) => {
      try {
        setBusinessesLoading(true);
        
        const response = await businessesApi.getAll({
          page: page,
          limit: 20,
        });
        
        if (response.statusCode === 200 && response.data) {
          // Filter only active businesses
          const activeBusinesses = response.data.filter(business => business.isActive && !business.isBlocked);
          
          // Get pagination info
          const totalPages = (response as any).totalPages || 1;
          setStoreTotalPages(totalPages);
          setHasMoreStores(page < totalPages);
          
          if (append) {
            setBusinesses(prev => {
              const combined = [...prev, ...activeBusinesses];
              // Remove duplicates by ID
              return combined.filter((business, index, self) =>
                index === self.findIndex(b => b._id === business._id)
              );
            });
          } else {
            setBusinesses(activeBusinesses);
          }
        } else {
          if (!append) {
            setBusinesses([]);
          }
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
        if (!append) {
          setBusinesses([]);
        }
      } finally {
        setBusinessesLoading(false);
      }
    };

    loadUserData();
    getCurrentLocation();
  }, []);



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
    if (mapRef.current && mapRegion) {
      mapRef.current.animateToRegion({
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.5,
        longitudeDelta: mapRegion.longitudeDelta * 0.5,
      }, 300);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current && mapRegion) {
      mapRef.current.animateToRegion({
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 2,
        longitudeDelta: mapRegion.longitudeDelta * 2,
      }, 300);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Please grant location permission');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);
      const newRegion = {
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setMapRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleDirections = (store: Business) => {
    const [longitude, latitude] = store.location.coordinates;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    if (userLocation) {
      url += `&origin=${userLocation.latitude},${userLocation.longitude}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open Google Maps");
    });
  };

  // Get unique categories from businesses
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    businesses.forEach(business => {
      if (business.businessType) {
        uniqueCategories.add(business.businessType);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [businesses]);

  // Filter businesses based on filter criteria, search, and category
  const filteredStores = React.useMemo(() => {
    if (businesses.length === 0) {
      return [];
    }
    
    // Apply search filter
    let filtered = businesses;
    if (searchQuery.trim()) {
      filtered = businesses.filter(store =>
        store.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.businessAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(store => store.businessType === selectedCategory);
    }
    
    // If no user location, return filtered businesses
    if (!userLocation) {
      return filtered;
    }
    
    // Calculate distance for all stores
    let stores = filtered.map(store => {
      const [longitude, latitude] = store.location.coordinates;
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        latitude,
        longitude
      );
      return { ...store, distance };
    });
    
    // Filter criteria
    if (activeFilter === 'all') {
      // Sort by distance for all stores (closest first)
      return stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    if (activeFilter === 'nearby') {
      // Within 5km, sorted by distance
      return stores
        .filter(store => (store.distance || 0) <= 5)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    if (activeFilter === 'top-rated') {
      // We don't have rating data from API, so return all sorted by distance
      return stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    if (activeFilter === 'closest') {
      // Sort by distance and return closest ones
      return stores
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10); // Top 10 closest
    }
    
    return stores;
  }, [businesses, activeFilter, userLocation, searchQuery, selectedCategory]);

  const renderStoreCard = (store: Business & { distance?: number }) => {
    const [longitude, latitude] = store.location.coordinates;
    const currentHour = new Date().getHours();
    const openHour = parseInt(store.openTime.split(':')[0]);
    const closeHour = parseInt(store.closeTime.split(':')[0]);
    const isOpen = currentHour >= openHour && currentHour < closeHour;
    
    // Get distance from store object (calculated in filteredStores)
    // If distance is not available, calculate it
    const distance = store.distance !== undefined 
      ? store.distance 
      : (userLocation 
          ? calculateDistance(userLocation.latitude, userLocation.longitude, latitude, longitude)
          : null);
    
    return (
      <TouchableOpacity 
        key={store._id} 
        style={styles.storeCard}
        onPress={() => router.push(`/(protected)/customer/store-detail/${store._id}`)}
      >
        {/* Logo - Left Side */}
        <View style={styles.storeLogoContainer}>
          {store.businessLogoUrl ? (
            <Image 
              source={{ uri: store.businessLogoUrl }} 
              style={styles.storeLogoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.storeLogoFallback}>
              <Ionicons name="storefront" size={32} color="#0F4D3A" />
            </View>
          )}
        </View>
        
        {/* Information - Middle */}
        <View style={styles.storeInfoContainer}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.businessName}
          </Text>
          <Text style={styles.storeType} numberOfLines={1}>
            {store.businessType}
          </Text>
          <Text style={styles.storeAddress} numberOfLines={2}>
            {store.businessAddress}
          </Text>
          
          {/* Rating & Products Count */}
          <View style={styles.storeMetaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
            <View style={styles.productsCountContainer}>
              <Ionicons name="cube-outline" size={14} color="#6B7280" />
              <Text style={styles.productsCountText}>Products</Text>
            </View>
          </View>
          
          {/* Status & Distance Row */}
          <View style={styles.storeStatusRow}>
            {distance !== null && (
              <Text style={styles.distanceText}>
                {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
              </Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Action Buttons - Right Side */}
        <View style={styles.storeActionsContainer}>
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDirections(store);
            }}
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity 
              style={[styles.secondaryIconButton, { marginLeft: 0 }]}
              onPress={(e) => {
                e.stopPropagation();
                if (store.businessPhone) {
                  Linking.openURL(`tel:${store.businessPhone}`);
                }
              }}
            >
              <Ionicons name="call-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.headerSafeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Stores</Text>
            <View style={styles.headerProfile}>
              <Text style={styles.headerProfileText}>U</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Unified Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stores</Text>
          <TouchableOpacity 
            style={styles.headerProfile}
            onPress={() => router.push('/(protected)/customer/my-profile')}
          >
            <Text style={styles.headerProfileText}>
              {(user?.name || user?.fullName || 'U').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map View */}
        <View style={styles.mapSection}>

          <View style={styles.mapContainer}>
            {businessesLoading ? (
              <View style={styles.mapLoadingContainer}>
                <Text style={styles.mapLoadingText}>Loading map...</Text>
              </View>
            ) : (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={mapRegion || {
                    latitude: 10.7769,
                    longitude: 106.7009,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  region={mapRegion || undefined}
                  onRegionChangeComplete={setMapRegion}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  showsCompass={true}
                  showsScale={true}
                >
                  {/* User location marker */}
                  {userLocation && (
                    <Marker
                      coordinate={userLocation}
                      title="Your Location"
                      description="This is your current location"
                      pinColor="#3B82F6"
                    />
                  )}
                  
                  {/* Business markers */}
                  {filteredStores.map((store) => {
                    // API returns [longitude, latitude] so we need to reverse
                    const [longitude, latitude] = store.location.coordinates;
                    const isOpen = new Date().getHours() >= parseInt(store.openTime.split(':')[0]) && 
                                   new Date().getHours() < parseInt(store.closeTime.split(':')[0]);
                    
                    return (
                      <Marker
                        key={store._id}
                        coordinate={{
                          latitude,
                          longitude,
                        }}
                        title={store.businessName}
                        description={store.businessAddress}
                      >
                        <View style={styles.markerContainer}>
                          {store.businessLogoUrl ? (
                            <View style={styles.markerLogoContainer}>
                              <Image 
                                source={{ uri: store.businessLogoUrl }} 
                                style={styles.markerLogo}
                                resizeMode="cover"
                              />
                              <View style={[styles.markerStatusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
                            </View>
                          ) : (
                            <View style={[styles.markerIcon, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]}>
                              <Ionicons name="storefront" size={16} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
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
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity 
                      style={styles.locationButton}
                      onPress={handleGetCurrentLocation}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="locate" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Store List Section */}
        <View style={styles.storeListSection}>
          <Text style={styles.sectionTitle}>Stores</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stores..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter */}
          {categories.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
            >
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeFilterTabText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'nearby' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('nearby')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'nearby' && styles.activeFilterTabText]}>
                Nearby
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'top-rated' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('top-rated')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'top-rated' && styles.activeFilterTabText]}>
                Top Rated
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'closest' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('closest')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'closest' && styles.activeFilterTabText]}>
                Closest
              </Text>
            </TouchableOpacity>
          </View>

          {/* Store Cards */}
          <View style={styles.storeList}>
            {filteredStores.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No stores found</Text>
              </View>
            ) : (
              filteredStores.map(renderStoreCard)
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header Styles
  headerSafeArea: {
    backgroundColor: '#0F4D3A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F4D3A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  // Map Section
  mapSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Map Controls
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
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
    marginBottom: 12,
  },
  zoomButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  locationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4D3A',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Map Markers
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
  markerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Store List Section
  storeListSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#0F4D3A',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  // Store List
  storeList: {
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  // Store Card
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Store Logo (Left)
  storeLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  storeLogoImage: {
    width: '100%',
    height: '100%',
  },
  storeLogoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  // Store Info (Middle)
  storeInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeType: {
    fontSize: 13,
    color: '#00704A',
    fontWeight: '600',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  productsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productsCountText: {
    fontSize: 13,
    color: '#6B7280',
  },
  storeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Store Actions (Right)
  storeActionsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4D3A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
  },
  secondaryIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0F4D3A',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
});