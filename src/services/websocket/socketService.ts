import { API_BASE_URL } from '../../constants/api';
import { Notification } from '../api/notificationService';

type SocketMode = 'customer' | 'business' | 'staff';

interface SocketEvents {
  'notification': (payload: Notification) => void;
  'notification:new': (payload: Notification) => void;
  'new-notification': (payload: Notification) => void;
  'user-notification': (payload: Notification) => void;
  'notification-received': (payload: Notification) => void;
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: any) => void;
  [key: string]: (...args: any[]) => void; // Allow any event name for debugging
}

class SocketService {
  private socket: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private mode: SocketMode | null = null;

  // Initialize socket connection
  connect(userId: string, mode: SocketMode, token?: string) {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.userId = userId;
    this.mode = mode;
    this.isConnecting = true;

    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = API_BASE_URL.replace(/^https?:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
      const socketUrl = `${wsUrl}/socket.io/?EIO=4&transport=websocket${token ? `&token=${token}` : ''}`;

      // For React Native, we'll use socket.io-client
      // Note: Install socket.io-client: npm install socket.io-client
      let io;
      try {
        // Try dynamic import first (for React Native)
        io = require('socket.io-client');
      } catch (error) {
        console.error('socket.io-client not installed. Please run: npm install socket.io-client');
        // Don't throw error, just log and return - allow app to continue without WebSocket
        console.warn('WebSocket will not be available. App will continue without real-time notifications.');
        this.isConnecting = false;
        return;
      }
      
      if (!io) {
        console.warn('socket.io-client not available. WebSocket will not be available.');
        this.isConnecting = false;
        return;
      }
      
      this.socket = io(API_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        auth: token ? { token } : undefined,
      });

      // DEBUG: Listen to ALL events to see what backend emits
      this.socket.onAny((eventName: string, ...args: any[]) => {
        console.log('🔍 [SocketService] ANY EVENT received:', eventName, 'Data:', args);
        // Emit to our internal event system
        this.emit(eventName as any, ...args);
      });

      this.setupEventHandlers();
      this.register(userId, mode);
    } catch (error) {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emit('connect');
      
      // Re-register after reconnection
      if (this.userId && this.mode) {
        console.log('📬 Re-registering socket after connection');
        this.register(this.userId, this.mode);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.emit('disconnect');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
      this.isConnecting = false;
    });

    // Listen for notifications and emit to registered listeners
    this.socket.on('notification', (payload: Notification) => {
      console.log('📬 SocketService: Received notification:', payload);
      this.emit('notification', payload);
      this.emit('notification:new', payload);
    });

    this.socket.on('notification:new', (payload: Notification) => {
      console.log('📬 SocketService: Received new notification event:', payload);
      this.emit('notification:new', payload);
    });
  }

  // Register with server
  register(userId: string, mode: SocketMode) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot register');
      return;
    }

    console.log('📝 Registering socket:', { userId, mode });
    this.socket.emit('register', { userId, mode });
  }

  // Find all notifications
  findAllNotifications(userId: string, mode: SocketMode) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot find notifications');
      return;
    }

    console.log('🔍 Finding all notifications:', { userId, mode });
    this.socket.emit('findAllNotifications', { userId, mode });
  }

  // Mark notification as read
  markAsRead(id: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot mark as read');
      return;
    }

    this.socket.emit('markAsRead', id);
  }

  // Mark all notifications as read
  markAllAsRead(userId: string, mode: SocketMode) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot mark all as read');
      return;
    }

    this.socket.emit('markAllAsRead', { userId, mode });
  }

  // Delete notification
  deleteNotification(id: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot delete notification');
      return;
    }

    this.socket.emit('deleteNotification', id);
  }

  // Delete all notifications
  deleteAllNotifications(userId: string, mode: SocketMode) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot delete all notifications');
      return;
    }

    this.socket.emit('deleteAllNotifications', { userId, mode });
  }

  // Mark notification as unread
  markAsUnread(id: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, cannot mark as unread');
      return;
    }

    this.socket.emit('markAsUnread', id);
  }

  // Event listeners
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // Debug: Listen to ALL socket events to see what backend emits
  // This is already handled by socket.onAny() in connect() method
  // But we expose this for external use if needed
  onAny(callback: (eventName: string, ...args: any[]) => void) {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot listen to all events');
      return;
    }
    
    // Socket.io's onAny is already set up in connect()
    // This method is for backward compatibility
    console.log('📬 onAny listener registered (already handled by socket.onAny)');
  }

  private emit<K extends keyof SocketEvents>(event: K, ...args: Parameters<SocketEvents[K]>) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.userId && this.mode) {
        console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect(this.userId, this.mode);
      }
    }, delay);
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.userId = null;
    this.mode = null;
    this.listeners.clear();
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();

