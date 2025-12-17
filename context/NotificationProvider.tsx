import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Notification, notificationApi } from '../src/services/api/notificationService';
import { getCurrentUserProfileWithAutoRefresh } from '../src/services/api/userService';
import { socketService } from '../src/services/websocket/socketService';
import { useNotificationStore } from '../src/store/notificationStore';
import { useAuth } from './AuthProvider';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { 
    notifications, 
    unreadCount, 
    setNotifications, 
    addNotification, 
    updateNotification,
    removeNotification,
    markAsRead: markAsReadStore,
    markAllAsRead: markAllAsReadStore,
    setUnreadCount,
    incrementUnread,
  } = useNotificationStore();
  
  const [loading, setLoading] = useState(true);
  const socketInitialized = useRef(false);
  const shownAlertIds = useRef<Set<string>>(new Set()); // Track notification IDs that have already shown alerts
  const notificationHandlers = useRef<{
    notification?: (payload: Notification) => void;
    notificationNew?: (payload: Notification) => void;
    connect?: () => void;
    disconnect?: () => void;
    error?: (error: any) => void;
  }>({});

  // Get user ID and mode with fallback to API call
  const getUserIdAndMode = async (): Promise<{ userId: string | null; mode: 'customer' | 'business' | 'staff' }> => {
    let userId = auth.state.user?._id || null;
    const role = Array.isArray(auth.state.role) ? auth.state.role[0] : auth.state.role;
    let mode: 'customer' | 'business' | 'staff' = 'customer';
    
    if (role === 'business' || role === 'staff') {
      mode = role;
    }
    
    console.log('📬 NotificationProvider: User object:', auth.state.user);
    console.log('📬 NotificationProvider: User ID from state:', userId, 'Mode:', mode, 'Role:', role);
    
    // FALLBACK: If user ID is not in state, fetch from API (like web app does)
    // Only try if we have access token (silent fail if no token)
    if (!userId && auth.state.isAuthenticated && auth.state.accessToken) {
      console.log('📬 ⚠️ User ID not in state, fetching from API (fallback)...');
      try {
        const userProfile = await getCurrentUserProfileWithAutoRefresh();
        userId = userProfile._id || null;
        console.log('📬 ✅ Got user ID from API:', userId);
      } catch (error: any) {
        // Silent fail - don't log error or show to user
        // This is expected if token is not available yet or API call fails
        // Just return null userId and let the app continue
        const errorMessage = error?.message || '';
        const isTokenError = errorMessage.includes('token') || errorMessage.includes('Token');
        
        if (isTokenError) {
          // Token not available - this is normal during initial load
          // Don't log anything, just return null
        } else {
          // Other errors - log quietly (not as error, just info)
          console.log('📬 ℹ️ Could not fetch user profile from API (will retry later)');
        }
        // Return null userId - don't throw error
        userId = null;
      }
    } else if (!userId && auth.state.isAuthenticated && !auth.state.accessToken) {
      // No token available - this is normal, don't log as error
      console.log('📬 ℹ️ User authenticated but no access token yet, waiting...');
    }
    
    console.log('📬 NotificationProvider: Final User ID:', userId, 'Mode:', mode);
    console.log('📬 NotificationProvider: isAuthenticated:', auth.state.isAuthenticated);
    console.log('📬 NotificationProvider: isHydrated:', auth.state.isHydrated);
    
    return { userId, mode };
  };

  // Recursive function to find array in nested object
  const findArrayInObject = (obj: any, depth = 0, maxDepth = 5): any[] | null => {
    if (depth > maxDepth) return null;
    if (!obj || typeof obj !== 'object') return null;
    
    // If it's already an array, return it
    if (Array.isArray(obj)) {
      return obj;
    }
    
    // Check common array property names
    const arrayKeys = ['data', 'notifications', 'items', 'results', 'list', 'notificationsList', 'content'];
    for (const key of arrayKeys) {
      if (obj[key] && Array.isArray(obj[key])) {
        return obj[key];
      }
    }
    
    // Recursively search in nested objects
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
        const found = findArrayInObject(obj[key], depth + 1, maxDepth);
        if (found) return found;
      }
    }
    
    return null;
  };

  // Validate notification structure
  const isValidNotification = (item: any): item is Notification => {
    if (!item || typeof item !== 'object') return false;
    // Must have at least _id or id, and at least title or message
    return (item._id || item.id) && (item.title || item.message);
  };

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      console.log('📬 ========== LOAD NOTIFICATIONS START ==========');
      const { userId } = await getUserIdAndMode();
      if (!userId) {
        // Silent fail - don't show error to user, just skip loading
        // This is normal if user is not loaded yet or token is not available
        console.log('📬 ℹ️ No userId available yet, skipping load notifications (will retry when user is loaded)');
        setLoading(false);
        return;
      }

      console.log('📬 Calling API: getByReceiver with userId:', userId);
      const response = await notificationApi.getByReceiver(userId, {
        page: 1,
        limit: 100,
      });

      console.log('📬 API Response type:', typeof response);
      console.log('📬 API Response is array?', Array.isArray(response));
      console.log('📬 API Response statusCode:', (response as any)?.statusCode);
      console.log('📬 API Response has data:', !!(response as any)?.data);
      console.log('📬 Full API Response:', JSON.stringify(response, null, 2));

      // Handle multiple response formats:
      // 1. Direct array: [...]
      // 2. Wrapped object: { statusCode: 200, data: [...] }
      // 3. Nested: { data: { data: [...] } }
      let responseData: any = null;
      
      if (Array.isArray(response)) {
        // Case 1: Response is direct array
        console.log('📬 ✅ Response is direct array');
        responseData = response;
      } else if (response && typeof response === 'object') {
        // Case 2: Response is object
        const resp = response as any;
        
        if (resp.statusCode === 200 && resp.data) {
          // Standard format: { statusCode: 200, data: [...] }
          console.log('📬 ✅ Response has statusCode 200 and data');
          responseData = resp.data;
        } else if (Array.isArray(resp)) {
          // Response itself is array (shouldn't happen but handle it)
          console.log('📬 ✅ Response object is array');
          responseData = resp;
        } else if (resp.data) {
          // Has data property
          console.log('📬 ✅ Response has data property');
          responseData = resp.data;
        } else {
          // Try to use response directly
          console.log('📬 ⚠️ Response structure unclear, trying to use response directly');
          responseData = resp;
        }
      } else {
        console.warn('📬 ⚠️ Unknown response format');
        responseData = null;
      }

      if (responseData) {
        // CRITICAL: Log raw response data to see actual structure
        console.log('📬 ========== PARSING RESPONSE ==========');
        console.log('📬 Response data type:', typeof responseData);
        console.log('📬 Is array?', Array.isArray(responseData));
        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
          console.log('📬 Response data keys:', Object.keys(responseData));
        }
        console.log('📬 Response data structure:', JSON.stringify(responseData, null, 2));
        
        // Use recursive function to find array in nested structure
        let notificationsList: Notification[] = [];
        const foundArray = findArrayInObject(responseData);
        
        if (foundArray) {
          console.log('✅ Found array with', foundArray.length, 'items');
          // Validate and filter notifications
          notificationsList = foundArray.filter(isValidNotification).map((item: any) => ({
            ...item,
            _id: item._id || item.id,
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
            isRead: item.isRead !== undefined ? item.isRead : false,
          })) as Notification[];
          console.log('✅ Valid notifications after filtering:', notificationsList.length);
        } else {
          console.warn('📬 ⚠️ WARNING: Could not find array in response structure!');
          console.warn('📬 Response data:', JSON.stringify(responseData, null, 2));
          notificationsList = [];
        }
        
        console.log('📬 ========== PARSING RESULT ==========');
        console.log('📬 Parsed list length:', notificationsList.length);
        if (notificationsList.length > 0) {
          console.log('📬 First notification:', JSON.stringify(notificationsList[0], null, 2));
        }
        
        // CRITICAL FIX: Always create new array reference to trigger Zustand re-render
        // Even if empty, we need to create a new reference
        const newNotificationsArray = notificationsList.length > 0 
          ? [...notificationsList] 
          : []; // Explicit empty array
        
        console.log('📬 Setting notifications to Zustand store...');
        setNotifications(newNotificationsArray);
        
        // Calculate unread count from new list
        const newUnreadCount = newNotificationsArray.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        
        console.log('✅ ========== SET NOTIFICATIONS DONE ==========');
        console.log('✅ Notifications count:', newNotificationsArray.length);
        console.log('✅ Unread count:', newUnreadCount);
        console.log('✅ Zustand store should now have:', newNotificationsArray.length, 'notifications');
      } else {
        console.warn('📬 ⚠️ Invalid response or no data');
        console.warn('📬 Response:', response);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error: any) {
      console.error('📬 ❌ ERROR loading notifications:', error);
      console.error('📬 Error message:', error?.message);
      console.error('📬 Error response:', error?.response?.data);
      console.error('📬 Error status:', error?.response?.status);
      console.error('📬 Full error:', JSON.stringify(error, null, 2));
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      console.log('📬 ========== LOAD NOTIFICATIONS END ==========');
    }
  };

  // Initialize socket connection
  const initializeSocket = async () => {
    if (socketInitialized.current || !auth.state.isAuthenticated) {
      console.log('📬 Socket already initialized or not authenticated');
      return;
    }

    const { userId, mode } = await getUserIdAndMode();
    if (!userId) {
      console.log('📬 No userId, cannot initialize socket');
      return;
    }

    try {
      // Get access token
      const token = auth.state.accessToken;
      
      console.log('📬 Initializing socket with:', { userId, mode, hasToken: !!token });
      
      // AUTO HANDLE ANY NOTIFICATION EVENT (siêu mạnh - catch tất cả)
      // This will catch ANY event that looks like a notification
      socketService.onAny((eventName: string, ...args: any[]) => {
        console.log('🔍 ========== SOCKET ANY EVENT ==========');
        console.log('🔍 Event name:', eventName);
        console.log('🔍 Args count:', args.length);
        console.log('🔍 Args:', JSON.stringify(args, null, 2));
        
        // Extract payload (could be first arg or nested in array)
        let payload: any = null;
        if (args.length > 0) {
          if (Array.isArray(args[0]) && args[0].length > 0) {
            payload = args[0][0]; // First item in array
            console.log('🔍 Extracted payload from array[0][0]');
          } else if (typeof args[0] === 'object' && args[0] !== null) {
            payload = args[0]; // Direct object
            console.log('🔍 Extracted payload from args[0]');
          } else {
            console.log('🔍 Could not extract payload from args');
          }
        }
        
        if (!payload || typeof payload !== 'object') {
          console.log('🔍 No valid payload, skipping...');
          return; // Skip if no valid payload
        }
        
        console.log('🔍 Payload:', JSON.stringify(payload, null, 2));
        
        // Check if this is a notification event by name
        const isNotificationEvent = 
          eventName.includes('notif') ||
          eventName.includes('notification') ||
          eventName.includes('message') ||
          eventName.includes('alert') ||
          eventName.includes('notify');
        
        // Check if payload has notification structure
        const hasNotificationStructure = 
          (payload._id || payload.id) && 
          (payload.title || payload.message || payload.body);
        
        console.log('🔍 Is notification event (by name):', isNotificationEvent);
        console.log('🔍 Has notification structure:', hasNotificationStructure);
        
        // AUTO ADD if it looks like a notification
        if (isNotificationEvent || hasNotificationStructure) {
          console.log('🔥 ========== AUTO ADD NOTIFICATION ==========');
          console.log('🔥 Event:', eventName);
          console.log('🔥 Payload:', JSON.stringify(payload, null, 2));
          
          // Validate notification before adding
          if (!isValidNotification(payload)) {
            console.warn('⚠️ Payload does not have valid notification structure, skipping');
            return;
          }
          
          // Clone payload to trigger Zustand re-render
          // Use type assertion since payload might have different field names
          const payloadAny = payload as any;
          const notificationPayload: Notification = {
            ...payload,
            _id: payload._id || payloadAny.id,
            createdAt: payload.createdAt || payloadAny.created_at || new Date().toISOString(),
            updatedAt: payload.updatedAt || payloadAny.updated_at || new Date().toISOString(),
            isRead: payload.isRead !== undefined ? payload.isRead : false,
          };
          
          console.log('🔥 Normalized notification:', JSON.stringify(notificationPayload, null, 2));
          
          // Add to store (will trigger re-render)
          console.log('🔥 Adding to Zustand store...');
          addNotification(notificationPayload);
          
          if (!notificationPayload.isRead) {
            incrementUnread();
            console.log('🔥 Incremented unread count');
          }
          
          // Show in-app alert/popup for new notifications (only once per notification)
          if (!notificationPayload.isRead && !shownAlertIds.current.has(notificationPayload._id)) {
            console.log('🔥 Showing alert popup...');
            shownAlertIds.current.add(notificationPayload._id);
            
            // Limit Set size to prevent memory leaks (keep max 100)
            if (shownAlertIds.current.size > 100) {
              // Remove oldest entries (first 50) when limit exceeded
              const idsToRemove = Array.from(shownAlertIds.current).slice(0, 50);
              idsToRemove.forEach(id => shownAlertIds.current.delete(id));
            }
            
            Alert.alert(
              notificationPayload.title || 'Thông báo mới',
              notificationPayload.message || '',
              [
                { text: 'Đóng', style: 'cancel' },
                { 
                  text: 'Xem', 
                  onPress: () => {
                    console.log('User wants to view notification:', notificationPayload._id);
                  }
                }
              ],
              { cancelable: true }
            );
          }
          
          console.log('✅ Notification added successfully to store!');
          console.log('✅ =========================================');
        } else {
          console.log('🔍 Not a notification event, skipping...');
        }
        console.log('🔍 =========================================');
      });

      // Setup listeners BEFORE connecting (socket.io will queue them)
      // Store handlers for cleanup
      notificationHandlers.current.notification = (payload: Notification) => {
        console.log('📬 [notification] New notification received via socket:', payload);
        addNotification(payload);
        if (!payload.isRead) {
          incrementUnread();
        }
        
        // Show in-app alert/popup for new notifications (only once per notification)
        if (!payload.isRead && !shownAlertIds.current.has(payload._id)) {
          shownAlertIds.current.add(payload._id);
          
          // Limit Set size to prevent memory leaks (keep last 100)
          if (shownAlertIds.current.size > 100) {
            const firstId = shownAlertIds.current.values().next().value;
            shownAlertIds.current.delete(firstId);
          }
          
          Alert.alert(
            payload.title || 'Thông báo mới',
            payload.message || '',
            [
              { text: 'Đóng', style: 'cancel' },
              { 
                text: 'Xem', 
                onPress: () => {
                  // Could navigate to notification detail if needed
                  console.log('User wants to view notification:', payload._id);
                }
              }
            ],
            { cancelable: true }
          );
        }
      };

      notificationHandlers.current.notificationNew = (payload: Notification) => {
        console.log('📬 [notification:new] New notification event via socket:', payload);
        addNotification(payload);
        if (!payload.isRead) {
          incrementUnread();
        }
        
        // Show in-app alert/popup for new notifications (only once per notification)
        if (!payload.isRead && !shownAlertIds.current.has(payload._id)) {
          shownAlertIds.current.add(payload._id);
          
          // Limit Set size to prevent memory leaks (keep last 100)
          if (shownAlertIds.current.size > 100) {
            const firstId = shownAlertIds.current.values().next().value;
            shownAlertIds.current.delete(firstId);
          }
          
          Alert.alert(
            payload.title || 'Thông báo mới',
            payload.message || '',
            [
              { text: 'Đóng', style: 'cancel' },
              { 
                text: 'Xem', 
                onPress: () => {
                  console.log('User wants to view notification:', payload._id);
                }
              }
            ],
            { cancelable: true }
          );
        }
      };

      notificationHandlers.current.connect = () => {
        console.log('📬 Socket connected, registering and finding notifications');
        socketService.register(userId, mode);
        // Wait a bit before finding notifications to ensure registration is complete
        setTimeout(() => {
          socketService.findAllNotifications(userId, mode);
        }, 500);
      };

      notificationHandlers.current.disconnect = () => {
        console.log('📬 Socket disconnected');
      };

      notificationHandlers.current.error = (error: any) => {
        console.error('📬 Socket error:', error);
      };

      // Register listeners for common notification event names
      // We'll listen to multiple possible event names to catch what backend emits
      socketService.on('notification', notificationHandlers.current.notification);
      socketService.on('notification:new', notificationHandlers.current.notificationNew);
      // Listen to other possible event names (using type assertion for flexibility)
      (socketService.on as any)('new-notification', notificationHandlers.current.notificationNew);
      (socketService.on as any)('user-notification', notificationHandlers.current.notificationNew);
      (socketService.on as any)('notification-received', notificationHandlers.current.notificationNew);
      
      // Connection events
      socketService.on('connect', notificationHandlers.current.connect);
      socketService.on('disconnect', notificationHandlers.current.disconnect);
      socketService.on('error', notificationHandlers.current.error);

      // Connect socket
      socketService.connect(userId, mode, token || undefined);
      socketInitialized.current = true;

      // If already connected, register immediately
      if (socketService.isConnected()) {
        console.log('📬 Socket already connected, registering immediately');
        socketService.register(userId, mode);
        setTimeout(() => {
      socketService.findAllNotifications(userId, mode);
        }, 500);
      }
    } catch (error) {
      console.error('📬 Error initializing socket:', error);
      socketInitialized.current = false;
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    console.log('📬 Refreshing notifications...');
    await loadNotifications();
    const { userId, mode } = await getUserIdAndMode();
    if (userId) {
      if (socketService.isConnected()) {
        console.log('📬 Socket connected, finding notifications via socket');
      socketService.findAllNotifications(userId, mode);
      } else {
        console.log('📬 Socket not connected, skipping socket refresh');
      }
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      // Update local state immediately
      markAsReadStore(id);
      
      // Remove from shown alerts set (cleanup)
      shownAlertIds.current.delete(id);
      
      // Update via API
      await notificationApi.markAsRead(id);
      
      // Update via socket
      if (socketService.isConnected()) {
        socketService.markAsRead(id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      updateNotification(id, { isRead: false });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { userId, mode } = await getUserIdAndMode();
      if (!userId) return;

      // Update local state
      markAllAsReadStore();
      
      // Update via API
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifications.map(n => notificationApi.markAsRead(n._id)));
      
      // Update via socket
      if (socketService.isConnected()) {
        socketService.markAllAsRead(userId, mode);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      // Update local state
      removeNotification(id);
      
      // Delete via API
      await notificationApi.delete(id);
      
      // Delete via socket
      if (socketService.isConnected()) {
        socketService.deleteNotification(id);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const { userId, mode } = await getUserIdAndMode();
      if (!userId) return;

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
      // Delete via API
      await notificationApi.deleteByReceiver(userId);
      
      // Delete via socket
      if (socketService.isConnected()) {
        socketService.deleteAllNotifications(userId, mode);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  // Debug: Log store state changes
  useEffect(() => {
    console.log('📬 ========== ZUSTAND STORE STATE ==========');
    console.log('📬 Store notifications count:', notifications.length);
    console.log('📬 Store unread count:', unreadCount);
    console.log('📬 Store loading:', loading);
    if (notifications.length > 0) {
      console.log('📬 First notification in store:', notifications[0]);
    }
    console.log('📬 =========================================');
  }, [notifications, unreadCount, loading]);

  // Separate effect to watch for user object loading OR use fallback API call
  // This will trigger when user is loaded asynchronously after hydration
  useEffect(() => {
    const userId = auth.state.user?._id;
    const hasToken = !!auth.state.accessToken;
    const isReady = auth.state.isAuthenticated && auth.state.isHydrated && (!!userId || hasToken);
    
    console.log('📬 ========== USER WATCHER EFFECT ==========');
    console.log('📬 User object changed:', {
      hasUser: !!auth.state.user,
      userId: userId,
      hasToken: hasToken,
      isAuthenticated: auth.state.isAuthenticated,
      isHydrated: auth.state.isHydrated,
      isReady: isReady,
      socketInitialized: socketInitialized.current,
    });
    
    // Only initialize if ready and not already initialized
    // isReady = authenticated + hydrated + (has userId OR has token for fallback)
    if (isReady && !socketInitialized.current) {
      console.log('✅ Ready to initialize! (User ID in state OR has token for fallback)');
      console.log('✅ Initializing notifications and socket...');
      loadNotifications();
      initializeSocket(); // initializeSocket is now async but we don't need to await it
    } else if (isReady && socketInitialized.current) {
      console.log('ℹ️ Ready but socket already initialized, skipping...');
    } else if (!isReady) {
      console.log('⏳ Waiting for authentication/hydration...');
    }
  }, [auth.state.user?._id, auth.state.isAuthenticated, auth.state.isHydrated, auth.state.accessToken]);

  // Initialize on mount and when auth state changes
  useEffect(() => {
    console.log('📬 ========== NOTIFICATION PROVIDER EFFECT ==========');
    console.log('📬 Effect triggered with state:', {
      isAuthenticated: auth.state.isAuthenticated,
      isHydrated: auth.state.isHydrated,
      userId: auth.state.user?._id,
      user: auth.state.user,
      role: auth.state.role,
      hasAccessToken: !!auth.state.accessToken,
    });
    
    // CRITICAL: Wait for both authentication AND user object to be loaded
    // User object is loaded asynchronously after hydration via API call
    // OR we can use fallback API call if user object is not available
    if (auth.state.isAuthenticated && auth.state.isHydrated) {
      const userId = auth.state.user?._id;
      const hasToken = !!auth.state.accessToken;
      
      if (userId) {
        console.log('✅ User authenticated, hydrated, and user ID available in state');
        console.log('✅ Initializing notifications and socket...');
        loadNotifications();
        initializeSocket(); // initializeSocket is now async but we don't need to await it
      } else if (hasToken) {
        console.warn('⚠️ User authenticated and hydrated, but user ID not in state yet');
        console.warn('📬 User object:', auth.state.user);
        console.warn('📬 Has access token, will use fallback API call to get user ID');
        console.warn('📬 User watcher effect will handle initialization with fallback');
        // Don't clear notifications yet, wait for user watcher effect to handle it
        // The user watcher effect will call loadNotifications which uses fallback API
      } else {
        console.warn('⚠️ User authenticated and hydrated, but no user ID and no token');
        console.warn('📬 Cannot load notifications without user ID or token');
      }
    } else {
      console.warn('⚠️ Not authenticated or not hydrated yet');
      console.warn('📬 isAuthenticated:', auth.state.isAuthenticated);
      console.warn('📬 isHydrated:', auth.state.isHydrated);
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      // Cleanup socket listeners
      if (notificationHandlers.current.notification) {
        socketService.off('notification', notificationHandlers.current.notification);
      }
      if (notificationHandlers.current.notificationNew) {
        socketService.off('notification:new', notificationHandlers.current.notificationNew);
        (socketService.off as any)('new-notification', notificationHandlers.current.notificationNew);
        (socketService.off as any)('user-notification', notificationHandlers.current.notificationNew);
        (socketService.off as any)('notification-received', notificationHandlers.current.notificationNew);
      }
      if (notificationHandlers.current.connect) {
        socketService.off('connect', notificationHandlers.current.connect);
      }
      if (notificationHandlers.current.disconnect) {
        socketService.off('disconnect', notificationHandlers.current.disconnect);
      }
      if (notificationHandlers.current.error) {
        socketService.off('error', notificationHandlers.current.error);
      }
      
      // Only disconnect if we're the one who initialized it
      // (in case other components are using the socket)
      if (socketInitialized.current) {
        console.log('📬 NotificationProvider: Cleaning up socket');
        // Don't disconnect - let socket service manage its own lifecycle
        // socketService.disconnect();
        socketInitialized.current = false;
      }
      
      // Clear handlers
      notificationHandlers.current = {};
    };
  }, [auth.state.isAuthenticated, auth.state.isHydrated, auth.state.user, auth.state.role]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

