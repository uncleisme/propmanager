import { supabase } from './supabaseClient';
import { createNotification } from './notifications';

interface AssetData {
  name: string;
  asset_type_id?: number;
  location?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const createAsset = async (userId: string, assetData: AssetData) => {
  const { data, error } = await supabase
    .from('assets')
    .insert([assetData])
    .select();

  // Create notification if successful
  if (data && data.length > 0) {
    console.log('🔔 Asset created successfully, creating notification...');
    const message = `New asset "${assetData.name}" has been added to the system.`;
    
    // Notify relevant users (asset managers, maintenance team)
    const recipients = [userId]; // In production, you'd determine recipients based on roles
    
    try {
      await createNotification(
        userId,
        'asset',
        'created',
        data[0].id,
        message,
        recipients
      );
      console.log('🔔 Asset notification created successfully');
    } catch (notificationError) {
      console.error('🔔 Error creating asset notification:', notificationError);
    }
  }

  return { data: data ? data[0] : null, error };
};

export const updateAssetStatus = async (userId: string, assetId: number, status: string, assetName: string) => {
  const { data, error } = await supabase
    .from('assets')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', assetId)
    .select();

  // Create notification for status changes
  if (data && data.length > 0) {
    const message = `Asset "${assetName}" status changed to ${status}.`;
    const recipients = [userId];
    
    try {
      await createNotification(
        userId,
        'asset',
        'status_changed',
        assetId,
        message,
        recipients
      );
    } catch (notificationError) {
      console.error('🔔 Error creating asset status notification:', notificationError);
    }
  }

  return { data: data ? data[0] : null, error };
};
