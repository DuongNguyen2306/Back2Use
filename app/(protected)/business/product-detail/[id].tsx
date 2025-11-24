import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  View
} from 'react-native';
import { useAuth } from '../../../../context/AuthProvider';
import { productsApi } from '../../../../src/services/api/productService';
import { Product } from '../../../../src/types/product.types';

export default function BusinessProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Update product states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: 'available' as 'available' | 'borrowed' | 'maintenance' | 'retired',
    condition: '',
    lastConditionNote: '',
  });

  // Fetch product details
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading product with ID:', id);
        setLoading(true);

        const response = await productsApi.getByIdWithAutoRefresh(id);
        
        if (response && response.data) {
          setProduct(response.data);
          // Initialize form with current product data
          setUpdateForm({
            status: response.data.status as any,
            condition: response.data.condition || '',
            lastConditionNote: response.data.lastConditionNote || '',
          });
        } else {
          Alert.alert('Error', response?.message || 'Product not found.');
        }
      } catch (error: any) {
        console.error('❌ Error loading product:', error);
        Alert.alert('Error', error.message || 'Failed to load product information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadProduct();
    }, 100);

    return () => clearTimeout(timer);
  }, [id]);

  // Handle update product
  const handleUpdateProduct = async () => {
    if (!product || !id) {
      Alert.alert('Error', 'Product information not found.');
      return;
    }

    try {
      setUpdating(true);
      console.log('🔄 Updating product:', id, 'with data:', updateForm);

      const updates: any = {};
      if (updateForm.status) updates.status = updateForm.status;
      if (updateForm.condition) updates.condition = updateForm.condition;
      if (updateForm.lastConditionNote) updates.lastConditionNote = updateForm.lastConditionNote;

      const response = await productsApi.update(id, updates);

      if (response.data) {
        setProduct(response.data);
        setShowUpdateModal(false);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
      Alert.alert('Error', error.message || 'Failed to update product. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Always show header, even when loading
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header - Always visible */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        {product && (
          <TouchableOpacity
            style={styles.editButtonHeader}
            onPress={() => setShowUpdateModal(true)}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading product information...</Text>
        </View>
      ) : !product ? (
        // Error state
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
          <Text style={styles.errorText}>Product information not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : product.productGroupId ? (
        // Product content
        <>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Product Image */}
            {product.images && product.images.length > 0 ? (
              <Image
                source={{ uri: product.images[0] }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
              </View>
            )}

            {/* Product Info */}
            <View style={styles.content}>
              {/* Product Name */}
              <Text style={styles.productName}>
                {(product.productGroupId as any)?.name || 'Product'}
              </Text>

              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: {
                available: '#10B981',
                borrowed: '#EF4444',
                maintenance: '#F59E0B',
                retired: '#6B7280',
              }[product.status] + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: {
                  available: '#10B981',
                  borrowed: '#EF4444',
                  maintenance: '#F59E0B',
                  retired: '#6B7280',
                }[product.status] }]} />
                <Text style={[styles.statusText, { color: {
                  available: '#10B981',
                  borrowed: '#EF4444',
                  maintenance: '#F59E0B',
                  retired: '#6B7280',
                }[product.status] }]}>
                  {{
                    available: 'Available',
                    borrowed: 'Borrowed',
                    maintenance: 'Maintenance',
                    retired: 'Retired',
                  }[product.status] || 'Unknown'}
                </Text>
              </View>

              {/* Product Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Product Information</Text>
                
                <View style={styles.detailRow}>
                  <Ionicons name="cube" size={20} color="#6B7280" />
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>
                    {(product.productSizeId as any)?.name || (product.productSizeId as any)?.description || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="barcode" size={20} color="#6B7280" />
                  <Text style={styles.detailLabel}>Serial Number:</Text>
                  <Text style={styles.detailValue}>{product.serialNumber}</Text>
                </View>

                {product.condition && (
                  <View style={styles.detailRow}>
                    <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
                    <Text style={styles.detailLabel}>Condition:</Text>
                    <Text style={styles.detailValue}>{product.condition}</Text>
                  </View>
                )}
              </View>

              {/* Pricing Section */}
              {(product.productSizeId as any)?.depositValue || (product.productSizeId as any)?.rentalPrice ? (
                <View style={styles.pricingSection}>
                  <Text style={styles.sectionTitle}>Pricing Information</Text>
                  
                  {(product.productSizeId as any)?.depositValue && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Deposit:</Text>
                      <Text style={styles.priceValue}>
                        {((product.productSizeId as any).depositValue || 0).toLocaleString('vi-VN')} VNĐ
                      </Text>
                    </View>
                  )}

                  {(product.productSizeId as any)?.rentalPrice && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Rental Price:</Text>
                      <Text style={styles.priceValue}>
                        {((product.productSizeId as any).rentalPrice || 0).toLocaleString('vi-VN')} VNĐ
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Description */}
              {(product.productGroupId as any)?.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>
                    {(product.productGroupId as any).description}
                  </Text>
                </View>
              )}

              {/* Last Condition Note */}
              {product.lastConditionNote && (
                <View style={styles.notesSection}>
                  <Text style={styles.sectionTitle}>Last Condition Note</Text>
                  <Text style={styles.notesText}>{product.lastConditionNote}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Edit Button */}
          {state.isAuthenticated && state.role === 'business' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowUpdateModal(true)}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Product</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Product information incomplete</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status *</Text>
                <View style={styles.statusOptions}>
                  {['available', 'borrowed', 'maintenance', 'retired'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        updateForm.status === status && styles.statusOptionActive
                      ]}
                      onPress={() => setUpdateForm({ ...updateForm, status: status as any })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        updateForm.status === status && styles.statusOptionTextActive
                      ]}>
                        {status === 'available' ? 'Available' :
                         status === 'borrowed' ? 'Borrowed' :
                         status === 'maintenance' ? 'Maintenance' : 'Retired'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Condition</Text>
                <TextInput
                  style={styles.formInput}
                  value={updateForm.condition}
                  onChangeText={(text) => setUpdateForm({ ...updateForm, condition: text })}
                  placeholder="Enter product condition..."
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Condition Note</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={updateForm.lastConditionNote}
                  onChangeText={(text) => setUpdateForm({ ...updateForm, lastConditionNote: text })}
                  placeholder="Enter notes about product condition..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, updating && styles.saveButtonDisabled]}
                onPress={handleUpdateProduct}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    backgroundColor: '#00704A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonHeader: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  editButtonHeader: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#00704A',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  pricingSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00704A',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  notesSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  statusOptionActive: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#00704A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
