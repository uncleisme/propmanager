import React from 'react';
import { Award, Calendar, Building, AlertCircle, Plus } from 'lucide-react';
import { License } from '../types';
import { formatDate, getDaysUntilExpiration, getStatusColor, getStatusText } from '../utils/dateUtils';

interface LicensesProps {
  licenses: License[];
  onAddLicense: (license: Omit<License, 'id'>) => void;
}

const Licenses: React.FC<LicensesProps> = ({ licenses, onAddLicense }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newLicense, setNewLicense] = React.useState({
    name: '',
    type: '',
    issuer: '',
    issueDate: '',
    expirationDate: '',
    licenseNumber: '',
    status: 'active' as License['status'],
    contactId: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLicense({
      ...newLicense,
      contactId: newLicense.contactId || undefined
    });
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
    setShowAddForm(false);
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
      <div className="space-y-4">
        {licenses.map(license => {
          const days = getDaysUntilExpiration(license.expirationDate);
          const isExpiringSoon = days <= 30 && days >= 0;
          
          return (
            <div
              key={license.id}
              className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200 ${
                isExpiringSoon ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{license.name}</h3>
                    <p className="text-sm text-gray-600">{license.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isExpiringSoon && (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  {getStatusBadge(license)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Issuer</p>
                    <p className="text-sm font-medium text-gray-900">{license.issuer}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(license.issueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Expiration Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(license.expirationDate)}</p>
                  </div>
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

      {licenses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No licenses found</p>
        </div>
      )}

      {/* Add License Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New License</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Name</label>
                  <input
                    type="text"
                    required
                    value={newLicense.name}
                    onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Property Management License"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                  <input
                    type="text"
                    required
                    value={newLicense.type}
                    onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Business License, Safety Certificate"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    required
                    value={newLicense.issuer}
                    onChange={(e) => setNewLicense({ ...newLicense, issuer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., City of Springfield, State Department"
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
                    placeholder="e.g., PM-2024-001234"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newLicense.status}
                    onChange={(e) => setNewLicense({ ...newLicense, status: e.target.value as License['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="expiring">Expiring</option>
                    <option value="expired">Expired</option>
                  </select>
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