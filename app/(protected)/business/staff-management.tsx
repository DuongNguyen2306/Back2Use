"use client"

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { businessesApi } from "../../../src/services/api/businessService";
import { Staff, staffApi } from "../../../src/services/api/staffService";

export default function StaffManagementScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Load business profile and staff list
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      const profileResponse = await businessesApi.getProfileWithAutoRefresh();
      if (profileResponse.data?.business?._id) {
        setBusinessId(profileResponse.data.business._id);
        // Load staff list after getting businessId
        loadStaffList();
      } else {
        Alert.alert("Error", "Unable to load business profile");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error loading business profile:", error);
      Alert.alert("Error", error.message || "Failed to load business profile");
      setLoading(false);
    }
  };

  const loadStaffList = async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      const response = await staffApi.getAll();
      if (response.statusCode === 200) {
        // Set staff list, even if it's an empty array
        setStaffList(response.data || []);
      } else {
        // If status code is not 200, set empty array
        setStaffList([]);
      }
    } catch (error: any) {
      console.error("Error loading staff list:", error);
      // Set empty array on error so empty state can be shown
      setStaffList([]);
      // Only show alert for actual errors, not empty results
      if (error.message && !error.message.includes('404')) {
        Alert.alert("Error", error.message || "Failed to load staff list");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle add staff
  const handleAddStaff = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Please enter full name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter email");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Please enter phone number");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    if (!businessId) {
      Alert.alert("Error", "Business ID not found. Please try again.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await staffApi.create({
        businessId: businessId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Show success alert
        Alert.alert(
          "Success",
          "Staff added! Please tell them to check their email for login credentials.",
          [
            {
              text: "OK",
              onPress: () => {
                // Reset form
                setFullName("");
                setEmail("");
                setPhone("");
                setShowAddModal(false);
                // Reload staff list
                loadStaffList();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Error creating staff:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create staff account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete staff
  const handleDeleteStaff = (staff: Staff) => {
    Alert.alert(
      "Delete Staff",
      `Are you sure you want to delete ${staff.fullName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await staffApi.delete(staff._id);
              Alert.alert("Success", "Staff member deleted successfully");
              loadStaffList();
            } catch (error: any) {
              console.error("Error deleting staff:", error);
              Alert.alert("Error", error.message || "Failed to delete staff");
            }
          },
        },
      ]
    );
  };

  // Handle deactivate/activate staff
  const handleDeactivateStaff = (staff: Staff) => {
    const isActive = staff.status === 'active';
    Alert.alert(
      isActive ? "Deactivate Staff" : "Activate Staff",
      `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} ${staff.fullName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isActive ? "Deactivate" : "Activate",
          onPress: async () => {
            try {
              await staffApi.update(staff._id, {
                status: isActive ? 'inactive' : 'active',
              });
              Alert.alert("Success", `Staff member ${isActive ? 'deactivated' : 'activated'} successfully`);
              loadStaffList();
            } catch (error: any) {
              console.error("Error updating staff status:", error);
              Alert.alert("Error", error.message || "Failed to update staff status");
            }
          },
        },
      ]
    );
  };

  // Render staff card
  const renderStaffCard = ({ item }: { item: Staff }) => {
    const isActive = item.status === "active";

    return (
      <View style={styles.staffCard}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#6B7280" />
            </View>
          )}
        </View>

        {/* Staff Info */}
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.fullName}</Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
          <Text style={styles.staffPhone}>{item.phone}</Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            isActive ? styles.statusActive : styles.statusInactive,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isActive ? styles.statusTextActive : styles.statusTextInactive,
            ]}
          >
            {isActive ? "Active" : "Inactive"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deactivateButton]}
            onPress={() => handleDeactivateStaff(item)}
          >
            <Ionicons
              name={isActive ? "pause-circle-outline" : "play-circle-outline"}
              size={20}
              color="#F97316"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteStaff(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: bottom + 100 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        {/* Left: Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        {/* Center: Title */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Staff Management</Text>
        </View>
        
        {/* Right: Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Staff List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006241" />
        </View>
      ) : staffList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Bạn chưa có staff</Text>
          <Text style={styles.emptySubtext}>
            Thêm nhân viên đầu tiên để bắt đầu
          </Text>
        </View>
      ) : (
        <FlatList
          data={staffList}
          renderItem={renderStaffCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Staff Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <ImageBackground
          source={{ uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-bg.jpg-0cgAaCzoZKCdOb8naNxHzXRdZGseCS.jpeg" }}
          style={styles.modalBg}
          resizeMode="cover"
        >
          <View style={styles.modalOverlayDark} />
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
              style={styles.keyboardView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
            >
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.titleContainer}>
                    <Ionicons name="person-add-outline" size={28} color="#0F4D3A" style={{ marginRight: 12 }} />
                    <Text style={styles.modalTitle}>Add Staff Member</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowAddModal(false);
                      setFullName("");
                      setEmail("");
                      setPhone("");
                    }}
                    disabled={submitting}
                  >
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  bounces={false}
                >
                  <Text style={styles.formSubtitle}>
                    Enter staff information to create a new account. Password will be sent automatically via email.
                  </Text>

                  {/* Form */}
                  <View style={styles.form}>
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full Name *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Nguyen Van A"
                          placeholderTextColor="#9CA3AF"
                          value={fullName}
                          onChangeText={setFullName}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="staff@example.com"
                          placeholderTextColor="#9CA3AF"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      <Text style={styles.helperText}>
                        Lưu ý: Mật khẩu sẽ được hệ thống tự động gửi vào email này.
                      </Text>
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Phone *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="0909..."
                          placeholderTextColor="#9CA3AF"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          maxLength={15}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddModal(false);
                      setFullName("");
                      setEmail("");
                      setPhone("");
                    }}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton, submitting && styles.createButtonDisabled]}
                    onPress={handleAddStaff}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.createButtonText}>
                        Create Staff Account
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </ImageBackground>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F2", // Creamy background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    minWidth: 40,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    minWidth: 0, // Allow text to wrap if needed
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    minWidth: 40,
    flexShrink: 0,
    borderRadius: 20,
    backgroundColor: "#006241", // Green accent
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  staffCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: "#D1FAE5",
  },
  statusInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#059669",
  },
  statusTextInactive: {
    color: "#EF4444",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deactivateButton: {
    backgroundColor: "#FED7AA",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
  },
  // Modal Styles - Beautiful like BusinessRegisterModal
  modalBg: {
    flex: 1,
  },
  modalOverlayDark: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  keyboardView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    width: '95%',
    height: '90%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  form: {
    gap: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: 'transparent',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  createButton: {
    backgroundColor: "#006241",
    shadowColor: '#006241',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

