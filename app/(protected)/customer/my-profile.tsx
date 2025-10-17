import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
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
import { getCurrentUserProfileWithAutoRefresh, UpdateProfileRequest, updateUserProfileWithAutoRefresh, uploadAvatarWithAutoRefresh, User } from '../../../lib/api';
import { validateProfileForm, ValidationError } from '../../../lib/validation';

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

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
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
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [toast]);

  const achievements = [
    { id: 'loyalty', icon: 'star', color: '#FFD700', title: 'VIP Member' },
    { id: 'points', icon: 'diamond', color: '#FF6B6B', title: '1000 Points' },
    { id: 'streak', icon: 'flame', color: '#FF8C00', title: '7 Day Streak' },
    { id: 'eco', icon: 'leaf', color: '#32CD32', title: 'Eco Warrior' },
  ];

  const menuSections: MenuSection[] = [
    {
      title: t('profile').settings,
      items: [
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
          title: t('profile').transactionHistory,
          subtitle: 'View transaction and activity history',
          icon: 'time',
          onPress: () => console.log('Navigate to History'),
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

  const handleLogout = async () => {
    try {
      console.log('Logout pressed');
      // Clear auth state using auth context
      await auth.actions.signOut();
      // Navigate to welcome screen
      router.replace('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to welcome even if logout fails
      router.replace('/welcome');
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

      // Prepare update data
      const updateData: UpdateProfileRequest = {
        fullName: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

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
      
      if (response.data) {
        const avatarUrl = typeof response.data === 'string' ? response.data : (response.data as any)?.avatarUrl || response.data;
        setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
        
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
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

  return (
    <View style={styles.container}>
      {/* Unified Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile').myAccount}</Text>
        <TouchableOpacity style={styles.editIconButton} onPress={handleEditProfile}>
          <Ionicons name="pencil" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          /* Large User Information Card */
          <View style={styles.userInfoCard}>
            {/* Background decorative shapes */}
            <View style={styles.backgroundShapes}>
              <View style={[styles.shape, styles.shape1]} />
              <View style={[styles.shape, styles.shape2]} />
              <View style={[styles.shape, styles.shape3]} />
            </View>
            
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user?.avatar && user.avatar.trim() !== "" ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {((user as any)?.fullName || user?.name || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            
            {/* User Details */}
            <View style={styles.userDetails}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{(user as any)?.fullName || user?.name || "User Name"}</Text>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={styles.verifiedIcon} />
              </View>
              <Text style={styles.userEmail}>{user?.email || "email@example.com"}</Text>
            </View>
            
            {/* Achievement Badges */}
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement, index) => (
                <View key={achievement.id} style={styles.achievementBadge}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                    <Ionicons name={achievement.icon as any} size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.lastMenuItem
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#0F4D3A" />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Separated Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('profile').logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  editIconButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
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
  logoutSection: {
    marginTop: 40,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
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
});
