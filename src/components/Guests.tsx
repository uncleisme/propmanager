import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Eye, Edit, X, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { Guest } from '../types';
import { supabase } from '../utils/supabaseClient';

const Guests: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [newGuest, setNewGuest] = useState<Omit<Guest, 'id' | 'created_at' | 'updated_at'>>({
    visitor_name: '',
    visitor_phone: '',
    visitor_email: '',
    host_name: '',
    host_unit: '',
    host_phone: '',
    visit_date: '',
    visit_time_start: '',
    visit_time_end: '',
    purpose: '',
    vehicle_info: '',
    status: 'pending',
    approved_by: '',
    approved_at: '',
    notes: ''
  });

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const getStatusColor = (status: Guest['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Guest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'denied': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
    }
  };

  const handleAdd = () => {
    setModalType('add');
    setSelectedGuest(null);
    setNewGuest({
      visitor_name: '',
      visitor_phone: '',
      visitor_email: '',
      host_name: '',
      host_unit: '',
      host_phone: '',
      visit_date: '',
      visit_time_start: '',
      visit_time_end: '',
      purpose: '',
      vehicle_info: '',
      status: 'pending',
      approved_by: '',
      approved_at: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleView = (guest: Guest) => {
    setModalType('view');
    setSelectedGuest(guest);
    setShowModal(true);
  };

  const handleEdit = (guest: Guest) => {
    setModalType('edit');
    setSelectedGuest(guest);
    setNewGuest({
      visitor_name: guest.visitor_name,
      visitor_phone: guest.visitor_phone || '',
      visitor_email: guest.visitor_email || '',
      host_name: guest.host_name,
      host_unit: guest.host_unit,
      host_phone: guest.host_phone,
      visit_date: guest.visit_date,
      visit_time_start: guest.visit_time_start || '',
      visit_time_end: guest.visit_time_end || '',
      purpose: guest.purpose || '',
      vehicle_info: guest.vehicle_info || '',
      status: guest.status,
      approved_by: guest.approved_by || '',
      approved_at: guest.approved_at || '',
      notes: guest.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!newGuest.visitor_name.trim() || !newGuest.host_name.trim() || !newGuest.host_unit.trim()) {
        throw new Error('Please fill in all required fields');
      }

      const guestData = {
        ...newGuest,
        visitor_phone: newGuest.visitor_phone || null,
        visitor_email: newGuest.visitor_email || null,
        visit_time_start: newGuest.visit_time_start || null,
        visit_time_end: newGuest.visit_time_end || null,
        purpose: newGuest.purpose || null,
        vehicle_info: newGuest.vehicle_info || null,
        approved_by: newGuest.approved_by || null,
        approved_at: newGuest.status === 'approved' && !newGuest.approved_at 
          ? new Date().toISOString() 
          : newGuest.approved_at || null,
        notes: newGuest.notes || null
      };

      if (modalType === 'add') {
        const { error } = await supabase
          .from('guests')
          .insert([guestData]);

        if (error) throw error;
      } else if (modalType === 'edit' && selectedGuest) {
        const { error } = await supabase
          .from('guests')
          .update(guestData)
          .eq('id', selectedGuest.id);

        if (error) throw error;
      }

      await fetchGuests();
      setShowModal(false);
      setSelectedGuest(null);
    } catch (error) {
      console.error('Error saving guest:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save guest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (guest: Guest) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ 
          status: 'approved',
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', guest.id);

      if (error) throw error;
      await fetchGuests();
    } catch (error) {
      console.error('Error approving guest:', error);
    }
  };

  const handleDeny = async (guest: Guest) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ 
          status: 'denied',
          approved_by: 'Admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', guest.id);

      if (error) throw error;
      await fetchGuests();
    } catch (error) {
      console.error('Error denying guest:', error);
    }
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
      guest.host_name.toLowerCase().includes(search.toLowerCase()) ||
      guest.host_unit.toLowerCase().includes(search.toLowerCase()) ||
      (guest.visitor_phone && guest.visitor_phone.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingGuests = guests.filter(guest => guest.status === 'pending');
  const todayGuests = guests.filter(guest => 
    guest.visit_date === new Date().toISOString().split('T')[0] && 
    (guest.status === 'approved' || guest.status === 'completed')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading guests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
          <p className="text-gray-600">Manage visitor pre-approvals and access</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guest</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingGuests.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Visitors</p>
              <p className="text-2xl font-bold text-green-600">{todayGuests.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Guests</p>
              <p className="text-2xl font-bold text-blue-600">{guests.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {guests.filter(guest => guest.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
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
                placeholder="Search by visitor name, host, unit, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
              <option value="denied">Denied</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guests List */}
      <div className="space-y-4">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{guest.visitor_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(guest.status)}`}>
                    {getStatusIcon(guest.status)}
                    <span className="capitalize">{guest.status}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>Host:</strong> {guest.host_name} • Unit {guest.host_unit}</p>
                    <p><strong>Host Phone:</strong> {guest.host_phone}</p>
                    {guest.visitor_phone && (
                      <p><strong>Visitor Phone:</strong> {guest.visitor_phone}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>Visit Date:</strong> {new Date(guest.visit_date).toLocaleDateString()}</p>
                    {guest.visit_time_start && guest.visit_time_end && (
                      <p><strong>Time:</strong> {guest.visit_time_start} - {guest.visit_time_end}</p>
                    )}
                    {guest.purpose && (
                      <p><strong>Purpose:</strong> {guest.purpose}</p>
                    )}
                  </div>
                </div>
                {guest.vehicle_info && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Vehicle:</strong> {guest.vehicle_info}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {guest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(guest)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Approve"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeny(guest)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Deny"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleView(guest)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(guest)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit guest"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No guests found</p>
        </div>
      )}

      {/* Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'view' ? 'Guest Details' : modalType === 'add' ? 'Add Guest' : 'Edit Guest'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedGuest(null);
                    setSubmitError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === 'view' && selectedGuest && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedGuest.visitor_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedGuest.status)}`}>
                      {selectedGuest.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Visitor Name</p>
                      <p className="text-sm text-gray-900">{selectedGuest.visitor_name}</p>
                    </div>
                    {selectedGuest.visitor_phone && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Visitor Phone</p>
                        <p className="text-sm text-gray-900">{selectedGuest.visitor_phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Host</p>
                      <p className="text-sm text-gray-900">{selectedGuest.host_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Unit</p>
                      <p className="text-sm text-gray-900">{selectedGuest.host_unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Host Phone</p>
                      <p className="text-sm text-gray-900">{selectedGuest.host_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Visit Date</p>
                      <p className="text-sm text-gray-900">{new Date(selectedGuest.visit_date).toLocaleDateString()}</p>
                    </div>
                    {selectedGuest.visit_time_start && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Start Time</p>
                        <p className="text-sm text-gray-900">{selectedGuest.visit_time_start}</p>
                      </div>
                    )}
                    {selectedGuest.visit_time_end && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">End Time</p>
                        <p className="text-sm text-gray-900">{selectedGuest.visit_time_end}</p>
                      </div>
                    )}
                  </div>

                  {selectedGuest.purpose && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Purpose</p>
                      <p className="text-sm text-gray-600">{selectedGuest.purpose}</p>
                    </div>
                  )}

                  {selectedGuest.vehicle_info && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle Info</p>
                      <p className="text-sm text-gray-600">{selectedGuest.vehicle_info}</p>
                    </div>
                  )}

                  {selectedGuest.approved_by && selectedGuest.approved_at && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Approved By</p>
                      <p className="text-sm text-gray-900">{selectedGuest.approved_by}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedGuest.approved_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedGuest.notes && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-gray-600">{selectedGuest.notes}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name *</label>
                    <input
                      type="text"
                      required
                      value={newGuest.visitor_name}
                      onChange={(e) => setNewGuest({ ...newGuest, visitor_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Phone</label>
                      <input
                        type="tel"
                        value={newGuest.visitor_phone}
                        onChange={(e) => setNewGuest({ ...newGuest, visitor_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Email</label>
                      <input
                        type="email"
                        value={newGuest.visitor_email}
                        onChange={(e) => setNewGuest({ ...newGuest, visitor_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Host Name *</label>
                      <input
                        type="text"
                        required
                        value={newGuest.host_name}
                        onChange={(e) => setNewGuest({ ...newGuest, host_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Host Unit *</label>
                      <input
                        type="text"
                        required
                        value={newGuest.host_unit}
                        onChange={(e) => setNewGuest({ ...newGuest, host_unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newGuest.host_phone}
                      onChange={(e) => setNewGuest({ ...newGuest, host_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={newGuest.visit_date}
                      onChange={(e) => setNewGuest({ ...newGuest, visit_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={newGuest.visit_time_start}
                        onChange={(e) => setNewGuest({ ...newGuest, visit_time_start: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={newGuest.visit_time_end}
                        onChange={(e) => setNewGuest({ ...newGuest, visit_time_end: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
                    <input
                      type="text"
                      value={newGuest.purpose}
                      onChange={(e) => setNewGuest({ ...newGuest, purpose: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Social visit, Delivery, Maintenance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Information</label>
                    <input
                      type="text"
                      value={newGuest.vehicle_info}
                      onChange={(e) => setNewGuest({ ...newGuest, vehicle_info: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Red Toyota Camry - ABC123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newGuest.status}
                      onChange={(e) => setNewGuest({ ...newGuest, status: e.target.value as Guest['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="denied">Denied</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={newGuest.notes}
                      onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional notes or special instructions..."
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
                      {isSubmitting ? 'Saving...' : modalType === 'add' ? 'Add Guest' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedGuest(null);
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

export default Guests;