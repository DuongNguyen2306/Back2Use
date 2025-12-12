import { create } from 'zustand';
import { Notification } from '../services/api/notificationService';

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  
  decrementUnread: () => set((state) => ({ 
    unreadCount: Math.max(0, state.unreadCount - 1) 
  })),
  
  setNotifications: (notifications) => {
    const unread = notifications.filter(n => !n.isRead).length;
    set({ notifications, unreadCount: unread });
  },
  
  addNotification: (notification) => set((state) => {
    // Check if notification already exists
    const exists = state.notifications.some(n => n._id === notification._id);
    if (exists) return state;
    
    const newNotifications = [notification, ...state.notifications];
    const unread = notification.isRead ? state.unreadCount : state.unreadCount + 1;
    return { 
      notifications: newNotifications, 
      unreadCount: unread 
    };
  }),
  
  updateNotification: (id, updates) => set((state) => {
    const updated = state.notifications.map(n => 
      n._id === id ? { ...n, ...updates } : n
    );
    const unread = updated.filter(n => !n.isRead).length;
    return { notifications: updated, unreadCount: unread };
  }),
  
  removeNotification: (id) => set((state) => {
    const removed = state.notifications.find(n => n._id === id);
    const updated = state.notifications.filter(n => n._id !== id);
    const unread = removed && !removed.isRead 
      ? Math.max(0, state.unreadCount - 1)
      : state.unreadCount;
    return { notifications: updated, unreadCount: unread };
  }),
  
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map(n => 
      n._id === id ? { ...n, isRead: true } : n
    );
    const unread = updated.filter(n => !n.isRead).length;
    return { notifications: updated, unreadCount: unread };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),
  
  reset: () => set({ unreadCount: 0, notifications: [] }),
}));


