import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import type { CreateProductGroupRequest, CreateProductSizeRequest, CreateProductsRequest, ProductSize } from '../../../src/services/api/businessService';
import { materialsApi, productGroupsApi, productSizesApi, productsApi } from '../../../src/services/api/businessService';

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  materialId?: string;
  createdAt: string;
}

interface Material {
  _id: string;
  materialName: string;
}

export default function InventoryManagementScreen() {
  const { state } = useAuth();
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
  const [showCreateSizeModal, setShowCreateSizeModal] = useState(false);
  const [showCreateProductsModal, setShowCreateProductsModal] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  
  // Selected group for detail view
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const [groupSizes, setGroupSizes] = useState<ProductSize[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    materialId: '',
    name: '',
    description: '',
    image: null as any,
  });
  const [sizeForm, setSizeForm] = useState({
    sizeName: '',
    basePrice: '',
    weight: '',
    description: '',
  });
  const [productsForm, setProductsForm] = useState({
    amount: '',
  });
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  // Load product groups and materials on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadProductGroups(), loadMaterials()]);
  };

  const loadMaterials = async () => {
    try {
      const res = await materialsApi.listApproved(1, 50);
      console.log('📊 API response:', res);
      
      // Ở VIỆT NAM THƯỜNG LÀ res.data HOẶC res.data.data
      const resAny = res as any;
      const array = resAny?.data?.data || resAny?.data || res || [];
      
      const list = Array.isArray(array) 
        ? array.map((item: any) => ({
            _id: item._id || item.id || 'unknown',
            materialName: item.materialName || item.name || 'No name',
          }))
        : [];
      
      console.log('✅ Loaded materials:', list.length, list);
      setMaterials(list);
    } catch (err) {
      console.error('❌ Load materials error:', err);
      setMaterials([]);
    }
  };

  const loadProductGroups = async () => {
    try {
      setLoading(true);
      const productGroupsResponse = await productGroupsApi.getAll({ page: 1, limit: 50 });
      
      // Handle response structure like Redux: payload.data || payload || []
      const responseData = (productGroupsResponse as any)?.data || productGroupsResponse;
      const groupsArray = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.docs || responseData?.items || []);
      
      const mappedGroups = groupsArray.map((item: any) => ({
        id: item._id || item.id,
        name: item.name || 'Unnamed Product Group',
        description: item.description || '',
        imageUrl: item.imageUrl,
        materialId: item.materialId,
        createdAt: item.createdAt || new Date().toISOString().split('T')[0],
      }));
      
      setProductGroups(mappedGroups);
    } catch (error: any) {
      console.error('❌ Error loading product groups:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load inventory';
      Alert.alert('Error', errorMessage);
      setProductGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupSizes = async (productGroupId: string) => {
    try {
      setLoadingSizes(true);
      const response = await productSizesApi.getAll(productGroupId);
      
      // Handle response structure like Redux: payload.data || payload || []
      const responseData = (response as any)?.data || response;
      const sizesArray = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.docs || responseData?.items || []);
      
      setGroupSizes(sizesArray);
    } catch (error: any) {
      console.error('❌ Error loading sizes:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load product sizes';
      Alert.alert('Error', errorMessage);
      setGroupSizes([]);
    } finally {
      setLoadingSizes(false);
    }
  };

  const handleGroupPress = async (group: ProductGroup) => {
    setSelectedGroup(group);
    setShowGroupDetailModal(true);
    await loadGroupSizes(group.id);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.materialId || !groupForm.name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateProductGroupRequest = {
        materialId: groupForm.materialId,
        name: groupForm.name,
        description: groupForm.description || undefined,
        image: groupForm.image || undefined,
      };
      
      const response = await productGroupsApi.create(request);
      const successMessage = (response as any)?.message || 'Product group created successfully';
      Alert.alert('Success', successMessage);
      setShowCreateGroupModal(false);
      setGroupForm({ materialId: '', name: '', description: '', image: null });
      await loadProductGroups();
    } catch (error: any) {
      console.error('❌ Error creating product group:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create product group';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSize = async () => {
    if (!selectedGroup || !sizeForm.sizeName.trim() || !sizeForm.basePrice.trim() || !sizeForm.weight.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateProductSizeRequest = {
        productGroupId: selectedGroup.id,
        sizeName: sizeForm.sizeName,
        basePrice: parseFloat(sizeForm.basePrice),
        weight: parseFloat(sizeForm.weight),
        description: sizeForm.description || undefined,
      };
      
      // API service đã trả về response.data (size mới) trực tiếp
      const newSize = await productSizesApi.create(request);
      
      // ĐÓNG MODAL TRƯỚC
      setShowCreateSizeModal(false);
      setSizeForm({ sizeName: '', basePrice: '', weight: '', description: '' });

      // TỰ ĐỘNG THÊM SIZE MỚI VÀO DANH SÁCH (không cần reload)
      if (newSize && newSize._id) {
        setGroupSizes(prev => [...prev, newSize]);
      } else {
        // Fallback: reload nếu không lấy được data
        await loadGroupSizes(selectedGroup.id);
      }

      Alert.alert('Success', 'Product size created successfully');
    } catch (error: any) {
      console.error('Error creating product size:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create product size';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProducts = async () => {
    if (!selectedGroup || !selectedSize || !productsForm.amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseInt(productsForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateProductsRequest = {
        productSizeId: selectedSize._id,
        productGroupId: selectedGroup.id,
        amount: amount,
      };
      
      const response = await productsApi.create(request);
      // Handle response structure like Redux: payload.data || payload
      const responseData = (response as any)?.data || response;
      const products = responseData?.products || [];
      const productCount = Array.isArray(products) ? products.length : 0;
      
      const successMessage = productCount > 0 
        ? `Successfully created ${productCount} products with QR codes`
        : (responseData?.message || 'Products created successfully');
      
      Alert.alert('Success', successMessage);
      setShowCreateProductsModal(false);
      setProductsForm({ amount: '' });
      setSelectedSize(null);
      
      // Optionally reload sizes to show updated product count if needed
      // await loadGroupSizes(selectedGroup.id);
    } catch (error: any) {
      console.error('❌ Error creating products:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create products';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'product-group-image.jpg',
      };
      setGroupForm(prev => ({ ...prev, image: file }));
    }
  };

  const filteredProductGroups = productGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (group.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateGroupModal(true)}
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
            placeholder="Search inventory..."
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

      {/* Product Groups List */}
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView 
          style={styles.inventoryList} 
          contentContainerStyle={styles.inventoryListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredProductGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No inventory found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search' : 'Create your first product group'}
              </Text>
            </View>
          ) : (
            filteredProductGroups.map((group) => (
              <TouchableOpacity 
                key={group.id} 
                style={styles.inventoryCard}
                onPress={() => handleGroupPress(group)}
              >
                <View style={styles.inventoryContent}>
                  {/* Thumbnail */}
                  <View style={styles.inventoryThumbnail}>
                    {group.imageUrl ? (
                      <Image 
                        source={{ uri: group.imageUrl }} 
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="cube" size={32} color="#0F4D3A" />
                    )}
                  </View>
                  
                  {/* Product Group Info */}
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.inventoryDescription} numberOfLines={2}>
                        {group.description}
                      </Text>
                    )}
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Create Product Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product Group</Text>
            <TouchableOpacity onPress={handleCreateGroup} disabled={submitting}>
              <Text style={[styles.saveButton, submitting && styles.disabledButton]}>
                {submitting ? 'Creating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Material Dropdown – Thay thế hoàn toàn cái Modal cũ */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Material *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowMaterialPicker(prev => !prev)} // toggle dropdown
                >
                  <Text 
                    style={[
                      styles.pickerButtonText, 
                      !groupForm.materialId && styles.pickerButtonPlaceholder
                    ]}
                    numberOfLines={1}
                  >
                    {groupForm.materialId 
                      ? materials.find(m => m._id === groupForm.materialId)?.materialName || 'Select material'
                      : 'Select material'
                    }
                  </Text>
                  <Ionicons 
                    name={showMaterialPicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>

                {/* Dropdown List */}
                {showMaterialPicker && (
                  <View style={styles.dropdownList}>
                    <ScrollView 
                      nestedScrollEnabled={true}
                      style={{ maxHeight: 300 }}
                    >
                      {materials.length === 0 ? (
                        <View style={styles.dropdownEmpty}>
                          <Text style={styles.dropdownEmptyText}>No materials available</Text>
                          <TouchableOpacity onPress={loadMaterials} style={styles.refreshBtn}>
                            <Ionicons name="refresh" size={20} color="#059669" />
                            <Text style={styles.refreshText}>Refresh</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        materials.map((material) => (
                          <TouchableOpacity
                            key={material._id}
                            style={[
                              styles.dropdownItem,
                              groupForm.materialId === material._id && styles.dropdownItemSelected
                            ]}
                            onPress={() => {
                              setGroupForm(prev => ({ ...prev, materialId: material._id }));
                              setShowMaterialPicker(false); // đóng dropdown sau khi chọn
                            }}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              groupForm.materialId === material._id && styles.dropdownItemTextSelected
                            ]}>
                              {material.materialName}
                            </Text>
                            {groupForm.materialId === material._id && (
                              <Ionicons name="checkmark" size={20} color="#059669" />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Group Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter product group name"
                value={groupForm.name}
                onChangeText={(text) => setGroupForm(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter description"
                value={groupForm.description}
                onChangeText={(text) => setGroupForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Image (Optional)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                {groupForm.image ? (
                  <Image source={{ uri: groupForm.image.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#6B7280" />
                    <Text style={styles.imagePlaceholderText}>Choose Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>


      {/* Group Detail Modal (Sizes) */}
      <Modal
        visible={showGroupDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowGroupDetailModal(false);
              setSelectedGroup(null);
              setGroupSizes([]);
            }}>
              <Text style={styles.cancelButton}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedGroup?.name || 'Product Group'}</Text>
            <TouchableOpacity onPress={() => {
              setShowCreateSizeModal(true);
            }}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {loadingSizes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
              </View>
            ) : groupSizes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="resize-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No sizes found</Text>
                <Text style={styles.emptySubtitle}>Create your first product size</Text>
              </View>
            ) : (
              groupSizes.map((size) => (
                <TouchableOpacity
                  key={size._id}
                  style={styles.sizeCard}
                  onPress={() => {
                    setSelectedSize(size);
                    setShowCreateProductsModal(true);
                  }}
                >
                  <View style={styles.sizeContent}>
                    <View style={styles.sizeInfo}>
                      <Text style={styles.sizeName}>{size.sizeName}</Text>
                      <Text style={styles.sizeDetails}>
                        Price: {size.basePrice?.toLocaleString()} VND • Weight: {size.weight}g
                      </Text>
                      {size.description && (
                        <Text style={styles.sizeDescription}>{size.description}</Text>
                      )}
                      <View style={styles.addProductHint}>
                        <Ionicons name="add-circle-outline" size={16} color="#059669" />
                        <Text style={styles.addProductHintText}>Tap to add products</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Size Modal */}
      <Modal
        visible={showCreateSizeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateSizeModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product Size</Text>
            <TouchableOpacity onPress={handleCreateSize} disabled={submitting}>
              <Text style={[styles.saveButton, submitting && styles.disabledButton]}>
                {submitting ? 'Creating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Size Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Medium, Large"
                value={sizeForm.sizeName}
                onChangeText={(text) => setSizeForm(prev => ({ ...prev, sizeName: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Base Price (VND) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter base price"
                value={sizeForm.basePrice}
                onChangeText={(text) => setSizeForm(prev => ({ ...prev, basePrice: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (grams) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter weight in grams"
                value={sizeForm.weight}
                onChangeText={(text) => setSizeForm(prev => ({ ...prev, weight: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter description"
                value={sizeForm.description}
                onChangeText={(text) => setSizeForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Products Modal */}
      <Modal
        visible={showCreateProductsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateProductsModal(false);
              setSelectedSize(null);
            }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Products</Text>
            <TouchableOpacity onPress={handleCreateProducts} disabled={submitting}>
              <Text style={[styles.saveButton, submitting && styles.disabledButton]}>
                {submitting ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.sizeInfoCard}>
              <Text style={styles.sizeInfoTitle}>Selected Size</Text>
              <Text style={styles.sizeInfoText}>Name: {selectedSize?.sizeName}</Text>
              <Text style={styles.sizeInfoText}>Price: {selectedSize?.basePrice?.toLocaleString()} VND</Text>
              <Text style={styles.sizeInfoText}>Weight: {selectedSize?.weight}g</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter number of products to create"
                value={productsForm.amount}
                onChangeText={(text) => setProductsForm(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                This will create {productsForm.amount || 0} products with unique QR codes
              </Text>
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
    backgroundColor: '#00704A',
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#00704A',
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
  clearButton: {
    padding: 4,
  },
  inventoryList: {
    flex: 1,
  },
  inventoryListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  inventoryCard: {
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
  inventoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inventoryThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  inventoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerButtonPlaceholder: {
    color: '#9CA3AF',
  },
  imagePickerButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  sizeCard: {
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
  sizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeInfo: {
    flex: 1,
  },
  sizeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sizeDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sizeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sizeInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sizeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sizeInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  addProductHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  addProductHintText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownList: {
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    color: '#6B7280',
    marginBottom: 12,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: '#059669',
    fontWeight: '600',
  },
});
