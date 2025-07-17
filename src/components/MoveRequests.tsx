import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Eye, Edit, X, CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { MoveRequest } from '../types';
import { supabase } from '../utils/supabaseClient';

const MoveRequests: React.FC = () => {
  const [moveRequests, setMoveRequests] = useState<MoveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MoveRequest | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [newRequest, setNewRequest] = useState<Omit<MoveRequest, 'id' | 'created_at' | 'updated_at'>>({
    request_type: 'move_in',
    resident_name: '',
    unit_number: '',
    contact_phone: '',
    contact_email: '',
    requested_date: '',
    preferred_time: '',
    elevator_needed: false,
    moving_company: '',
    estimated_duration: '',
    special_requirements: '',
    status: 'pending',
    approved_by: '',
    approved_at: '',
    scheduled_time: '',
    notes: ''
  });

  const fetchMoveRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('move_requests')
        .select('*')
        .order('requested_date', { ascending: false });

      if (error) throw error;
      setMoveRequests(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoveRequests();
  }, []);

  const getStatusColor = (status: MoveRequest['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: MoveRequest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Truck className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: MoveRequest['request_type']) => {
    return type === 'move_in' ? '📦➡️' : '📦⬅️';
  };

  const handleAdd = () => {
    setModalType('add');
    setSelectedRequest(null);
    setNewRequest({
      request_type: 'move_in',
      resident_name: '',
      unit_number: '',
      contact_phone: '',
      contact_email: '',
      requested_date: '',
      preferred_time: '',
      elevator_needed: false,
      moving_company: '',
      estimated_duration: '',
      special_requirements: '',
      status: 'pending',
      approved_by: '',
      approved_at: '',
      scheduled_time: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleView = (request: MoveRequest) => {
    setModalType('view');
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleEdit = (request: MoveRequest) => {
    setModalType('edit');
    setSelectedRequest(request);
    setNewRequest({
      request_type: request.request_type,
      resident_name: request.resident_name,
      unit_number: request.unit_number,
      contact_phone: request.contact_phone,
      contact_email: request.contact_email,
      requested_date: request.requested_date,
      preferred_time: request.preferred_time || '',
      elevator_needed: request.elevator_needed,
      moving_company: request.moving_company || '',
      estimated_duration: request.estimated_duration || '',
      special_requirements: request.special_requirements || '',
      status: request.status,
      approved_by: request.approved_by || '',
      approved_at: request.approved_at || '',
      scheduled_time: request.scheduled_time || '',
      notes: request.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!newRequest.resident_name.trim() || !newRequest.unit_number.trim() || !newRequest.contact_phone.trim()) {
        throw new Error('Please fill in all required fields');
      }

      const requestData = {
        ...newRequest,
        preferred_time: newRequest.preferred_time || null,
        moving_company: newRequest.moving_company || null,
        estimated_duration: newRequest.estimated_duration || null,
        special_requirements: newRequest.special_requirements || null,
        approved_by: newRequest.approved_by || null,
        approved_at: newRequest.status === 'approved' && !newRequest.approved_at 
          ? new Date().toISOString() 
          : newRequest.approved_at || null,
        scheduled_time: newRequest.scheduled_time || null,
        notes: newRequest.notes || null
      };

      if (modalType === 'add') {
        const { error } = await supabase
          .from('move_requests')
          .insert([requestData]);

        if (error) throw error;
      } else if (modalType === 'edit' && selectedRequest) {
        const { error } = await supabase
          .from('move_requests')
          .update(requestData)
          .eq('id', selectedRequest.id);

        if (error) throw error;
      }

      await fetchMoveRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error saving move request:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save move request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (request: MoveRequest) => {
    try {
      const { error } = await supabase
        .from('move_requests')
        .update({ 
          status: 'approved',
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
      await fetchMoveRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleSchedule = async (request: MoveRequest) => {
    try {
      const { error } = await supabase
        .from('move_requests')
        .update({ 
          status: 'scheduled',
          scheduled_time: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
      await fetchMoveRequests();
    } catch (error) {
      console.error('Error scheduling request:', error);
    }
  };

  const filteredRequests = moveRequests.filter(request => {
    const matchesSearch = 
      request.resident_name.toLowerCase().includes(search.toLowerCase()) ||
      request.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      request.contact_phone.toLowerCase().includes(search.toLowerCase()) ||
      (request.moving_company && request.moving_company.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.request_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingRequests = moveRequests.filter(request => request.status === 'pending');
  const todayRequests = moveRequests.filter(request => 
    request.requested_date === new Date().toISOString().split('T')[0] && 
    (request.status === 'scheduled' || request.status === 'approved')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading move requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Move Requests</h1>
          <p className="text-gray-600">Manage move-in and move-out requests</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Request</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Moves</p>
              <p className="text-2xl font-bold text-blue-600">{todayRequests.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Move-ins</p>
              <p className="text-2xl font-bold text-green-600">
                {moveRequests.filter(request => request.request_type === 'move_in').length}
              </p>
            </div>
            <span className="text-2xl">📦➡️</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Move-outs</p>
              <p className="text-2xl font-bold text-red-600">
                {moveRequests.filter(request => request.request_type === 'move_out').length}
              </p>
            </div>
            <span className="text-2xl">📦⬅️</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by resident name, unit, phone, or moving company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="move_in">Move-in</option>
              <option value="move_out">Move-out</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Move Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{getTypeIcon(request.request_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {request.request_type.replace('_', '-')} Request
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Resident:</strong> {request.resident_name}</p>
                      <p><strong>Unit:</strong> {request.unit_number}</p>
                      <p><strong>Phone:</strong> {request.contact_phone}</p>
                    </div>
                    <div>
                      <p><strong>Requested Date:</strong> {new Date(request.requested_date).toLocaleDateString()}</p>
                      {request.preferred_time && (
                        <p><strong>Preferred Time:</strong> {request.preferred_time}</p>
                      )}
                      {request.elevator_needed && (
                        <p><strong>Elevator:</strong> Required</p>
                      )}
                    </div>
                  </div>
                  {request.moving_company && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Moving Company:</strong> {request.moving_company}
                    </p>
                  )}
                  {request.estimated_duration && (
                    <p className="text-sm text-gray-600">
                      <strong>Estimated Duration:</strong> {request.estimated_duration}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {request.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(request)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {request.status === 'approved' && (
                  <button
                    onClick={() => handleSchedule(request)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Schedule"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleView(request)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(request)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit request"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No move requests found</p>
        </div>
      )}

      {/* Move Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'view' ? 'Move Request Details' : modalType === 'add' ? 'Add Move Request' : 'Edit Move Request'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setSubmitError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === 'view' && selectedRequest && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">{getTypeIcon(selectedRequest.request_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {selectedRequest.request_type.replace('_', '-')} Request
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Resident</p>
                      <p className="text-sm text-gray-900">{selectedRequest.resident_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Unit</p>
                      <p className="text-sm text-gray-900">{selectedRequest.unit_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm text-gray-900">{selectedRequest.contact_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm text-gray-900">{selectedRequest.contact_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Requested Date</p>
                      <p className="text-sm text-gray-900">{new Date(selectedRequest.requested_date).toLocaleDateString()}</p>
                    </div>
                    {selectedRequest.preferred_time && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Preferred Time</p>
                        <p className="text-sm text-gray-900">{selectedRequest.preferred_time}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Elevator Needed</p>
                      <p className="text-sm text-gray-900">{selectedRequest.elevator_needed ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedRequest.moving_company && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Moving Company</p>
                        <p className="text-sm text-gray-900">{selectedRequest.moving_company}</p>
                      </div>
                    )}
                  </div>

                  {selectedRequest.estimated_duration && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Duration</p>
                      <p className="text-sm text-gray-600">{selectedRequest.estimated_duration}</p>
                    </div>
                  )}

                  {selectedRequest.special_requirements && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Special Requirements</p>
                      <p className="text-sm text-gray-600">{selectedRequest.special_requirements}</p>
                    </div>
                  )}

                  {selectedRequest.approved_by && selectedRequest.approved_at && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Approved By</p>
                      <p className="text-sm text-gray-900">{selectedRequest.approved_by}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedRequest.approved_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedRequest.scheduled_time && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Scheduled Time</p>
                      <p className="text-sm text-gray-900">{new Date(selectedRequest.scheduled_time).toLocaleString()}</p>
                    </div>
                  )}

                  {selectedRequest.notes && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-gray-600">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {(modalType === 'add' || modalType === 'edit') && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Request Type *</label>
                    <select
                      required
                      value={newRequest.request_type}
                      onChange={(e) => setNewRequest({ ...newRequest, request_type: e.target.value as MoveRequest['request_type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="move_in">Move-in</option>
                      <option value="move_out">Move-out</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name *</label>
                      <input
                        type="text"
                        required
                        value={newRequest.resident_name}
                        onChange={(e) => setNewRequest({ ...newRequest, resident_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                      <input
                        type="text"
                        required
                        value={newRequest.unit_number}
                        onChange={(e) => setNewRequest({ ...newRequest, unit_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={newRequest.contact_phone}
                        onChange={(e) => setNewRequest({ ...newRequest, contact_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                      <input
                        type="email"
                        required
                        value={newRequest.contact_email}
                        onChange={(e) => setNewRequest({ ...newRequest, contact_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={newRequest.requested_date}
                        onChange={(e) => setNewRequest({ ...newRequest, requested_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                      <input
                        type="text"
                        value={newRequest.preferred_time}
                        onChange={(e) => setNewRequest({ ...newRequest, preferred_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Morning, 9 AM - 12 PM"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="elevator_needed"
                      checked={newRequest.elevator_needed}
                      onChange={(e) => setNewRequest({ ...newRequest, elevator_needed: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="elevator_needed" className="text-sm font-medium text-gray-700">
                      Elevator needed
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moving Company</label>
                    <input
                      type="text"
                      value={newRequest.moving_company}
                      onChange={(e) => setNewRequest({ ...newRequest, moving_company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
                    <input
                      type="text"
                      value={newRequest.estimated_duration}
                      onChange={(e) => setNewRequest({ ...newRequest, estimated_duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 4-6 hours, Half day"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                    <textarea
                      rows={3}
                      value={newRequest.special_requirements}
                      onChange={(e) => setNewRequest({ ...newRequest, special_requirements: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special requirements or instructions..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newRequest.status}
                      onChange={(e) => setNewRequest({ ...newRequest, status: e.target.value as MoveRequest['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={newRequest.notes}
                      onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Saving...' : modalType === 'add' ? 'Add Request' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedRequest(null);
                        setSubmitError(null);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoveRequests;