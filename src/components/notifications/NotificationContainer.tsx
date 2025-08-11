import React, { useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationContainer: React.FC = () => {
  const { isOpen, toggleDropdown, unreadCount } = useNotifications();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        isOpen && toggleDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleDropdown]);

  return (
    <div className="relative" ref={containerRef}>
      <NotificationBell 
        unreadCount={unreadCount} 
        onClick={toggleDropdown}
        isOpen={isOpen}
      />
      <NotificationDropdown />
    </div>
  );
};

export default NotificationContainer;
