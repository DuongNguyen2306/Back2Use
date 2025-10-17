import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../../../context/AuthProvider';
import { getCurrentUserProfileWithAutoRefresh, User } from '../../../lib/api';

const { width } = Dimensions.get('window');

interface Store {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string;
  isOpen: boolean;
  phone: string;
  latitude: number;
  longitude: number;
}

export default function Stores() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'top-rated' | 'closest'>('all');
  const [searchText, setSearchText] = useState('');

  // Load user data
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

    loadUserData();
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Mock data
  const stores: Store[] = [
    {
      id: '1',
      name: 'Back2Use Store - District 1',
      address: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      rating: 4.5,
      distance: '0.8 km',
      isOpen: true,
      phone: '028-1234-5678',
      latitude: 10.7769,
      longitude: 106.7009,
    },
    {
      id: '2',
      name: 'Back2Use Store - District 3',
      address: '456 Le Van Sy, District 3, Ho Chi Minh City',
      rating: 4.2,
      distance: '1.2 km',
      isOpen: true,
      phone: '028-2345-6789',
      latitude: 10.7831,
      longitude: 106.6969,
    },
    {
      id: '3',
      name: 'Back2Use Store - District 7',
      address: '789 Nguyen Thi Thap, District 7, Ho Chi Minh City',
      rating: 4.8,
      distance: '2.5 km',
      isOpen: false,
      phone: '028-3456-7890',
      latitude: 10.7374,
      longitude: 106.7223,
    },
    {
      id: '4',
      name: 'Back2Use Store - District 10',
      address: '321 Cach Mang Thang 8, District 10, Ho Chi Minh City',
      rating: 4.0,
      distance: '1.8 km',
      isOpen: true,
      phone: '028-4567-8901',
      latitude: 10.7678,
      longitude: 106.6668,
    },
    {
      id: '5',
      name: 'Back2Use Store - District 11',
      address: '654 Ly Thuong Kiet, District 11, Ho Chi Minh City',
      rating: 4.3,
      distance: '0.5 km',
      isOpen: true,
      phone: '028-5678-9012',
      latitude: 10.7678,
      longitude: 106.6668,
    },
  ];

  const filteredStores = stores.filter(store => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'nearby') return parseFloat(store.distance) <= 1.0;
    if (activeFilter === 'top-rated') return store.rating >= 4.5;
    if (activeFilter === 'closest') return parseFloat(store.distance) <= 0.8;
    return true;
  });

  const renderStoreCard = (store: Store) => (
    <View key={store.id} style={styles.storeCard}>
      <View style={styles.storeHeader}>
                <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={20} color="#FFFFFF" />
                </View>
        <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeAddress}>{store.address}</Text>
          <View style={styles.storeDetails}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {store.rating}</Text>
                        </View>
            <Text style={styles.distance}>{store.distance}</Text>
            <View style={[styles.statusBadge, { backgroundColor: store.isOpen ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>
                {store.isOpen ? 'Open' : 'Closed'}
              </Text>
                    </View>
                  </View>
                </View>
              </View>
                
              <View style={styles.storeActions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Get Directions</Text>
                </TouchableOpacity>
        
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="call" size={16} color="#0F4D3A" />
                  </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="eye" size={16} color="#0F4D3A" />
                </TouchableOpacity>
                </View>
              </View>
        </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
            </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>Loading...</Text>
                </View>
                  </View>
                </View>
              </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.heroHeaderArea}>
        <View style={styles.topBar}>
          <Text style={styles.brandTitle}>BACK2USE</Text>
              </View>

        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
            <Text style={styles.greetingName}>{(user as any)?.fullName || user?.name || "User"}</Text>
                    </View>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{((user as any)?.fullName || user?.name || "U").charAt(0).toUpperCase()}</Text>
                    </View>
                </View>
              </View>

      <ScrollView style={styles.scrollContent}>
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stores</Text>
              </View>

        {/* Search & Map Section */}
        <View style={styles.searchSection}>
          {/* Location Dropdown */}
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.locationText}>District 11, Vietnam</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Here"
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
          <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
              initialRegion={{
                latitude: 10.7769,
                longitude: 106.7009,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            >
              {filteredStores.map((store) => (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.latitude,
                  longitude: store.longitude,
                }}
                title={store.name}
                description={store.address}
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.markerIcon, { backgroundColor: store.isOpen ? '#10B981' : '#EF4444' }]}>
                      <Ionicons name="storefront" size={16} color="#FFFFFF" />
                    </View>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
          </View>
          
        {/* Store List Section */}
        <View style={styles.storeListSection}>
          <Text style={styles.nearbyStoresTitle}>Nearby Stores</Text>
          
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
            {filteredStores.map(renderStoreCard)}
      </View>
              </View>
            </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  heroHeaderArea: {
    backgroundColor: '#00704A',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4,
  },
  brandTitle: { 
    color: '#fff', 
    fontWeight: '800', 
    letterSpacing: 2, 
    fontSize: 14,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  greetingName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
  },
  avatarLg: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarLgText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchSection: {
    marginBottom: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  storeListSection: {
    marginTop: 8,
  },
  nearbyStoresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#0F4D3A',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  storeList: {
    gap: 16,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  storeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  storeIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#0F4D3A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  distance: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0F4D3A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});