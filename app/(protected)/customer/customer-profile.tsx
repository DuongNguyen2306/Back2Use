import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../context/AuthProvider";
import { getUserById, User } from "../../../lib/user-service";

export default function CustomerProfile() {
  const { state, actions } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, City, State 12345",
    dateOfBirth: "1990-01-15",
    notifications: true,
    emailUpdates: true,
    smsAlerts: false,
  });


  const handleSave = () => {
    Alert.alert("Success", "Profile updated successfully!");
    setIsEditing(false);
  };

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        // For now, we'll use a mock user ID. In real app, get from auth state
        const mockUserId = "68e25774cc3e083c6f072b1b"; // From API example
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI20GUyNTc3NGNjM2UwODNjNmYwNzJiMWIiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQi0jE3NTk3NDMzMzYsImV4cCI6MTc1OTgyOTczNn0.TlT1igZdgBwuqngjJrcj57XRKŁA";
        
        const userData = await getUserById(mockUserId, mockToken);
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.name,
          email: userData.email,
        }));
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert("Error", "Failed to load user data. Using mock data.");
        // Fallback to mock data
        setFormData(prev => ({
          ...prev,
          name: "John Doe",
          email: "john.doe@example.com",
        }));
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
          <Text style={styles.editButtonText}>{isEditing ? "Lưu" : "Chỉnh sửa"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#0F4D3A" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{formData.name}</Text>
              <Text style={styles.profileEmail}>{formData.email}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Gold Member</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                editable={isEditing}
                placeholder="Enter your full name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                editable={isEditing}
                keyboardType="email-address"
                placeholder="Enter your email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                editable={isEditing}
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar" size={20} color="#6B7280" style={styles.inputIcon} />
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
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.address}
                onChangeText={(value) => handleInputChange("address", value)}
                editable={isEditing}
                placeholder="Enter your address"
                multiline
              />
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Push Notifications</Text>
              <Text style={styles.switchDescription}>Receive notifications in the app</Text>
            </View>
            <TouchableOpacity
              style={[styles.switch, formData.notifications && styles.switchActive]}
              onPress={() => handleInputChange("notifications", !formData.notifications)}
              disabled={!isEditing}
            >
              <View style={[styles.switchThumb, formData.notifications && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Email Updates</Text>
              <Text style={styles.switchDescription}>Get updates via email</Text>
            </View>
            <TouchableOpacity
              style={[styles.switch, formData.emailUpdates && styles.switchActive]}
              onPress={() => handleInputChange("emailUpdates", !formData.emailUpdates)}
              disabled={!isEditing}
            >
              <View style={[styles.switchThumb, formData.emailUpdates && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>SMS Alerts</Text>
              <Text style={styles.switchDescription}>Receive urgent alerts via text</Text>
            </View>
            <TouchableOpacity
              style={[styles.switch, formData.smsAlerts && styles.switchActive]}
              onPress={() => handleInputChange("smsAlerts", !formData.smsAlerts)}
              disabled={!isEditing}
            >
              <View style={[styles.switchThumb, formData.smsAlerts && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Member since</Text>
              <Text style={styles.statusValue}>January 2024</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>47</Text>
              <Text style={styles.statLabel}>Total Borrows</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>44</Text>
              <Text style={styles.statLabel}>Total Returns</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>$89.50</Text>
              <Text style={styles.statLabel}>Money Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>23.5kg</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#0F4D3A",
    borderRadius: 16,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  memberBadge: {
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  memberBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  inputDisabled: {
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: "#6b7280",
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
});
