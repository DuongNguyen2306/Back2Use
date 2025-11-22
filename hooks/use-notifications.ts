import { useCallback, useEffect, useRef, useState } from "react";
import { NotificationService, type Notification } from "@/services/notifications/notificationService";
import { mockPackagingItems, mockTransactions } from "@/utils/mockData";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const existingIdsRef = useRef<Set<string>>(new Set());

  const generateNotifications = useCallback(() => {
    if (!userId) return;
    setIsLoading(true);

    const updatedItems = NotificationService.updateItemStatusBasedOnDueDate(mockPackagingItems, mockTransactions);
    const newNotifications = NotificationService.generateReturnReminders(mockTransactions, updatedItems);

    const uniqueNewNotifications = newNotifications.filter((n) => !existingIdsRef.current.has(n.id));
    if (uniqueNewNotifications.length > 0) {
      setNotifications((prev) => {
        const updated = [...prev, ...uniqueNewNotifications];
        existingIdsRef.current = new Set(updated.map((n) => n.id));
        return updated;
      });
    }

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    generateNotifications();
    const interval = setInterval(generateNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, generateNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => NotificationService.markNotificationAsRead(prev, notificationId));
  };

  const markAllAsRead = () => {
    if (!userId) return;
    setNotifications((prev) => NotificationService.markAllNotificationsAsRead(prev, userId));
  };

  const userNotifications = userId ? NotificationService.getNotificationsByUser(notifications, userId) : [];
  const unreadCount = userId ? NotificationService.getUnreadCount(notifications, userId) : 0;

  return { notifications: userNotifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}


