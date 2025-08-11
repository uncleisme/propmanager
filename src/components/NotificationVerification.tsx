import React, { useState } from 'react';
import { createNotification, fetchNotifications } from '../utils/notifications';

const NotificationVerification: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const handleCreateNotification = async () => {
    setError('');
    setResult(null);
    
    if (!userId || !message) {
      setError('Please fill in both User ID and Message');
      return;
    }
    
    try {
      const result = await createNotification(
        userId,
        'test',
        'created',
        'test-id',
        message,
        [userId]
      );
      
      console.log('Notification created:', result);
      setResult(result);
      
      if (result.error) {
        setError(`Error creating notification: ${result.error.message}`);
      } else {
        setMessage(''); // Clear message on success
      }
    } catch (err) {
      console.error('Error creating notification:', err);
      setError(`Error creating notification: ${err}`);
    }
  };
  
  const handleFetchNotifications = async () => {
    setError('');
    setResult(null);
    
    if (!userId) {
      setError('Please enter a User ID');
      return;
    }
    
    try {
      const { data, error } = await fetchNotifications(userId);
      
      console.log('Notifications fetched:', { data, error });
      setResult({ data, error });
      
      if (error) {
        setError(`Error fetching notifications: ${error.message}`);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(`Error fetching notifications: ${err}`);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Notification System Verification</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-blue-800">Instructions</h2>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>Enter your User ID (you can find this in your Supabase auth dashboard)</li>
          <li>Enter a test message</li>
          <li>Click "Create Notification" to create a new notification</li>
          <li>Click "Fetch Notifications" to retrieve all notifications for this user</li>
          <li>Check the browser console for detailed output</li>
        </ol>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your user ID"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Message
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a test message"
          />
        </div>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={handleCreateNotification}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Create Notification
        </button>
        
        <button
          onClick={handleFetchNotifications}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Fetch Notifications
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-1 text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Result</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Next Steps</h3>
        <p className="text-sm text-yellow-700">
          After verifying that notifications work, you can test the real-time functionality by:
        </p>
        <ol className="list-decimal list-inside text-yellow-700 text-sm mt-2 space-y-1">
          <li>Opening this page in two different browser tabs</li>
          <li>Creating a notification in one tab</li>
          <li>Checking if it appears in the other tab without refreshing</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationVerification;
