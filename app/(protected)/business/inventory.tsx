"use client"

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import BusinessHeader from "../../../components/BusinessHeader";
import { useAuth } from "../../../context/AuthProvider";
import { businessesApi } from "../../../src/services/api/businessService";
import { BusinessProfile } from "../../../src/types/business.types";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Mock data types
interface PackagingItem {
  id: string;
  qrCode: string;
  productTypeId: string;
  size: string;
  material: string;
  status: 'available' | 'borrowed' | 'washing' | 'damaged' | 'retired';
  condition: 'good' | 'needs_cleaning' | 'damaged' | 'retired';
  currentReuses: number;
  maxReuses: number;
  storeId: string;
}

interface ProductType {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  storeId: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  storeId: string;
}

export default function InventoryManagement() {
  const { state } = useAuth();
  const [storeItems, setStoreItems] = useState<PackagingItem[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'available' | 'non-available'>('available');
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });
  const [typeFormData, setTypeFormData] = useState({ name: '', description: '', category: '' });
  const itemsPerPage = 6;
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load business profile
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const profileResponse = await businessesApi.getProfileWithAutoRefresh();
        if (profileResponse.data && profileResponse.data.business) {
          setBusinessProfile(profileResponse.data.business);
        }
      } catch (error: any) {
        // Silently handle 403 errors (Access denied - role mismatch)
        if (error?.response?.status === 403 || error?.message === 'ACCESS_DENIED_403') {
          console.log('⚠️ Access denied (403) - silently handled');
        } else {
          console.error('Error loading business profile:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    loadBusinessData();
  }, []);

  // Mock data
  useEffect(() => {
    const mockProductTypes: ProductType[] = [
      {
        id: '1',
        name: 'Cốc cà phê',
        description: 'Cốc cà phê tái sử dụng',
        category: 'Cups',
        storeId: 'store1'
      },
      {
        id: '2',
        name: 'Hộp đựng thức ăn',
        description: 'Hộp đựng thức ăn tái sử dụng',
        category: 'Containers',
        storeId: 'store1'
      }
    ];

    const mockItems: PackagingItem[] = [
      {
        id: '1',
        qrCode: 'QR001',
        productTypeId: '1',
        size: 'medium',
        material: 'Ceramic',
        status: 'available',
        condition: 'good',
        currentReuses: 5,
        maxReuses: 100,
        storeId: 'store1'
      },
      {
        id: '2',
        qrCode: 'QR002',
        productTypeId: '1',
        size: 'large',
        material: 'Ceramic',
        status: 'borrowed',
        condition: 'good',
        currentReuses: 12,
        maxReuses: 100,
        storeId: 'store1'
      }
    ];

    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Cups',
        description: 'Các loại cốc',
        storeId: 'store1'
      },
      {
        id: '2',
        name: 'Containers',
        description: 'Các loại hộp đựng',
        storeId: 'store1'
      }
    ];

    setProductTypes(mockProductTypes);
    setStoreItems(mockItems);
    setCategories(mockCategories);
  }, []);

  const filteredProductTypes = productTypes.filter((type) => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = storeItems.filter((item) => {
    const productType = productTypes.find((pt) => pt.id === item.productTypeId);
    const matchesSearch = 
      item.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (productType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = selectedProductType ? item.productTypeId === selectedProductType.id : true;
    return matchesSearch && matchesType;
  });

  const availableItems = filteredItems.filter(item => item.status === 'available');
  const nonAvailableItems = filteredItems.filter(item => item.status !== 'available');

  const getItemCountForType = (typeId: string) => {
    const total = storeItems.filter(item => item.productTypeId === typeId).length;
    const available = storeItems.filter(item => item.productTypeId === typeId && item.status === 'available').length;
    const nonAvailable = total - available;
    return { total, available, nonAvailable };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'borrowed':
        return '#3B82F6';
      case 'washing':
        return '#F59E0B';
      case 'damaged':
        return '#EF4444';
      case 'retired':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Sẵn sàng';
      case 'borrowed':
        return 'Đang thuê';
      case 'washing':
        return 'Đang rửa';
      case 'damaged':
        return 'Hỏng';
      case 'retired':
        return 'Nghỉ hưu';
      default:
        return 'Không xác định';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleAddCategory = () => {
    if (categoryFormData.name.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryFormData.name,
        description: categoryFormData.description,
        storeId: 'store1'
      };
      setCategories([...categories, newCategory]);
      setCategoryFormData({ name: '', description: '' });
      setShowAddCategoryModal(false);
    }
  };

  const handleAddProductType = () => {
    if (typeFormData.name.trim() && typeFormData.category.trim()) {
      const newProductType: ProductType = {
        id: Date.now().toString(),
        name: typeFormData.name,
        description: typeFormData.description,
        category: typeFormData.category,
        storeId: 'store1'
      };
      setProductTypes([...productTypes, newProductType]);
      setTypeFormData({ name: '', description: '', category: '' });
      setShowAddTypeModal(false);
    }
  };

  const renderProductTypes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Các loại sản phẩm</Text>
      {filteredProductTypes.map((type) => {
        const counts = getItemCountForType(type.id);
        return (
          <TouchableOpacity
            key={type.id}
            style={styles.productTypeCard}
            onPress={() => setSelectedProductType(type)}
          >
            <View style={styles.productTypeHeader}>
              <View style={styles.productTypeIcon}>
                <Ionicons name="cube" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.productTypeInfo}>
                <Text style={styles.productTypeName}>{type.name}</Text>
                <Text style={styles.productTypeCategory}>{type.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
            <View style={styles.productTypeStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{counts.available}</Text>
                <Text style={styles.statLabel}>Sẵn sàng</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{counts.nonAvailable}</Text>
                <Text style={styles.statLabel}>Không sẵn</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderItems = (items: PackagingItem[]) => (
    <View style={styles.itemsGrid}>
      {items.map((item) => {
        const productType = productTypes.find((pt) => pt.id === item.productTypeId);
        return (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemIcon}>
                <Ionicons name="cube" size={20} color="#6B7280" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{productType?.name}</Text>
                <Text style={styles.itemSize}>{item.size}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity style={styles.itemActionButton}>
                  <Ionicons name="create" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.itemActionButton}>
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>QR Code:</Text>
                <View style={styles.qrCodeContainer}>
                  <Ionicons name="qr-code" size={12} color="#6B7280" />
                  <Text style={styles.qrCode}>{item.qrCode}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Chất liệu:</Text>
                <Text style={styles.detailValue}>{item.material}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sử dụng:</Text>
                <Text style={styles.detailValue}>{item.currentReuses}/{item.maxReuses}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cọc:</Text>
                <Text style={styles.detailValue}>{formatCurrency(50000)}/ngày</Text>
              </View>
            </View>

            <View style={styles.itemFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <BusinessHeader
        title="Quản lý kho"
        subtitle="Inventory Management"
        user={businessProfile ? {
          _id: businessProfile.userId._id,
          email: businessProfile.userId.email,
          name: businessProfile.userId.username,
          fullName: businessProfile.businessName,
          avatar: businessProfile.businessLogoUrl || undefined,
          role: 'business' as const,
        } : null}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedProductType ? (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="cube" size={24} color="#FFFFFF" />
                <Text style={styles.statCardValue}>{productTypes.length}</Text>
                <Text style={styles.statCardLabel}>Loại sản phẩm</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.statCardValue}>{availableItems.length}</Text>
                <Text style={styles.statCardLabel}>Sẵn sàng</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
                onPress={() => setShowAddCategoryModal(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Thêm danh mục</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => setShowAddTypeModal(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Thêm loại SP</Text>
              </TouchableOpacity>
            </View>

            {renderProductTypes()}
          </>
        ) : (
          <View style={styles.detailView}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedProductType(null)}
            >
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'available' && styles.activeTab]}
                onPress={() => setActiveTab('available')}
              >
                <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                  Sẵn sàng ({availableItems.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'non-available' && styles.activeTab]}
                onPress={() => setActiveTab('non-available')}
              >
                <Text style={[styles.tabText, activeTab === 'non-available' && styles.activeTabText]}>
                  Không sẵn ({nonAvailableItems.length})
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'available' ? renderItems(availableItems) : renderItems(nonAvailableItems)}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <Modal
        visible={showAddCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm danh mục</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tên danh mục"
              placeholderTextColor="#6B7280"
              value={categoryFormData.name}
              onChangeText={(text) => setCategoryFormData({...categoryFormData, name: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Mô tả"
              placeholderTextColor="#6B7280"
              value={categoryFormData.description}
              onChangeText={(text) => setCategoryFormData({...categoryFormData, description: text})}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.confirmButtonText}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddTypeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm loại sản phẩm</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tên loại sản phẩm"
              placeholderTextColor="#6B7280"
              value={typeFormData.name}
              onChangeText={(text) => setTypeFormData({...typeFormData, name: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Mô tả"
              placeholderTextColor="#6B7280"
              value={typeFormData.description}
              onChangeText={(text) => setTypeFormData({...typeFormData, description: text})}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Danh mục"
              placeholderTextColor="#6B7280"
              value={typeFormData.category}
              onChangeText={(text) => setTypeFormData({...typeFormData, category: text})}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddTypeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddProductType}
              >
                <Text style={styles.confirmButtonText}>Tạo</Text>
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
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  productTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  productTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productTypeInfo: {
    flex: 1,
  },
  productTypeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productTypeCategory: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  productTypeStats: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  detailView: {
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemSize: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
  },
  itemActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  qrCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrCode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  itemFooter: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: screenWidth - 40,
    maxHeight: screenHeight * 0.6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});