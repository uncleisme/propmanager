import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { MaintenanceTask, MaintenanceAsset, MaintenanceSchedule } from '../types';
import { User } from '@supabase/supabase-js';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Package, 
  BarChart3, 
  Plus,
  Eye,
  Wrench,
  Building,
  List,
  History
} from 'lucide-react';

interface PreventiveMaintenanceProps {
  user: User | null;
  onViewChange?: (view: string) => void;
}

interface DashboardStats {
  totalAssets: number;
  activeSchedules: number;
  overdueTasks: number;
  todayTasks: number;
  weekTasks: number;
  completedThisMonth: number;
}

const PreventiveMaintenance: React.FC<PreventiveMaintenanceProps> = ({ user, onViewChange }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    activeSchedules: 0,
    overdueTasks: 0,
    todayTasks: 0,
    weekTasks: 0,
    completedThisMonth: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState<MaintenanceTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      // Total assets
      const { count: assetsCount } = await supabase
        .from('maintenance_assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Active schedules
      const { count: schedulesCount } = await supabase
        .from('maintenance_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true);

      // Overdue tasks
      const { data: overdueData, count: overdueCount } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          asset:maintenance_assets(assetName, locationBuilding),
          schedule:maintenance_schedules(scheduleName)
        `, { count: 'exact' })
        .lt('scheduledDate', today)
        .in('status', ['scheduled', 'in_progress']);

      // Today's tasks
      const { count: todayCount } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('scheduledDate', today)
        .in('status', ['scheduled', 'in_progress']);

      // This week's tasks
      const { count: weekCount } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .gte('scheduledDate', today)
        .lte('scheduledDate', weekFromNow)
        .in('status', ['scheduled', 'in_progress']);

      // Completed this month
      const { count: completedCount } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .gte('scheduledDate', firstDayOfMonth)
        .eq('status', 'completed');

      // Upcoming tasks (next 7 days)
      const { data: upcomingData } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          asset:maintenance_assets(assetName, locationBuilding),
          schedule:maintenance_schedules(scheduleName)
        `)
        .gte('scheduledDate', today)
        .lte('scheduledDate', weekFromNow)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduledDate', { ascending: true })
        .limit(5);

      setStats({
        totalAssets: assetsCount || 0,
        activeSchedules: schedulesCount || 0,
        overdueTasks: overdueCount || 0,
        todayTasks: todayCount || 0,
        weekTasks: weekCount || 0,
        completedThisMonth: completedCount || 0
      });

      setUpcomingTasks(upcomingData || []);
      setOverdueTasks(overdueData || []);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'scheduled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Preventive Maintenance</h1>
          <p className="text-gray-600 mt-1">Manage assets, schedules, and maintenance tasks</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSchedules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weekTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => onViewChange?.('maintenance-assets')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center mb-3">
            <Package className="h-6 w-6 text-blue-500" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Assets</h3>
          </div>
          <p className="text-gray-600 text-sm">Manage maintenance assets and equipment</p>
        </button>

        <button
          onClick={() => onViewChange?.('maintenance-schedules')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center mb-3">
            <Calendar className="h-6 w-6 text-green-500" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Schedules</h3>
          </div>
          <p className="text-gray-600 text-sm">Create and manage maintenance schedules</p>
        </button>

        <button
          onClick={() => onViewChange?.('maintenance-tasks')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center mb-3">
            <List className="h-6 w-6 text-purple-500" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Tasks</h3>
          </div>
          <p className="text-gray-600 text-sm">View and manage maintenance tasks</p>
        </button>

        <button
          onClick={() => onViewChange?.('maintenance-history')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center mb-3">
            <History className="h-6 w-6 text-orange-500" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">History</h3>
          </div>
          <p className="text-gray-600 text-sm">View maintenance history and reports</p>
        </button>

        <button
          onClick={() => onViewChange?.('maintenance-config')}
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center mb-3">
            <Settings className="h-6 w-6 text-gray-500" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Automation</h3>
          </div>
          <p className="text-gray-600 text-sm">Configure work order auto-generation settings</p>
        </button>
      </div>

      {/* Tasks Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="ml-2 text-lg font-semibold text-gray-900">Overdue Tasks</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">
                        {task.asset?.assetName} • {task.asset?.locationBuilding}
                      </p>
                      <p className="text-sm text-red-600">Due: {task.scheduledDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {overdueTasks.length > 5 && (
                <button
                  onClick={() => onViewChange?.('maintenance-tasks')}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all {overdueTasks.length} overdue tasks →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500" />
              <h3 className="ml-2 text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
            </div>
          </div>
          <div className="p-6">
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">
                        {task.asset?.assetName} • {task.asset?.locationBuilding}
                      </p>
                      <p className="text-sm text-gray-500">Due: {task.scheduledDate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
            )}
            <button
              onClick={() => onViewChange?.('maintenance-tasks')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all tasks →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreventiveMaintenance;