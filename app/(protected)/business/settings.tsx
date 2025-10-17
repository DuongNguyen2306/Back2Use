import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';

export default function BusinessSettings() {
  const { actions: authActions } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('vi'); // 'vi' for Vietnamese, 'en' for English

  const handleLogout = () => {
    authActions.signOut();
    router.replace('/welcome');
  };

  const handleLanguageChange = (language: 'vi' | 'en') => {
    setSelectedLanguage(language);
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

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#00704A" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Bảo mật</Text>
                <Text style={styles.settingSubtitle}>Mật khẩu và xác thực</Text>
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
});