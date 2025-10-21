import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { materialsApi } from '../../../lib/api';

interface Material {
  id: string;
  materialName: string;
  maximumReuse: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function MaterialsScreen() {
  const { state } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Form states
  const [formData, setFormData] = useState({
    materialName: '',
    maximumReuse: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Mock data for demonstration
  const mockMaterials: Material[] = [
    {
      id: '1',
      materialName: 'Plastic',
      maximumReuse: 100,
      description: 'Durable and lightweight plastic material',
      status: 'approved',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      materialName: 'Glass',
      maximumReuse: 50,
      description: 'Clear glass material for containers',
      status: 'pending',
      createdAt: '2024-01-14',
    },
    {
      id: '3',
      materialName: 'Stainless Steel',
      maximumReuse: 200,
      description: 'High-quality stainless steel for durability',
      status: 'approved',
      createdAt: '2024-01-13',
    },
    {
      id: '4',
      materialName: 'Ceramic',
      maximumReuse: 75,
      description: 'Traditional ceramic material',
      status: 'rejected',
      createdAt: '2024-01-12',
    },
  ];

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // Try to load from API first, fallback to mock data
      try {
        const response = await materialsApi.listMy({ page: 1, limit: 50 });
        if (response.data?.docs || response.data?.items) {
          const materialsList = response.data.docs || response.data.items || [];
          setMaterials(materialsList.map((item: any) => ({
            id: item._id || item.id,
            materialName: item.materialName,
            maximumReuse: item.maximumReuse || 0,
            description: item.description || '',
            status: item.status || 'pending',
            createdAt: item.createdAt || new Date().toISOString().split('T')[0],
          })));
        } else {
          // Fallback to mock data
          setMaterials(mockMaterials);
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError);
        // Fallback to mock data
        setMaterials(mockMaterials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      Alert.alert('Error', 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const createMaterial = async () => {
    if (!formData.materialName.trim() || !formData.maximumReuse.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Try to create via API first
      try {
        const response = await materialsApi.create({
          materialName: formData.materialName,
          maximumReuse: parseInt(formData.maximumReuse),
          description: formData.description,
        });
        
        // If API call successful, reload materials
        await loadMaterials();
        setShowCreateModal(false);
        setFormData({ materialName: '', maximumReuse: '', description: '' });
        Alert.alert('Success', 'Material created successfully');
      } catch (apiError) {
        console.log('API not available, using mock creation:', apiError);
        
        // Fallback to mock creation
        const newMaterial: Material = {
          id: Date.now().toString(),
          materialName: formData.materialName,
          maximumReuse: parseInt(formData.maximumReuse),
          description: formData.description,
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0],
        };
        
        setMaterials(prev => [newMaterial, ...prev]);
        setShowCreateModal(false);
        setFormData({ materialName: '', maximumReuse: '', description: '' });
        Alert.alert('Success', 'Material created successfully (offline mode)');
      }
    } catch (error) {
      console.error('Error creating material:', error);
      Alert.alert('Error', 'Failed to create material');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || material.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading materials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Materials Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'rejected'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              statusFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => setStatusFilter(filter as any)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === filter && styles.activeFilterButtonText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Materials List */}
      <ScrollView style={styles.materialsList} showsVerticalScrollIndicator={false}>
        {filteredMaterials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No materials found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first material'}
            </Text>
          </View>
        ) : (
          filteredMaterials.map((material) => (
            <View key={material.id} style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <Text style={styles.materialName}>{material.materialName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(material.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(material.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.materialDescription}>{material.description}</Text>
              
              <View style={styles.materialDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="refresh" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Max Reuse: {material.maximumReuse}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{material.createdAt}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Material Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Material</Text>
            <TouchableOpacity onPress={createMaterial} disabled={submitting}>
              <Text style={[styles.saveButton, submitting && styles.disabledButton]}>
                {submitting ? 'Creating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Material Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter material name"
                value={formData.materialName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, materialName: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Reuse *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter maximum reuse count"
                value={formData.maximumReuse}
                onChangeText={(text) => setFormData(prev => ({ ...prev, maximumReuse: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter material description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#059669',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeFilterButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  materialsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  materialCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#059669',
  },
  cancelButton: {
    fontSize: 16,
    color: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});