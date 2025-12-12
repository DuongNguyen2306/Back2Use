import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import { useNotifications } from '../context/NotificationProvider';
import { Notification } from '../src/services/api/notificationService';

interface NotificationBadgeProps {
  iconColor?: string;
}

export default function NotificationBadge({ iconColor }: NotificationBadgeProps = {}) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const auth = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Debug logging
  React.useEffect(() => {
    console.log('📬 NotificationBadge: notifications count:', notifications.length);
    console.log('📬 NotificationBadge: unread count:', unreadCount);
    console.log('📬 NotificationBadge: loading:', loading);
  }, [notifications, unreadCount, loading]);
  
  // Determine icon color based on context
  const getIconColor = () => {
    if (iconColor) return iconColor;
    // Default: white for CustomerHeader (green background), dark for SimpleHeader (white background)
    return "#1A1A1A"; // Dark color for SimpleHeader
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type or data
    if (notification.data?.transactionId) {
      const role = auth.state.role;
      if (role === 'customer') {
        router.push({
          pathname: '/(protected)/customer/transaction-detail/[id]',
          params: { id: notification.data.transactionId },
        });
      } else if (role === 'business' || role === 'staff') {
        router.push('/(protected)/business/transaction-processing');
      }
    } else if (notification.data?.voucherId) {
      router.push({
        pathname: '/(protected)/customer/voucher-detail/[id]',
        params: { id: notification.data.voucherId },
      });
    }

    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item._id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item._id)}
      >
        <Ionicons name="close" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.badgeContainer}
        onPress={() => setShowDropdown(true)}
      >
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color={getIconColor()} 
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownTitle}>Notifications</Text>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.markAllButton}
                      onPress={handleMarkAllAsRead}
                    >
                      <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowDropdown(false)}
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {notifications.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No notifications</Text>
                  </View>
                ) : (
                  <FlatList
                    data={notifications.slice(0, 20)}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item._id}
                    style={styles.notificationsList}
                    contentContainerStyle={styles.notificationsListContent}
                  />
                )}

                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => {
                      setShowDropdown(false);
                      const role = auth.state.role;
                      if (role === 'customer') {
                        router.push('/(protected)/customer/notifications');
                      } else {
                        router.push('/(protected)/business/notifications');
                      }
                    }}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#0F4D3A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 320,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 12,
    color: '#0F4D3A',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationsListContent: {
    padding: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  unreadNotification: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0F4D3A',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F4D3A',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  viewAllButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
});


