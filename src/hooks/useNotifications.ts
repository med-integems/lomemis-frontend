"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { notificationsApi } from '../lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  isRead: boolean;
  referenceType?: string;
  referenceId?: number;
  createdAt: string;
  updatedAt: string;
  data?: Record<string, unknown>;
}

interface NotificationStats {
  total: number;
  unread: number;
  byPriority: { [key: string]: number };
  byCategory: { [key: string]: number };
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: number) => Promise<void>;
  dismissAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Simple module-scoped singleton to avoid multiple WS connections from multiple hook consumers
  interface GlobalNotificationWS {
    ws: WebSocket | null;
    initialized?: boolean;
  }
  
  // Create a properly typed global reference for shared WebSocket connection
  declare global {
    var __lomemis_notifications_ws__: GlobalNotificationWS | undefined;
  }
  
  if (!globalThis.__lomemis_notifications_ws__) {
    globalThis.__lomemis_notifications_ws__ = { ws: null, initialized: false };
  }
  const shared = globalThis.__lomemis_notifications_ws__;

  // Using axios-based API layer (see ../lib/api)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Exclude dismissed notifications in the center
      const res = await notificationsApi.list(page, limit, false, { dismissed: false });
      const data = res.data;

      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...data.notifications]);
      }

      setUnreadCount(data.unreadCount);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to fetch notifications';
      setError(msg);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await notificationsApi.stats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Optimistically update the UI immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationsApi.markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert the optimistic update on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Store current state for potential restoration
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    // Optimistically update the UI immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert the optimistic updates on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      throw err;
    }
  }, [notifications, unreadCount]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchNotifications(1),
      fetchStats(),
    ]);
  }, [fetchNotifications, fetchStats]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Reuse existing shared connection if available
    if (shared.ws && shared.ws.readyState === WebSocket.OPEN) {
      wsRef.current = shared.ws;
      setConnectionStatus('connected');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');

    try {
      // Build WebSocket URL targeting the backend host (NEXT_PUBLIC_API_URL)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const backend = new URL(apiUrl);
      const wsProtocol = backend.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsOrigin = `${wsProtocol}//${backend.host}`; // includes host:port
      const wsUrl = `${wsOrigin}/ws?token=${encodeURIComponent(token)}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('[Notifications] Connecting WebSocket:', wsUrl);
      }
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for notifications');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Send initial ping
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString(),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'notification':
              if (message.data && message.data.id) {
                const newNotification = message.data;
                
                setNotifications(prev => [newNotification, ...prev]);
                
                if (!newNotification.isRead) {
                  setUnreadCount(prev => prev + 1);
                }

                // Show browser notification if supported and permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(newNotification.title, {
                    body: newNotification.message,
                    icon: '/coat-of-arms-of-sierra-leone-seeklogo.png',
                    tag: `notification-${newNotification.id}`,
                  });
                }
              }
              break;

            case 'pong':
              // Handle pong response
              break;

            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        // Enhanced close event logging with interpretation
        const closeInfo = {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          timestamp: new Date().toISOString(),
          interpretation: interpretCloseCode(event.code),
          reconnectEligible: shouldReconnect(event.code)
        };

        if (process.env.NODE_ENV === 'development') {
          console.group('🔌 WebSocket Close Details');
          console.log('Close event:', event);
          console.table(closeInfo);
          console.groupEnd();
        } else {
          console.log('WebSocket disconnected:', closeInfo.code, closeInfo.reason, `(${closeInfo.interpretation})`);
        }

        setConnectionStatus('disconnected');
        wsRef.current = null;
        shared.ws = null;

        // Enhanced reconnection logic based on close code
        if (closeInfo.reconnectEligible && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = calculateBackoffDelay(reconnectAttempts.current, event.code);
          reconnectAttempts.current++;
          
          console.log(`🔄 Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms (${closeInfo.interpretation})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting WebSocket reconnection (attempt ${reconnectAttempts.current})`);
            connectWebSocket();
          }, delay);
        } else if (!closeInfo.reconnectEligible) {
          console.log(`❌ Not attempting reconnection: ${closeInfo.interpretation}`);
        }
      };

      ws.onerror = (error) => {
        // Enhanced error information collection (WebSocket errors are intentionally limited for security)
        const errorInfo = {
          timestamp: new Date().toISOString(),
          type: error.type || 'error',
          // WebSocket state information
          wsState: {
            readyState: ws.readyState,
            url: ws.url,
            protocol: ws.protocol || 'none',
            extensions: ws.extensions || 'none',
            bufferedAmount: ws.bufferedAmount
          },
          // Connection context
          connectionAttempt: reconnectAttempts.current,
          lastSuccessfulConnection: wsRef.current ? 'had_connection' : 'never_connected',
          // Network context
          online: navigator.onLine,
          connectionType: (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
          // Attempt to extract any available error details (usually empty for security)
          errorMessage: (error as Error).message || 'No error message available',
          errorName: (error as Error).name || 'WebSocketError',
          errorCode: (error as { code?: number }).code,
          errorReason: (error as { reason?: string }).reason
        };

        if (process.env.NODE_ENV === 'development') {
          console.group('🚨 WebSocket Error Details');
          if (error && Object.keys(error).length > 0) {
            console.warn('Raw error object (often minimal by design):', error);
          } else {
            console.warn('Empty error object received - this is common for WebSocket security reasons');
          }
          console.table(errorInfo.wsState);
          console.log('Full error context:', errorInfo);
          console.groupEnd();
        } else {
          // Production: Log essential information without overwhelming detail
          console.warn(`WebSocket error (attempt ${errorInfo.connectionAttempt}):`, {
            state: errorInfo.wsState.readyState,
            url: errorInfo.wsState.url,
            online: errorInfo.online
          });
        }

        setConnectionStatus('disconnected');
      };

      wsRef.current = ws;
      shared.ws = ws;

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Helper function to interpret WebSocket close codes
  const interpretCloseCode = (code: number): string => {
    const interpretations: { [key: number]: string } = {
      1000: 'Normal closure',
      1001: 'Going away (page unload/server shutdown)',
      1002: 'Protocol error',
      1003: 'Unsupported data',
      1005: 'No status code (abnormal closure)',
      1006: 'Abnormal closure (network issue)',
      1007: 'Invalid frame payload data',
      1008: 'Policy violation (likely auth failure)',
      1009: 'Message too big',
      1010: 'Missing required extension',
      1011: 'Internal server error',
      1015: 'TLS handshake failure'
    };
    
    return interpretations[code] || `Unknown close code: ${code}`;
  };

  const shouldReconnect = (code: number): boolean => {
    // Don't reconnect for these codes
    const noReconnectCodes = [1000, 1001, 1008]; // Normal, going away, policy violation
    return !noReconnectCodes.includes(code);
  };

  const calculateBackoffDelay = (attempt: number, closeCode: number): number => {
    // Faster retry for network issues (1006), slower for server errors
    const baseDelay = closeCode === 1006 ? 1000 : 2000; // Network vs server issues
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
  };

  // Dismiss notification
  const dismiss = useCallback(async (notificationId: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Store the notification for potential restoration on error
    const notificationToRemove = notifications.find(n => n.id === notificationId);
    
    // Optimistically remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    
    // Update unread count if it was unread
    if (notificationToRemove && !notificationToRemove.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationsApi.dismiss(notificationId);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      // Restore the notification on error
      if (notificationToRemove) {
        setNotifications((prev) => [...prev, notificationToRemove].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        if (!notificationToRemove.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      }
      throw err;
    }
  }, [notifications]);

  // Dismiss all notifications
  const dismissAll = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const previousNotifications = notifications;
    const previousUnread = unreadCount;

    // Optimistically clear UI instantly
    setNotifications([]);
    setUnreadCount(0);

    try {
      await notificationsApi.dismissAll();
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
      // Revert on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
      throw err;
    }
  }, [notifications, unreadCount]);

  // Close WebSocket connection
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  // Initialize notifications on mount
  useEffect(() => {
    if (user) {
      refreshNotifications();
      connectWebSocket();

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('Notification permission:', permission);
        });
      }
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, refreshNotifications, connectWebSocket, disconnectWebSocket]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network came online');
      
      // Attempt immediate reconnection if disconnected
      if (connectionStatus === 'disconnected' && user) {
        console.log('🔄 Network restored - attempting WebSocket reconnection');
        setTimeout(() => connectWebSocket(), 1000);
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network went offline - WebSocket will reconnect when network is restored');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus, connectWebSocket, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Periodic ping to keep WebSocket alive
  useEffect(() => {
    if (connectionStatus === 'connected' && wsRef.current) {
      const pingInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString(),
          }));
        }
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [connectionStatus]);

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      const pollInterval = setInterval(() => {
        // Lightweight refresh: just refresh notifications page 1 and stats
        refreshNotifications().catch(() => {});
      }, 60000); // poll every 60 seconds
      return () => clearInterval(pollInterval);
    }
  }, [connectionStatus, refreshNotifications]);

  // Refresh on window focus (helps if WS dropped while tab was hidden)
  useEffect(() => {
    const onFocus = () => {
      refreshNotifications().catch(() => {});
      if (connectionStatus !== 'connected') {
        connectWebSocket();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [connectionStatus, connectWebSocket, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    refreshNotifications,
    connectionStatus,
  };
};


