import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { MaintenanceSchedule, MaintenanceAsset, MaintenanceType } from '../types';
import { User } from '@supabase/supabase-js';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  Repeat,
  ArrowLeft,
  X,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface MaintenanceSchedulesProps {
  user: User | null;
  onViewChange?: (view: string) => void;
}

const MaintenanceSchedules: React.FC<MaintenanceSchedulesProps> = ({ user, onViewChange }) => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationResult, setAutomationResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    assetId: '',
    maintenanceTypeId: '',
    scheduleName: '',
    description: '',
    frequencyType: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom',
    frequencyValue: 1,
    startDate: '',
    endDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    estimatedDuration: 60,
    assignedTo: '',
    instructions: '',
    checklist: [] as Array<{ id: string; item: string; required: boolean }>,
    isActive: true,
    autoGenerateWorkOrders: true
  });

  useEffect(() => {
    fetchSchedules();
    fetchAssets();
    fetchMaintenanceTypes();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select(`
          *,
          asset:maintenance_assets(*),
          maintenanceType:maintenance_types(*)
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_assets')
        .select('*')
        .eq('status', 'active')
        .order('assetName');

      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
    }
  };

  const fetchMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (err: any) {
      console.error('Error fetching maintenance types:', err);
    }
  };

  const getFrequencyLabel = (type: string, value: number) => {
    switch (type) {
      case 'daily': return `Every ${value} day${value > 1 ? 's' : ''}`;
      case 'weekly': return `Every ${value} week${value > 1 ? 's' : ''}`;
      case 'monthly': return `Every ${value} month${value > 1 ? 's' : ''}`;
      case 'quarterly': return `Every ${value} quarter${value > 1 ? 's' : ''}`;
      case 'semi_annual': return `Every ${value * 6} months`;
      case 'annual': return `Every ${value} year${value > 1 ? 's' : ''}`;
      default: return 'Custom';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const runMaintenanceAutomation = async () => {
    setAutomationRunning(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('run_maintenance_automation', { days_ahead: 7 });
      
      if (error) throw error;
      
      setAutomationResult(data);
      
      // Refresh schedules to show updated next due dates
      await fetchSchedules();
      
    } catch (err: any) {
      setError('Failed to run maintenance automation: ' + err.message);
      console.error('Error running automation:', err);
    } finally {
      setAutomationRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate next due date based on frequency
      const startDate = new Date(formData.startDate);
      let nextDueDate = new Date(startDate);
      
      switch (formData.frequencyType) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + formData.frequencyValue);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + (formData.frequencyValue * 7));
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + formData.frequencyValue);
          break;
        case 'quarterly':
          nextDueDate.setMonth(nextDueDate.getMonth() + (formData.frequencyValue * 3));
          break;
        case 'semi_annual':
          nextDueDate.setMonth(nextDueDate.getMonth() + (formData.frequencyValue * 6));
          break;
        case 'annual':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + formData.frequencyValue);
          break;
      }

      const scheduleData = {
        "assetId": parseInt(formData.assetId),
        "maintenanceTypeId": parseInt(formData.maintenanceTypeId),
        "scheduleName": formData.scheduleName,
        description: formData.description,
        "frequencyType": formData.frequencyType,
        "frequencyValue": formData.frequencyValue,
        "startDate": formData.startDate,
        "endDate": formData.endDate || null,
        priority: formData.priority,
        "estimatedDuration": formData.estimatedDuration,
        "assignedTo": formData.assignedTo || null,
        instructions: formData.instructions || null,
        checklist: formData.checklist.length > 0 ? formData.checklist : null,
        "isActive": formData.isActive,
        "autoGenerateWorkOrders": formData.autoGenerateWorkOrders,
        "nextDueDate": nextDueDate.toISOString().split('T')[0],
        "createdBy": user?.id,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('maintenance_schedules')
        .insert([scheduleData])
        .select();

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        assetId: '',
        maintenanceTypeId: '',
        scheduleName: '',
        description: '',
        frequencyType: 'monthly',
        frequencyValue: 1,
        startDate: '',
        endDate: '',
        priority: 'medium',
        estimatedDuration: 60,
        assignedTo: '',
        instructions: '',
        checklist: [],
        isActive: true,
        autoGenerateWorkOrders: true
      });
      
      setShowModal(false);
      setModalType(null);
      
      // Refresh schedules list
      await fetchSchedules();
      
    } catch (err: any) {
      setError('Failed to create schedule: ' + err.message);
      console.error('Error creating schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => onViewChange?.('preventive-maintenance')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Schedules</h1>
            <p className="text-gray-600 mt-1">Create and manage recurring maintenance schedules</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={runMaintenanceAutomation}
            disabled={automationRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center"
          >
            {automationRunning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {automationRunning ? 'Running...' : 'Run Automation'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {automationResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Automation completed successfully!</span>
          </div>
          <div className="text-sm space-y-1">
            <p>• {automationResult.tasks_created} new maintenance tasks created</p>
            <p>• {automationResult.tasks_marked_overdue} tasks marked as overdue</p>
            <p>• {automationResult.tasks_synced_from_work_orders} tasks synced from completed work orders</p>
            <p className="text-xs text-green-600 mt-2">
              Last run: {new Date(automationResult.timestamp).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={() => setAutomationResult(null)}
            className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search schedules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-600">Create your first maintenance schedule to get started.</p>
          </div>
        ) : (
          schedules
            .filter(schedule => 
              search === '' || 
              schedule.scheduleName.toLowerCase().includes(search.toLowerCase()) ||
              schedule.asset?.assetName.toLowerCase().includes(search.toLowerCase())
            )
            .map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {schedule.scheduleName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {schedule.asset?.assetName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {schedule.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Repeat className="h-4 w-4 mr-2" />
                      {getFrequencyLabel(schedule.frequencyType, schedule.frequencyValue)}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Next due: {schedule.nextDueDate}
                    </div>

                    {schedule.estimatedDuration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {schedule.estimatedDuration} minutes
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(schedule.priority)}`}>
                        {schedule.priority}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Maintenance Schedule</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Schedule Name *</label>
                <input
                  type="text"
                  required
                  value={formData.scheduleName}
                  onChange={(e) => setFormData({ ...formData, scheduleName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Asset *</label>
                <select
                  required
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetName} - {asset.locationBuilding}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency Type</label>
                  <select
                    value={formData.frequencyType}
                    onChange={(e) => setFormData({ ...formData, frequencyType: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi_annual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Every</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.frequencyValue}
                    onChange={(e) => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 1 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoGenerateWorkOrders"
                  checked={formData.autoGenerateWorkOrders}
                  onChange={(e) => setFormData({ ...formData, autoGenerateWorkOrders: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoGenerateWorkOrders" className="text-sm font-medium text-gray-700">
                  Automatically generate work orders for maintenance tasks
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                When enabled, work orders will be automatically created when maintenance tasks are scheduled from this PM schedule.
              </p>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:bg-blue-400"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Schedule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceSchedules;