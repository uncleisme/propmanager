import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isOpen, 
    markAsRead, 
    deleteNotification,
    markAllAsRead,
    deleteAllNotifications,
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:text-primary-dark"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li 
                key={notification.id}
                className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {notification.subject}
                    </p>
                    <p className="text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-2 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={deleteAllNotifications}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
