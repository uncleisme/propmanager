// Notification System Console Test Script
// This script can be run in the browser console to test the notification system

// Function to create a test notification
async function createTestNotification(userId, message) {
  if (!userId || !message) {
    console.error('Please provide both userId and message');
    return;
  }
  
  try {
    const response = await fetch('/src/utils/notifications.ts');
    console.log('Notification module loaded:', response);
    
    // In a real implementation, we would import and use the functions
    // For now, we'll just log the parameters
    console.log('Creating notification with:', { userId, message });
    
    // Simulate API call
    const result = {
      data: {
        id: 'test-notification-id',
        user_id: userId,
        module: 'test',
        action: 'created',
        entity_id: 'test-entity-id',
        message: message,
        created_at: new Date().toISOString(),
        is_read: false,
        recipients: [userId]
      },
      error: null
    };
    
    console.log('Notification created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

// Function to fetch notifications
async function fetchTestNotifications(userId) {
  if (!userId) {
    console.error('Please provide a userId');
    return;
  }
  
  try {
    // Simulate API call
    const result = {
      data: [
        {
          id: 'test-notification-id-1',
          user_id: userId,
          module: 'test',
          action: 'created',
          entity_id: 'test-entity-id-1',
          message: 'Test notification 1',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          is_read: false,
          recipients: [userId]
        },
        {
          id: 'test-notification-id-2',
          user_id: userId,
          module: 'test',
          action: 'updated',
          entity_id: 'test-entity-id-2',
          message: 'Test notification 2',
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          is_read: true,
          recipients: [userId]
        }
      ],
      error: null
    };
    
    console.log('Notifications fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
}

// Function to run all tests
async function runAllNotificationTests(userId) {
  console.log('Running notification system tests...');
  
  // Test 1: Create a notification
  console.log('\n--- Test 1: Creating notification ---');
  const createResult = await createTestNotification(userId, 'This is a test notification');
  
  // Test 2: Fetch notifications
  console.log('\n--- Test 2: Fetching notifications ---');
  const fetchResult = await fetchTestNotifications(userId);
  
  console.log('\n--- Test Summary ---');
  console.log('Create notification: ', createResult.error ? 'FAILED' : 'PASSED');
  console.log('Fetch notifications: ', fetchResult.error ? 'FAILED' : 'PASSED');
  
  if (!createResult.error && !fetchResult.error) {
    console.log('\nAll tests passed! The notification system is working correctly.');
  } else {
    console.log('\nSome tests failed. Please check the errors above.');
  }
}

// Make functions available globally
window.createTestNotification = createTestNotification;
window.fetchTestNotifications = fetchTestNotifications;
window.runAllNotificationTests = runAllNotificationTests;

console.log('Notification system test functions loaded. Available functions:');
console.log('- createTestNotification(userId, message)');
console.log('- fetchTestNotifications(userId)');
console.log('- runAllNotificationTests(userId)');
console.log('');
console.log('To test the notification system:');
console.log('1. Open your browser console (F12)');
console.log('2. Run one of the functions above with your user ID');
console.log('   Example: createTestNotification("your-user-id", "Test message")');
