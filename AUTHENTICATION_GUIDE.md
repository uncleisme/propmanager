# Authentication Guide for Notification System Testing

This guide explains how to properly authenticate in the CMMS application to test the notification system.

## Why Authentication is Required

The notification system requires authentication for several important reasons:

1. **Security**: Notifications are tied to specific users and should only be accessible by those users
2. **Data Integrity**: Only authenticated users can create entities that trigger notifications
3. **Privacy**: Users should only see notifications intended for them

## How to Authenticate

### 1. Register a New Account

1. Navigate to the login page
2. Click on the "Register" link
3. Fill in the registration form with:
   - Full name
   - Valid email address
   - Strong password (at least 6 characters)
4. Click "Register"
5. Check your email for a confirmation message
6. Click the confirmation link in the email

### 2. Login with Existing Account

1. Navigate to the login page
2. Enter your email and password
3. Click "Login"

## Testing the Notification System

Once you're authenticated, you can test the notification system:

### 1. Create a Contact

1. Navigate to the Contacts page
2. Click "Add Contact"
3. Fill in the contact details
4. Click "Save"
5. You should see a notification appear in the notification bell

### 2. View Notifications

1. Click on the notification bell icon in the top right corner
2. You should see a dropdown with your notifications
3. Unread notifications will be highlighted

### 3. Mark Notifications as Read

1. In the notification dropdown, click "Mark as read" next to a notification
2. The notification should no longer appear as highlighted

### 4. Delete Notifications

1. In the notification dropdown, click the trash icon next to a notification
2. The notification should be removed from the list

## Troubleshooting Authentication Issues

### Common Issues and Solutions

1. **"User not authenticated" error**
   - Make sure you've completed the registration process
   - Check your email for the confirmation message
   - Try logging out and logging back in

2. **Invalid credentials**
   - Double-check your email and password
   - Make sure you're using the correct case
   - Reset your password if needed

3. **Session timeout**
   - You may need to log in again after a period of inactivity
   - Refresh the page to see if you're still logged in

### Checking Authentication Status

You can check your authentication status in the browser console:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('User authenticated:', !!user);
console.log('User ID:', user?.id);
```

## Testing Without Authentication

For development purposes, you can test the notification components without authentication using the test pages:

1. Open `public/notification-test.html` in your browser
2. Use the form to create and fetch notifications
3. Check the browser console for detailed output

Note that these tests use mock data and don't actually connect to the Supabase database.

## Security Best Practices

1. Always log out when using shared computers
2. Use strong, unique passwords
3. Enable two-factor authentication if available
4. Never share your login credentials
5. Report any suspicious activity immediately
