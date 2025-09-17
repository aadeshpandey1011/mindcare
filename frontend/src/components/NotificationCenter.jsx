import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { 
  Bell, 
  X, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  User,
  Mail
} from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const socketConnection = io('http://localhost:5000', {
        auth: {
          token: token
        },
        withCredentials: true
      });

      socketConnection.on('connect', () => {
        console.log('Connected to notification service');
      });

      // Listen for various notification types
      socketConnection.on('notification', (data) => {
        addNotification(data);
      });

      socketConnection.on('booking_request', (data) => {
        addNotification({
          ...data,
          type: 'booking_request',
          icon: 'calendar',
          color: 'blue'
        });
      });

      socketConnection.on('booking_approved', (data) => {
        addNotification({
          ...data,
          type: 'booking_approved',
          icon: 'check',
          color: 'green'
        });
      });

      socketConnection.on('booking_cancelled', (data) => {
        addNotification({
          ...data,
          type: 'booking_cancelled',
          icon: 'alert',
          color: 'red'
        });
      });

      socketConnection.on('booking_reminder', (data) => {
        addNotification({
          ...data,
          type: 'booking_reminder',
          icon: 'clock',
          color: 'orange'
        });
      });

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
      };
    }
  }, [user, token]);

  const addNotification = (notification) => {
    const newNotification = {
      id: notification.id || Date.now().toString(),
      ...notification,
      isRead: false,
      createdAt: notification.createdAt || new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('Mental Health Support', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
    });
  };

  const getNotificationIcon = (type, icon) => {
    if (icon === 'calendar' || type?.includes('booking')) return Calendar;
    if (icon === 'check' || type?.includes('approved')) return CheckCircle;
    if (icon === 'alert' || type?.includes('cancelled')) return AlertCircle;
    if (icon === 'clock' || type?.includes('reminder')) return Clock;
    if (icon === 'user') return User;
    if (icon === 'mail') return Mail;
    return Bell;
  };

  const getNotificationColor = (type, color) => {
    if (color) return color;
    if (type?.includes('approved')) return 'green';
    if (type?.includes('cancelled')) return 'red';
    if (type?.includes('reminder')) return 'orange';
    if (type?.includes('request')) return 'blue';
    return 'gray';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type, notification.icon);
                const color = getNotificationColor(notification.type, notification.color);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-full ${
                        color === 'green' ? 'bg-green-100 text-green-600' :
                        color === 'red' ? 'bg-red-100 text-red-600' :
                        color === 'orange' ? 'bg-orange-100 text-orange-600' :
                        color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {notification.message}
                        </p>
                        {notification.bookingId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Booking ID: {notification.bookingId}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          <div className="flex space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;