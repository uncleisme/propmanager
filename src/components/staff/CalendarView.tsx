import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { LeaveRequest, Staff } from '../../types';
import { User } from '@supabase/supabase-js';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Users, AlertCircle, X
} from 'lucide-react';

interface CalendarViewProps {
  user: User | null;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');

  const fetchData = async () => {
    setLoading(true);
    
    // Get the date range for the current view
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    try {
      // Fetch leave requests for the current month
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          *,
          staff:staffId (
            name,
            employeeId,
            department
          )
        `)
        .eq('status', 'approved')
        .gte('startDate', startOfMonth.toISOString().split('T')[0])
        .lte('endDate', endOfMonth.toISOString().split('T')[0]);

      if (leaveError) {
        setErrorMsg(leaveError.message);
      } else {
        setLeaveRequests(leaveData || []);
      }

      // Fetch active staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('status', 'active');

      if (staffError) {
        setErrorMsg(staffError.message);
      } else {
        setStaff(staffData || []);
      }
    } catch (error) {
      setErrorMsg('Error fetching data');
    }
    
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getLeaveForDate = (date: string) => {
    return leaveRequests.filter(leave => 
      date >= leave.startDate && date <= leave.endDate
    );
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Header with day names
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
    );

    // Calendar grid
    const calendarDays = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="p-2 h-24 border border-gray-200 bg-gray-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(year, month, day);
      const dayLeaves = getLeaveForDate(dateString);
      const isCurrentDay = isToday(year, month, day);
      const isSelected = selectedDate === dateString;

      calendarDays.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateString)}
          className={`p-2 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="mt-1 space-y-1">
            {dayLeaves.slice(0, 2).map((leave, index) => (
              <div
                key={`${leave.id}-${index}`}
                className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800 truncate"
                title={`${(leave as any).staff?.name} - ${leave.leaveType}`}
              >
                {(leave as any).staff?.name?.split(' ')[0]} - {leave.leaveType}
              </div>
            ))}
            {dayLeaves.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayLeaves.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    days.push(
      <div key="calendar" className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>
    );

    return days;
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate) return null;

    const dayLeaves = getLeaveForDate(selectedDate);
    const selectedDateObj = new Date(selectedDate);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {selectedDateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        {dayLeaves.length === 0 ? (
          <p className="text-gray-500">No staff on leave this day</p>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Staff on Leave ({dayLeaves.length})</h4>
            {dayLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {(leave as any).staff?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(leave as any).staff?.employeeId} • {(leave as any).staff?.department}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {leave.leaveType}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Calendar</h2>
          <p className="text-gray-600">View staff leave schedule and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total Staff:</span>
            <span className="text-sm font-medium text-gray-900">{staff.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">On Leave Today:</span>
            <span className="text-sm font-medium text-gray-900">
              {getLeaveForDate(new Date().toISOString().split('T')[0]).length}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : (
          <div className="space-y-2">
            {renderCalendar()}
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && renderSelectedDateDetails()}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span className="text-sm text-gray-600">Staff on Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Selected Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-sm text-gray-600">Previous/Next Month</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {leaveRequests.length}
              </div>
              <div className="text-sm text-gray-600">Leave Requests This Month</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {staff.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Staff Members</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {getLeaveForDate(new Date().toISOString().split('T')[0]).length}
              </div>
              <div className="text-sm text-gray-600">Staff on Leave Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
