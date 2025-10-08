import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { getCurrentUserProfile, UpdateProfileRequest, updateUserProfile, User } from '../../../lib/user-service';

const { width: screenWidth } = Dimensions.get('window');

export default function CustomerProfile() {
  const { state, actions } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

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
        if (state.accessToken) {
          const userData = await getCurrentUserProfile(state.accessToken);
          setUser(userData);
          setFormData({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            dateOfBirth: userData.yob || "",
            notifications: true,
            emailUpdates: true,
            smsAlerts: false,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
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

      setLoading(true);
      const updateData: UpdateProfileRequest = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        yob: formData.dateOfBirth,
      };

      const updatedUser = await updateUserProfile(updateData, state.accessToken);
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        dateOfBirth: user.yob || "",
        notifications: true,
        emailUpdates: true,
        smsAlerts: false,
      });
    }
    setIsEditing(false);
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
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header with gradient background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <TouchableOpacity 
            style={styles.headerEditButton}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card with gradient */}
        <Card style={styles.profileCard}>
          <CardContent style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || formData.name).charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || formData.name}</Text>
            <Text style={styles.userEmail}>{user?.email || formData.email}</Text>
            <View style={styles.badgeContainer}>
              <Badge style={styles.profileVerifiedBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.badgeText}>Đã xác thực</Text>
              </Badge>
              <Badge style={styles.levelBadge}>
                <Text style={styles.levelText}>Gold Member</Text>
              </Badge>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.profileStatValue}>1,250</Text>
                <Text style={styles.profileStatLabel}>Điểm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.profileStatValue}>15</Text>
                <Text style={styles.profileStatLabel}>Giao dịch</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.profileStatValue}>2.5</Text>
                <Text style={styles.profileStatLabel}>Năm</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            </View>
          
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color="#8B5CF6" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  editable={isEditing}
                  placeholder="Nhập họ và tên"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#8B5CF6" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  editable={isEditing}
                  keyboardType="email-address"
                  placeholder="Nhập email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={20} color="#8B5CF6" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange("phone", value)}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  placeholder="Nhập số điện thoại"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày sinh</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar" size={20} color="#8B5CF6" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.dateOfBirth}
                  onChangeText={(value) => handleInputChange("dateOfBirth", value)}
                  editable={isEditing}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa chỉ</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location" size={20} color="#8B5CF6" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.address}
                  onChangeText={(value) => handleInputChange("address", value)}
                  editable={isEditing}
                  placeholder="Nhập địa chỉ"
                  multiline
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Cài đặt thông báo</Text>
            </View>
          
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Thông báo đẩy</Text>
                <Text style={styles.switchDescription}>Nhận thông báo trong ứng dụng</Text>
              </View>
              <Switch
                value={formData.notifications}
                onValueChange={(value) => handleInputChange("notifications", value)}
                disabled={!isEditing}
                trackColor={{ false: "#E5E7EB", true: "#8B5CF6" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Cập nhật email</Text>
                <Text style={styles.switchDescription}>Nhận cập nhật qua email</Text>
              </View>
              <Switch
                value={formData.emailUpdates}
                onValueChange={(value) => handleInputChange("emailUpdates", value)}
                disabled={!isEditing}
                trackColor={{ false: "#E5E7EB", true: "#8B5CF6" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Cảnh báo SMS</Text>
                <Text style={styles.switchDescription}>Nhận cảnh báo khẩn cấp qua SMS</Text>
              </View>
              <Switch
                value={formData.smsAlerts}
                onValueChange={(value) => handleInputChange("smsAlerts", value)}
                disabled={!isEditing}
                trackColor={{ false: "#E5E7EB", true: "#8B5CF6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Trạng thái tài khoản</Text>
            </View>
            <View style={styles.statusCard}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>Thành viên từ</Text>
                <Text style={styles.statusValue}>Tháng 1, 2024</Text>
              </View>
              <Badge style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.verifiedText}>Đã xác thực</Text>
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditing ? (
            <View style={styles.buttonRow}>
              <Button
                variant="secondary"
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Button>
              <Button
                variant="eco"
                onPress={handleSave}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </Button>
            </View>
          ) : (
            <Button
              variant="eco"
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
            </Button>
          )}
        </View>

        {/* Sign Out Button */}
        <Card style={styles.signOutCard}>
          <CardContent style={styles.signOutContent}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <Text style={styles.signOutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
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
  header: {
    backgroundColor: "#8B5CF6",
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerEditButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#8B5CF6",
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
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
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
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
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
});
