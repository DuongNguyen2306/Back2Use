import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import SimpleHeader from "../../../components/SimpleHeader";
import { useAuth } from "../../../context/AuthProvider";
import { useToast } from "../../../hooks/use-toast";
import { useTokenRefresh } from "../../../hooks/useTokenRefresh";
import { materialsApi, MaterialItem } from "../../../src/services/api/businessService";
import { singleUseProductsApi, SingleUseProduct, ProductType, ProductSizeForSingleUse } from "../../../src/services/api/businessService";

interface FormData {
  name: string;
  description: string;
  productTypeId: string;
  productSizeId: string;
  materialId: string;
  weight: string;
  image: any;
}

export default function CreateSingleUseProductScreen() {
  const { state } = useAuth();
  const { toast } = useToast();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [productSizes, setProductSizes] = useState<ProductSizeForSingleUse[]>([]);
  const [myProducts, setMyProducts] = useState<SingleUseProduct[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    productTypeId: '',
    productSizeId: '',
    materialId: '',
    weight: '',
    image: null,
  });

  useTokenRefresh();

  useEffect(() => {
    if (state.isHydrated && state.accessToken && state.isAuthenticated && state.role === 'business') {
      loadInitialData();
    }
  }, [state.isHydrated, state.accessToken, state.isAuthenticated, state.role]);

  // Load sizes when product type changes
  useEffect(() => {
    if (formData.productTypeId) {
      console.log('🔄 Product Type changed, loading sizes for:', formData.productTypeId);
      loadProductSizes(formData.productTypeId);
    } else {
      console.log('🔄 Product Type cleared, resetting sizes');
      setProductSizes([]);
      setFormData(prev => ({ ...prev, productSizeId: '' }));
    }
  }, [formData.productTypeId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProductTypes(),
        loadMaterials(),
        loadMyProducts(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await singleUseProductsApi.getTypes();
      const typesArray = (response as any)?.data || [];
      // Map response to ensure consistent structure
      const mappedTypes = typesArray.map((type: any) => ({
        _id: type._id,
        name: type.name || type.typeName || 'Unknown',
        description: type.description,
      }));
      setProductTypes(mappedTypes);
    } catch (error: any) {
      console.error('Error loading product types:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load product types",
      });
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadProductSizes = async (productTypeId: string) => {
    if (!productTypeId) {
      setProductSizes([]);
      return;
    }
    try {
      setLoadingSizes(true);
      console.log('🔍 Loading product sizes for type:', productTypeId);
      const response = await singleUseProductsApi.getSizes(productTypeId);
      console.log('📦 Product sizes API response:', response);
      const sizesArray = (response as any)?.data || [];
      console.log('📦 Sizes array:', sizesArray);
      // Map response to ensure consistent structure
      const mappedSizes = sizesArray.map((size: any) => ({
        _id: size._id,
        name: size.name || size.sizeName || 'Unknown',
        description: size.description,
        sizeName: size.sizeName, // Keep original for reference
      }));
      console.log('✅ Mapped sizes:', mappedSizes);
      setProductSizes(mappedSizes);
      // Reset productSizeId if current selection is not in new sizes
      if (formData.productSizeId && !mappedSizes.find((s: any) => s._id === formData.productSizeId)) {
        setFormData(prev => ({ ...prev, productSizeId: '' }));
      }
    } catch (error: any) {
      console.error('❌ Error loading product sizes:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load product sizes",
      });
    } finally {
      setLoadingSizes(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      console.log('🔍 Loading approved materials...');
      const response = await materialsApi.listApproved(1, 100);
      const materialsArray = (response as any)?.data?.data || (response as any)?.data || [];
      console.log('📦 Materials API response:', materialsArray.length, 'materials');
      
      // For now, show all approved materials
      // Backend will validate if material is suitable for single-use products
      // If user selects wrong material, backend will return error and we'll show clear message
      const finalMaterials = Array.isArray(materialsArray) ? materialsArray : [];
      
      console.log('✅ Materials loaded:', finalMaterials.length, 'materials');
      console.log('📋 Materials data sample:', finalMaterials.slice(0, 3).map((m: any) => ({
        name: m.materialName,
        maxReuse: m.maximumReuse,
        isSingleUse: m.isSingleUse ?? m.singleUse
      })));
      
      setMaterials(finalMaterials);
    } catch (error: any) {
      console.error('❌ Error loading materials:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load materials",
      });
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadMyProducts = async () => {
    try {
      const response = await singleUseProductsApi.getMy({ page: 1, limit: 100 });
      // API returns: { statusCode: 200, message: "...", data: [...], total: ..., currentPage: ..., totalPages: ... }
      const productsArray = Array.isArray((response as any)?.data) 
        ? (response as any).data 
        : (response as any)?.data?.data || [];
      setMyProducts(productsArray);
    } catch (error: any) {
      console.error('Error loading my products:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to load products",
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyProducts();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFormData(prev => ({
          ...prev,
          image: {
            uri: asset.uri,
            type: 'image/jpeg',
            name: 'product.jpg',
          },
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
  };

  const checkDuplicate = (): SingleUseProduct | null => {
    // Check if a product with the same configuration already exists
    return myProducts.find((product) => {
      const productTypeId = typeof product.productTypeId === 'object' ? product.productTypeId._id : product.productTypeId;
      const productSizeId = typeof product.productSizeId === 'object' ? product.productSizeId._id : product.productSizeId;
      const materialId = typeof product.materialId === 'object' ? product.materialId._id : product.materialId;
      
      return (
        productTypeId === formData.productTypeId &&
        productSizeId === formData.productSizeId &&
        materialId === formData.materialId
      );
    }) || null;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return;
    }
    if (!formData.productTypeId) {
      Alert.alert('Validation Error', 'Please select a product type');
      return;
    }
    if (!formData.productSizeId) {
      Alert.alert('Validation Error', 'Please select a product size');
      return;
    }
    if (!formData.materialId) {
      Alert.alert('Validation Error', 'Please select a material');
      return;
    }
    if (!formData.weight.trim()) {
      Alert.alert('Validation Error', 'Weight is required');
      return;
    }
    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Validation Error', 'Weight must be a positive number');
      return;
    }

    // Check for duplicate before submitting
    const duplicateProduct = checkDuplicate();
    if (duplicateProduct) {
      const productType = typeof duplicateProduct.productTypeId === 'object' ? duplicateProduct.productTypeId.name : 'N/A';
      const productSize = typeof duplicateProduct.productSizeId === 'object' 
        ? (duplicateProduct.productSizeId.sizeName || duplicateProduct.productSizeId.name) 
        : 'N/A';
      const material = typeof duplicateProduct.materialId === 'object' ? duplicateProduct.materialId.materialName : 'N/A';
      
      Alert.alert(
        "Product Already Exists",
        `A product with the same configuration already exists:\n\n• Type: ${productType}\n• Size: ${productSize}\n• Material: ${material}\n\nProduct: "${duplicateProduct.name}"\n\nPlease modify the configuration or check your product list.`,
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    try {
      setSubmitting(true);
      await singleUseProductsApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        productTypeId: formData.productTypeId,
        productSizeId: formData.productSizeId,
        materialId: formData.materialId,
        weight: weight,
        image: formData.image,
      });

      toast({
        title: "Success",
        description: "Single-use product created successfully!",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        productTypeId: '',
        productSizeId: '',
        materialId: '',
        weight: '',
        image: null,
      });
      setShowCreateModal(false);
      
      // Refresh products list
      await loadMyProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create product";
      
      // Show alert for specific errors with more context
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        Alert.alert(
          "Product Already Exists",
          "A single-use product with the same configuration (Type, Size, Material) already exists for this business. Please check your product list or modify the configuration.",
          [
            { text: "OK", style: "default" }
          ]
        );
      } else if (errorMessage.includes('single use') || errorMessage.includes('Material must be')) {
        Alert.alert(
          "Invalid Material",
          "The selected material must be a single-use material. Please select a different material that is suitable for single-use products.\n\nSingle-use materials typically have maximum reuse of 0 or 1.",
          [
            { text: "OK", style: "default" }
          ]
        );
      } else {
        toast({
          title: "Error",
          description: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    if (submitting) return;
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      productTypeId: '',
      productSizeId: '',
      materialId: '',
      weight: '',
      image: null,
    });
  };

  const getProductTypeName = (typeId: string) => {
    const type = productTypes.find(t => t._id === typeId);
    return type?.name || typeId;
  };

  const getProductSizeName = (sizeId: string) => {
    const size = productSizes.find(s => s._id === sizeId);
    return size?.name || sizeId;
  };

  const getMaterialName = (materialId: string) => {
    const material = materials.find(m => m._id === materialId);
    return material?.materialName || materialId;
  };

  const renderProduct: ListRenderItem<SingleUseProduct> = ({ item }) => {
    const productType = typeof item.productTypeId === 'object' ? item.productTypeId : null;
    const productSize = typeof item.productSizeId === 'object' ? item.productSizeId : null;
    const material = typeof item.materialId === 'object' ? item.materialId : null;

    const typeName = productType?.name || 'N/A';
    const sizeName = productSize?.sizeName || productSize?.name || 'N/A';
    const materialName = material?.materialName || 'N/A';

    return (
      <View style={styles.productCard}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productDetails} numberOfLines={2}>
            {typeName} • {sizeName} • {materialName}
          </Text>
          <View style={styles.productMeta}>
            <Text style={styles.productWeight}>{item.weight}g</Text>
            {item.co2Emission !== undefined && (
              <View style={styles.co2Badge}>
                <Ionicons name="leaf" size={12} color="#10B981" />
                <Text style={styles.co2Text}>{item.co2Emission.toFixed(3)} kg CO₂</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SimpleHeader title="Single-Use Products" />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.title}>Single-Use Products</Text>
            <Text style={styles.subtitle}>Manage your single-use product inventory</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleOpenCreateModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00704A" />
          </View>
        ) : (
          <FlatList
            data={myProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Products</Text>
                <Text style={styles.emptySubtitle}>Create your first single-use product</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Create Product Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Single-Use Product</Text>
              <TouchableOpacity onPress={handleCloseCreateModal} disabled={submitting}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              <View style={styles.imageSection}>
                <Text style={styles.label}>Product Image (Optional)</Text>
                {formData.image ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: formData.image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={handleRemoveImage}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="image-outline" size={32} color="#6B7280" />
                    <Text style={styles.imagePickerText}>Tap to add image</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Product Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter product name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Product Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Type <Text style={styles.required}>*</Text></Text>
                {loadingTypes ? (
                  <View style={styles.loadingField}>
                    <ActivityIndicator size="small" color="#00704A" />
                    <Text style={styles.loadingText}>Loading types...</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                    {productTypes.map((type) => (
                      <TouchableOpacity
                        key={type._id}
                        style={[
                          styles.optionChip,
                          formData.productTypeId === type._id && styles.optionChipActive
                        ]}
                        onPress={() => {
                          console.log('✅ User selected product type:', type.name, type._id);
                          setFormData(prev => ({ ...prev, productTypeId: type._id, productSizeId: '' }));
                        }}
                      >
                        <Text style={[
                          styles.optionChipText,
                          formData.productTypeId === type._id && styles.optionChipTextActive
                        ]}>
                          {type.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Product Size */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product Size <Text style={styles.required}>*</Text></Text>
                {!formData.productTypeId ? (
                  <View style={styles.disabledField}>
                    <Text style={styles.disabledText}>Please select a product type first</Text>
                  </View>
                ) : loadingSizes ? (
                  <View style={styles.loadingField}>
                    <ActivityIndicator size="small" color="#00704A" />
                    <Text style={styles.loadingText}>Loading sizes...</Text>
                  </View>
                ) : productSizes.length === 0 ? (
                  <View style={styles.disabledField}>
                    <Text style={styles.disabledText}>No sizes available for this type</Text>
                  </View>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.optionsContainer}
                    contentContainerStyle={styles.optionsContent}
                  >
                    {productSizes.map((size) => (
                      <TouchableOpacity
                        key={size._id}
                        style={[
                          styles.optionChip,
                          formData.productSizeId === size._id && styles.optionChipActive
                        ]}
                        onPress={() => {
                          console.log('✅ Selected size:', size);
                          setFormData(prev => ({ ...prev, productSizeId: size._id }));
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.optionChipText,
                          formData.productSizeId === size._id && styles.optionChipTextActive
                        ]}>
                          {size.name || size.sizeName || 'Unknown'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Material */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Material <Text style={styles.required}>*</Text></Text>
                {loadingMaterials ? (
                  <View style={styles.loadingField}>
                    <ActivityIndicator size="small" color="#00704A" />
                    <Text style={styles.loadingText}>Loading materials...</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                    {materials.map((material) => (
                      <TouchableOpacity
                        key={material._id}
                        style={[
                          styles.optionChip,
                          formData.materialId === material._id && styles.optionChipActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, materialId: material._id }))}
                      >
                        <Text style={[
                          styles.optionChipText,
                          formData.materialId === material._id && styles.optionChipTextActive
                        ]}>
                          {material.materialName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Weight */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Weight (grams) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text.replace(/[^0-9.]/g, '') }))}
                  placeholder="Enter weight in grams"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter product description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, submitting && styles.buttonDisabled]}
                onPress={handleCloseCreateModal}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Product</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00704A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00704A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  productWeight: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  co2Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  co2Text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  optionsContainer: {
    flexGrow: 0,
  },
  optionsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 16,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionChipActive: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  loadingField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledField: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  disabledText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePickerButton: {
    width: '100%',
    height: 150,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#00704A',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
