import React, { useState, useEffect } from 'react';
import { Award, Calendar, Building, AlertCircle, Plus } from 'lucide-react';
import { License } from '../types';
import { formatDate, getDaysUntilExpiration, getStatusColor, getStatusText } from '../utils/dateUtils';
import { supabase } from '../utils/supabaseClient';



const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLicense, setNewLicense] = useState<Omit<License, 'id'>>({
    name: '',
    type: '',
    issuer: '',
    issueDate: '',
    expirationDate: '',
    licenseNumber: '',
    status: 'active',
    contactId: ''
  });

  useEffect(() => {
    const fetchLicenses = async () => {
      const { data } = await supabase.from('licenses').select('*').order('createdAt', { ascending: false });
      setLicenses(data || []);
    };
    fetchLicenses();
  }, []);

  const getStatusBadge = (license: License) => {
    const days = getDaysUntilExpiration(license.expirationDate);
    const statusText = getStatusText(days);
    const colorClass = getStatusColor(days);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {statusText}
      </span>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('licenses')
      .insert([
        newLicense
      ])
      .select();
    if (!error && data) {
      setLicenses(prev => [data[0], ...prev]);
      setShowAddForm(false);
      setNewLicense({
        name: '',
        type: '',
        issuer: '',
        issueDate: '',
        expirationDate: '',
        licenseNumber: '',
        status: 'active',
        contactId: ''
      });
    }
    // Optionally handle error
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Licenses</h1>
          <p className="text-gray-600">Track license expiration dates and renewals</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add License</span>
        </button>
      </div>

      {/* Licenses List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading licenses...</div>
      ) : (
        <div className="space-y-4">
          {licenses.map(license => {
            const days = getDaysUntilExpiration(license.expirationDate);
            const isExpiringSoon = days <= 30 && days >= 0;
            return (
              <div
                key={license.id}
                className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 ${isExpiringSoon ? 'border-yellow-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Award className="w-6 h-6 text-purple-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{license.name}</h3>
                      <p className="text-sm text-gray-600">{license.type}</p>
                    </div>
                  </div>
                  {getStatusBadge(license)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{license.issuer}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Issued: {formatDate(license.issueDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Expires: {formatDate(license.expirationDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-mono text-xs">#{license.licenseNumber}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    License #: {license.licenseNumber}
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
          })}
        </div>
      )}

      {licenses.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No licenses found</p>
        </div>
      )}

      {/* Add License Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New License</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newLicense.name}
                    onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    required
                    value={newLicense.type}
                    onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                  <input
                    type="text"
                    required
                    value={newLicense.issuer}
                    onChange={(e) => setNewLicense({ ...newLicense, issuer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={newLicense.issueDate}
                    onChange={(e) => setNewLicense({ ...newLicense, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={newLicense.expirationDate}
                    onChange={(e) => setNewLicense({ ...newLicense, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    value={newLicense.licenseNumber}
                    onChange={(e) => setNewLicense({ ...newLicense, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newLicense.status}
                    onChange={(e) => setNewLicense({ ...newLicense, status: e.target.value as License['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="expiring">Expiring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Contact (optional)</label>
                  <input
                    type="text"
                    value={newLicense.contactId}
                    onChange={(e) => setNewLicense({ ...newLicense, contactId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contact ID"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add License
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

export default Licenses;