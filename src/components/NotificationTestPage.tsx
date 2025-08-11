import React, { useState } from 'react';
import { createNotification, fetchNotifications } from '../utils/notifications';
import NotificationContainer from './notifications/NotificationContainer';

const NotificationTestPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const handleCreateNotification = async () => {
    if (!userId || !message) return;
    
    const result = await createNotification(
      userId,
      'test',
      'created',
      'test-id',
      message,
      [userId]
    );
    
    console.log('Notification created:', result);
  };
  
  const handleFetchNotifications = async () => {
    if (!userId) return;
    
    const { data, error } = await fetchNotifications(userId);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }
    
    setNotifications(data || []);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification System Test</h1>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Create Test Notification</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter user ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter notification message"
            />
          </div>
          
          <button
            onClick={handleCreateNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Notification
          </button>
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Fetch Notifications</h2>
        <div className="space-y-4">
          <button
            onClick={handleFetchNotifications}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Fetch Notifications
          </button>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Fetched Notifications:</h3>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-white border rounded-md">
                  <p className="font-medium">{notif.message}</p>
                  <p className="text-sm text-gray-500">
                    Module: {notif.module} | Action: {notif.action}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Real-time Notifications</h2>
        <p className="mb-4">Use the notification bell in the top right to see real-time notifications:</p>
        <div className="flex justify-end">
          {userId && <NotificationContainer userId={userId} />}
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
