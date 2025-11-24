import { authApi } from '@/services/api/authService';
import { getCurrentUserProfileWithAutoRefresh, updateUserProfileWithAutoRefresh, uploadAvatarWithAutoRefresh } from '@/services/api/userService';
import { UpdateProfileRequest, User } from '@/types/auth.types';
import { validateProfileForm, ValidationError } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AvatarPicker from '../../../components/AvatarPicker';
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../hooks/use-toast';
import { useI18n } from '../../../hooks/useI18n';

export default function ProfileDetail() {
  const auth = useAuth();
  const { t, language, changeLanguage } = useI18n();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

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
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // Helper function to format date input
  const formatDateInput = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, "");
    // Format as YYYY-MM-DD
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUserProfileWithAutoRefresh();
      // getCurrentUserProfileWithAutoRefresh returns User directly, not wrapped in response.data
      setUser(userData);
      
      // Auto-fill form with user data
      const userDataAny = userData as any;
      setFormData({
        name: userDataAny.fullName || userData.name || "",
        email: userData.email || "",
        phone: userDataAny.phone || "",
        address: userDataAny.address || "",
        dateOfBirth: formatDateString(userDataAny.dateOfBirth || userDataAny.yob || ""),
        notifications: userDataAny.notifications !== undefined ? userDataAny.notifications : true,
        emailUpdates: userDataAny.emailUpdates !== undefined ? userDataAny.emailUpdates : true,
        smsAlerts: userDataAny.smsAlerts !== undefined ? userDataAny.smsAlerts : false,
      });
      console.log('✅ Profile loaded and form filled:', {
        name: userDataAny.fullName || userData.name,
        email: userData.email,
        phone: userDataAny.phone,
        dateOfBirth: formatDateString(userDataAny.dateOfBirth || userDataAny.yob || ""),
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setValidationErrors([]);
    // Reset form data to original user data
    if (user) {
      setFormData({
        name: (user as any).fullName || user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        address: (user as any).address || "",
        dateOfBirth: formatDateString((user as any).dateOfBirth || ""),
        notifications: (user as any).notifications !== undefined ? (user as any).notifications : true,
        emailUpdates: (user as any).emailUpdates !== undefined ? (user as any).emailUpdates : true,
        smsAlerts: (user as any).smsAlerts !== undefined ? (user as any).smsAlerts : false,
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Debug: Check current role and token
      console.log('🔍 Profile Save - Current Auth State:', {
        role: auth.state.role,
        isAuthenticated: auth.state.isAuthenticated,
        hasAccessToken: !!auth.state.accessToken,
      });

      // Validate form
      const validationResult = validateProfileForm(formData);
      if (!validationResult.isValid && validationResult.errors) {
        setValidationErrors(validationResult.errors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form",
        });
        return;
      }

      setSaving(true);
      setValidationErrors([]);

      const updateData: UpdateProfileRequest = {
        fullName: formData.name, // Backend expects fullName, not name
        phone: formData.phone,
        address: formData.address,
        yob: formData.dateOfBirth || undefined, // Backend expects yob, not dateOfBirth
        // Note: email is read-only, should not be sent
      };

      console.log('📤 Profile Save - Update Data:', updateData);
      console.log('📤 Profile Save - Current Role:', auth.state.role);

      // Check if user has customer role, if not, try to switch
      if (auth.state.role !== 'customer') {
        console.log('⚠️ Current role is not customer, attempting to switch role...');
        
        try {
          const switchResponse = await authApi.switchRole({ role: 'customer' });
          
          if (switchResponse.data?.accessToken && switchResponse.data?.refreshToken) {
            // Save new tokens
            await AsyncStorage.setItem('ACCESS_TOKEN', switchResponse.data.accessToken);
            await AsyncStorage.setItem('REFRESH_TOKEN', switchResponse.data.refreshToken);
            
            // Update role in auth state
            const newRole = switchResponse.data.user?.role as 'customer' | 'business' | 'admin';
            if (newRole) {
              await auth.actions.updateRole(newRole);
            }
            
            // Calculate token expiry (1 hour from now)
            const tokenExpiry = Date.now() + (60 * 60 * 1000);
            await AsyncStorage.setItem('TOKEN_EXPIRY', tokenExpiry.toString());
            
            console.log('✅ Successfully switched to customer role');
            toast({
              title: "Success",
              description: "Switched to customer account. Please try saving again.",
            });
            
            // Retry the update after switching role
            const updatedUser = await updateUserProfileWithAutoRefresh(updateData);
            setUser(updatedUser);
            
            // Update formData with new user data
            const updatedUserAny = updatedUser as any;
            setFormData({
              name: updatedUserAny.fullName || updatedUser.name || "",
              email: updatedUser.email || "",
              phone: updatedUserAny.phone || "",
              address: updatedUserAny.address || "",
              dateOfBirth: formatDateString(updatedUserAny.dateOfBirth || updatedUserAny.yob || ""),
              notifications: updatedUserAny.notifications !== undefined ? updatedUserAny.notifications : true,
              emailUpdates: updatedUserAny.emailUpdates !== undefined ? updatedUserAny.emailUpdates : true,
              smsAlerts: updatedUserAny.smsAlerts !== undefined ? updatedUserAny.smsAlerts : false,
            });
            
            setIsEditing(false);
            toast({
              title: "Success",
              description: "Profile updated successfully",
            });
            setSaving(false);
            return;
          } else {
            throw new Error('No token received from server');
          }
        } catch (switchError: any) {
          console.error('❌ Failed to switch role:', switchError);
          const errorMsg = `Current role is "${auth.state.role}", but API requires "customer" role. Failed to switch role: ${switchError.message}`;
          toast({
            title: "Role Error",
            description: errorMsg,
          });
          setSaving(false);
          return;
        }
      }

      const updatedUser = await updateUserProfileWithAutoRefresh(updateData);
      // updateUserProfileWithAutoRefresh returns User directly, not wrapped in response.data
      setUser(updatedUser);
      
      // Update formData with new user data
      const updatedUserAny = updatedUser as any;
      setFormData({
        name: updatedUserAny.fullName || updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUserAny.phone || "",
        address: updatedUserAny.address || "",
        dateOfBirth: formatDateString(updatedUserAny.dateOfBirth || updatedUserAny.yob || ""),
        notifications: updatedUserAny.notifications !== undefined ? updatedUserAny.notifications : true,
        emailUpdates: updatedUserAny.emailUpdates !== undefined ? updatedUserAny.emailUpdates : true,
        smsAlerts: updatedUserAny.smsAlerts !== undefined ? updatedUserAny.smsAlerts : false,
      });
      
      setIsEditing(false);
      
      // Reload user profile to ensure we have the latest data (including avatar if it was updated)
      try {
        const refreshedUser = await getCurrentUserProfileWithAutoRefresh();
        setUser(refreshedUser);
        console.log('✅ User profile refreshed after update');
        
        // Mark profile as updated to trigger refresh in other screens
        await AsyncStorage.setItem('PROFILE_UPDATED_TIMESTAMP', Date.now().toString());
      } catch (refreshError) {
        console.error('⚠️ Failed to refresh user profile after update:', refreshError);
        // Continue anyway, we already have the updated user
        // Still mark as updated so other screens can refresh
        await AsyncStorage.setItem('PROFILE_UPDATED_TIMESTAMP', Date.now().toString());
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (imageUri: string) => {
    try {
      setUploadingAvatar(true);
      const response = await uploadAvatarWithAutoRefresh(imageUri);
      
      // Extract avatarUrl from response
      let avatarUrl = response?.data?.avatarUrl || 
                       (typeof response.data === 'string' ? response.data : '') ||
                       (response as any)?.avatarUrl || '';
      
      // If avatarUrl not found in response, fetch updated user profile
      // This handles cases where server updates avatar but doesn't return URL
      if (!avatarUrl) {
        console.log('⚠️ Avatar URL not in response, fetching updated user profile...');
        try {
          const updatedUser = await getCurrentUserProfileWithAutoRefresh();
          avatarUrl = updatedUser?.avatar || '';
          console.log('✅ Fetched avatar from user profile:', avatarUrl);
        } catch (profileError) {
          console.error('❌ Failed to fetch user profile:', profileError);
        }
      }
      
      // Always reload user profile to get the latest data (including avatar)
      // This ensures we have the most up-to-date information
      try {
        const updatedUser = await getCurrentUserProfileWithAutoRefresh();
        setUser(updatedUser);
        
        // Mark profile as updated to trigger refresh in other screens
        await AsyncStorage.setItem('PROFILE_UPDATED_TIMESTAMP', Date.now().toString());
        
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      } catch (profileError) {
        console.error('❌ Failed to reload user profile:', profileError);
        // Even if reload fails, update with the avatarUrl we have
        if (avatarUrl) {
          setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
        }
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      // Check if error is just about missing URL but upload succeeded
      if (error.message?.includes('No avatar URL returned')) {
        // Try to fetch user profile to verify upload succeeded
        try {
          const updatedUser = await getCurrentUserProfileWithAutoRefresh();
          if (updatedUser?.avatar) {
            setUser(updatedUser);
            toast({
              title: "Success",
              description: "Avatar updated successfully",
            });
            return; // Exit early, don't show error
          }
        } catch (profileError) {
          console.error('❌ Failed to verify avatar upload:', profileError);
        }
      }
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight}>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {isEditing ? (
            /* Edit Profile Form */
            <View style={styles.editFormCard}>
            <View style={styles.editFormHeader}>
              <Text style={styles.editFormTitle}>{t('profile').editProfile}</Text>
              <View style={styles.editFormActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancelEdit}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>{t('common').cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common').save}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Avatar Upload */}
            <View style={styles.avatarUploadSection}>
              <Text style={styles.avatarLabel}>{t('profile').avatar}</Text>
              <AvatarPicker
                currentAvatar={user?.avatar}
                onAvatarSelected={handleAvatarUpload}
              />
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile').name}</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.find(e => e.field === 'name') && styles.inputError]}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                />
                {validationErrors.find(e => e.field === 'name') && (
                  <Text style={styles.errorText}>{validationErrors.find(e => e.field === 'name')?.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile').email}</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.find(e => e.field === 'email') && styles.inputError]}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {validationErrors.find(e => e.field === 'email') && (
                  <Text style={styles.errorText}>{validationErrors.find(e => e.field === 'email')?.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile').phone}</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.find(e => e.field === 'phone') && styles.inputError]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
                {validationErrors.find(e => e.field === 'phone') && (
                  <Text style={styles.errorText}>{validationErrors.find(e => e.field === 'phone')?.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile').address}</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.find(e => e.field === 'address') && styles.inputError]}
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Enter your address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                />
                {validationErrors.find(e => e.field === 'address') && (
                  <Text style={styles.errorText}>{validationErrors.find(e => e.field === 'address')?.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile').dateOfBirth}</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.find(e => e.field === 'dateOfBirth') && styles.inputError]}
                  value={formData.dateOfBirth}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, dateOfBirth: formatDateInput(text) }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                />
                {validationErrors.find(e => e.field === 'dateOfBirth') && (
                  <Text style={styles.errorText}>{validationErrors.find(e => e.field === 'dateOfBirth')?.message}</Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* Profile View */
          <View style={styles.profileViewCard}>
            <View style={styles.profileHeader}>
              {userAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.profileViewName}>{userName}</Text>
              <Text style={styles.profileViewEmail}>{user?.email || "email@example.com"}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#00704A" />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{formData.phone || "Not provided"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#00704A" />
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{formData.address || "Not provided"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#00704A" />
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{formData.dateOfBirth || "Not provided"}</Text>
              </View>
            </View>
          </View>
        )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 20,
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 40,
  },
  editButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  profileViewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#00704A',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00704A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00704A',
    marginBottom: 16,
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileViewName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  profileViewEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoSection: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  editFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
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
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00704A',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarUploadSection: {
    marginBottom: 24,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  formFields: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
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
  bottomSpacing: {
    height: 200,
  },
});
