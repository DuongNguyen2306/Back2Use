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
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
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

  // Reload materials when activeTab changes
  useEffect(() => {
    if (activeTab) {
      loadMaterials();
    }
  }, [activeTab]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading materials...');
      
      // Try to load from API first, fallback to mock data
      try {
        let response;
        
        if (activeTab === 'approved') {
          console.log('📡 Calling materials API listApproved...');
          response = await materialsApi.listApproved(1, 50);
        } else {
          console.log('📡 Calling materials API listMy...');
          response = await materialsApi.listMy({ 
            status: activeTab === 'all' ? undefined : activeTab as any,
            page: 1, 
            limit: 50 
          });
        }
        
        console.log('📊 API response:', response);
        
        // Check if response has data array directly
        if (response.data && Array.isArray(response.data)) {
          console.log('📋 Materials list from API (direct array):', response.data);
          
          const mappedMaterials = response.data.map((item: any) => ({
            id: item._id || item.id,
            materialName: item.materialName,
            maximumReuse: item.maximumReuse || 0,
            description: item.description || '',
            status: item.status || 'pending',
            createdAt: item.createdAt || new Date().toISOString().split('T')[0],
          }));
          
          console.log('🔄 Mapped materials:', mappedMaterials);
          setMaterials(mappedMaterials);
        } else if (response.data?.docs || response.data?.items) {
          const materialsList = response.data.docs || response.data.items || [];
          console.log('📋 Materials list from API (nested):', materialsList);
          
          const mappedMaterials = materialsList.map((item: any) => ({
            id: item._id || item.id,
            materialName: item.materialName,
            maximumReuse: item.maximumReuse || 0,
            description: item.description || '',
            status: item.status || 'pending',
            createdAt: item.createdAt || new Date().toISOString().split('T')[0],
          }));
          
          console.log('🔄 Mapped materials:', mappedMaterials);
          setMaterials(mappedMaterials);
        } else {
          console.log('📝 No data from API, using mock data');
          console.log('📊 Response structure:', response);
          // Fallback to mock data
          setMaterials(mockMaterials);
        }
      } catch (apiError) {
        console.log('❌ API not available, using mock data:', apiError);
        console.log('❌ API Error details:', {
          message: (apiError as any)?.message,
          response: (apiError as any)?.response?.data,
          status: (apiError as any)?.response?.status
        });
        // Fallback to mock data
        setMaterials(mockMaterials);
      }
    } catch (error) {
      console.error('❌ Error loading materials:', error);
      Alert.alert('Error', 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const createMaterial = async () => {
    console.log('🚀 Creating material with data:', formData);
    
    if (!formData.materialName.trim() || !formData.maximumReuse.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Try to create via API first
      try {
        console.log('📡 Calling materials API create...');
        const response = await materialsApi.create({
          materialName: formData.materialName,
          maximumReuse: parseInt(formData.maximumReuse),
          description: formData.description,
        });
        
        console.log('✅ API create response:', response);
        
        // If API call successful, reload materials
        console.log('🔄 Reloading materials after successful creation...');
        await loadMaterials();
        setShowCreateModal(false);
        setFormData({ materialName: '', maximumReuse: '', description: '' });
        Alert.alert('Success', 'Material created successfully');
      } catch (apiError) {
        console.log('❌ API create failed, using mock creation:', apiError);
        console.log('❌ API Error details:', {
          message: (apiError as any)?.message,
          response: (apiError as any)?.response?.data,
          status: (apiError as any)?.response?.status
        });
        
        // Fallback to mock creation
        const newMaterial: Material = {
          id: Date.now().toString(),
          materialName: formData.materialName,
          maximumReuse: parseInt(formData.maximumReuse),
          description: formData.description,
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0],
        };
        
        console.log('📝 Adding mock material:', newMaterial);
        setMaterials(prev => [newMaterial, ...prev]);
        setShowCreateModal(false);
        setFormData({ materialName: '', maximumReuse: '', description: '' });
        Alert.alert('Success', 'Material created successfully (offline mode)');
      }
    } catch (error) {
      console.error('❌ Error creating material:', error);
      Alert.alert('Error', 'Failed to create material');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === 'all' || material.status === activeTab;
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

      {/* Tab Navigation Bar */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.activeTabButtonText
            ]}>
              {tab.label}
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
              <View style={styles.materialContent}>
                {/* Thumbnail */}
                <View style={styles.materialThumbnail}>
                  <Ionicons name="cube" size={32} color="#0F4D3A" />
                </View>
                
                {/* Material Info */}
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.materialName}</Text>
                  <Text style={styles.materialSubtitle}>Max: {material.maximumReuse} uses</Text>
                  <Text style={styles.materialDescription}>{material.description}</Text>
                </View>
                
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(material.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(material.status)}</Text>
                  </View>
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
    backgroundColor: '#0F4D3A',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0F4D3A',
    backgroundColor: '#F0FDF4',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#0F4D3A',
    fontWeight: '600',
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
  materialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
    marginRight: 12,
  },
  materialSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});