"use client"

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Switch
} from "react-native";
import { useAuth } from "../../../context/AuthProvider";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StoreData {
  name: string;
  phone: string;
  email: string;
  address: string;
  operatingHours: string;
}

interface NotificationSettings {
  lowInventory: boolean;
  overdueReturns: boolean;
  newBorrows: boolean;
  dailyReports: boolean;
}

export default function BusinessSettings() {
  const { actions } = useAuth();
  const [storeData, setStoreData] = useState<StoreData>({
    name: "Cửa hàng Back2Use",
    phone: "0123456789",
    email: "store@back2use.com",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    operatingHours: "Thứ 2-6: 8:00-18:00, Thứ 7-CN: 9:00-17:00"
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    lowInventory: true,
    overdueReturns: true,
    newBorrows: false,
    dailyReports: true,
  });

  const handleSave = () => {
    Alert.alert(
      "Thành công",
      "Cài đặt đã được lưu!",
      [{ text: "OK" }]
    );
    console.log("Saving store settings:", storeData);
    console.log("Saving notification settings:", notifications);
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
          onPress: () => {
            actions.logout();
            router.replace("/auth");
          }
        }
      ]
    );
  };

  const renderStoreInfoCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <Ionicons name="storefront" size={24} color="#FFFFFF" />
          <Text style={styles.cardTitle}>Thông tin cửa hàng</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên cửa hàng</Text>
          <TextInput
            style={styles.input}
            value={storeData.name}
            onChangeText={(text) => setStoreData({ ...storeData, name: text })}
            placeholder="Nhập tên cửa hàng"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={storeData.phone}
            onChangeText={(text) => setStoreData({ ...storeData, phone: text })}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={storeData.email}
            onChangeText={(text) => setStoreData({ ...storeData, email: text })}
            placeholder="Nhập email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={storeData.address}
            onChangeText={(text) => setStoreData({ ...storeData, address: text })}
            placeholder="Nhập địa chỉ"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giờ làm việc</Text>
          <TextInput
            style={styles.input}
            value={storeData.operatingHours}
            onChangeText={(text) => setStoreData({ ...storeData, operatingHours: text })}
            placeholder="VD: Thứ 2-6: 8:00-18:00, Thứ 7-CN: 9:00-17:00"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
    </View>
  );

  const renderNotificationCard = () => (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { backgroundColor: '#F59E0B' }]}>
        <View style={styles.cardHeaderContent}>
          <Ionicons name="notifications" size={24} color="#FFFFFF" />
          <Text style={styles.cardTitle}>Thông báo</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Cảnh báo tồn kho thấp</Text>
            <Text style={styles.notificationDesc}>Nhận thông báo khi hàng sắp hết</Text>
          </View>
          <Switch
            value={notifications.lowInventory}
            onValueChange={(value) => setNotifications({ ...notifications, lowInventory: value })}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={notifications.lowInventory ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Cảnh báo quá hạn</Text>
            <Text style={styles.notificationDesc}>Thông báo về đơn quá hạn</Text>
          </View>
          <Switch
            value={notifications.overdueReturns}
            onValueChange={(value) => setNotifications({ ...notifications, overdueReturns: value })}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={notifications.overdueReturns ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Thông báo mượn mới</Text>
            <Text style={styles.notificationDesc}>Nhận thông báo khi có đơn mượn mới</Text>
          </View>
          <Switch
            value={notifications.newBorrows}
            onValueChange={(value) => setNotifications({ ...notifications, newBorrows: value })}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={notifications.newBorrows ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Báo cáo hàng ngày</Text>
            <Text style={styles.notificationDesc}>Nhận báo cáo tổng hợp</Text>
          </View>
          <Switch
            value={notifications.dailyReports}
            onValueChange={(value) => setNotifications({ ...notifications, dailyReports: value })}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            thumbColor={notifications.dailyReports ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <Text style={styles.headerSubtitle}>Quản lý cửa hàng của bạn</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStoreInfoCard()}
        {renderNotificationCard()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  cardContent: {
    padding: 16,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
