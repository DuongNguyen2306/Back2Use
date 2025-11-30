import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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
  const [showProductListModal, setShowProductListModal] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showCreateMaterialRequestModal, setShowCreateMaterialRequestModal] = useState(false);
  
  // Selected group for detail view
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const [groupSizes, setGroupSizes] = useState<ProductSize[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  
  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
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
  
  // Material request form
  const [materialRequestForm, setMaterialRequestForm] = useState({
    materialName: '',
    description: '',
  });
  
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

  const loadProductGroups = async (): Promise<ProductGroup[]> => {
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
      
      setProductGroups(mappedGroups);  // ← cập nhật state
      
      console.log('✅ Product groups loaded:', mappedGroups.length, mappedGroups);
      
      return mappedGroups; // ← TRẢ VỀ MẢNG MỚI (quan trọng!)
    } catch (error: any) {
      console.error('❌ Error loading product groups:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load inventory';
      Alert.alert('Error', errorMessage);
      setProductGroups([]);
      return [];
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
      
      // LOG ĐÚNG Ở ĐÂY
      console.log('✅ Sizes loaded successfully:', sizesArray.length, sizesArray);
      
      return sizesArray; // ← trả về để dùng ở nơi khác nếu cần
    } catch (error: any) {
      console.error('❌ Error loading sizes:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load product sizes';
      Alert.alert('Error', errorMessage);
      setGroupSizes([]);
      return []; // Trả về mảng rỗng nếu có lỗi
    } finally {
      setLoadingSizes(false);
    }
  };

  const loadProducts = async (productSizeId: string) => {
    try {
      setLoadingProducts(true);
      
      // API yêu cầu productGroupId làm path parameter, không phải productSizeId
      // Lấy productGroupId từ selectedGroup hoặc selectedSize
      const productGroupId = selectedGroup?.id || selectedSize?.productGroupId;
      
      if (!productGroupId) {
        console.error('❌ No productGroupId available');
        Alert.alert('Error', 'Product group ID is required');
        setProducts([]);
        return [];
      }
      
      console.log('🔄 Loading products for productGroupId:', productGroupId, 'productSizeId:', productSizeId);
      console.log('🔄 productsApi.getAll exists?', typeof productsApi.getAll === 'function');
      
      // Gọi API với productGroupId làm path parameter
      const response = await productsApi.getAll(productGroupId, { 
        page: 1, 
        limit: 100 
      });
      
      console.log('📡 Products API Response:', response);
      
      // Handle response structure
      const responseData = (response as any)?.data || response;
      let productsArray = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || responseData?.docs || responseData?.items || []);
      
      console.log('📦 Products array before filter:', productsArray.length);
      
      // Filter products theo productSizeId nếu có
      // Lưu ý: productSizeId trong response là object, không phải string
      if (productSizeId && productsArray.length > 0) {
        productsArray = productsArray.filter((p: any) => {
          // productSizeId có thể là object {_id: "...", ...} hoặc string
          const sizeId = typeof p.productSizeId === 'object' 
            ? p.productSizeId?._id 
            : p.productSizeId;
          return sizeId === productSizeId;
        });
        console.log(`🔍 Filtered products by productSizeId (${productSizeId}):`, productsArray.length);
      }
      
      setProducts(productsArray);
      console.log('✅ Products loaded successfully:', productsArray.length);
      
      return productsArray;
    } catch (error: any) {
      console.error('❌ Error loading products:', error);
      console.error('❌ Error stack:', error.stack);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load products';
      Alert.alert('Error', errorMessage);
      setProducts([]);
      return [];
    } finally {
      setLoadingProducts(false);
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
      
      // RELOAD và log đúng
      const newGroups = await loadProductGroups();
      console.log('✅ New groups count:', newGroups.length); // sẽ thấy đúng số lượng
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
      
      console.log('📤 Creating product size:', request);
      const response = await productSizesApi.create(request);
      console.log('✅ Created size successfully:', (response as any)?.data || response);
      
      // ĐÓNG MODAL TRƯỚC
      setShowCreateSizeModal(false);
      setSizeForm({ sizeName: '', basePrice: '', weight: '', description: '' });

      // RELOAD và log đúng
      const updatedSizes = await loadGroupSizes(selectedGroup.id);
      console.log('✅ Sizes now:', updatedSizes.length); // → đúng số lượng mới!

      // Mở lại Group Detail Modal để hiển thị size mới
      setShowGroupDetailModal(true);

      Alert.alert('Success', 'Product size created successfully');
    } catch (error: any) {
      console.error('❌ Error creating product size:', error);
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
      
      // Reload products để hiển thị products mới
      if (selectedSize) {
        await loadProducts(selectedSize._id);
      }
      
      // Mở lại Product List Modal để hiển thị products mới
      setShowProductListModal(true);
    } catch (error: any) {
      console.error('❌ Error creating products:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create products';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMaterialRequest = async () => {
    if (!materialRequestForm.materialName.trim()) {
      Alert.alert('Error', 'Please enter material name');
      return;
    }

    try {
      setSubmitting(true);
      const response = await materialsApi.createRequest({
        materialName: materialRequestForm.materialName.trim(),
        description: materialRequestForm.description.trim() || undefined,
      });
      
      Alert.alert('Success', 'Material request created successfully!');
      setShowCreateMaterialRequestModal(false);
      setMaterialRequestForm({ materialName: '', description: '' });
      
      // Reload materials to show new approved materials if any
      await loadMaterials();
    } catch (error: any) {
      console.error('❌ Error creating material request:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create material request';
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
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Inventory Management</Text>
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(protected)/business/my-materials')}
          >
            <Ionicons name="list-outline" size={16} color="white" />
            <Text style={styles.headerButtonText}>My Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowCreateMaterialRequestModal(true)}
          >
            <Ionicons name="add-circle-outline" size={16} color="white" />
            <Text style={styles.headerButtonText}>Request</Text>
          </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateGroupModal(true)}
        >
            <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
        </View>
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
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#059669" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateGroupModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product Group</Text>
            <TouchableOpacity 
              onPress={handleCreateGroup}
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              <Text style={styles.saveButton}>
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
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#059669" />
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
              // Đóng modal hiện tại
              setShowGroupDetailModal(false);
              // Mở modal tạo size NGAY LẬP TỨC → không cần setTimeout
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
                  onPress={async () => {
                    setSelectedSize(size);
                    setShowGroupDetailModal(false);
                    setShowProductListModal(true);  // MỞ DANH SÁCH PRODUCT
                    // Load products khi mở modal
                    await loadProducts(size._id);
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
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#059669" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateSizeModal(false);
              // Mở lại Group Detail Modal khi đóng Create Size Modal
              if (selectedGroup) {
                setShowGroupDetailModal(true);
              }
            }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product Size</Text>
            <TouchableOpacity 
              onPress={handleCreateSize}
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              <Text style={styles.saveButton}>
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
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#059669" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateProductsModal(false);
              // Mở lại Product List Modal
              setShowProductListModal(true);
            }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Products</Text>
            <TouchableOpacity 
              onPress={handleCreateProducts}
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              <Text style={styles.saveButton}>
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

      {/* Product List Modal - SIÊU ĐẸP */}
      <Modal
        visible={showProductListModal}
        animationType="slide"
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#059669" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowProductListModal(false);
              setShowGroupDetailModal(true);
            }}>
              <Text style={styles.cancelButton}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedSize?.sizeName} Products
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Size Info */}
            <View style={styles.sizeInfoCard}>
              <Text style={styles.sizeInfoTitle}>Size Information</Text>
              <Text style={styles.sizeInfoText}>Name: {selectedSize?.sizeName}</Text>
              <Text style={styles.sizeInfoText}>
                Price: {selectedSize?.basePrice?.toLocaleString()} VND
              </Text>
              <Text style={styles.sizeInfoText}>Weight: {selectedSize?.weight}g</Text>
            </View>

            {/* Product Count */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
                Products ({products.length})
              </Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => {
                  setShowProductListModal(false);
                  setShowCreateProductsModal(true);
                }}
              >
                <Ionicons name="add-circle" size={22} color="#059669" />
                <Text style={{ color: '#059669', fontWeight: '600' }}>Add More</Text>
              </TouchableOpacity>
            </View>

            {/* Danh sách sản phẩm */}
            {loadingProducts ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading products...</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Ionicons name="qr-code-outline" size={80} color="#D1D5DB" />
                <Text style={{ fontSize: 18, color: '#6B7280', marginTop: 20, fontWeight: '600' }}>
                  No products yet
                </Text>
                <Text style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
                  Tap "Add More" to create products with unique QR codes
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {products.map((product, index) => {
                  // Xử lý productSizeId có thể là object hoặc string
                  const sizeId = typeof product.productSizeId === 'object' 
                    ? product.productSizeId?._id 
                    : product.productSizeId;
                  const sizeName = typeof product.productSizeId === 'object' 
                    ? product.productSizeId?.sizeName 
                    : 'Unknown';
                  
                  return (
                    <TouchableOpacity
                      key={product._id || index}
                      style={styles.productItem}
                      onPress={() => {
                        const productId = product._id || product.id;
                        if (productId) {
                          // Đóng modal trước khi navigate
                          setShowProductListModal(false);
                          // Delay nhỏ để đảm bảo modal đóng hoàn toàn trước khi navigate
                          setTimeout(() => {
                            router.push(`/(protected)/business/product-detail/${productId}`);
                          }, 100);
                        } else {
                          console.error('Product ID not found:', product);
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={styles.qrPlaceholder}>
                          <Ionicons name="qr-code-outline" size={32} color="#059669" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: '#111827' }}>
                            {product.serialNumber || `Product #${String(index + 1).padStart(4, '0')}`}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                            Size: {sizeName}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>
                            Status: {product.status || 'N/A'}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>
                            {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Nút tạo thêm lớn (nếu chưa có hoặc muốn thêm) */}
            <TouchableOpacity
              style={{
                backgroundColor: '#059669',
                padding: 18,
                borderRadius: 14,
                alignItems: 'center',
                marginTop: 30,
                marginBottom: 20,
              }}
              onPress={() => {
                setShowProductListModal(false);
                setShowCreateProductsModal(true);
              }}
            >
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '600' }}>
                Create More Products
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Material Request Modal */}
      <Modal
        visible={showCreateMaterialRequestModal}
        animationType="slide"
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#059669" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreateMaterialRequestModal(false);
              setMaterialRequestForm({ materialName: '', description: '' });
            }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Material</Text>
            <TouchableOpacity 
              onPress={handleCreateMaterialRequest}
              disabled={submitting || !materialRequestForm.materialName.trim()}
              style={{ opacity: (submitting || !materialRequestForm.materialName.trim()) ? 0.6 : 1 }}
            >
              <Text style={styles.saveButton}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formSection}>
              <Text style={styles.label}>Material Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Glass Bottle"
                value={materialRequestForm.materialName}
                onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, materialName: text }))}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g., Tái sử dụng được nhiều lần, thân thiện với môi trường"
                value={materialRequestForm.description}
                onChangeText={(text) => setMaterialRequestForm(prev => ({ ...prev, description: text }))}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#00704A',
    minHeight: 70,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    marginRight: 8,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 50, // Tránh bị che bởi status bar
    paddingBottom: 16,
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
  productItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
