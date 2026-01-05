import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { MaterialItem, materialsApi } from '../../../lib/api';

export default function ApprovedMaterialsScreen() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadApprovedMaterials();
  }, []);

  const loadApprovedMaterials = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
        setMaterials([]);
      } else {
        setLoading(true);
      }

      console.log('📡 Loading approved materials, page:', refresh ? 1 : page);
      
      const response = await materialsApi.listApproved(refresh ? 1 : page, 20);
      console.log('📊 Approved materials response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        const newMaterials = response.data.map((item: any) => ({
          _id: item._id,
          materialName: item.materialName,
          maximumReuse: item.maximumReuse || 0,
          description: item.description || '',
          status: item.status || 'approved',
          createdAt: item.createdAt || new Date().toISOString().split('T')[0],
        }));
        
        if (refresh) {
          setMaterials(newMaterials);
        } else {
          setMaterials(prev => [...prev, ...newMaterials]);
        }
        
        setHasMore(newMaterials.length === 20);
        setPage(prev => prev + 1);
      } else {
        console.log('📝 No approved materials found');
        setMaterials([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ Error loading approved materials:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const renderMaterial = ({ item }: { item: MaterialItem }) => (
    <View style={styles.materialCard}>
      <View style={styles.materialHeader}>
        <Text style={styles.materialName}>{item.materialName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'approved') }]}>
          <Text style={styles.statusText}>{getStatusText(item.status || 'approved')}</Text>
        </View>
      </View>
      
      <Text style={styles.materialDescription}>{item.description || ''}</Text>
      
      <View style={styles.materialDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="refresh" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Max Reuse: {item.maximumReuse}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.createdAt}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No approved materials</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search' : 'No materials have been approved yet'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approved Materials</Text>
        <Text style={styles.headerSubtitle}>Browse approved materials</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Materials List */}
      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item._id}
        renderItem={renderMaterial}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadApprovedMaterials(true)}
            colors={['#0F4D3A']}
            tintColor="#0F4D3A"
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            loadApprovedMaterials();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && !refreshing ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#0F4D3A" />
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    padding: 20,
  },
  materialCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  materialDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  materialDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});
