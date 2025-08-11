# Notification System for CMMS

This document provides an overview of the notification system implemented for the CMMS application, including setup instructions, testing procedures, and component details.

## System Overview

The notification system provides real-time notifications to users about important events in the CMMS application. It includes:

1. Database schema for storing notifications
2. Utility functions for creating, fetching, and managing notifications
3. React components for displaying notifications in the UI
4. Context for managing notification state across the application

## Components

### Database Schema

The notifications table has the following structure:

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  recipients UUID[]
);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(recipients));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = ANY(recipients));

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Utility Functions

Located in `src/utils/notifications.ts`:

1. `createNotification` - Creates a new notification in the database
2. `fetchNotifications` - Fetches notifications for a user
3. `markAsRead` - Marks a notification as read
4. `deleteNotification` - Deletes a notification
5. `useRealtimeNotifications` - Hook for real-time notification updates

### React Components

Located in `src/components/notifications/`:

1. `NotificationBell.tsx` - Bell icon showing unread notification count
2. `NotificationDropdown.tsx` - Dropdown list displaying notifications
3. `NotificationContainer.tsx` - Combines bell and dropdown with real-time updates

### Context

Located in `src/contexts/NotificationContext.tsx`:

Provides global notification state management and helper functions.

## Integration

### Adding Notifications to New Features

To add notifications to a new feature:

1. Import the `createNotification` function
2. Call it after successful creation/update of an entity

Example:

```typescript
import { createNotification } from '../utils/notifications';

// After creating a new contact
const { data, error } = await supabase
  .from('contacts')
  .insert([contactData]);

if (!error && data) {
  await createNotification(
    userId,
    'contacts',
    'created',
    data[0].id,
    `New contact ${data[0].name} created`,
    [userId]
  );
}
```

### Using Notification Components

To display notifications in the UI:

1. Wrap your app with `NotificationProvider`
2. Use `NotificationContainer` in your layout

Example in `App.tsx`:

```typescript
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/notifications/NotificationContainer';

function App() {
  return (
    <NotificationProvider userId={user?.id || ''}>
      <Layout>
        <NotificationContainer />
        {/* Other components */}
      </Layout>
    </NotificationProvider>
  );
}
```

## Testing

### Automated Testing

1. Run the development server: `npm run dev`
2. Navigate to `http://localhost:5174/#/notification-verification`
3. Use the test interface to create and fetch notifications

### Manual Testing

1. Open `public/notification-test.html` in a browser
2. Use the form to create and fetch notifications
3. Check the browser console for detailed output

### Console Testing

1. Open `public/notification-console-test.js` in a browser
2. Use the provided functions in the browser console:
   - `createTestNotification(userId, message)`
   - `fetchTestNotifications(userId)`
   - `runAllNotificationTests(userId)`

## Troubleshooting

### Common Issues

1. **Notifications not appearing in real-time**
   - Check that the Supabase real-time subscription is working
   - Verify that the user ID is correctly passed to the NotificationProvider

2. **Permission errors**
   - Ensure RLS policies are correctly set on the notifications table
   - Verify that the user has the correct permissions

3. **Notifications not being created**
   - Check that the createNotification function is being called with correct parameters
   - Verify that the user is authenticated

### Debugging Steps

1. Check the browser console for errors
2. Verify that the notifications table exists in the database
3. Check that the RLS policies are correctly configured
4. Ensure that the Supabase client is correctly configured

## Future Enhancements

1. Add support for notification categories
2. Implement notification preferences
3. Add push notification support
4. Create a notification center with filtering and search
