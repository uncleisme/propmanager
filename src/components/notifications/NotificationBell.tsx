import React from 'react';
import { Bell as BellIcon } from 'lucide-react';

type NotificationBellProps = {
  unreadCount: number;
  onClick: () => void;
  isOpen: boolean;
};

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  unreadCount, 
  onClick,
  isOpen 
}) => {
  const hasUnread = unreadCount > 0;
  
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
          isOpen ? 'bg-gray-100' : 'hover:bg-gray-100'
        }`}
        aria-label="Notifications"
      >
        <BellIcon 
          className={`h-5 w-5 ${hasUnread ? 'text-red-500' : 'text-gray-500'}`} 
          aria-hidden="true"
        />
      </button>
      
      {hasUnread && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
