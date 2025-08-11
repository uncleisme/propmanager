import { supabase } from './supabaseClient';
import { createNotification } from './notifications';

export const createContact = async (userId: string, contactData: any) => {
  // Create the contact
  const { data, error } = await supabase
    .from('contacts')
    .insert([contactData])
    .select();

  if (error) {
    console.error('Error creating contact:', error);
    return { data: null, error };
  }

  // Create notification if successful
  if (data && data.length > 0) {
    console.log('🔔 Contact created successfully, creating notification...');
    const message = `${contactData.name || 'A user'} created a new contact.`;
    
    // In a real app, you would determine recipients dynamically
    // For now, we'll just use the current user as a recipient for testing
    const recipients = [userId];
    
    console.log('🔔 Creating notification with:', {
      userId,
      module: 'contact',
      action: 'created',
      entityId: data[0].id,
      message,
      recipients
    });
    
    try {
      const notificationResult = await createNotification(
        userId,
        'contact',
        'created',
        data[0].id,
        message,
        recipients
      );
      console.log('🔔 Notification creation result:', notificationResult);
    } catch (notificationError) {
      console.error('🔔 Error creating notification:', notificationError);
    }
  }

  return { data: data ? data[0] : null, error };
};
