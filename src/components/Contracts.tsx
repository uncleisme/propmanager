import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Plus, Mail, Phone, Building, X } from 'lucide-react';
import { Contract, Contact } from '../types';
import { getDaysUntilExpiration, getStatusColor, getStatusText } from '../utils/dateUtils';
import { supabase } from '../utils/supabaseClient';

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Contact | null>(null);
  const [newContract, setNewContract] = useState<Omit<Contract, 'id'>>({
    title: '',
    contactId: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'active',
    description: '',
    renewalNotice: 30
  });

  useEffect(() => {
    // Always fetch contracts from Supabase on mount
    const fetchContracts = async () => {
      const { data } = await supabase.from('contracts').select('*').order('createdAt', { ascending: false });
      setContracts(data || []);
    };
    fetchContracts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('contracts')
      .insert([
        newContract
      ])
      .select();
    if (!error && data) {
      setContracts(prev => [data[0], ...prev]);
      setShowAddForm(false);
      setNewContract({
        title: '',
        contactId: '',
        startDate: '',
        endDate: '',
        value: 0,
        status: 'active',
        description: '',
        renewalNotice: 30
      });
    }
    // Optionally handle error
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Unknown Contact';
  };

  const getContact = (contactId: string) => {
    return contacts.find(c => c.id === contactId);
  };

  const handleVendorClick = (contactId: string) => {
    const contact = getContact(contactId);
    if (contact) {
      setSelectedVendor(contact);
    }
  };

  const getTypeColor = (type: Contact['type']) => {
    const colors = {
      contractor: 'bg-blue-100 text-blue-800',
      supplier: 'bg-green-100 text-green-800',
      serviceprovider: 'bg-green-100 text-green-800',
      government: 'bg-yellow-100 text-yellow-800',
      resident: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    // Normalize type to match keys (remove spaces and lowercase)
    const normalizedType = type.replace(/\s+/g, '').toLowerCase();
    return colors[normalizedType as keyof typeof colors] || colors.other;
  };

  const getStatusBadge = (contract: Contract) => {
    const days = getDaysUntilExpiration(contract.endDate);
    const statusText = getStatusText(days);
    const colorClass = getStatusColor(days);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{statusText}</span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600">Monitor and manage service provider contracts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contract</span>
        </button>
      </div>
      {/* Contracts List */}
      <div className="space-y-4">
        {contracts.length > 0 ? contracts.map(contract => {
          const days = getDaysUntilExpiration(contract.endDate);
          const isExpiringSoon = days <= 30 && days >= 0;
          return (
            <div
              key={contract.id}
              className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 ${
                isExpiringSoon ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
                    <p className="text-sm text-gray-600">
                      with{' '}
                      <button
                        onClick={() => handleVendorClick(contract.contactId)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                      >
                        {getContactName(contract.contactId)}
                      </button>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isExpiringSoon && (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  {getStatusBadge(contract)}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">{contract.description}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Renewal notice: {contract.renewalNotice} days before expiration
                </div>
                <div className="text-sm">
                  {days >= 0 ? (
                    <span className="text-gray-600">
                      {days === 0 ? 'Expires today' : `${days} days remaining`}
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Expired {Math.abs(days)} days ago
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contracts found</p>
          </div>
        )}
      </div>
      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Vendor Details</h2>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedVendor.name}</h3>
                    <p className="text-sm text-gray-600">{selectedVendor.company}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedVendor.type)}`}>{selectedVendor.type}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <a href={`mailto:${selectedVendor.email}`} className="text-blue-600 hover:text-blue-800">
                        {selectedVendor.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <a href={`tel:${selectedVendor.phone}`} className="text-blue-600 hover:text-blue-800">
                        {selectedVendor.phone}
                      </a>
                    </div>
                  </div>
                  {selectedVendor.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                        <p className="text-gray-900">{selectedVendor.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                      <p className="text-gray-900">{selectedVendor.company}</p>
                    </div>
                  </div>
                </div>
                {selectedVendor.notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm text-gray-600">{selectedVendor.notes}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                  <p className="text-sm text-gray-900">{new Date(selectedVendor.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Contract Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Contract</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Title</label>
                  <input
                    type="text"
                    required
                    value={newContract.title}
                    onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Annual HVAC Maintenance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider</label>
                  <select
                    required
                    value={newContract.contactId}
                    onChange={(e) => setNewContract({ ...newContract, contactId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a contact</option>
                    {contacts.map((contact: Contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} - {contact.company}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newContract.startDate}
                      onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={newContract.endDate}
                      onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newContract.value}
                    onChange={(e) => setNewContract({ ...newContract, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newContract.status}
                    onChange={(e) => setNewContract({ ...newContract, status: e.target.value as Contract['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Notice (days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newContract.renewalNotice}
                    onChange={(e) => setNewContract({ ...newContract, renewalNotice: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the services covered by this contract..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
