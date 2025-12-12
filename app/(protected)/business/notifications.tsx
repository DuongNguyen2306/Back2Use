"use client"

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SimpleHeader from "../../../components/SimpleHeader";
import { useAuth } from "../../../context/AuthProvider";
import { businessesApi } from "../../../src/services/api/businessService";
import { Notification, notificationApi } from "../../../src/services/api/notificationService";

export default function BusinessNotificationsScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { state: authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  useEffect(() => {
    if (businessId || authState.user?._id) {
      loadNotifications();
    }
  }, [filter, businessId, authState.user?._id]);

  const loadBusinessProfile = async () => {
    // Staff doesn't need business profile
    if (authState.role === 'staff' as any) {
      // Staff can use their userId directly
      loadNotifications();
      return;
    }

    try {
      const profileResponse = await businessesApi.getProfileWithAutoRefresh();
      if (profileResponse.data?.business?._id) {
        setBusinessId(profileResponse.data.business._id);
      }
    } catch (error: any) {
      // Silently handle errors
      if (error?.response?.status !== 403 && error?.response?.status !== 500) {
        console.error('Error loading business profile:', error);
      }
      // Still try to load notifications with userId
      loadNotifications();
    }
  };

  const loadNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      // Get receiver ID: businessId for business owner, userId for staff
      const receiverId = businessId || authState.user?._id;
      if (!receiverId) {
        console.warn('No receiver ID found');
        setNotifications([]);
        return;
      }

      const params: any = {
        page: 1,
        limit: 100,
      };
      
      if (filter === 'unread') {
        params.isRead = false;
      }

      // Use getByReceiver
      const response = await notificationApi.getByReceiver(receiverId, params);
      
      console.log('📬 Business Notifications: API Response:', JSON.stringify(response, null, 2));
      console.log('📬 Business Notifications: Response type:', typeof response);
      console.log('📬 Business Notifications: Is array?', Array.isArray(response));
      
      // Handle multiple response formats (same as NotificationProvider)
      let notificationData: Notification[] = [];
      
      if (Array.isArray(response)) {
        // Case 1: Direct array
        console.log('📬 Business Notifications: Response is direct array');
        notificationData = response;
      } else if (response && typeof response === 'object') {
        const resp = response as any;
        
        if (resp.statusCode === 200 && resp.data) {
          // Case 2: Standard format { statusCode: 200, data: [...] }
          console.log('📬 Business Notifications: Response has statusCode 200 and data');
          const responseData = resp.data;
          
          // Check if data is array
          if (Array.isArray(responseData)) {
            notificationData = responseData;
          } else if (responseData?.data && Array.isArray(responseData.data)) {
            // Nested: { data: { data: [...] } }
            notificationData = responseData.data;
          } else if (responseData?.notifications && Array.isArray(responseData.notifications)) {
            // Nested: { data: { notifications: [...] } }
            notificationData = responseData.notifications;
          } else if (responseData?.items && Array.isArray(responseData.items)) {
            // Nested: { data: { items: [...] } }
            notificationData = responseData.items;
          } else if (responseData?.results && Array.isArray(responseData.results)) {
            // Nested: { data: { results: [...] } }
            notificationData = responseData.results;
          } else if (responseData?.list && Array.isArray(responseData.list)) {
            // Nested: { data: { list: [...] } }
            notificationData = responseData.list;
          } else {
            console.warn('📬 Business Notifications: Could not find array in response.data');
            console.warn('📬 Business Notifications: responseData:', JSON.stringify(responseData, null, 2));
          }
        } else if (resp.data && Array.isArray(resp.data)) {
          // Case 3: { data: [...] } without statusCode
          console.log('📬 Business Notifications: Response has data array');
          notificationData = resp.data;
        } else if (Array.isArray(resp)) {
          // Case 4: Response itself is array (shouldn't happen but handle it)
          console.log('📬 Business Notifications: Response object is array');
          notificationData = resp;
        }
      }
      
      console.log('📬 Business Notifications: Parsed notifications count:', notificationData.length);
      if (notificationData.length > 0) {
        console.log('📬 Business Notifications: First notification:', JSON.stringify(notificationData[0], null, 2));
      }
      
      setNotifications(notificationData);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      if (error?.response?.status && error.response.status >= 500) {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationApi.delete(notificationId);
              setNotifications(prev => prev.filter(n => n._id !== notificationId));
            } catch (error: any) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifications.map(n => notificationApi.markAsRead(n._id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const receiverId = businessId || authState.user?._id;
              if (receiverId) {
                await notificationApi.deleteByReceiver(receiverId);
                setNotifications([]);
                Alert.alert('Success', 'All notifications deleted');
              }
            } catch (error: any) {
              console.error('Error deleting all notifications:', error);
              Alert.alert('Error', 'Failed to delete all notifications');
            }
          },
        },
      ]
    );
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => !item.isRead && handleMarkAsRead(item._id)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationDate}>
            {new Date(item.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>
        <View style={styles.notificationActions}>
          {!item.isRead && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkAsRead(item._id)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#0F4D3A" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter notifications based on filter state
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <SimpleHeader 
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        rightAction={
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleDeleteAll}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === 'unread' 
              ? 'You\'re all caught up!' 
              : 'You\'ll see notifications here when you have updates'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F4D3A",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#0F4D3A",
    borderColor: "#0F4D3A",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
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
  notificationCard: {
    flexDirection: "row",
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
  unreadCard: {
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 4,
    borderLeftColor: "#0F4D3A",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F4D3A",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  notificationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});

