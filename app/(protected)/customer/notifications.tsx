"use client"

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import { useNotifications } from "../../../context/NotificationProvider";
import { Notification } from "../../../src/services/api/notificationService";

export default function CustomerNotificationsScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { state: authState } = useAuth();
  
  // ✅ FIX: Sử dụng context thay vì tự quản lý state
  const { 
    notifications: contextNotifications, 
    unreadCount, 
    loading: contextLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter notifications based on filter state
  const filteredNotifications = React.useMemo(() => {
    if (filter === 'unread') {
      return contextNotifications.filter(n => !n.isRead);
    }
    return contextNotifications;
  }, [contextNotifications, filter]);

  // Debug logging
  useEffect(() => {
    console.log('📬 Notifications Screen: Context notifications count:', contextNotifications.length);
    console.log('📬 Notifications Screen: Filtered count:', filteredNotifications.length);
    console.log('📬 Notifications Screen: Unread count:', unreadCount);
    console.log('📬 Notifications Screen: Loading:', contextLoading);
  }, [contextNotifications, filteredNotifications, unreadCount, contextLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
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
              await deleteNotification(notificationId);
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
      await markAllAsRead();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
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

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <SimpleHeader 
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
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
      {contextLoading ? (
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
  markAllButton: {
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

