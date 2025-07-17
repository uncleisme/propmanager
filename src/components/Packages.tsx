import React, { useState, useEffect } from 'react';
import { Package as PackageIcon, Plus, Search, Eye, Edit, X, Bell, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Package } from '../types';
import { supabase } from '../utils/supabaseClient';

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [newPackage, setNewPackage] = useState<Omit<Package, 'id' | 'created_at' | 'updated_at'>>({
    tracking_number: '',
    recipient_name: '',
    recipient_unit: '',
    recipient_phone: '',
    sender: '',
    package_type: 'standard',
    delivery_date: '',
    delivery_time: '',
    status: 'received',
    location: 'front_desk',
    notes: '',
    received_by: '',
    picked_up_at: ''
  });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const getPackageTypeIcon = (type: Package['package_type']) => {
    switch (type) {
      case 'fragile': return '📦💔';
      case 'perishable': return '🧊';
      case 'large': return '📦📏';
      case 'document': return '📄';
      default: return '📦';
    }
  };

  const getStatusColor = (status: Package['status']) => {
    const colors = {
      received: 'bg-blue-100 text-blue-800',
      notified: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-green-100 text-green-800',
      returned: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Package['status']) => {
    switch (status) {
      case 'received': return <Clock className="w-4 h-4" />;
      case 'notified': return <Bell className="w-4 h-4" />;
      case 'picked_up': return <CheckCircle className="w-4 h-4" />;
      case 'returned': return <AlertTriangle className="w-4 h-4" />;
      default: return <PackageIcon className="w-4 h-4" />;
    }
  };

  const handleAdd = () => {
    setModalType('add');
    setSelectedPackage(null);
    setNewPackage({
      tracking_number: '',
      recipient_name: '',
      recipient_unit: '',
      recipient_phone: '',
      sender: '',
      package_type: 'standard',
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_time: '',
      status: 'received',
      location: 'front_desk',
      notes: '',
      received_by: '',
      picked_up_at: ''
    });
    setShowModal(true);
  };

  const handleView = (pkg: Package) => {
    setModalType('view');
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const handleEdit = (pkg: Package) => {
    setModalType('edit');
    setSelectedPackage(pkg);
    setNewPackage({
      tracking_number: pkg.tracking_number,
      recipient_name: pkg.recipient_name,
      recipient_unit: pkg.recipient_unit,
      recipient_phone: pkg.recipient_phone || '',
      sender: pkg.sender,
      package_type: pkg.package_type,
      delivery_date: pkg.delivery_date,
      delivery_time: pkg.delivery_time || '',
      status: pkg.status,
      location: pkg.location,
      notes: pkg.notes || '',
      received_by: pkg.received_by || '',
      picked_up_at: pkg.picked_up_at || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!newPackage.tracking_number.trim() || !newPackage.recipient_name.trim() || !newPackage.sender.trim()) {
        throw new Error('Please fill in all required fields');
      }

      const packageData = {
        ...newPackage,
        recipient_phone: newPackage.recipient_phone || null,
        delivery_time: newPackage.delivery_time || null,
        notes: newPackage.notes || null,
        received_by: newPackage.received_by || null,
        picked_up_at: newPackage.status === 'picked_up' && !newPackage.picked_up_at 
          ? new Date().toISOString() 
          : newPackage.picked_up_at || null
      };

      if (modalType === 'add') {
        const { error } = await supabase
          .from('packages')
          .insert([packageData]);

        if (error) throw error;
      } else if (modalType === 'edit' && selectedPackage) {
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', selectedPackage.id);

        if (error) throw error;
      }

      await fetchPackages();
      setShowModal(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Error saving package:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyResident = async (pkg: Package) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'notified' })
        .eq('id', pkg.id);

      if (error) throw error;
      await fetchPackages();
    } catch (error) {
      console.error('Error notifying resident:', error);
    }
  };

  const handleMarkPickedUp = async (pkg: Package) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        })
        .eq('id', pkg.id);

      if (error) throw error;
      await fetchPackages();
    } catch (error) {
      console.error('Error marking as picked up:', error);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      pkg.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      pkg.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.recipient_unit.toLowerCase().includes(search.toLowerCase()) ||
      pkg.sender.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingPackages = packages.filter(pkg => pkg.status === 'received' || pkg.status === 'notified');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading packages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Package Delivery</h1>
          <p className="text-gray-600">Track and manage package deliveries</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Package</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Pickup</p>
              <p className="text-2xl font-bold text-orange-600">{pendingPackages.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Picked Up Today</p>
              <p className="text-2xl font-bold text-green-600">
                {packages.filter(pkg => 
                  pkg.status === 'picked_up' && 
                  pkg.picked_up_at && 
                  new Date(pkg.picked_up_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold text-blue-600">{packages.length}</p>
            </div>
            <PackageIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Returned</p>
              <p className="text-2xl font-bold text-red-600">
                {packages.filter(pkg => pkg.status === 'returned').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
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
                placeholder="Search by tracking number, recipient, unit, or sender..."
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
              <option value="received">Received</option>
              <option value="notified">Notified</option>
              <option value="picked_up">Picked Up</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packages List */}
      <div className="space-y-4">
        {filteredPackages.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{getPackageTypeIcon(pkg.package_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">#{pkg.tracking_number}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(pkg.status)}`}>
                      {getStatusIcon(pkg.status)}
                      <span className="capitalize">{pkg.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>To:</strong> {pkg.recipient_name} • Unit {pkg.recipient_unit}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>From:</strong> {pkg.sender}
                  </p>
                  <p className="text-sm text-gray-500">
                    Delivered: {new Date(pkg.delivery_date).toLocaleDateString()}
                    {pkg.delivery_time && ` at ${pkg.delivery_time}`}
                  </p>
                  {pkg.location && (
                    <p className="text-sm text-gray-500">
                      <strong>Location:</strong> {pkg.location.replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {pkg.status === 'received' && (
                  <button
                    onClick={() => handleNotifyResident(pkg)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Notify resident"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                )}
                {(pkg.status === 'received' || pkg.status === 'notified') && (
                  <button
                    onClick={() => handleMarkPickedUp(pkg)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    title="Mark as picked up"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleView(pkg)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(pkg)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit package"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No packages found</p>
        </div>
      )}

      {/* Package Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'view' ? 'Package Details' : modalType === 'add' ? 'Add Package' : 'Edit Package'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPackage(null);
                    setSubmitError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === 'view' && selectedPackage && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">{getPackageTypeIcon(selectedPackage.package_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">#{selectedPackage.tracking_number}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPackage.status)}`}>
                        {selectedPackage.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Recipient</p>
                      <p className="text-sm text-gray-900">{selectedPackage.recipient_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Unit</p>
                      <p className="text-sm text-gray-900">{selectedPackage.recipient_unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Sender</p>
                      <p className="text-sm text-gray-900">{selectedPackage.sender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                      <p className="text-sm text-gray-900 capitalize">{selectedPackage.package_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery Date</p>
                      <p className="text-sm text-gray-900">{new Date(selectedPackage.delivery_date).toLocaleDateString()}</p>
                    </div>
                    {selectedPackage.delivery_time && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery Time</p>
                        <p className="text-sm text-gray-900">{selectedPackage.delivery_time}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-sm text-gray-900">{selectedPackage.location.replace('_', ' ')}</p>
                    </div>
                    {selectedPackage.received_by && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Received By</p>
                        <p className="text-sm text-gray-900">{selectedPackage.received_by}</p>
                      </div>
                    )}
                  </div>

                  {selectedPackage.picked_up_at && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Picked Up</p>
                      <p className="text-sm text-gray-900">{new Date(selectedPackage.picked_up_at).toLocaleString()}</p>
                    </div>
                  )}

                  {selectedPackage.notes && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-gray-600">{selectedPackage.notes}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number *</label>
                    <input
                      type="text"
                      required
                      value={newPackage.tracking_number}
                      onChange={(e) => setNewPackage({ ...newPackage, tracking_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={newPackage.recipient_name}
                        onChange={(e) => setNewPackage({ ...newPackage, recipient_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                      <input
                        type="text"
                        required
                        value={newPackage.recipient_unit}
                        onChange={(e) => setNewPackage({ ...newPackage, recipient_unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Phone</label>
                    <input
                      type="tel"
                      value={newPackage.recipient_phone}
                      onChange={(e) => setNewPackage({ ...newPackage, recipient_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender *</label>
                    <input
                      type="text"
                      required
                      value={newPackage.sender}
                      onChange={(e) => setNewPackage({ ...newPackage, sender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                      <select
                        value={newPackage.package_type}
                        onChange={(e) => setNewPackage({ ...newPackage, package_type: e.target.value as Package['package_type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="standard">Standard</option>
                        <option value="fragile">Fragile</option>
                        <option value="perishable">Perishable</option>
                        <option value="large">Large</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={newPackage.status}
                        onChange={(e) => setNewPackage({ ...newPackage, status: e.target.value as Package['status'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="received">Received</option>
                        <option value="notified">Notified</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                      <input
                        type="date"
                        required
                        value={newPackage.delivery_date}
                        onChange={(e) => setNewPackage({ ...newPackage, delivery_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                      <input
                        type="time"
                        value={newPackage.delivery_time}
                        onChange={(e) => setNewPackage({ ...newPackage, delivery_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={newPackage.location}
                        onChange={(e) => setNewPackage({ ...newPackage, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., front_desk, mailroom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                      <input
                        type="text"
                        value={newPackage.received_by}
                        onChange={(e) => setNewPackage({ ...newPackage, received_by: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={newPackage.notes}
                      onChange={(e) => setNewPackage({ ...newPackage, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special handling instructions..."
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
                      {isSubmitting ? 'Saving...' : modalType === 'add' ? 'Add Package' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedPackage(null);
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

export default Packages;