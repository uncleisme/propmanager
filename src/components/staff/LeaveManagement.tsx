import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { LeaveRequest, Staff } from '../../types';
import { User } from '@supabase/supabase-js';
import { 
  Plus, Search, Eye, User as UserIcon, CheckCircle, XCircle, 
  AlertCircle, X, Calendar, Clock
} from 'lucide-react';

interface LeaveManagementProps {
  user: User | null;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'view' | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('');

  // Form state
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRequest>>({
    staffId: '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending'
  });

  const fetchLeaveRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        staff:staffId (
          name,
          employeeId,
          department,
          email
        )
      `)
      .order('createdAt', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    if (leaveTypeFilter) {
      query = query.eq('leaveType', leaveTypeFilter);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMsg(error.message);
    } else {
      let filteredData = data || [];
      
      if (search) {
        filteredData = filteredData.filter(leave => 
          (leave as any).staff?.name?.toLowerCase().includes(search.toLowerCase()) ||
          (leave as any).staff?.employeeId?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setLeaveRequests(filteredData);
    }
    setLoading(false);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, employeeId, department')
      .eq('status', 'active')
      .order('name');

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStaff(data || []);
    }
  };

  const handleAddLeaveRequest = async () => {
    if (!leaveForm.staffId || !leaveForm.startDate || !leaveForm.endDate) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    const startDate = new Date(leaveForm.startDate!);
    const endDate = new Date(leaveForm.endDate!);
    
    if (endDate < startDate) {
      setErrorMsg('End date cannot be before start date');
      return;
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;

    const { error } = await supabase
      .from('leave_requests')
      .insert([{
        ...leaveForm,
        totalDays,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowModal(false);
      resetForm();
      fetchLeaveRequests();
    }
  };

  const handleApproveLeave = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approvedBy: user?.id,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      fetchLeaveRequests();
    }
  };

  const handleRejectLeave = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      fetchLeaveRequests();
    }
  };

  const resetForm = () => {
    setLeaveForm({
      staffId: '',
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
      status: 'pending'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'paternity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchStaff();
  }, [statusFilter, leaveTypeFilter, search]);

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
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600">Manage staff leave requests and approvals</p>
        </div>
        <button
          onClick={() => {
            setModalType('add');
            setShowModal(true);
            resetForm();
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Leave Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by staff name or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={leaveTypeFilter}
          onChange={(e) => setLeaveTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Leave Types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="emergency">Emergency</option>
          <option value="maternity">Maternity</option>
          <option value="paternity">Paternity</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No leave requests found</td>
                </tr>
              ) : (
                leaveRequests.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {(leave as any).staff?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(leave as any).staff?.employeeId || 'N/A'} • {(leave as any).staff?.department || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{leave.totalDays} days</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(leave.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) handleRejectLeave(leave.id, reason);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setModalType('view');
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'add' ? 'Add Leave Request' : 'Leave Request Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalType === 'view' && selectedLeave ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staff Member</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {(selectedLeave as any).staff?.name || 'Unknown'} ({(selectedLeave as any).staff?.employeeId || 'N/A'})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLeave.leaveType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Days</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeave.totalDays} days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLeave.status}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeave.reason || 'No reason provided'}</p>
                  </div>
                  {selectedLeave.rejectionReason && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                      <p className="mt-1 text-sm text-red-600">{selectedLeave.rejectionReason}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Applied Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedLeave.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedLeave.approvedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approved Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedLeave.approvedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddLeaveRequest();
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member *</label>
                    <select
                      value={leaveForm.staffId || ''}
                      onChange={(e) => setLeaveForm({...leaveForm, staffId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select staff member</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.employeeId}) - {member.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                    <select
                      value={leaveForm.leaveType || 'annual'}
                      onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="emergency">Emergency Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="unpaid">Unpaid Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={leaveForm.startDate || ''}
                      onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={leaveForm.endDate || ''}
                      onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <textarea
                      value={leaveForm.reason || ''}
                      onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional reason for leave request..."
                    />
                  </div>
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
                    Add Leave Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
