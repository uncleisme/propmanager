import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { StaffAttendance, Staff } from '../../types';
import { User } from '@supabase/supabase-js';
import { 
  Clock, Users, CheckCircle, XCircle, AlertCircle, X, 
  ChevronLeft, ChevronRight, Calendar, TrendingUp
} from 'lucide-react';

interface AttendanceTrackerProps {
  user: User | null;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ user }) => {
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Form state for attendance
  const [attendanceForm, setAttendanceForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day' | 'on_leave',
    notes: ''
  });

  const fetchAttendance = async () => {
    setLoading(true);
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const { data, error } = await supabase
      .from('staff_attendance')
      .select(`
        *,
        staff:staffId (
          name,
          employeeId,
          department
        )
      `)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setAttendance(data || []);
    }
    setLoading(false);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStaff(data || []);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedStaff) return;

    const totalHours = attendanceForm.checkIn && attendanceForm.checkOut ? 
      calculateHours(attendanceForm.checkIn, attendanceForm.checkOut) : undefined;

    const attendanceData = {
      staffId: selectedStaff.id,
      date: selectedDate,
      checkIn: attendanceForm.checkIn || null,
      checkOut: attendanceForm.checkOut || null,
      totalHours,
      status: attendanceForm.status,
      notes: attendanceForm.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check if attendance already exists for this staff and date
    const { data: existingAttendance } = await supabase
      .from('staff_attendance')
      .select('id')
      .eq('staffId', selectedStaff.id)
      .eq('date', selectedDate)
      .single();

    let error;
    if (existingAttendance) {
      // Update existing attendance
      const { error: updateError } = await supabase
        .from('staff_attendance')
        .update({
          ...attendanceData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingAttendance.id);
      error = updateError;
    } else {
      // Insert new attendance
      const { error: insertError } = await supabase
        .from('staff_attendance')
        .insert([attendanceData]);
      error = insertError;
    }

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowModal(false);
      setSelectedStaff(null);
      resetForm();
      fetchAttendance();
    }
  };

  const calculateHours = (checkIn: string, checkOut: string): number => {
    const checkInTime = new Date(`2000-01-01T${checkIn}`);
    const checkOutTime = new Date(`2000-01-01T${checkOut}`);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  };

  const resetForm = () => {
    setAttendanceForm({
      checkIn: '',
      checkOut: '',
      status: 'present',
      notes: ''
    });
  };

  const getAttendanceForDate = (date: string) => {
    return attendance.filter(att => att.date === date);
  };

  const getAttendanceStats = () => {
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const workingDays = Math.floor(totalDays * 0.7); // Assuming 5 working days per week
    
    const presentCount = attendance.filter(att => att.status === 'present').length;
    const absentCount = attendance.filter(att => att.status === 'absent').length;
    const lateCount = attendance.filter(att => att.status === 'late').length;
    const onLeaveCount = attendance.filter(att => att.status === 'on_leave').length;

    return {
      totalDays: workingDays,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      onLeave: onLeaveCount,
      attendanceRate: workingDays > 0 ? Math.round((presentCount / (workingDays * staff.length)) * 100) : 0
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half_day': return 'bg-blue-100 text-blue-800';
      case 'on_leave': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'half_day': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'on_leave': return <Calendar className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
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

  useEffect(() => {
    fetchAttendance();
    fetchStaff();
  }, [currentDate]);

  const stats = getAttendanceStats();
  const todayAttendance = getAttendanceForDate(selectedDate);

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
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracker</h2>
          <p className="text-gray-600">Track and manage staff attendance</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.present}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.absent}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.late}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Staff List for Selected Date */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">
              Staff Attendance for {new Date(selectedDate).toLocaleDateString()}
            </h4>
            <span className="text-sm text-gray-500">
              {todayAttendance.length} of {staff.length} marked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => {
              const memberAttendance = todayAttendance.find(att => att.staffId === member.id);
              
              return (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedStaff(member);
                    if (memberAttendance) {
                      setAttendanceForm({
                        checkIn: memberAttendance.checkIn || '',
                        checkOut: memberAttendance.checkOut || '',
                        status: memberAttendance.status,
                        notes: memberAttendance.notes || ''
                      });
                    } else {
                      resetForm();
                    }
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.employeeId}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {memberAttendance ? (
                        <>
                          {getStatusIcon(memberAttendance.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(memberAttendance.status)}`}>
                            {memberAttendance.status.replace('_', ' ')}
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not marked
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {memberAttendance && (memberAttendance.checkIn || memberAttendance.checkOut) && (
                    <div className="mt-3 text-sm text-gray-600">
                      {memberAttendance.checkIn && (
                        <div>Check In: {memberAttendance.checkIn}</div>
                      )}
                      {memberAttendance.checkOut && (
                        <div>Check Out: {memberAttendance.checkOut}</div>
                      )}
                      {memberAttendance.totalHours && (
                        <div>Total Hours: {memberAttendance.totalHours}h</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      {showModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Mark Attendance - {selectedStaff.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleMarkAttendance();
            }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                    <input
                      type="time"
                      value={attendanceForm.checkIn}
                      onChange={(e) => setAttendanceForm({...attendanceForm, checkIn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
                    <input
                      type="time"
                      value={attendanceForm.checkOut}
                      onChange={(e) => setAttendanceForm({...attendanceForm, checkOut: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={attendanceForm.notes}
                    onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes..."
                  />
                </div>

                {attendanceForm.checkIn && attendanceForm.checkOut && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      Total Hours: {calculateHours(attendanceForm.checkIn, attendanceForm.checkOut)}h
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
