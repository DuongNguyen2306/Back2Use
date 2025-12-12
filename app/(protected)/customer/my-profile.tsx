import { authApi } from '@/services/api/authService';
import { businessApi } from '@/services/api/businessService';
import { getCurrentUserProfileWithAutoRefresh, updateUserProfileWithAutoRefresh, uploadAvatarWithAutoRefresh } from '@/services/api/userService';
import { UpdateProfileRequest, User } from '@/types/auth.types';
import { validateProfileForm, ValidationError } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BusinessRegisterHistoryModal from '../../../components/BusinessRegisterHistoryModal';
import BusinessRegisterModal from '../../../components/BusinessRegisterModal';
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../hooks/use-toast';
import { useI18n } from '../../../hooks/useI18n';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MyProfile() {
  const auth = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showBusinessRegisterModal, setShowBusinessRegisterModal] = useState(false);
  const [showBusinessHistoryModal, setShowBusinessHistoryModal] = useState(false);
  const [hasPendingBusiness, setHasPendingBusiness] = useState(false);
  const [hasBusinessRole, setHasBusinessRole] = useState(false);
  const [businessHistory, setBusinessHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Change password states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    notifications: true,
    emailUpdates: true,
    smsAlerts: false,
  });

  // Helper function to format date string to YYYY-MM-DD
  const formatDateString = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // If it's a full ISO date string, extract YYYY-MM-DD
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    
    // If it's in other formats, try to parse and format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.log('Date parsing error:', error);
    }
    
    return dateStr;
  };

  // Helper function to format input as user types (add dashes automatically)
  const formatDateInput = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Add dashes at appropriate positions
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }
  };

  const loadUserData = useCallback(async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUserProfileWithAutoRefresh();
        setUser(userData);
        
        // Populate form with user data from API response
        setFormData({
          name: (userData as any).fullName || userData.name || "",
          email: userData.email || "",
          phone: (userData as any).phone || "",
          address: (userData as any).address || "",
          dateOfBirth: formatDateString((userData as any).yob || ""),
          notifications: true,
          emailUpdates: true,
          smsAlerts: false,
        });

      // Check if user already has business role FIRST
      const userHasBusinessRole = userData.role === 'business' || auth.state.role === 'business';
      if (userHasBusinessRole) {
        setHasBusinessRole(true);
        console.log('✅ User already has business role from userData or auth state');
      }
      
      // Check for pending business registration (this may also set hasBusinessRole if approved)
        await checkPendingBusiness();
      
      // Final check: ensure hasBusinessRole is set if user has business role
      if (userData.role === 'business' || auth.state.role === 'business') {
        setHasBusinessRole(true);
      }
      } catch (error: any) {
        // Silently handle "No valid access token available" errors
        const isNoTokenError = error?.message?.toLowerCase().includes('no valid access token') ||
                               error?.message?.toLowerCase().includes('no access token');
        
        // Don't show toast for network errors - they're expected when offline
        const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                               error?.message?.toLowerCase().includes('timeout') ||
                               error?.message?.toLowerCase().includes('connection');
        
        if (!isNoTokenError && !isNetworkError) {
          console.error('Error loading user data:', error);
          toast({
            title: "Lỗi",
            description: "Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.",
          });
        } else if (isNetworkError) {
          console.warn('⚠️ Network error loading user data (will retry later):', error.message);
          // Don't show toast for network errors - user can still use the form
        }
      } finally {
        setLoading(false);
      }
  }, [toast, auth.state.role]);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Reload user data when screen is focused (e.g., after returning from profile edit)
  useFocusEffect(
    useCallback(() => {
      const checkAndReload = async () => {
        try {
          const lastUpdateTimestamp = await AsyncStorage.getItem('PROFILE_UPDATED_TIMESTAMP');
          if (lastUpdateTimestamp) {
            const lastUpdate = parseInt(lastUpdateTimestamp, 10);
            const now = Date.now();
            // Reload if profile was updated within the last 5 minutes
            if (now - lastUpdate < 5 * 60 * 1000) {
              console.log('🔄 Profile was recently updated, reloading user data...');
              await loadUserData();
            }
          } else {
            // Always reload when screen is focused to ensure fresh data
            await loadUserData();
          }
        } catch (error) {
          console.error('Error checking profile update:', error);
          // Still try to load user data
          await loadUserData();
        }
      };
      checkAndReload();
    }, [loadUserData])
  );

  // Check if user has pending business registration and load history
  const checkPendingBusiness = async () => {
    try {
      setLoadingHistory(true);
      // Load all business history
      const response = await businessApi.getHistory({ page: 1, limit: 10 });
      
      console.log('📋 Business history response:', response);
      
      // Handle different response formats
      let historyData: any[] = [];
      const responseAny = response as any;
      
      if (Array.isArray(responseAny)) {
        // If response is directly an array
        historyData = responseAny;
      } else if (responseAny.data && Array.isArray(responseAny.data)) {
        // If response has data property with array
        historyData = responseAny.data;
      } else if (responseAny.data && responseAny.data.data && Array.isArray(responseAny.data.data)) {
        // If response is nested
        historyData = responseAny.data.data;
      }
      
      console.log('📋 Extracted history data:', historyData);
      
      if (historyData && historyData.length > 0) {
        console.log('✅ Found business history:', historyData.length, 'items');
        setBusinessHistory(historyData);
        // Check if there's any pending business
        const hasPending = historyData.some((item: any) => item.status === 'pending');
        setHasPendingBusiness(hasPending);
        console.log('📊 Has pending business:', hasPending);
        
        // Check if there's any approved business (user already has business role)
        const hasApproved = historyData.some((item: any) => item.status === 'approved');
        console.log('📊 Has approved business:', hasApproved);
        if (hasApproved) {
          console.log('✅ Found approved business, user has business role - hiding register button');
          setHasBusinessRole(true);
        }
        // Don't set to false if user already has business role from userData
        // Only set to false if we're sure they don't have it
      } else {
        console.log('ℹ️ No business history found');
        setBusinessHistory([]);
        setHasPendingBusiness(false);
        // Don't reset hasBusinessRole here - it might be set from userData.role
      }
    } catch (error) {
      console.error('❌ Error checking pending business:', error);
      // If error, assume no pending business
      setHasPendingBusiness(false);
      setBusinessHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle business register button press
  const handleBusinessRegisterPress = () => {
    // Prevent registration if user already has business role
    if (auth.state.role === 'business' || user?.role === 'business') {
      toast({
        title: "Thông báo",
        description: "Bạn đã có tài khoản doanh nghiệp. Vui lòng chuyển sang chế độ doanh nghiệp để sử dụng.",
      });
      return;
    }

    // If user has business history, show history modal instead of register form
    if (businessHistory.length > 0) {
      setShowBusinessHistoryModal(true);
      return;
    }

    if (hasPendingBusiness) {
      // Show history modal if there's a pending business
      setShowBusinessHistoryModal(true);
    } else {
      // Show register modal if no pending business and no history
      setShowBusinessRegisterModal(true);
    }
  };

  const shortcuts = [
    {
      id: 'wallet',
      icon: 'wallet-outline',
      label: 'My Wallet',
      color: '#10B981',
      onPress: () => router.push('/(protected)/customer/customer-wallet'),
    },
    {
      id: 'stores',
      icon: 'storefront-outline',
      label: 'Stores',
      color: '#3B82F6',
      onPress: () => router.push('/(protected)/customer/stores'),
    },
    {
      id: 'rewards',
      icon: 'gift-outline',
      label: 'Rewards',
      color: '#F59E0B',
      onPress: () => router.push('/(protected)/customer/rewards'),
    },
    {
      id: 'history',
      icon: 'time-outline',
      label: 'History',
      color: '#8B5CF6',
      onPress: () => router.push('/(protected)/customer/transaction-history'),
    },
    {
      id: 'feedbacks',
      title: 'My Feedbacks',
      subtitle: 'View and manage your feedbacks',
      icon: 'star',
      onPress: () => router.push('/(protected)/customer/my-feedbacks'),
    },
    {
      id: 'leaderboard',
      icon: 'trophy-outline',
      label: 'Leaderboard',
      color: '#EF4444',
      onPress: () => router.push('/(protected)/customer/leaderboard'),
    },
    {
      id: 'ai-chat',
      icon: 'chatbubble-ellipses-outline',
      label: 'AI Chat',
      color: '#06B6D4',
      onPress: () => router.push('/(protected)/customer/ai-chat'),
    },
  ];

  const [expandedHelp, setExpandedHelp] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);

  const menuSections: MenuSection[] = [
    {
      title: t('profile').settings,
      items: [
        {
          id: 'history',
          title: 'Transaction History',
          subtitle: 'View your transaction history',
          icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
          onPress: () => router.push('/(protected)/customer/transaction-history'),
        },
        {
          id: 'feedbacks',
          title: 'My Feedbacks',
          subtitle: 'View and manage your feedbacks',
          icon: 'star' as keyof typeof Ionicons.glyphMap,
          onPress: () => router.push('/(protected)/customer/my-feedbacks'),
        },
        {
          id: 'language',
          title: t('profile').language,
          subtitle: language === 'vi' ? 'Tiếng Việt' : 'English',
          icon: 'language',
          onPress: () => {
            const newLanguage = language === 'vi' ? 'en' : 'vi';
            changeLanguage(newLanguage);
          },
        },
        {
          id: 'notifications',
          title: t('profile').notifications,
          subtitle: 'Quản lý thông báo ứng dụng',
          icon: 'notifications',
          onPress: () => console.log('Navigate to Notifications'),
        },
        {
          id: 'security',
          title: t('profile').security,
          subtitle: 'Mật khẩu và xác thực',
          icon: 'shield-checkmark',
          onPress: () => console.log('Navigate to Security'),
        },
      ]
    },
    {
      title: t('profile').generalSettings,
      items: [
        {
          id: 'account',
          title: t('profile').accountSettings,
          subtitle: 'Update information and edit profile',
          icon: 'person-circle',
          onPress: () => console.log('Navigate to Account Settings'),
        },
        {
          id: 'password',
          title: 'Change Password',
          subtitle: 'Update your account password',
          icon: 'lock-closed',
          onPress: () => setShowChangePasswordModal(true),
        },
        // Only show switch to business if user has business role
        ...(hasBusinessRole || auth.state.role === 'business' || user?.role === 'business' ? [{
          id: 'switch-to-business',
          title: 'Chuyển sang tài khoản doanh nghiệp',
          subtitle: 'Chuyển đổi sang chế độ doanh nghiệp',
          icon: 'briefcase' as keyof typeof Ionicons.glyphMap,
          onPress: () => handleSwitchRole('business'),
        }] : []),
      ]
    },
    {
      title: 'Activity',
      items: [
        {
          id: 'rank',
          title: t('profile').viewRankings,
          subtitle: 'Leaderboard and your ranking position',
          icon: 'trophy',
          onPress: () => router.push('/(protected)/customer/leaderboard'),
        },
        {
          id: 'history',
          title: 'Lịch sử mượn',
          subtitle: 'Xem lịch sử giao dịch mượn',
          icon: 'time',
          onPress: () => router.push('/(protected)/customer/transaction-history'),
    },
    {
      id: 'feedbacks',
      title: 'My Feedbacks',
      subtitle: 'View and manage your feedbacks',
      icon: 'star',
      onPress: () => router.push('/(protected)/customer/my-feedbacks'),
        },
        {
          id: 'rewards',
          title: t('rewards').title,
          subtitle: 'Points, vouchers and special offers',
          icon: 'gift',
          onPress: () => router.push('/(protected)/customer/rewards'),
        },
        {
          id: 'ai-chat',
          title: t('profile').aiChat,
          subtitle: 'Chat with smart AI Assistant',
          icon: 'chatbubble-ellipses',
                        onPress: () => router.push('/(protected)/customer/ai-chat'),
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: t('profile').help,
          subtitle: 'FAQ, guides and contact support',
          icon: 'help-circle',
          onPress: () => console.log('Navigate to Help'),
        },
        {
          id: 'about',
          title: t('profile').aboutApp,
          subtitle: 'Version, terms and policies',
          icon: 'information-circle',
          onPress: () => console.log('Navigate to About'),
        },
      ]
    }
  ];

  // Replace logout handler to use auth.actions.logout
  const handleLogout = async () => {
    try {
      await auth.actions.logout();
      router.replace('/auth');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Switch role handler
  const handleSwitchRole = async (targetRole: 'customer' | 'business') => {
    try {
      console.log(`🔄 Switching role to: ${targetRole}`);
      
      const response = await authApi.switchRole({ role: targetRole });
      
      if (response.data?.accessToken && response.data?.refreshToken) {
        const newRole = response.data.user?.role as 'customer' | 'business' | 'admin';
        const tokenExpiry = Date.now() + (60 * 60 * 1000);
        
        // Use switchRoleWithTokens to update both tokens and role in auth state
        await auth.actions.switchRoleWithTokens(
          newRole || targetRole,
          response.data.accessToken,
          response.data.refreshToken,
          tokenExpiry,
          response.data.user || null
        );
        
        console.log(`✅ Role switched, waiting for token propagation...`);
        
        // Wait a bit longer to ensure token is fully propagated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify token was saved correctly before redirecting
        const savedToken = await AsyncStorage.getItem('ACCESS_TOKEN');
        if (savedToken !== response.data.accessToken) {
          console.error('❌ Token mismatch after switch!');
          throw new Error('Token không được lưu đúng cách');
        }
        
        console.log(`✅ Token verified, redirecting...`);
        
        toast({
          title: "Thành công",
          description: `Đã chuyển sang tài khoản ${targetRole === 'business' ? 'doanh nghiệp' : 'khách hàng'}`,
        });
        
        // Redirect to appropriate dashboard
        if (targetRole === 'business') {
          router.replace('/(protected)/business');
        } else {
          router.replace('/(protected)/customer');
        }
      } else {
        throw new Error('Không nhận được token từ server');
      }
    } catch (error: any) {
      console.error('❌ Switch role error:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể chuyển đổi tài khoản. Vui lòng thử lại.",
      });
    }
  };

  const handleEditProfile = () => {
    console.log('Edit profile pressed');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);

      // Validate form
      const validationResult = validateProfileForm(formData);
      if (validationResult.isValid === false && validationResult.errors) {
        setValidationErrors(validationResult.errors);
        toast({
          title: "Validation Error",
          description: "Please check your input and try again",
        });
        return;
      }

      // Prepare update data - only include fields that have actually changed
      const updateData: UpdateProfileRequest = {};
      
      // Only include fields that are different from the original user data
      if (user && formData.name !== (user.fullName || user.name || "")) {
        updateData.fullName = formData.name;
      }
      if (user && formData.phone !== (user.phone || "")) {
        updateData.phone = formData.phone;
      }
      if (user && formData.address !== (user.address || "")) {
        updateData.address = formData.address;
      }
      if (user && formData.dateOfBirth !== formatDateString(user.yob || "")) {
        updateData.yob = formData.dateOfBirth ? formatDateString(formData.dateOfBirth) : undefined;
      }

      // Check if there are any changes to save
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes detected to save",
        });
        setIsEditing(false);
        return;
      }

      console.log('📝 Sending only changed fields:', updateData);

      // Update profile
      const updatedUser = await updateUserProfileWithAutoRefresh(updateData);
      setUser(updatedUser);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);

      // Validation
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
        });
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters",
        });
        return;
      }

      // Call API to change password
      await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      });
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      // Reset form
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        name: (user as any).fullName || user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        address: (user as any).address || "",
        dateOfBirth: formatDateString((user as any).yob || ""),
        notifications: true,
        emailUpdates: true,
        smsAlerts: false,
      });
    }
    setValidationErrors([]);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (imageUri: string) => {
    try {
      setUploadingAvatar(true);
      const response = await uploadAvatarWithAutoRefresh(imageUri);
      
      // Extract avatarUrl from response
      const avatarUrl = response?.data?.avatarUrl || 
                       (typeof response.data === 'string' ? response.data : '') ||
                       (response as any)?.avatarUrl || '';
      
      if (avatarUrl) {
        setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      } else {
        throw new Error('No avatar URL returned from server');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile').myAccount}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00704A" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const userName = (user as any)?.fullName || user?.name || 'User Name';
  const userAvatar = user?.avatar || null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLeft}
          onPress={() => router.push('/(protected)/customer/profile-detail')}
          activeOpacity={0.7}
        >
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
      </View>
          )}
          <Text style={styles.headerName}>{userName}</Text>
          {/* Only show switch role button if user has business role */}
          {(hasBusinessRole || auth.state.role === 'business' || user?.role === 'business') && (
                <TouchableOpacity 
              style={styles.headerSwitchRoleButton}
              onPress={(e) => {
                e.stopPropagation();
                handleSwitchRole('business');
              }}
            >
              <Ionicons name="swap-horizontal" size={20} color="#00704A" />
                </TouchableOpacity>
          )}
        </TouchableOpacity>
        <View style={styles.headerRight}>
                <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => router.push('/(protected)/customer/settings')}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Shortcuts Grid */}
        <View style={styles.shortcutsGrid}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.id}
              style={styles.shortcutCard}
              onPress={shortcut.onPress}
            >
              <View style={[styles.shortcutIconContainer, { backgroundColor: `${shortcut.color}15` }]}>
                <Ionicons name={shortcut.icon as any} size={32} color={shortcut.color} />
              </View>
              <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
            </TouchableOpacity>
          ))}
              </View>

        {/* Collapsible Settings List */}
        <View style={styles.settingsList}>
          <TouchableOpacity
            style={styles.settingsListItem}
            onPress={() => setExpandedHelp(!expandedHelp)}
          >
            <View style={styles.settingsListItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#00704A" />
              <Text style={styles.settingsListItemText}>Help & Support</Text>
              </View>
            <Ionicons 
              name={expandedHelp ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          {expandedHelp && (
            <View style={styles.expandedContent}>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/customer/help')}
              >
                <Text style={styles.expandedItemText}>FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/customer/contact')}
              >
                <Text style={styles.expandedItemText}>Contact Support</Text>
              </TouchableOpacity>
              </View>
          )}

          <TouchableOpacity
            style={styles.settingsListItem}
            onPress={() => setExpandedSettings(!expandedSettings)}
          >
            <View style={styles.settingsListItemLeft}>
              <Ionicons name="settings-outline" size={24} color="#00704A" />
              <Text style={styles.settingsListItemText}>Settings & Privacy</Text>
              </View>
            <Ionicons 
              name={expandedSettings ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          {expandedSettings && (
            <View style={styles.expandedContent}>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/customer/settings')}
              >
                <Text style={styles.expandedItemText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.expandedItem}
                onPress={() => router.push('/(protected)/customer/privacy')}
              >
                <Text style={styles.expandedItemText}>Privacy</Text>
              </TouchableOpacity>
                </View>
              )}
            </View>
            
        {/* Business Registration History - Always show if there's history */}
        {businessHistory.length > 0 && (
          <View style={styles.businessRegisterSection}>
            <Text style={styles.businessHistoryTitle}>Business Registration History</Text>
            {businessHistory.slice(0, 1).map((item: any, index: number) => (
                <TouchableOpacity
                key={item._id || index}
                style={styles.businessHistoryCard}
                onPress={() => setShowBusinessHistoryModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.businessHistoryHeader}>
                  <Text style={styles.businessHistoryName}>{item.businessName}</Text>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'approved' && styles.statusBadgeApproved,
                    item.status === 'rejected' && styles.statusBadgeRejected,
                    item.status === 'pending' && styles.statusBadgePending,
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      item.status === 'approved' && styles.statusBadgeTextApproved,
                      item.status === 'rejected' && styles.statusBadgeTextRejected,
                      item.status === 'pending' && styles.statusBadgeTextPending,
                    ]}>
                      {item.status === 'approved' ? 'Approved' : 
                       item.status === 'rejected' ? 'Rejected' : 
                       'Pending'}
                    </Text>
                    </View>
                    </View>
                </TouchableOpacity>
              ))}
            </View>
        )}

        {/* Business Registration Section - Only show register button if user doesn't have business role */}
        {!hasBusinessRole && auth.state.role !== 'business' && user?.role !== 'business' && businessHistory.length === 0 && (
        <View style={styles.businessRegisterSection}>
          <TouchableOpacity 
            style={styles.businessRegisterButton} 
              onPress={() => {
                if (hasPendingBusiness) {
                  setShowBusinessHistoryModal(true);
                } else {
                  setShowBusinessRegisterModal(true);
                }
              }}
          >
            <Ionicons name="business-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.businessRegisterButtonText}>Register Business</Text>
            {hasPendingBusiness && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        )}

        {/* Register New Business Button - Only show if user doesn't have approved business */}
        {!hasBusinessRole && auth.state.role !== 'business' && user?.role !== 'business' && 
         businessHistory.length > 0 && 
         !businessHistory.some((item: any) => item.status === 'approved') && 
         !hasPendingBusiness && (
          <View style={styles.businessRegisterSection}>
            <TouchableOpacity 
              style={[styles.businessRegisterButton, { backgroundColor: '#00704A' }]} 
              onPress={() => setShowBusinessRegisterModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.businessRegisterButtonText}>Register New Business</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter current password"
                value={passwordData.oldPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, oldPassword: text }))}
                secureTextEntry
              />
              
              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry
              />
              
              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm new password"
                value={passwordData.confirmNewPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmNewPassword: text }))}
                secureTextEntry
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.modalSaveButtonText}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Business Register Modal */}
      <BusinessRegisterModal
        visible={showBusinessRegisterModal}
        onClose={() => setShowBusinessRegisterModal(false)}
        onSuccess={async () => {
          toast({
            title: "Success",
            description: "Business registration submitted successfully",
          });
          // Check for pending business after registration
          await checkPendingBusiness();
        }}
      />

      {/* Business Register History Modal */}
      <BusinessRegisterHistoryModal
        visible={showBusinessHistoryModal}
        onClose={() => setShowBusinessHistoryModal(false)}
      />
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  headerAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  headerAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#00704A',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  headerSwitchRoleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shortcutCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shortcutIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsListItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  expandedContent: {
    backgroundColor: '#F9FAFB',
    paddingLeft: 52,
  },
  expandedItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expandedItemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  bottomSpacing: {
    height: 180,
  },
  userInfoCard: {
    backgroundColor: '#0F4D3A',
    borderRadius: 20,
    marginTop: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shape: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  shape1: {
    width: 80,
    height: 80,
    backgroundColor: '#A8E063',
    top: -20,
    right: -20,
  },
  shape2: {
    width: 60,
    height: 60,
    backgroundColor: '#10B981',
    bottom: -10,
    left: -10,
  },
  shape3: {
    width: 40,
    height: 40,
    backgroundColor: '#34D399',
    top: 60,
    right: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  userDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  achievementBadge: {
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 70,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  businessRegisterSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  businessHistoryContainer: {
    marginTop: 8,
  },
  businessHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  businessHistoryCard: {
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
  businessHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessHistoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadgeTextApproved: {
    color: '#065F46',
  },
  statusBadgeTextRejected: {
    color: '#991B1B',
  },
  statusBadgeTextPending: {
    color: '#92400E',
  },
  businessHistoryInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  rejectNoteContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  rejectNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  rejectNoteText: {
    fontSize: 14,
    color: '#991B1B',
  },
  businessHistoryDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  businessRegisterButton: {
    backgroundColor: '#00704A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    marginTop: 12,
  },
  businessRegisterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pendingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Edit Form Styles
  editFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  editFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  editFormActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00704A',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  avatarUploadSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
    backgroundColor: '#3B82F6',
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
