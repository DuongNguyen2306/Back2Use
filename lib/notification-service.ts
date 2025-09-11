export type Notification = {
  id: string;
  userId: string;
  type: "return_reminder" | "overdue_alert" | "return_complete" | "system_update";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  scheduledFor?: Date;
};

export type PackagingItem = {
  id: string;
  qrCode: string;
  status: "available" | "borrowed" | "overdue" | "washing";
  storeId: string;
};

export type Transaction = {
  id: string;
  customerId: string;
  storeId: string;
  packagingItemId: string;
  type: "borrow" | "return";
  depositAmount: number;
  status: "complete" | "pending" | "reject" | "completed";
  borrowedAt?: Date;
  returnedAt?: Date;
  dueDate?: Date;
};

export class NotificationService {
  static generateReturnReminders(transactions: Transaction[], items: PackagingItem[]): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    transactions
      .filter((t) => t.type === "borrow" && (t.status === "complete" || t.status === "completed") && !t.returnedAt && t.dueDate)
      .forEach((transaction) => {
        const dueDate = new Date(transaction.dueDate!);
        const item = items.find((i) => i.id === transaction.packagingItemId);

        if (dueDate <= twoDaysFromNow && dueDate > now) {
          notifications.push({
            id: `reminder_${transaction.id}_${Date.now()}`,
            userId: transaction.customerId,
            type: "return_reminder",
            title: "Return Reminder",
            message: `Your ${item?.qrCode || "container"} is due for return in 2 days. Please return it to avoid late fees.`,
            isRead: false,
            scheduledFor: new Date(now.getTime() + (dueDate.getTime() - twoDaysFromNow.getTime())),
            createdAt: now,
          });
        }

        if (dueDate < now) {
          notifications.push({
            id: `overdue_${transaction.id}_${Date.now()}`,
            userId: transaction.customerId,
            type: "overdue_alert",
            title: "Overdue Container",
            message: `Your ${item?.qrCode || "container"} is now overdue. Late fees may apply. Please return it as soon as possible.`,
            isRead: false,
            createdAt: now,
          });
        }
      });

    return notifications;
  }

  static generateReturnCompleteNotification(
    customerId: string,
    transactionId: string,
    itemQrCode: string,
    isApproved: boolean,
  ): Notification {
    return {
      id: `return_complete_${transactionId}_${Date.now()}`,
      userId: customerId,
      type: "return_complete",
      title: isApproved ? "Return Approved" : "Return Rejected",
      message: isApproved
        ? `Your container ${itemQrCode} has been successfully returned. Your deposit has been refunded.`
        : `Your container ${itemQrCode} return was rejected. Please contact the store for more information.`,
      isRead: false,
      createdAt: new Date(),
    };
  }

  static generateBusinessNotifications(
    storeId: string,
    businessUserId: string,
    transactions: Transaction[],
    items: PackagingItem[],
  ): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();

    const overdueCount = items.filter((item) => item.storeId === storeId && item.status === "overdue").length;
    if (overdueCount > 0) {
      notifications.push({
        id: `business_overdue_${storeId}_${Date.now()}`,
        userId: businessUserId,
        type: "overdue_alert",
        title: "Overdue Items Alert",
        message: `You have ${overdueCount} overdue container${overdueCount > 1 ? "s" : ""} that need attention.`,
        isRead: false,
        createdAt: now,
      });
    }

    const pendingReturns = transactions.filter(
      (t) => t.storeId === storeId && t.type === "borrow" && (t.status === "complete" || t.status === "completed") && !t.returnedAt,
    ).length;

    if (pendingReturns > 5) {
      notifications.push({
        id: `business_pending_${storeId}_${Date.now()}`,
        userId: businessUserId,
        type: "system_update",
        title: "High Volume of Pending Returns",
        message: `You have ${pendingReturns} containers pending return. Consider reaching out to customers.`,
        isRead: false,
        createdAt: now,
      });
    }

    return notifications;
  }

  static updateItemStatusBasedOnDueDate(items: PackagingItem[], transactions?: Transaction[]): PackagingItem[] {
    const now = new Date();
    const borrowedIds = new Set(
      (transactions || [])
        .filter((t) => t.type === "borrow" && t.dueDate && new Date(t.dueDate) < now)
        .map((t) => t.packagingItemId)
    );
    return items.map((item) => {
      if (borrowedIds.has(item.id)) {
        return { ...item, status: "overdue" };
      }
      return item;
    });
  }

  static markNotificationAsRead(notifications: Notification[], notificationId: string): Notification[] {
    return notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
  }

  static markAllNotificationsAsRead(notifications: Notification[], userId: string): Notification[] {
    return notifications.map((n) => (n.userId === userId ? { ...n, isRead: true } : n));
  }

  static getUnreadCount(notifications: Notification[], userId: string): number {
    return notifications.filter((n) => n.userId === userId && !n.isRead).length;
  }

  static getNotificationsByUser(notifications: Notification[], userId: string): Notification[] {
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}


