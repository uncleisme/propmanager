# 📣 Notification Feature for CMMS using React, TypeScript & Supabase

This guide outlines how to implement a **notification system** for a CMMS application with modules like Contacts, Contracts, Licenses, Building Info, Work Orders, etc.

---

## 🔄 Notification Flow Overview

1. **Trigger Action**: A user creates or updates an entity.
2. **Save Notification**: A new row is inserted into the `notifications` table in Supabase.
3. **Real-Time Delivery** *(optional)*: Subscribe to Supabase real-time channels.
4. **Frontend Display**: Notification bell displays the new entries.
5. **Mark as Read** *(optional)*: Users can mark notifications as read.

---

## 🧱 1. Supabase Schema: `notifications`

### Table Name: `notifications`

| Field       | Type        | Description                            |
|------------|-------------|----------------------------------------|
| id         | uuid (PK)   | Unique ID                              |
| user_id    | uuid        | User who triggered the action          |
| module     | text        | e.g. "contact", "contract", etc.       |
| action     | text        | "created", "updated", etc.             |
| entity_id  | uuid        | The ID of the created/updated entity   |
| message    | text        | Notification message                   |
| created_at | timestamp   | Timestamp of creation                  |
| is_read    | boolean     | Track if notification is read (default: false) |
| recipients | uuid[]      | List of user IDs to notify             |

### Example SQL

```sql
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  module text not null,
  action text not null,
  entity_id uuid,
  message text,
  created_at timestamp with time zone default now(),
  is_read boolean default false,
  recipients uuid[] not null
);
```

---

## ✍️ 2. Creating a Notification (Server/Client-Side Logic)

Use this logic after a successful creation of any entity.

### Example (createContact.ts)

```ts
import { supabase } from '../utils/supabaseClient';

export const createContact = async (userId: string, contactData: any) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([contactData])
    .select();

  if (data) {
    const message = \`\${contactData.created_by_name} created a new contact.\`;

    await supabase.from('notifications').insert([
      {
        user_id: userId,
        module: 'contact',
        action: 'created',
        entity_id: data[0].id,
        message,
        recipients: ['recipient-user-id-1', 'recipient-user-id-2'] // Set dynamically
      }
    ]);
  }

  return { data, error };
};
```

### 🔁 Reusable `createNotification` Utility (Optional)

```ts
export const createNotification = async (
  userId: string,
  module: string,
  action: string,
  entityId: string,
  message: string,
  recipients: string[]
) => {
  return await supabase.from('notifications').insert([
    {
      user_id: userId,
      module,
      action,
      entity_id: entityId,
      message,
      recipients,
    },
  ]);
};
```

---

## 🛎️ 3. Display Notifications in React

### Fetch Notifications

```ts
const fetchNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .contains('recipients', [userId])
    .order('created_at', { ascending: false });

  return { data, error };
};
```

### Notification Bell Component

```tsx
import { useEffect, useState } from 'react';

const NotificationIcon = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await fetchNotifications(userId);
      setNotifications(data ?? []);
    };
    load();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <i className="icon-bell" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
          {unreadCount}
        </span>
      )}
      <div className="dropdown">
        {notifications.map(n => (
          <div key={n.id}>{n.message}</div>
        ))}
      </div>
    </div>
  );
};
```

---

## ✅ 4. Mark Notifications as Read (Optional)

### Mark as Read Function

```ts
const markAsRead = async (notificationId: string) => {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
};
```

---

## 🚀 5. Real-Time Notifications (Optional but Recommended)

Supabase supports real-time subscriptions via Channels.

### Example Real-Time Subscription

```ts
import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const useRealtimeNotifications = (userId: string, onNewNotification: (notif: any) => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          if (payload.new.recipients.includes(userId)) {
            onNewNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
```

---

## 🧩 Summary

| Step | What to Build |
|------|-------------------------------|
| ✅ 1 | `notifications` table in Supabase |
| ✅ 2 | Logic to insert notifications after entity creation |
| ✅ 3 | Notification icon in React |
| ✅ 4 | Optional: mark notifications as read |
| ✅ 5 | Optional: real-time updates using Supabase channels |

---

## 📝 To-Do (Customize for Your App)

- [ ] Define recipient rules: who should receive what notifications?
- [ ] Add links to notifications so users can click to view the created entity.
- [ ] Add filtering or grouping by module.
- [ ] Add user settings for notification preferences (future improvement).
