import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
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
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../hooks/use-toast';
import { useI18n } from '../../../hooks/useI18n';
import { authApi, SubscriptionPackage } from '../../../lib/api';
import { businessesApi } from '../../../src/services/api/businessService';
import { staffApi, StaffProfile } from '../../../src/services/api/staffService';
import { BusinessProfile } from '../../../src/types/business.types';

const { width } = Dimensions.get('window');

interface ValidationError {
  field: string;
  message: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  showArrow?: boolean;
  badge?: string;
}

export default function BusinessProfileScreen() {
  const auth = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPackage[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

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
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessType: "",
    openTime: "",
    closeTime: "",
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
      console.error('Date parsing error:', error);
    }
    
    return dateStr;
  };

  // Load profile data on component mount (business or staff)
  useEffect(() => {
    const loadProfileData = async () => {
      // Wait for auth state to be hydrated before making API calls
      if (!auth.state.isHydrated) {
        return;
      }
      
      if (!auth.state.accessToken || !auth.state.isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        if (auth.state.role === 'business') {
          console.log('🔍 Loading business profile for my-profile screen...');
          const profileResponse = await businessesApi.getProfileWithAutoRefresh();
          console.log('✅ Business profile loaded:', profileResponse);
          
          if (profileResponse.data) {
            if (profileResponse.data.business) {
              const profile = profileResponse.data.business;
              setBusinessProfile(profile);
              
              // Populate form with business profile data
              setFormData({
                name: profile.businessName || profile.userId.username || "",
                email: profile.userId.email || profile.businessMail || "",
                phone: profile.businessPhone || "",
                address: profile.businessAddress || "",
                businessName: profile.businessName || "",
                businessAddress: profile.businessAddress || "",
                businessPhone: profile.businessPhone || "",
                businessType: profile.businessType || "",
                openTime: profile.openTime || "",
                closeTime: profile.closeTime || "",
                notifications: true,
                emailUpdates: true,
                smsAlerts: false,
              });
            }
            
            // Load active subscription
            if (profileResponse.data.activeSubscription) {
              const subscriptions = Array.isArray(profileResponse.data.activeSubscription) 
                ? profileResponse.data.activeSubscription 
                : [profileResponse.data.activeSubscription];
              setActiveSubscription(subscriptions);
            } else {
              setActiveSubscription([]);
            }
          }
        } else if (auth.state.role === 'staff') {
          console.log('🔍 Loading staff profile for my-profile screen...');
          const profileResponse = await staffApi.getProfile();
          console.log('✅ Staff profile loaded:', profileResponse);
          
          if (profileResponse.data) {
            const profile = profileResponse.data;
            setStaffProfile(profile);
            
            // Populate form with staff profile data
            setFormData({
              name: profile.fullName || "",
              email: profile.email || "",
              phone: profile.phone || "",
              address: "",
              businessName: "",
              businessAddress: "",
              businessPhone: "",
              businessType: "",
              openTime: "",
              closeTime: "",
              notifications: true,
              emailUpdates: true,
              smsAlerts: false,
            });
          }
        }
      } catch (error: any) {
        // Silently handle 403 errors (Access denied - role mismatch)
        if (error?.response?.status === 403 || error?.message === 'ACCESS_DENIED_403') {
          console.log('⚠️ Access denied (403) - silently handled');
        } else {
          const isNetworkError = error?.message?.toLowerCase().includes('network') ||
                                 error?.message?.toLowerCase().includes('timeout') ||
                                 error?.message?.toLowerCase().includes('connection');
          
          if (!isNetworkError) {
            console.error('Error loading profile:', error);
            toast({
              title: "Error",
              description: "Failed to load profile data. Please try again.",
            });
          } else {
            console.warn('⚠️ Network error loading profile (will retry later):', error.message);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [toast, auth.state.isHydrated, auth.state.accessToken, auth.state.isAuthenticated, auth.state.role]);


  const achievements = [
    { id: 'business', icon: 'business', color: '#3B82F6', title: 'Business Owner' },
    { id: 'eco', icon: 'leaf', color: '#10B981', title: 'Green Partner' },
    { id: 'customers', icon: 'people', color: '#F59E0B', title: '100+ Customers' },
    { id: 'revenue', icon: 'trending-up', color: '#8B5CF6', title: 'Top Revenue' },
  ];

  const menuSections: MenuSection[] = [
    {
      title: '', // No title for main menu
      items: [
        {
          id: 'change-password',
          title: 'Change Password',
          icon: 'lock-closed-outline',
          color: '#3B82F6',
          onPress: () => setShowChangePasswordModal(true),
          showArrow: false,
        },
        {
          id: 'switch-to-customer',
          title: 'Switch to Customer Account',
          icon: 'swap-horizontal-outline',
          color: '#10B981',
          onPress: () => handleSwitchRole('customer'),
          showArrow: true,
        },
      ],
    },
  ];

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);

      // Basic validation
      const errors: ValidationError[] = [];
      
      if (!formData.name.trim()) {
        errors.push({ field: 'name', message: 'Name cannot be empty' });
      }
      
      if (!formData.email.trim()) {
        errors.push({ field: 'email', message: 'Email cannot be empty' });
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      if (auth.state.role === 'business') {
        // Update business profile
        const updateData = {
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessPhone: formData.businessPhone,
          businessType: formData.businessType,
          openTime: formData.openTime,
          closeTime: formData.closeTime,
        };

        await businessesApi.updateProfile(updateData);
        
        // Reload business profile data
        const refreshedProfile = await businessesApi.getProfileWithAutoRefresh();
        if (refreshedProfile.data && refreshedProfile.data.business) {
          const updatedProfile = refreshedProfile.data.business;
          setBusinessProfile(updatedProfile);
          
          setFormData({
            name: updatedProfile.businessName || updatedProfile.userId.username || "",
            email: updatedProfile.userId.email || updatedProfile.businessMail || "",
            phone: updatedProfile.businessPhone || "",
            address: updatedProfile.businessAddress || "",
            businessName: updatedProfile.businessName || "",
            businessAddress: updatedProfile.businessAddress || "",
            businessPhone: updatedProfile.businessPhone || "",
            businessType: updatedProfile.businessType || "",
            openTime: updatedProfile.openTime || "",
            closeTime: updatedProfile.closeTime || "",
            notifications: true,
            emailUpdates: true,
            smsAlerts: false,
          });
        }
      } else if (auth.state.role === 'staff') {
        // Update staff profile
        const updateData = {
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
        };

        await staffApi.updateProfile(updateData);
        
        // Reload staff profile data
        const refreshedProfile = await staffApi.getProfile();
        if (refreshedProfile.data) {
          const updatedProfile = refreshedProfile.data;
          setStaffProfile(updatedProfile);
          
          setFormData({
            name: updatedProfile.fullName || "",
            email: updatedProfile.email || "",
            phone: updatedProfile.phone || "",
            address: "",
            businessName: "",
            businessAddress: "",
            businessPhone: "",
            businessType: "",
            openTime: "",
            closeTime: "",
            notifications: true,
            emailUpdates: true,
            smsAlerts: false,
          });
        }
      }
      
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.oldPassword.trim()) {
      Alert.alert("Error", "Please enter your old password");
      return;
    }

    if (!passwordData.newPassword.trim()) {
      Alert.alert("Error", "Please enter your new password");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      Alert.alert("Error", "Password confirmation does not match");
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      Alert.alert("Error", "New password must be different from old password");
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      });
      
      Alert.alert(
        "Success",
        "Password changed successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setShowChangePasswordModal(false);
              setPasswordData({
                oldPassword: "",
                newPassword: "",
                confirmNewPassword: "",
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => auth.actions.logout()
        }
      ]
    );
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
          throw new Error('Token was not saved correctly');
        }
        
        console.log(`✅ Token verified, redirecting...`);
        
        toast({
          title: "Success",
          description: `Switched to ${targetRole === 'business' ? 'business' : 'customer'} account`,
        });
        
        // Redirect to appropriate dashboard
        if (targetRole === 'business') {
          router.replace('/(protected)/business');
        } else {
          router.replace('/(protected)/customer');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('❌ Switch role error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to switch account. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {auth.state.role === 'staff' ? 'Staff Profile' : 'Business Profile'}
        </Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(protected)/business/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: auth.state.role === 'staff' 
                  ? (staffProfile?.avatar || 'https://via.placeholder.com/100')
                  : (businessProfile?.businessLogoUrl || 'https://via.placeholder.com/100')
              }} 
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.avatarEditButton}
              onPress={() => {/* Handle avatar upload */}}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>
            {auth.state.role === 'staff'
              ? (staffProfile?.fullName || 'Staff Name')
              : (businessProfile?.businessName || businessProfile?.userId?.username || 'Business Name')}
          </Text>
          <Text style={styles.email}>
            {auth.state.role === 'staff'
              ? (staffProfile?.email || '')
              : (businessProfile?.userId?.email || businessProfile?.businessMail || '')}
          </Text>
          <Text style={styles.role}>
            {auth.state.role === 'staff' ? 'Staff' : 'Business'}
          </Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={16} color="#0F4D3A" />
            <Text style={styles.editProfileButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements Section - Only for business */}
        {auth.state.role === 'business' && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                    <Ionicons name={achievement.icon as any} size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Staff Information Card */}
        {auth.state.role === 'staff' && staffProfile && (
          <View style={styles.businessInfoCard}>
            <Text style={styles.businessInfoTitle}>Staff Information</Text>
            <View style={styles.businessInfoRow}>
              <Ionicons name="person" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Full Name</Text>
                <Text style={styles.businessInfoValue}>{staffProfile.fullName || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="mail" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Email</Text>
                <Text style={styles.businessInfoValue}>{staffProfile.email || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="call" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Phone Number</Text>
                <Text style={styles.businessInfoValue}>{staffProfile.phone || 'Not set'}</Text>
              </View>
            </View>
            {staffProfile.position && (
              <View style={styles.businessInfoRow}>
                <Ionicons name="briefcase" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
                <View style={styles.businessInfoContent}>
                  <Text style={styles.businessInfoLabel}>Position</Text>
                  <Text style={styles.businessInfoValue}>{staffProfile.position}</Text>
                </View>
              </View>
            )}
            {staffProfile.businessId && (
              <View style={styles.businessInfoRow}>
                <Ionicons name="business" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
                <View style={styles.businessInfoContent}>
                  <Text style={styles.businessInfoLabel}>Business</Text>
                  <Text style={styles.businessInfoValue}>
                    {typeof staffProfile.businessId === 'object' 
                      ? staffProfile.businessId.businessName 
                      : 'Not set'}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.businessInfoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Status</Text>
                <Text style={styles.businessInfoValue}>
                  {staffProfile.status === 'active' ? 'Active' : staffProfile.status === 'inactive' ? 'Inactive' : 'Removed'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Business Information Card */}
        {auth.state.role === 'business' && businessProfile && (
          <View style={styles.businessInfoCard}>
            <Text style={styles.businessInfoTitle}>Business Information</Text>
            <View style={styles.businessInfoRow}>
              <Ionicons name="business" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Business Name</Text>
                <Text style={styles.businessInfoValue}>{businessProfile.businessName || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="mail" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Business Email</Text>
                <Text style={styles.businessInfoValue}>{businessProfile.businessMail || businessProfile.userId?.email || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="call" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Phone Number</Text>
                <Text style={styles.businessInfoValue}>{businessProfile.businessPhone || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="location" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Address</Text>
                <Text style={styles.businessInfoValue}>{businessProfile.businessAddress || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="pricetag" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Business Type</Text>
                <Text style={styles.businessInfoValue}>{businessProfile.businessType || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.businessInfoRow}>
              <Ionicons name="time" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
              <View style={styles.businessInfoContent}>
                <Text style={styles.businessInfoLabel}>Working Hours</Text>
                <Text style={styles.businessInfoValue}>
                  {businessProfile.openTime && businessProfile.closeTime 
                    ? `${businessProfile.openTime} - ${businessProfile.closeTime}`
                    : 'Not set'}
                </Text>
              </View>
            </View>
            {businessProfile.taxCode && (
              <View style={styles.businessInfoRow}>
                <Ionicons name="document-text" size={20} color="#0F4D3A" style={styles.businessInfoIcon} />
                <View style={styles.businessInfoContent}>
                  <Text style={styles.businessInfoLabel}>Tax Code</Text>
                  <Text style={styles.businessInfoValue}>{businessProfile.taxCode}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Current Subscription Plan Card - Only for business */}
        {auth.state.role === 'business' && activeSubscription && activeSubscription.length > 0 ? (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name="card" size={24} color="#00704A" />
              <Text style={styles.subscriptionTitle}>Current Subscription Plan</Text>
            </View>
            {activeSubscription.map((sub: any, index: number) => {
              // Handle different possible structures
              const subscriptionName = sub.subscriptionId?.name || sub.subscription?.name || sub.name || 'Unknown Plan';
              const subscriptionPrice = sub.subscriptionId?.price || sub.subscription?.price || sub.price || 0;
              const startDate = sub.startDate || sub.startAt || sub.createdAt;
              const endDate = sub.endDate || sub.endAt || sub.expiresAt;
              const status = sub.status || (sub.isActive ? 'active' : 'inactive');
              
              return (
                <View key={index} style={styles.subscriptionItem}>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionName}>{subscriptionName}</Text>
                    <Text style={styles.subscriptionPrice}>
                      {subscriptionPrice > 0 
                        ? `${subscriptionPrice.toLocaleString('en-US')} VND` 
                        : 'Free'}
                    </Text>
                    {startDate && endDate && (
                      <Text style={styles.subscriptionDate}>
                        {new Date(startDate).toLocaleDateString('en-US')} - {new Date(endDate).toLocaleDateString('en-US')}
                      </Text>
                    )}
                    {sub.durationInDays && (
                      <Text style={styles.subscriptionDate}>
                        Duration: {sub.durationInDays} days
                      </Text>
                    )}
                    <View style={[
                      styles.subscriptionStatus,
                      status === 'active' && styles.subscriptionStatusActive,
                      status === 'expired' && styles.subscriptionStatusExpired,
                    ]}>
                      <Text style={styles.subscriptionStatusText}>
                        {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : auth.state.role === 'business' ? (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name="card-outline" size={24} color="#9CA3AF" />
              <Text style={styles.subscriptionTitle}>Current Subscription Plan</Text>
            </View>
            <View style={styles.subscriptionItem}>
              <Text style={styles.subscriptionName}>No active subscription</Text>
              <Text style={styles.subscriptionDate}>You don't have an active subscription plan</Text>
            </View>
          </View>
        ) : null}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            <View style={styles.menuItems}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuItemIcon, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  {item.showArrow && (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
           <Ionicons name="log-out-outline" size={20} color="#EF4444" />
           <Text style={styles.logoutText}>Logout</Text>
         </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text style={[styles.saveButton, saving && styles.disabledSaveButton]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Personal Info */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, validationErrors.some(e => e.field === 'name') && styles.inputError]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                />
                {validationErrors.some(e => e.field === 'name') && (
                  <Text style={styles.errorText}>
                    {validationErrors.find(e => e.field === 'name')?.message}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, validationErrors.some(e => e.field === 'email') && styles.inputError]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {validationErrors.some(e => e.field === 'email') && (
                  <Text style={styles.errorText}>
                    {validationErrors.find(e => e.field === 'email')?.message}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Address - Only for business */}
              {auth.state.role === 'business' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    placeholder="Enter address"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}
            </View>

            {/* Business Info - Only for business */}
            {auth.state.role === 'business' && (
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Business Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessName}
                    onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                    placeholder="Enter business name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Address</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessAddress}
                    onChangeText={(text) => setFormData({ ...formData, businessAddress: text })}
                    placeholder="Enter business address"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessPhone}
                    onChangeText={(text) => setFormData({ ...formData, businessPhone: text })}
                    placeholder="Enter business phone"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Type</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.businessType}
                    onChangeText={(text) => setFormData({ ...formData, businessType: text })}
                    placeholder="Enter business type"
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Open Time</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.openTime}
                      onChangeText={(text) => setFormData({ ...formData, openTime: text })}
                      placeholder="08:00"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Close Time</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.closeTime}
                      onChangeText={(text) => setFormData({ ...formData, closeTime: text })}
                      placeholder="22:00"
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Old Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.oldPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                placeholder="Enter old password"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmNewPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmNewPassword: text })}
                placeholder="Re-enter new password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.confirmButton, changingPassword && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              <Text style={styles.confirmButtonText}>
                {changingPassword ? 'Processing...' : 'Change Password'}
              </Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00704A',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00704A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00704A',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  role: {
    fontSize: 14,
    color: '#0F4D3A',
    fontWeight: '500',
    backgroundColor: '#E5F7F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F7F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F4D3A',
    marginLeft: 6,
  },
  businessInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessType: {
    fontSize: 14,
    color: '#6B7280',
  },
  businessInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  businessInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  businessInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  businessInfoRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  businessInfoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  businessInfoContent: {
    flex: 1,
  },
  businessInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  businessInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  achievementsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: (width - 60) / 2,
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
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItems: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },
  // Subscription Card styles
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  subscriptionItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#00704A',
    fontWeight: '500',
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  subscriptionStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  subscriptionStatusActive: {
    backgroundColor: '#D1FAE5',
  },
  subscriptionStatusExpired: {
    backgroundColor: '#FEE2E2',
  },
  subscriptionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00704A',
  },
  cancelButton: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledSaveButton: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
  },
  confirmButton: {
    backgroundColor: '#00704A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
