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
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthProvider';
import { useI18n } from '../../../hooks/useI18n';

const { width } = Dimensions.get('window');


export default function Stores() {
  const auth = useAuth();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open-now' | 'nearest' | 'top-rated'>('all');
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  const carouselRef = React.useRef<FlatList>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const router = useRouter();
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
      } catch (error: any) {
        // Silently handle "No valid access token available" errors
        const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                               error?.message?.toLowerCase().includes('no access token');
        if (!isNoTokenError) {
          console.error('Error loading user data:', error);
        }
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
          
          // Get pagination info from root level
          const totalPages = response.totalPages || 1;
          const total = response.total || activeBusinesses.length;
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

  // Pulsing animation for user location
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
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
    
    if (activeFilter === 'open-now') {
      // Filter open stores only, sorted by distance
      const currentHour = new Date().getHours();
      return stores
        .filter(store => {
          const openHour = parseInt(store.openTime.split(':')[0]);
          const closeHour = parseInt(store.closeTime.split(':')[0]);
          return currentHour >= openHour && currentHour < closeHour;
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    if (activeFilter === 'nearest') {
      // Sort by distance (closest first)
      return stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    if (activeFilter === 'top-rated') {
      // Sort by averageRating (highest first), then by distance
      return stores.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA; // Higher rating first
        }
        return (a.distance || 0) - (b.distance || 0); // Then by distance
      });
    }
    
    return stores;
  }, [businesses, activeFilter, userLocation, searchQuery]);


  const insets = useSafeAreaInsets();

  // Handle carousel scroll to highlight marker
  const handleCarouselScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    setSelectedStoreIndex(index);
    if (filteredStores[index]) {
      const store = filteredStores[index];
      const [longitude, latitude] = store.location.coordinates;
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Full Screen Map */}
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
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              scrollEnabled={true}
              zoomEnabled={true}
              rotateEnabled={true}
              pitchEnabled={true}
            >
              {/* User location marker with pulsing animation */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="Your Location"
                  description="This is your current location"
                >
                  <Animated.View
                    style={[
                      styles.userLocationMarker,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    <View style={styles.userLocationDot} />
                    <View style={styles.userLocationPulse} />
                  </Animated.View>
                </Marker>
              )}
              
              {/* Business markers with custom brand icons */}
              {filteredStores.map((store, index) => {
                const [longitude, latitude] = store.location.coordinates;
                const currentHour = new Date().getHours();
                const openHour = parseInt(store.openTime.split(':')[0]);
                const closeHour = parseInt(store.closeTime.split(':')[0]);
                const isOpen = currentHour >= openHour && currentHour < closeHour;
                const isSelected = index === selectedStoreIndex;
                
                return (
                  <Marker
                    key={store._id}
                    coordinate={{
                      latitude,
                      longitude,
                    }}
                    title={store.businessName}
                    description={store.businessAddress}
                    onPress={() => {
                      setSelectedStoreIndex(index);
                      if (carouselRef.current) {
                        carouselRef.current.scrollToIndex({ index, animated: true });
                      }
                    }}
                  >
                    <View style={styles.markerContainer}>
                      {store.businessLogoUrl ? (
                        <View style={[
                          styles.markerLogoContainer,
                          isSelected && styles.markerLogoContainerSelected
                        ]}>
                          <Image 
                            source={{ uri: store.businessLogoUrl }} 
                            style={styles.markerLogo}
                            resizeMode="cover"
                          />
                          <View style={[
                            styles.markerStatusDot, 
                            { backgroundColor: isOpen ? '#10B981' : '#EF4444' }
                          ]} />
                          <View style={[
                            styles.markerPointer,
                            { borderTopColor: isOpen ? '#10B981' : '#EF4444' }
                          ]} />
                        </View>
                      ) : (
                        <View style={[
                          styles.markerIcon,
                          { backgroundColor: isOpen ? '#10B981' : '#EF4444' },
                          isSelected && styles.markerIconSelected
                        ]}>
                          <Ionicons name="storefront" size={16} color="#FFFFFF" />
                          <View style={[
                            styles.markerPointer,
                            { borderTopColor: isOpen ? '#10B981' : '#EF4444' }
                          ]} />
                        </View>
                      )}
                    </View>
                  </Marker>
                );
              })}
            </MapView>
            
            {/* Map Controls */}
            <View style={styles.mapControls}>
              <View style={styles.zoomControls}>
                <TouchableOpacity 
                  style={styles.zoomButton}
                  onPress={handleZoomIn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#00704A" />
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity 
                  style={styles.zoomButton}
                  onPress={handleZoomOut}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color="#00704A" />
                </TouchableOpacity>
              </View>
              
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

      {/* Floating Search Bar */}
      <View style={[styles.searchBarContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or store..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterIconButton}>
            <Ionicons name="options-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Filter Chips */}
      <View style={[styles.filterChipsContainer, { top: insets.top + 70 }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'open-now' && styles.filterChipActive]}
            onPress={() => setActiveFilter('open-now')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'open-now' && styles.filterChipTextActive]}>
              Open Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'nearest' && styles.filterChipActive]}
            onPress={() => setActiveFilter('nearest')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'nearest' && styles.filterChipTextActive]}>
              Nearest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'top-rated' && styles.filterChipActive]}
            onPress={() => setActiveFilter('top-rated')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'top-rated' && styles.filterChipTextActive]}>
              Top Rated
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Horizontal Store Carousel at Bottom */}
      {filteredStores.length > 0 && (
        <View style={[styles.carouselContainer, { paddingBottom: insets.bottom }]}>
          <FlatList
            ref={carouselRef}
            data={filteredStores}
            renderItem={({ item, index }) => {
              const [longitude, latitude] = item.location.coordinates;
              const currentHour = new Date().getHours();
              const openHour = parseInt(item.openTime.split(':')[0]);
              const closeHour = parseInt(item.closeTime.split(':')[0]);
              const isOpen = currentHour >= openHour && currentHour < closeHour;
              const distance = item.distance !== undefined 
                ? item.distance 
                : (userLocation 
                    ? calculateDistance(userLocation.latitude, userLocation.longitude, latitude, longitude)
                    : null);
              
              return (
                <TouchableOpacity 
                  style={styles.carouselCard}
                  onPress={() => router.push(`/(protected)/customer/store-detail/${item._id}`)}
                  activeOpacity={0.9}
                >
                  {/* Store Thumbnail */}
                  <View style={styles.carouselThumbnail}>
                    {item.businessLogoUrl ? (
                      <Image 
                        source={{ uri: item.businessLogoUrl }} 
                        style={styles.carouselThumbnailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.carouselThumbnailFallback}>
                        <Ionicons name="storefront" size={24} color="#00704A" />
                      </View>
                    )}
                  </View>
                  
                  {/* Store Info */}
                  <View style={styles.carouselInfo}>
                    <Text style={styles.carouselStoreName} numberOfLines={1}>
                      {item.businessName}
                    </Text>
                    
                    {/* Rating */}
                    <View style={styles.carouselRatingRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.carouselRatingText}>
                        {item.averageRating ? item.averageRating.toFixed(1) : '0.0'}
                      </Text>
                      {item.totalReviews !== undefined && item.totalReviews > 0 && (
                        <Text style={styles.carouselRatingCount}>
                          ({item.totalReviews})
                        </Text>
                      )}
                    </View>
                    
                    {/* Distance and Hours */}
                    <View style={styles.carouselMetaRow}>
                      {distance !== null && (
                        <View style={styles.carouselMetaItem}>
                          <Ionicons name="location-outline" size={12} color="#6B7280" />
                          <Text style={styles.carouselMetaText}>
                            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                          </Text>
                        </View>
                      )}
                      <View style={styles.carouselMetaItem}>
                        <Ionicons name="time-outline" size={12} color="#6B7280" />
                        <Text style={styles.carouselMetaText}>
                          {item.openTime} - {item.closeTime}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Status Badge */}
                    <View style={[styles.carouselStatusBadge, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]}>
                      <Text style={styles.carouselStatusText}>
                        {isOpen ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Directions Button */}
                  <TouchableOpacity 
                    style={styles.carouselDirectionsButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDirections(item);
                    }}
                  >
                    <Ionicons name="navigate" size={20} color="#00704A" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
            snapToInterval={width - 40}
            decelerationRate="fast"
            getItemLayout={(data, index) => ({
              length: width - 40,
              offset: (width - 40) * index,
              index,
            })}
          />
        </View>
      )}
    </View>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Full Screen Map
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    right: 16,
    bottom: 200,
    zIndex: 10,
  },
  zoomControls: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  zoomButton: {
    width: 44,
    height: 44,
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
    backgroundColor: '#00704A',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  // User Location Marker with Pulsing
  userLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    zIndex: 1,
  },
  // Map Markers - Custom Brand Icons
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLogoContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: '#FFFFFF',
  },
  markerLogoContainerSelected: {
    borderColor: '#00704A',
    borderWidth: 4,
    transform: [{ scale: 1.15 }],
  },
  markerLogo: {
    width: '100%',
    height: '100%',
  },
  markerStatusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerPointer: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  markerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerIconSelected: {
    borderColor: '#00704A',
    borderWidth: 4,
    transform: [{ scale: 1.15 }],
  },
  // Floating Search Bar
  searchBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterIconButton: {
    marginLeft: 12,
    padding: 4,
  },
  // Floating Filter Chips
  filterChipsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
    paddingHorizontal: 16,
  },
  filterChipsScroll: {
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: '#00704A',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Horizontal Store Carousel
  carouselContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  carouselCard: {
    width: width - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  carouselThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 16,
  },
  carouselThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  carouselThumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  carouselInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselStoreName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  carouselRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  carouselRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 2,
  },
  carouselRatingCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  carouselMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
    flexWrap: 'wrap',
  },
  carouselMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  carouselMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  carouselStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  carouselDirectionsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});