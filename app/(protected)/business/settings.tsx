import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { authApi, SubscriptionPackage, subscriptionsApi } from '../../../lib/api';
import { businessesApi } from '../../../src/services/api/businessService';
import { BusinessProfile } from '../../../src/types/business.types';

export default function BusinessSettings() {
  const { actions: authActions, state } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('vi'); // 'vi' for Vietnamese, 'en' for English
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Subscription packages states
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [buyingSubscription, setBuyingSubscription] = useState(false);

  // Load business profile data
  useEffect(() => {
    const loadBusinessData = async () => {
      // Wait for auth state to be hydrated before making API calls
      if (!state.isHydrated) {
        return;
      }
      
      if (state.accessToken && state.isAuthenticated && state.role === 'business') {
        try {
          console.log('🔍 Loading business profile for settings screen...');
          const profileResponse = await businessesApi.getProfileWithAutoRefresh();
          console.log('✅ Business profile loaded:', profileResponse);
          
          if (profileResponse.data && profileResponse.data.business) {
            setBusinessProfile(profileResponse.data.business);
          }
        } catch (error: any) {
          console.error('Error loading business profile:', error);
          // Don't show alert for network errors in settings - just log and continue
          // User can still use the settings screen with default values
          if (error?.message?.includes('Network error') || error?.message?.includes('timeout')) {
            console.warn('Network error loading business profile, using default values');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, [state.isHydrated, state.accessToken, state.isAuthenticated, state.role]);

  const handleLogout = async () => {
    try {
      await authActions.logout();
      router.replace('/welcome');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate even if logout fails
      router.replace('/welcome');
    }
  };

  const handleLanguageChange = (language: 'vi' | 'en') => {
    setSelectedLanguage(language);
  };

  const loadSubscriptionPackages = async () => {
    try {
      setLoadingPackages(true);
      console.log('📡 Loading subscription packages...');
      
      try {
        const response = await subscriptionsApi.getAll();
        console.log('📊 Subscription packages response:', response);
        
        if (response.data?.subscriptions) {
          setPackages(response.data.subscriptions);
        } else {
          setPackages([]);
        }
      } catch (apiError) {
        console.log('❌ API not available, using mock data:', apiError);
        
        // Fallback to mock data
        const mockResponse = {
          statusCode: 200,
          message: "Subscriptions retrieved successfully",
          data: {
            subscriptions: [
              {
                _id: "68f339856f15498ff08285cb",
                name: "Free Trial",
                price: 0,
                durationInDays: 7,
                isActive: true,
                isTrial: true,
                isDeleted: false,
                createdAt: "2025-10-18T06:53:57.379Z",
                updatedAt: "2025-10-18T06:53:57.379Z",
              },
              {
                _id: "68f34726cda34044d972f332",
                name: "1 Month",
                price: 299000,
                durationInDays: 30,
                isActive: true,
                isTrial: false,
                isDeleted: false,
                createdAt: "2025-10-18T07:52:06.020Z",
                updatedAt: "2025-10-19T13:49:38.632Z",
              },
              {
                _id: "68f34726cda34044d972f333",
                name: "3 Months",
                price: 799000,
                durationInDays: 90,
                isActive: true,
                isTrial: false,
                isDeleted: false,
                createdAt: "2025-10-18T07:52:06.020Z",
                updatedAt: "2025-10-19T13:49:38.632Z",
              },
              {
                _id: "68f34726cda34044d972f334",
                name: "1 Year",
                price: 2999000,
                durationInDays: 365,
                isActive: true,
                isTrial: false,
                isDeleted: false,
                createdAt: "2025-10-18T07:52:06.020Z",
                updatedAt: "2025-10-19T13:49:38.632Z",
              }
            ]
          }
        };
        
        setPackages(mockResponse.data.subscriptions);
      }
    } catch (error) {
      console.error('❌ Error loading subscription packages:', error);
      alert('Failed to load subscription packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleBuySubscription = async (packageItem: SubscriptionPackage) => {
    try {
      setBuyingSubscription(true);
      console.log('🛒 Buying subscription:', packageItem);
      
      try {
        const response = await subscriptionsApi.buy({
          subscriptionId: packageItem._id
        });
        
        console.log('✅ Buy subscription response:', response);
        alert(`Successfully purchased ${packageItem.name} package!`);
        setShowSubscriptionModal(false);
      } catch (apiError) {
        console.log('❌ API not available, using mock purchase:', apiError);
        alert(`Mock purchase: ${packageItem.name} package selected!`);
        setShowSubscriptionModal(false);
      }
    } catch (error) {
      console.error('❌ Error buying subscription:', error);
      alert('Failed to purchase subscription');
    } finally {
      setBuyingSubscription(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  };

  const formatDuration = (days: number) => {
    if (days === 7) return '7 days';
    if (days === 30) return '1 month';
    if (days === 90) return '3 months';
    if (days === 365) return '1 year';
    return `${days} days`;
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        alert('Please fill in all fields');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        alert('New password must be at least 6 characters');
        return;
      }

      // Call API to change password
      await authApi.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword,
      });
      
      alert('Password changed successfully');

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      alert(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Card */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Ngôn ngữ</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'vi' ? styles.languageButtonActive : styles.languageButtonInactive
              ]}
              onPress={() => handleLanguageChange('vi')}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === 'vi' ? styles.languageButtonTextActive : styles.languageButtonTextInactive
              ]}>
                Tiếng Việt
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'en' ? styles.languageButtonActive : styles.languageButtonInactive
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[
                styles.languageButtonText,
                selectedLanguage === 'en' ? styles.languageButtonTextActive : styles.languageButtonTextInactive
              ]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings List Card */}
        <View style={styles.settingsCard}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(protected)/business/notifications')}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="notifications" size={24} color="#0F4D3A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Thông báo</Text>
                <Text style={styles.settingSubtitle}>Quản lý thông báo ứng dụng</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(protected)/business/my-profile')}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="person" size={24} color="#0F4D3A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Hồ sơ doanh nghiệp</Text>
                <Text style={styles.settingSubtitle}>Xem và chỉnh sửa thông tin doanh nghiệp</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="lock-closed" size={24} color="#0F4D3A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Đổi mật khẩu</Text>
                <Text style={styles.settingSubtitle}>Cập nhật mật khẩu tài khoản</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(protected)/business/help')}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="help-circle" size={24} color="#0F4D3A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Trợ giúp & Hỗ trợ</Text>
                <Text style={styles.settingSubtitle}>FAQ và hỗ trợ</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/(protected)/business/about')}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-circle" size={24} color="#0F4D3A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Về ứng dụng</Text>
                <Text style={styles.settingSubtitle}>Phiên bản và thông tin</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
        
        {/* Bottom spacing to avoid navigation bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập mật khẩu hiện tại"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                secureTextEntry
              />
              
              <Text style={styles.modalLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập mật khẩu mới"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry
              />
              
              <Text style={styles.modalLabel}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Xác nhận mật khẩu mới"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.modalSaveButtonText}>
                  {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Packages Modal */}
      <Modal
        visible={showSubscriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.subscriptionModalOverlay}>
          <View style={styles.subscriptionModalContent}>
            <View style={styles.subscriptionModalHeader}>
              <Text style={styles.subscriptionModalTitle}>Gói đăng ký</Text>
              <TouchableOpacity onPress={() => setShowSubscriptionModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.subscriptionModalBody} showsVerticalScrollIndicator={false}>
              {loadingPackages ? (
                <View style={styles.subscriptionLoadingContainer}>
                  <Text style={styles.subscriptionLoadingText}>Đang tải gói...</Text>
                </View>
              ) : (
                packages.map((packageItem) => (
                  <TouchableOpacity
                    key={packageItem._id}
                    style={styles.subscriptionPackageCard}
                    onPress={() => handleBuySubscription(packageItem)}
                    disabled={buyingSubscription}
                  >
                    <View style={styles.subscriptionPackageHeader}>
                      <View style={styles.subscriptionPackageIcon}>
                        <Ionicons 
                          name={packageItem.isTrial ? "gift" : "card"} 
                          size={24} 
                          color="#0F4D3A" 
                        />
                      </View>
                      <View style={styles.subscriptionPackageInfo}>
                        <Text style={styles.subscriptionPackageName}>{packageItem.name}</Text>
                        <Text style={styles.subscriptionPackageDuration}>
                          {formatDuration(packageItem.durationInDays)}
                        </Text>
                      </View>
                      <View style={styles.subscriptionPackagePrice}>
                        <Text style={styles.subscriptionPriceText}>
                          {formatPrice(packageItem.price)}
                        </Text>
                        {packageItem.isTrial && (
                          <View style={styles.subscriptionTrialBadge}>
                            <Text style={styles.subscriptionTrialText}>TRIAL</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.subscriptionPackageFeatures}>
                      <View style={styles.subscriptionFeatureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.subscriptionFeatureText}>Truy cập đầy đủ tính năng</Text>
                      </View>
                      <View style={styles.subscriptionFeatureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.subscriptionFeatureText}>Hỗ trợ khách hàng ưu tiên</Text>
                      </View>
                      <View style={styles.subscriptionFeatureItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.subscriptionFeatureText}>Phân tích nâng cao</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#00704A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#0F4D3A',
  },
  languageButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F4D3A',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  languageButtonTextInactive: {
    color: '#0F4D3A',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
  },
  logoutButton: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#00704A',
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Subscription modal styles
  subscriptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  subscriptionModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  subscriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subscriptionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  subscriptionModalBody: {
    flex: 1,
    padding: 20,
  },
  subscriptionLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  subscriptionLoadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  subscriptionPackageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subscriptionPackageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionPackageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionPackageInfo: {
    flex: 1,
  },
  subscriptionPackageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subscriptionPackageDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionPackagePrice: {
    alignItems: 'flex-end',
  },
  subscriptionPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F4D3A',
  },
  subscriptionTrialBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  subscriptionTrialText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  subscriptionPackageFeatures: {
    gap: 6,
  },
  subscriptionFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionFeatureText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
});