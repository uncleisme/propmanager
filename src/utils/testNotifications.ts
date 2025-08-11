import { createNotification, fetchNotifications, markAsRead, deleteNotification } from './notifications';

// Test function to create a notification
export const testCreateNotification = async (userId: string) => {
  try {
    const result = await createNotification(
      userId,
      'contact',
      'created',
      'test-contact-id',
      'Test notification: A new contact was created',
      [userId]
    );
    
    console.log('Notification created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

// Test function to fetch notifications
export const testFetchNotifications = async (userId: string) => {
  try {
    const { data, error } = await fetchNotifications(userId);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }
    
    console.log('Notifications fetched successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
};

// Test function to mark a notification as read
export const testMarkAsRead = async (notificationId: string) => {
  try {
    const result = await markAsRead(notificationId);
    console.log('Notification marked as read:', result);
    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
};

// Test function to delete a notification
export const testDeleteNotification = async (notificationId: string) => {
  try {
    const result = await deleteNotification(notificationId);
    console.log('Notification deleted:', result);
    return result;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { data: null, error };
  }
};

// Test function to run all notification tests
export const runAllNotificationTests = async (userId: string) => {
  console.log('Running notification tests...');
  
  // Create a notification
  const createResult = await testCreateNotification(userId);
  if (createResult.error) return;
  
  // Fetch notifications
  const fetchResult = await testFetchNotifications(userId);
  if (fetchResult.error) return;
  
  // If we have notifications, test marking one as read
  if (fetchResult.data && fetchResult.data.length > 0) {
    const notificationId = fetchResult.data[0].id;
    
    // Mark as read
    await testMarkAsRead(notificationId);
    
    // Fetch again to verify
    await testFetchNotifications(userId);
  }
  
  console.log('All notification tests completed!');
};
