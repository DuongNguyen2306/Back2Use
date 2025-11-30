import { API_ENDPOINTS } from '../../constants/api';
import { apiCall } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentAccessToken } from './client';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  _id: string;
  receiverId: string;
  receiverType: 'customer' | 'business' | 'staff';
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  receiverId: string;
  receiverType: 'customer' | 'business' | 'staff';
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationListResponse {
  statusCode: number;
  message: string;
  data: Notification[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface NotificationResponse {
  statusCode: number;
  message: string;
  data: Notification;
}

export interface DeleteNotificationResponse {
  statusCode: number;
  message: string;
}

// ============================================================================
// NOTIFICATION API
// ============================================================================

export const notificationApi = {
  // Get all notifications
  getAll: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<NotificationListResponse> => {
    const { page = 1, limit = 50, isRead, type } = params || {};
    const queryParams: any = { page, limit };
    if (isRead !== undefined) queryParams.isRead = isRead;
    if (type) queryParams.type = type;
    
    return apiCall<NotificationListResponse>(API_ENDPOINTS.NOTIFICATIONS.GET_ALL, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Get notification by ID
  getById: async (notificationId: string): Promise<NotificationResponse> => {
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.GET_BY_ID}/${notificationId}`;
    return apiCall<NotificationResponse>(endpoint, {
      method: 'GET',
    });
  },

  // Create a new notification
  create: async (data: CreateNotificationRequest): Promise<NotificationResponse> => {
    return apiCall<NotificationResponse>(API_ENDPOINTS.NOTIFICATIONS.CREATE, {
      method: 'POST',
      data,
    });
  },

  // Update notification
  update: async (notificationId: string, data: Partial<CreateNotificationRequest>): Promise<NotificationResponse> => {
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.UPDATE}/${notificationId}`;
    return apiCall<NotificationResponse>(endpoint, {
      method: 'PATCH',
      data,
    });
  },

  // Delete notification
  delete: async (notificationId: string): Promise<DeleteNotificationResponse> => {
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.DELETE}/${notificationId}`;
    return apiCall<DeleteNotificationResponse>(endpoint, {
      method: 'DELETE',
    });
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ}/${notificationId}/read`;
    return apiCall<NotificationResponse>(endpoint, {
      method: 'PATCH',
    });
  },

  // Get notifications by receiver ID
  getByReceiver: async (receiverId: string, params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<NotificationListResponse> => {
    const { page = 1, limit = 50, isRead, type } = params || {};
    const queryParams: any = { page, limit };
    if (isRead !== undefined) queryParams.isRead = isRead;
    if (type) queryParams.type = type;
    
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.GET_BY_RECEIVER}/${receiverId}`;
    return apiCall<NotificationListResponse>(endpoint, {
      method: 'GET',
      params: queryParams,
    });
  },

  // Delete all notifications by receiver ID
  deleteByReceiver: async (receiverId: string): Promise<DeleteNotificationResponse> => {
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.DELETE_BY_RECEIVER}/${receiverId}`;
    return apiCall<DeleteNotificationResponse>(endpoint, {
      method: 'DELETE',
    });
  },
};

