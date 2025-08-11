import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeNotifications, fetchNotifications } from '../../utils/notifications';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';

const NotificationContainer: React.FC<{ userId: string }> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!userId) return;
    
    const loadNotifications = async () => {
      console.log('🔔 NotificationContainer: Fetching initial notifications for userId:', userId);
      const { data, error } = await fetchNotifications(userId);
      if (error) {
        console.error('🔔 NotificationContainer: Error fetching notifications:', error);
        return;
      }
      console.log('🔔 NotificationContainer: Loaded notifications:', data);
      setNotifications(data || []);
    };
    
    loadNotifications();
  }, [userId]);

  // Set up real-time notifications
  useEffect(() => {
    if (!userId) return;
    
    console.log('🔔 NotificationContainer: Setting up real-time notifications for userId:', userId);
    const unsubscribe = useRealtimeNotifications(userId, (newNotification) => {
      console.log('🔔 NotificationContainer: New real-time notification received:', newNotification);
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const markAllAsRead = async () => {
    // In a real app, you would update all notifications in the database
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={containerRef}>
      <NotificationBell 
        unreadCount={unreadCount} 
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
      />
      <NotificationDropdown 
        userId={userId}
        isOpen={isOpen}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
      />
    </div>
  );
};

export default NotificationContainer;
