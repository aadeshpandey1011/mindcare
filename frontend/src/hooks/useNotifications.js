// // hooks/useNotifications.js - Frontend WebSocket Integration
// import { useState, useEffect, useCallback } from 'react';
// import { io } from 'socket.io-client';
// import { useAuth } from '../context/AuthContext';

// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// export const useNotifications = () => {
//   const { user, token } = useAuth();
//   const [socket, setSocket] = useState(null);
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [isConnected, setIsConnected] = useState(false);

//   // Initialize socket connection
//   useEffect(() => {
//     if (user && token) {
//       const newSocket = io(SOCKET_URL, {
//         auth: { token },
//         transports: ['websocket', 'polling']
//       });

//       newSocket.on('connect', () => {
//         console.log('Connected to notification server');
//         setIsConnected(true);
//         // Join user-specific room
//         newSocket.emit('join', user.id);
//       });

//       newSocket.on('disconnect', () => {
//         console.log('Disconnected from notification server');
//         setIsConnected(false);
//       });

//       // Booking-related event listeners
//       newSocket.on('booking_request', (data) => {
//         addNotification({
//           ...data,
//           title: 'New Booking Request',
//           type: 'booking_request',
//           priority: 'high'
//         });
//         showToast('New booking request received!', 'info');
//       });

//       newSocket.on('booking_approved', (data) => {
//         addNotification({
//           ...data,
//           title: 'Booking Approved',
//           type: 'booking_approved',
//           priority: 'high'
//         });
//         showToast('Your booking has been approved!', 'success');
//       });

//       newSocket.on('booking_cancelled', (data) => {
//         addNotification({
//           ...data,
//           title: 'Booking Cancelled',
//           type: 'booking_cancelled',
//           priority: 'medium'
//         });
//         showToast('A booking has been cancelled', 'warning');
//       });

//       newSocket.on('booking_completed', (data) => {
//         addNotification({
//           ...data,
//           title: 'Session Completed',
//           type: 'booking_completed',
//           priority: 'low'
//         });
//         showToast('Session marked as completed', 'success');
//       });

//       newSocket.on('booking_reminder', (data) => {
//         addNotification({
//           ...data,
//           title: 'Session Reminder',
//           type: 'booking_reminder',
//           priority: 'high'
//         });
//         showToast('Reminder: You have a session tomorrow!', 'info');
//       });

//       setSocket(newSocket);

//       return () => {
//         newSocket.disconnect();
//         setSocket(null);
//         setIsConnected(false);
//       };
//     }
//   }, [user, token]);

//   // Add notification to state
//   const addNotification = useCallback((notification) => {
//     const newNotification = {
//       id: notification.id || Date.now().toString(),
//       ...notification,
//       read: false,
//       createdAt: new Date()
//     };

//     setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
//     setUnreadCount(prev => prev + 1);

//     // Store in localStorage for persistence
//     const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
//     const updated = [newNotification, ...stored.slice(0, 49)];
//     localStorage.setItem('notifications', JSON.stringify(updated));
//   }, []);

//   // Show toast notification
//   const showToast = useCallback((message, type = 'info') => {
//     // Check if browser supports notifications
//     if ('Notification' in window && Notification.permission === 'granted') {
//       const notification = new Notification('Mental Health Support', {
//         body: message,
//         icon: '/favicon.ico',
//         tag: 'booking-notification'
//       });

//       // Auto close after 5 seconds
//       setTimeout(() => notification.close(), 5000);
//     }

//     // Also show in-app toast (you can integrate with your toast library)
//     const toast = document.createElement('div');
//     toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
//     const colors = {
//       success: 'bg-green-500 text-white',
//       error: 'bg-red-500 text-white',
//       warning: 'bg-yellow-500 text-black',
//       info: 'bg-blue-500 text-white'
//     };
    
//     toast.className += ` ${colors[type] || colors.info}`;
//     toast.textContent = message;
    
//     document.body.appendChild(toast);
    
//     // Animate in
//     setTimeout(() => {
//       toast.style.transform = 'translateX(0)';
//     }, 100);
    
//     // Remove after 4 seconds
//     setTimeout(() => {
//       toast.style.transform = 'translateX(100%)';
//       setTimeout(() => document.body.removeChild(toast), 300);
//     }, 4000);
//   }, []);

//   // Mark notification as read
//   const markAsRead = useCallback((notificationId) => {
//     setNotifications(prev => 
//       prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
//     );
//     setUnreadCount(prev => Math.max(0, prev - 1));

//     // Update localStorage
//     const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
//     const updated = stored.map(n => n.id === notificationId ? { ...n, read: true } : n);
//     localStorage.setItem('notifications', JSON.stringify(updated));
//   }, []);

//   // Mark all notifications as read
//   const markAllAsRead = useCallback(() => {
//     setNotifications(prev => prev.map(n => ({ ...n, read: true })));
//     setUnreadCount(0);

//     const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
//     const updated = stored.map(n => ({ ...n, read: true }));
//     localStorage.setItem('notifications', JSON.stringify(updated));
//   }, []);

//   // Clear all notifications
//   const clearAll = useCallback(() => {
//     setNotifications([]);
//     setUnreadCount(0);
//     localStorage.removeItem('notifications');
//   }, []);

//   // Request notification permission
//   const requestNotificationPermission = useCallback(async () => {
//     if ('Notification' in window && Notification.permission === 'default') {
//       const permission = await Notification.requestPermission();
//       return permission === 'granted';
//     }
//     return Notification.permission === 'granted';
//   }, []);

//   // Load notifications from localStorage on mount
//   useEffect(() => {
//     const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
//     const unread = stored.filter(n => !n.read).length;
    
//     setNotifications(stored);
//     setUnreadCount(unread);
    
//     // Request notification permission if not already granted
//     requestNotificationPermission();
//   }, [requestNotificationPermission]);

//   return {
//     notifications,
//     unreadCount,
//     isConnected,
//     markAsRead,
//     markAllAsRead,
//     clearAll,
//     requestNotificationPermission
//   };
// };

// // Notification Component
// export const NotificationCenter = () => {
//   const {
//     notifications,
//     unreadCount,
//     isConnected,
//     markAsRead,
//     markAllAsRead,
//     clearAll
//   } = useNotifications();

//   const [isOpen, setIsOpen] = useState(false);

//   const getNotificationIcon = (type) => {
//     const icons = {
//       booking_request: '📅',
//       booking_approved: '✅',
//       booking_cancelled: '❌',
//       booking_completed: '✨',
//       booking_reminder: '⏰',
//       default: '🔔'
//     };
//     return icons[type] || icons.default;
//   };

//   const getNotificationColor = (type, priority) => {
//     if (priority === 'high') return 'bg-red-50 border-red-200';
//     if (priority === 'medium') return 'bg-yellow-50 border-yellow-200';
//     return 'bg-blue-50 border-blue-200';
//   };

//   const formatTime = (date) => {
//     const now = new Date();
//     const diff = now - new Date(date);
//     const minutes = Math.floor(diff / 60000);
//     const hours = Math.floor(diff / 3600000);
//     const days = Math.floor(diff / 86400000);

//     if (minutes < 1) return 'Just now';
//     if (minutes < 60) return `${minutes}m ago`;
//     if (hours < 24) return `${hours}h ago`;
//     return `${days}d ago`;
//   };

//   return (
//     <div className="relative">
//       {/* Notification Bell */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
//       >
//         <span className="text-xl">🔔</span>
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//             {unreadCount > 99 ? '99+' : unreadCount}
//           </span>
//         )}
//         <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
//           isConnected ? 'bg-green-400' : 'bg-red-400'
//         }`} />
//       </button>

//       {/* Notification Dropdown */}
//       {isOpen && (
//         <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
//           <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//             <h3 className="font-semibold text-gray-900">Notifications</h3>
//             <div className="flex space-x-2">
//               {unreadCount > 0 && (
//                 <button
//                   onClick={markAllAsRead}
//                   className="text-sm text-blue-600 hover:text-blue-800"
//                 >
//                   Mark all read
//                 </button>
//               )}
//               <button
//                 onClick={clearAll}
//                 className="text-sm text-gray-500 hover:text-gray-700"
//               >
//                 Clear all
//               </button>
//             </div>
//           </div>

//           <div className="max-h-96 overflow-y-auto">
//             {notifications.length === 0 ? (
//               <div className="p-4 text-center text-gray-500">
//                 <span className="text-2xl block mb-2">🔕</span>
//                 No notifications yet
//               </div>
//             ) : (
//               notifications.map((notification) => (
//                 <div
//                   key={notification.id}
//                   onClick={() => !notification.read && markAsRead(notification.id)}
//                   className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
//                     !notification.read ? 'bg-blue-50' : ''
//                   }`}
//                 >
//                   <div className="flex items-start space-x-3">
//                     <span className="text-xl flex-shrink-0 mt-1">
//                       {getNotificationIcon(notification.type)}
//                     </span>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex justify-between items-start">
//                         <p className="font-medium text-gray-900 text-sm">
//                           {notification.title}
//                         </p>
//                         {!notification.read && (
//                           <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
//                         )}
//                       </div>
//                       <p className="text-gray-600 text-sm mt-1 line-clamp-2">
//                         {notification.message}
//                       </p>
//                       <p className="text-gray-400 text-xs mt-2">
//                         {formatTime(notification.createdAt)}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           <div className="p-3 border-t border-gray-200 text-center">
//             <button
//               onClick={() => setIsOpen(false)}
//               className="text-sm text-gray-500 hover:text-gray-700"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Click outside to close */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 z-40"
//           onClick={() => setIsOpen(false)}
//         />
//       )}
//     </div>
//   );
// };




// frontend/src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useNotifications = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Get user and token from localStorage/context
  const getAuthData = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    let user = null;
    
    try {
      user = userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    
    return { user, token };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const { user, token } = getAuthData();
    
    if (user && token) {
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
        // Join user-specific room
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notification server:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Booking-related event listeners
      newSocket.on('booking_request', (data) => {
        console.log('Received booking request notification:', data);
        addNotification({
          ...data,
          title: 'New Booking Request',
          type: 'booking_request',
          priority: 'high'
        });
        showToast('New booking request received!', 'info');
      });

      newSocket.on('booking_approved', (data) => {
        console.log('Received booking approved notification:', data);
        addNotification({
          ...data,
          title: 'Booking Approved',
          type: 'booking_approved',
          priority: 'high'
        });
        showToast('Your booking has been approved!', 'success');
      });

      newSocket.on('booking_cancelled', (data) => {
        console.log('Received booking cancelled notification:', data);
        addNotification({
          ...data,
          title: 'Booking Cancelled',
          type: 'booking_cancelled',
          priority: 'medium'
        });
        showToast('A booking has been cancelled', 'warning');
      });

      newSocket.on('booking_completed', (data) => {
        console.log('Received booking completed notification:', data);
        addNotification({
          ...data,
          title: 'Session Completed',
          type: 'booking_completed',
          priority: 'low'
        });
        showToast('Session marked as completed', 'success');
      });

      newSocket.on('booking_reminder', (data) => {
        console.log('Received booking reminder notification:', data);
        addNotification({
          ...data,
          title: 'Session Reminder',
          type: 'booking_reminder',
          priority: 'high'
        });
        showToast('Reminder: You have a session tomorrow!', 'info');
      });

      // Generic notification handler
      newSocket.on('notification', (data) => {
        console.log('Received generic notification:', data);
        addNotification(data);
        showToast(data.message || 'New notification', data.type || 'info');
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        socketRef.current = null;
      };
    }
  }, []); // Empty dependency array to run once

  // Add notification to state
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...notification,
      read: false,
      createdAt: notification.createdAt || new Date().toISOString()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev.slice(0, 49)]; // Keep last 50
      // Store in localStorage for persistence
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    // Check if browser supports notifications and ask for permission
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('Mental Health Support', {
          body: message,
          icon: '/favicon.ico',
          tag: 'booking-notification',
          requireInteraction: false,
          silent: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          try {
            notification.close();
          } catch (e) {
            // Notification might already be closed
          }
        }, 5000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }

    // Also show in-app toast
    showInAppToast(message, type);
  }, []);

  // Show in-app toast notification
  const showInAppToast = useCallback((message, type = 'info') => {
    // Remove existing toasts to prevent stacking
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
    
    const colors = {
      success: 'bg-green-500 text-white border-l-4 border-green-700',
      error: 'bg-red-500 text-white border-l-4 border-red-700',
      warning: 'bg-yellow-500 text-black border-l-4 border-yellow-700',
      info: 'bg-blue-500 text-white border-l-4 border-blue-700'
    };
    
    toast.className += ` ${colors[type] || colors.info}`;
    
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="mr-2">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span class="font-medium">${message}</span>
        </div>
        <button class="ml-4 text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 4000);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating notifications in localStorage:', error);
      }
      return updated;
    });
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating notifications in localStorage:', error);
      }
      return updated;
    });
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      localStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error clearing notifications from localStorage:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      }
      return Notification.permission === 'granted';
    }
    return false;
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        const unread = parsedNotifications.filter(n => !n.read).length;
        
        setNotifications(parsedNotifications);
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
      localStorage.removeItem('notifications'); // Clear corrupted data
    }
    
    // Request notification permission if not already granted
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Send notification through socket (for testing)
  const sendNotification = useCallback((notification) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_notification', notification);
    }
  }, []);

  // Connection management
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    
    // Actions
    markAsRead,
    markAllAsRead,
    clearAll,
    requestNotificationPermission,
    sendNotification,
    
    // Connection management
    connect,
    disconnect,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current
  };
};

// Notification Center Component
export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    const icons = {
      booking_request: '📅',
      booking_approved: '✅',
      booking_cancelled: '❌',
      booking_completed: '✨',
      booking_reminder: '⏰',
      default: '🔔'
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-50 border-red-200 hover:bg-red-100';
    if (priority === 'medium') return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
    return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
  };

  const formatTime = (date) => {
    try {
      const now = new Date();
      const notificationDate = new Date(date);
      const diff = now - notificationDate;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return notificationDate.toLocaleDateString();
    } catch (error) {
      return 'Unknown time';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle notification-specific actions
    if (notification.bookingId) {
      // Navigate to booking details or dashboard
      window.location.href = `/dashboard?booking=${notification.bookingId}`;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection status indicator */}
        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full transition-colors ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} title={isConnected ? 'Connected' : 'Disconnected'} />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    title="Clear all notifications"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl block mb-3">🔕</span>
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">You'll see updates here when they arrive</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                      !notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                    } ${index === notifications.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <span className="text-xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900 text-sm leading-tight">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2 ml-2" />
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-gray-400 text-xs">
                            {formatTime(notification.createdAt)}
                          </p>
                          
                          {notification.priority && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {notification.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 text-center bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Click outside to close overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default useNotifications;