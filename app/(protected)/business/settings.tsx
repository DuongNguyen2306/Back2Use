import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { changePasswordApi } from '../../../lib/api';

export default function BusinessSettings() {
  const { actions: authActions } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('vi'); // 'vi' for Vietnamese, 'en' for English

  // Change password states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = () => {
    authActions.signOut();
    router.replace('/welcome');
  };

  const handleLanguageChange = (language: 'vi' | 'en') => {
    setSelectedLanguage(language);
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
      await changePasswordApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
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
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cài đặt</Text>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Settings Card */}
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

        {/* Other Settings */}
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="notifications" size={24} color="#00704A" />
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
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="lock-closed" size={24} color="#00704A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Đổi mật khẩu</Text>
                <Text style={styles.settingSubtitle}>Cập nhật mật khẩu tài khoản</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="business" size={24} color="#00704A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Thông tin doanh nghiệp</Text>
                <Text style={styles.settingSubtitle}>Cập nhật thông tin cửa hàng</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="help-circle" size={24} color="#00704A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Trợ giúp</Text>
                <Text style={styles.settingSubtitle}>FAQ và hỗ trợ</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-circle" size={24} color="#00704A" />
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileIcon: {
    padding: 8,
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
    backgroundColor: '#00704A',
  },
  languageButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#00704A',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  languageButtonTextInactive: {
    color: '#00704A',
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
    marginBottom: 40,
    gap: 8,
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
});