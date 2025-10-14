import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '../../../context/AuthProvider';
import { useToast } from '../../../hooks/use-toast';
import { getCurrentUserProfileWithAutoRefresh, UpdateProfileRequest, updateUserProfileWithAutoRefresh, User } from '../../../lib/api';
import { validateProfileForm, ValidationError } from '../../../lib/validation';

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const { width: screenWidth } = Dimensions.get('window');

export default function CustomerProfile() {
  const { state, actions } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

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


  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        console.log('🔍 CustomerProfile: Loading user data...');
        console.log('🔍 Auth state:', {
          isAuthenticated: state.isAuthenticated,
          hasAccessToken: !!state.accessToken,
          hasRefreshToken: !!state.refreshToken,
          accessTokenPreview: state.accessToken ? '***' + state.accessToken.slice(-8) : 'None',
          refreshTokenPreview: state.refreshToken ? '***' + state.refreshToken.slice(-8) : 'None',
          role: state.role
        });
        
        if (state.accessToken) {
          console.log('🔍 Using accessToken for API call:', '***' + state.accessToken.slice(-8));
          const userData = await getCurrentUserProfileWithAutoRefresh();
          setUser(userData);
          setFormData({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            dateOfBirth: formatDateString(userData.yob || ""),
            notifications: true,
            emailUpdates: true,
            smsAlerts: false,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin người dùng"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [state.accessToken]);

  const handleSave = async () => {
    try {
      if (!state.accessToken) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        return;
      }

      // Validate form data
      const validation = validateProfileForm(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng kiểm tra lại thông tin đã nhập"
        });
        return;
      }

      setSaving(true);
      setValidationErrors([]);
      
      const updateData: UpdateProfileRequest = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        yob: formData.dateOfBirth.trim() || undefined,
      };

      const updatedUser = await updateUserProfileWithAutoRefresh(updateData);
      setUser(updatedUser);
      setIsEditing(false);
      setValidationErrors([]);
      toast({
        title: "✅ Cập nhật thành công",
        description: "Thông tin hồ sơ đã được cập nhật"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật thông tin";
      toast({
        title: "Lỗi",
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    let processedValue = value;
    
    // Special handling for dateOfBirth field
    if (field === 'dateOfBirth' && typeof value === 'string') {
      processedValue = formatDateInput(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    // Clear validation errors for this field when user starts typing
    if (validationErrors.some(error => error.field === field)) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        dateOfBirth: formatDateString(user.yob || ""),
        notifications: true,
        emailUpdates: true,
        smsAlerts: false,
      });
    }
    setValidationErrors([]);
    setIsEditing(false);
  };

  // Helper function to get error message for a field
  const getFieldError = (field: string): string | undefined => {
    const error = validationErrors.find(err => err.field === field);
    return error?.message;
  };

  const handleSignOut = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🚪 Signing out user...");
              await actions.signOut();
              console.log("🚪 User signed out, redirecting to welcome");
              // Use setTimeout to ensure navigation happens after state update
              setTimeout(() => {
                router.replace("/welcome");
              }, 100);
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#009900" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00704A" />
      
      <View style={styles.heroHeaderArea}>
          <View style={styles.topBar}>
            <Text style={styles.brandTitle}>BACK2USE</Text>
          </View>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
              <Text style={styles.greetingName}>My Profile</Text>
          </View>
        </View>
        
        {/* Profile Info in Header */}
        <View style={styles.headerProfileContent}>
          {/* Logo in corner */}
          <View style={styles.headerLogoContainer}>
            <Image source={require("../../../assets/images/logo2.png")} style={styles.headerLogo} />
          </View>
          
          {/* Profile Info */}
          <View style={styles.headerProfileInfo}>
            <View style={styles.headerAvatarContainer}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {(user?.name || formData.name).charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.headerProfileDetails}>
              <Text style={styles.headerProfileName}>
                {user?.name || formData.name || "User"}
              </Text>
              <Text style={styles.headerProfileHandle}>
                @{user?.name?.toLowerCase().replace(/\s+/g, '') || "user"}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.headerEditButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.headerEditButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {isEditing ? (
          /* Edit Form */
          <View style={styles.editFormContainer}>
            {/* Personal Information */}
            <View style={styles.section}>
              <View style={styles.sectionContent}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person" size={24} color="#009900" />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>
              
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <View style={[styles.inputContainer, getFieldError('name') && styles.inputError]}>
                    <Ionicons name="person" size={20} color={getFieldError('name') ? "#ef4444" : "#009900"} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={formData.name}
                      onChangeText={(value) => handleInputChange("name", value)}
                      editable={isEditing}
                      placeholder="Enter full name"
                    />
                  </View>
                  {getFieldError('name') && (
                    <Text style={styles.errorText}>{getFieldError('name')}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[styles.inputContainer, styles.inputReadOnly]}>
                    <Ionicons name="mail" size={20} color="#009900" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputReadOnly]}
                      value={formData.email}
                      editable={false}
                      keyboardType="email-address"
                      placeholder="Email cannot be changed"
                    />
                    <Ionicons name="lock-closed" size={16} color="#6B7280" style={styles.lockIcon} />
                  </View>
                  <Text style={styles.helpText}>Email cannot be changed. Contact support if you need to change email.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputContainer, getFieldError('phone') && styles.inputError]}>
                    <Ionicons name="call" size={20} color={getFieldError('phone') ? "#ef4444" : "#009900"} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={formData.phone}
                      onChangeText={(value) => handleInputChange("phone", value)}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                    />
                  </View>
                  {getFieldError('phone') && (
                    <Text style={styles.errorText}>{getFieldError('phone')}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <View style={[styles.inputContainer, getFieldError('dateOfBirth') && styles.inputError]}>
                    <Ionicons name="calendar" size={20} color={getFieldError('dateOfBirth') ? "#ef4444" : "#009900"} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={formData.dateOfBirth}
                      onChangeText={(value) => handleInputChange("dateOfBirth", value)}
                      editable={isEditing}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  {getFieldError('dateOfBirth') && (
                    <Text style={styles.errorText}>{getFieldError('dateOfBirth')}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address</Text>
                  <View style={[styles.inputContainer, getFieldError('address') && styles.inputError]}>
                    <Ionicons name="location" size={20} color={getFieldError('address') ? "#ef4444" : "#009900"} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={formData.address}
                      onChangeText={(value) => handleInputChange("address", value)}
                      editable={isEditing}
                      placeholder="Enter address"
                      multiline
                    />
                  </View>
                  {getFieldError('address') && (
                    <Text style={styles.errorText}>{getFieldError('address')}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Menu Options */
          <View style={styles.menuContainer}>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(protected)/customer/rewards")}>
              <Ionicons name="trophy-outline" size={24} color="#000000" />
              <Text style={styles.menuText}>Rank</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(protected)/customer/transaction-history")}>
              <Ionicons name="time-outline" size={24} color="#000000" />
              <Text style={styles.menuText}>History</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(protected)/ai")}>
              <Ionicons name="chatbubble-outline" size={24} color="#000000" />
              <Text style={styles.menuText}>AI Chat</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color="#000000" />
              <Text style={styles.menuText}>Logout</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  heroHeaderArea: { backgroundColor: '#00704A', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandTitle: { color: '#fff', fontWeight: '800', letterSpacing: 2, fontSize: 14 },
  iconGhost: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 },
  greetingName: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarLg: { height: 56, width: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  // Header Profile Styles
  headerProfileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerLogoContainer: {
    position: 'absolute',
    right: 16,
    top: 2,
    opacity: 0.08,
  },
  headerLogo: {
    width: 80,
    height: 80,
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarContainer: {
    marginRight: 12,
  },
  headerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00704A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerProfileDetails: {
    flex: 1,
  },
  headerProfileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerProfileHandle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerEditButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerEditButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#009900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileContent: {
    padding: 24,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#009900",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#009900",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  profileVerifiedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "600",
  },
  levelBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: "#D97706",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#6b7280",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00704A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: "#0F4D3A",
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F4D3A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  changePasswordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  changePasswordContent: {
    padding: 20,
  },
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 8,
  },
  changePasswordText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  signOutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutContent: {
    padding: 20,
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputReadOnly: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  lockIcon: {
    marginLeft: 8,
  },
  helpText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontStyle: "italic",
  },
  // New Profile Design Styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 0,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userHandle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 16,
    flex: 1,
  },
  editFormContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
