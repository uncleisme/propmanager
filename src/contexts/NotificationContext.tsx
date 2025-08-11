import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRealtimeNotifications, fetchNotifications, markAsRead as markAsReadApi, deleteNotification as deleteNotificationApi } from '../utils/notifications';

interface Notification {
  id: string;
  user_id: string;
  module: string;
  action: string;
  entity_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  recipients: string[];
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  userId 
}) => {
  console.log('🔔 NotificationProvider rendered with userId:', userId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      console.log('🔔 No userId provided, skipping notification fetch');
      return;
    }
    
    console.log('🔔 Fetching notifications for userId:', userId);
    const { data, error } = await fetchNotifications(userId);
    if (error) {
      console.error('🔔 Error fetching notifications:', error);
      return;
    }
    
    console.log('🔔 Fetched notifications:', data);
    setNotifications(data || []);
  }, [userId]);

  // Set up real-time notifications
  useEffect(() => {
    if (!userId) {
      console.log('🔔 No userId for real-time notifications');
      return;
    }
    
    console.log('🔔 Setting up real-time notifications for userId:', userId);
    const unsubscribe = useRealtimeNotifications(userId, (newNotification) => {
      console.log('🔔 New real-time notification received:', newNotification);
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Refresh notifications when userId changes
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    await markAsReadApi(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  // Delete a notification
  const deleteNotification = async (id: string) => {
    await deleteNotificationApi(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // In a real implementation, you would mark all as read in the database
    // For now, we'll just update the local state
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    refreshNotifications,
    isOpen,
    setIsOpen
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
