import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';
import { 
  Settings, 
  Save, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface MaintenanceConfigProps {
  user: User | null;
  onViewChange?: (view: string) => void;
}

interface ConfigSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

const MaintenanceConfig: React.FC<MaintenanceConfigProps> = ({ user, onViewChange }) => {
  const [settings, setSettings] = useState<ConfigSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    auto_generate_work_orders: 'true',
    work_order_prefix: 'PM:',
    include_overdue_in_title: 'true'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_config')
        .select('*')
        .order('settingKey');

      if (error) throw error;

      setSettings(data || []);
      
      // Update form data with current settings
      const settingsMap = (data || []).reduce((acc, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {} as any);
      
      setFormData(prev => ({ ...prev, ...settingsMap }));

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Update each setting
      for (const [key, value] of Object.entries(formData)) {
        const { error } = await supabase
          .from('maintenance_config')
          .upsert({
            settingKey: key,
            settingValue: value,
            updatedAt: new Date().toISOString()
          }, {
            onConflict: 'settingKey'
          });

        if (error) throw error;
      }

      setSuccess('Settings saved successfully!');
      await fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const testAutomation = async () => {
    setError('');
    setSuccess('');
    
    try {
      const { data, error } = await supabase.rpc('run_maintenance_automation', { days_ahead: 1 });
      
      if (error) throw error;
      
      setSuccess(`Test completed! Created ${data.tasks_created} tasks, marked ${data.tasks_marked_overdue} as overdue.`);
      
    } catch (err: any) {
      setError('Test failed: ' + err.message);
      console.error('Error testing automation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => onViewChange?.('preventive-maintenance')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Automation Settings</h1>
          <p className="text-gray-600 mt-1">Configure automatic work order generation and scheduling</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Automation Configuration</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Auto Generate Work Orders */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.auto_generate_work_orders === 'true'}
                onChange={(e) => setFormData({
                  ...formData,
                  auto_generate_work_orders: e.target.checked ? 'true' : 'false'
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Auto-generate work orders from maintenance tasks
                </span>
                <p className="text-xs text-gray-500">
                  Automatically create work orders when maintenance tasks are scheduled
                </p>
              </div>
            </label>
          </div>

          {/* Work Order Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Order Title Prefix
            </label>
            <input
              type="text"
              value={formData.work_order_prefix}
              onChange={(e) => setFormData({ ...formData, work_order_prefix: e.target.value })}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PM:"
            />
            <p className="text-xs text-gray-500 mt-1">
              Prefix added to auto-generated work order titles (e.g., "PM: Filter Replacement")
            </p>
          </div>

          {/* Include Overdue in Title */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.include_overdue_in_title === 'true'}
                onChange={(e) => setFormData({
                  ...formData,
                  include_overdue_in_title: e.target.checked ? 'true' : 'false'
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Mark overdue tasks in work order titles
                </span>
                <p className="text-xs text-gray-500">
                  Add "OVERDUE:" prefix to work order titles for overdue maintenance tasks
                </p>
              </div>
            </label>
          </div>

          {/* Current Settings Display */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Current Settings</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex justify-between">
                    <span className="text-gray-600">{setting.setting_key}:</span>
                    <span className="font-mono text-gray-900">{setting.setting_value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {settings.length > 0 ? new Date(settings[0].updated_at).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={testAutomation}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Automation
            </button>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">How Automation Works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>1. Automatic Task Generation:</strong> The system checks active PM schedules and creates maintenance tasks when they become due.
          </p>
          <p>
            <strong>2. Work Order Creation:</strong> When maintenance tasks are created, corresponding work orders are automatically generated if enabled.
          </p>
          <p>
            <strong>3. Overdue Management:</strong> Tasks that pass their due date are automatically marked as overdue and their work orders are updated with higher priority.
          </p>
          <p>
            <strong>4. Synchronization:</strong> When work orders are completed, the corresponding maintenance tasks are automatically marked as completed.
          </p>
          <p className="mt-4 text-xs text-blue-600">
            <strong>Note:</strong> You can run the automation manually using the "Run Automation" button on the schedules page, or set up a cron job to run it automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceConfig;