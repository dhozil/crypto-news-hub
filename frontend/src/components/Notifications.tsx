'use client';

// Notification system component
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Bell,
  BellOff
} from 'lucide-react';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  read?: boolean;
}

// Notification context
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
  isMuted: boolean;
  toggleMute: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      duration: notification.duration || 5000
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        markAsRead,
        unreadCount,
        isMuted,
        toggleMute
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Notification Container
const NotificationContainer = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
};

// Notification Item
interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
}

const NotificationItem = ({ notification, onClose, onRead }: NotificationItemProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    if (!notification.read) {
      const timer = setTimeout(() => {
        onRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notification.read, onRead]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastClass = () => {
    switch (notification.type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
        return 'toast-info';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div 
      className={`toast ${getToastClass()} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-out'
      }}
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      
      <div className="toast-content">
        <div className="toast-title">
          {notification.title}
        </div>
        <div className="toast-message">
          {notification.message}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs opacity-60">
            {formatTime(notification.timestamp)}
          </span>
          
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-xs font-medium underline hover:no-underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="toast-close"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Notification Bell Component
export const NotificationBell = () => {
  const { notifications, unreadCount, isMuted, toggleMute } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {isMuted ? (
          <BellOff className="w-5 h-5 text-gray-500" />
        ) : (
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
        
        {unreadCount > 0 && !isMuted && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                >
                  {isMuted ? (
                    <BellOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Bell className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {notification.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format time
const formatTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
