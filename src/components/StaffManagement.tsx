import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Users, CalendarDays, Calendar, Clock } from 'lucide-react';
import StaffDirectory from './staff/StaffDirectory';
import LeaveManagement from './staff/LeaveManagement';
import CalendarView from './staff/CalendarView';
import AttendanceTracker from './staff/AttendanceTracker';

interface StaffManagementProps {
  user: User | null;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'leave' | 'calendar' | 'attendance'>('directory');

  const tabs = [
    { id: 'directory', label: 'Staff Directory', icon: Users, component: StaffDirectory },
    { id: 'leave', label: 'Leave Management', icon: CalendarDays, component: LeaveManagement },
    { id: 'calendar', label: 'Calendar View', icon: Calendar, component: CalendarView },
    { id: 'attendance', label: 'Attendance', icon: Clock, component: AttendanceTracker }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || StaffDirectory;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Active Tab Content */}
      <ActiveComponent user={user} />
    </div>
  );
};

export default StaffManagement;
