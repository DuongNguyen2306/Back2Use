"use client"

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../../context/AuthProvider";

const { width: screenWidth } = Dimensions.get('window')

export default function MorePage() {
  const { actions } = useAuth();

  const handleSettings = () => {
    router.push('/(protected)/business/settings');
  };

  const handleChangePassword = () => {
    router.push("/(protected)/business/change-password");
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await actions.logout();
              // Navigate to welcome after logout
              router.replace("/welcome");
            } catch (error) {
              console.error('Error during logout:', error);
              // Still try to navigate even if logout fails
              router.replace("/welcome");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#009900" barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {"M"}
              </Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Thêm</Text>
              <Text style={styles.headerSubtitle}>Các chức năng khác</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton} onPress={handleSettings}>
              <Ionicons name="settings" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Chức năng thêm</Text>
          
          {/* Settings Button */}
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="settings" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Cài đặt</Text>
                <Text style={styles.menuSubtitle}>Quản lý cửa hàng và thông báo</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Inventory Management Button */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(protected)/business/materials')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Inventory Management</Text>
                <Text style={styles.menuSubtitle}>Manage your inventory and materials</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* My Inventory Button */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(protected)/business/my-materials')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="albums" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>My Inventory</Text>
                <Text style={styles.menuSubtitle}>View pending/rejected status</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>


          {/* Change Password Button */}
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Đổi mật khẩu</Text>
                <Text style={styles.menuSubtitle}>Thay đổi mật khẩu tài khoản</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="log-out" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Đăng xuất</Text>
                <Text style={styles.menuSubtitle}>Thoát khỏi tài khoản</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#009900',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
})
