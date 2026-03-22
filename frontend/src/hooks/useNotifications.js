import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useNotifications = () => {
  const [socket,      setSocket]      = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // ── Read auth from the single correct key ─────────────────────────────────
  // After fix 4, only dpi_token is written. The old 'token' and 'user' keys
  // no longer exist — reading them always returned null and prevented socket
  // connection silently.
  const getAuthData = useCallback(() => {
    const token = localStorage.getItem('dpi_token');
    return { token };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const { token } = getAuthData();

    if (token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notification server:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('booking_request',   (data) => { addNotification({ ...data, title: 'New Booking Request',   type: 'booking_request',   priority: 'high'   }); showToast('New booking request received!', 'info'); });
      newSocket.on('booking_approved',  (data) => { addNotification({ ...data, title: 'Booking Approved',      type: 'booking_approved',  priority: 'high'   }); showToast('Your booking has been approved!', 'success'); });
      newSocket.on('booking_cancelled', (data) => { addNotification({ ...data, title: 'Booking Cancelled',     type: 'booking_cancelled', priority: 'medium' }); showToast('A booking has been cancelled', 'warning'); });
      newSocket.on('booking_completed', (data) => { addNotification({ ...data, title: 'Session Completed',     type: 'booking_completed', priority: 'low'    }); showToast('Session marked as completed', 'success'); });
      newSocket.on('booking_reminder',  (data) => { addNotification({ ...data, title: 'Session Reminder',      type: 'booking_reminder',  priority: 'high'   }); showToast('Reminder: You have a session tomorrow!', 'info'); });
      newSocket.on('notification',      (data) => { addNotification(data); showToast(data.message || 'New notification', data.type || 'info'); });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        socketRef.current = null;
      };
    }
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...notification,
      read: false,
      createdAt: notification.createdAt || new Date().toISOString()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev.slice(0, 49)];
      try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setUnreadCount(prev => prev + 1);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('MindCare', { body: message, icon: '/favicon.ico', tag: 'mindcare-notification' });
        setTimeout(() => n.close(), 5000);
      } catch {}
    }

    const existing = document.querySelectorAll('.toast-notification');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;padding:1rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:320px;font-size:13px;transition:transform .3s;transform:translateX(120%)';

    const colors = { success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#2563eb' };
    toast.style.background = colors[type] || colors.info;
    toast.style.color = '#fff';
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 50);
    setTimeout(() => { toast.style.transform = 'translateX(120%)'; setTimeout(() => toast.remove(), 300); }, 4000);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
      try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try { localStorage.setItem('notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    try { localStorage.removeItem('notifications'); } catch {}
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch { return false; }
    }
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  // Load persisted notifications on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch {
      localStorage.removeItem('notifications');
    }
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return {
    notifications, unreadCount, isConnected,
    markAsRead, markAllAsRead, clearAll,
    requestNotificationPermission,
    socket: socketRef.current
  };
};

export default useNotifications;
