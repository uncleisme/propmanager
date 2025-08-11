import { supabase } from './supabaseClient';

// Create a notification
export const createNotification = async (
  userId: string,
  module: string,
  action: string,
  entityId: string | null,
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
  ]).select();
};

// Fetch notifications for a user
export const fetchNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .contains('recipients', [userId])
    .order('created_at', { ascending: false });

  return { data, error };
};

// Mark a notification as read
export const markAsRead = async (notificationId: string) => {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  return await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
};

// Subscribe to real-time notifications
export const useRealtimeNotifications = (userId: string, onNewNotification: (notif: any) => void) => {
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
};
