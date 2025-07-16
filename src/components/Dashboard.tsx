import React, { useEffect, useState } from 'react';
import { Users, FileText, Award, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getDaysUntilExpiration, getStatusColor, formatDate } from '../utils/dateUtils';

const Dashboard: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: contactsData }, { data: contractsData }, { data: licensesData }, { data: complaintsData }] = await Promise.all([
        supabase.from('contacts').select('*'),
        supabase.from('contracts').select('*'),
        supabase.from('licenses').select('*'),
        supabase.from('complaints').select('*')
      ]);
      setContacts(contactsData || []);
      setContracts(contractsData || []);
      setLicenses(licensesData || []);
      setComplaints(complaintsData || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const activeComplaints = complaints.filter(c => c.status === 'open' || c.status === 'in-progress');
  const criticalComplaints = complaints.filter(c => c.priority === 'critical' || c.priority === 'high');
  
  // Fixed: Ensure we're using the correct field name for contract end date
  const expiringContracts = contracts.filter(contract => {
    const endDate = contract.end_date || contract.endDate; // Try both possible field names
    if (!endDate) return false;
    const days = getDaysUntilExpiration(endDate);
    return days <= 30 && days >= 0;
  });

  // Fixed: Ensure we're using the correct field name for license expiration
  const expiringLicenses = licenses.filter(license => {
    const expirationDate = license.expiration_date || license.expirationDate; // Try both possible field names
    if (!expirationDate) return false;
    const days = getDaysUntilExpiration(expirationDate);
    return days <= 30 && days >= 0;
  });

  const stats = [
    {
      title: 'Total Contacts',
      value: contacts.length,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: 'Active Contracts',
      value: contracts.filter(c => c.status === 'active').length,
      icon: FileText,
      color: 'bg-green-500',
      trend: '+5%'
    },
    {
      title: 'Valid Licenses',
      value: licenses.filter(l => l.status === 'active').length,
      icon: Award,
      color: 'bg-purple-500',
      trend: '0%'
    },
    {
      title: 'Open Complaints',
      value: activeComplaints.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-8%'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your property management activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expiring Contracts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-amber-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Expiring Contracts</h2>
          </div>
          <div className="space-y-3">
            {expiringContracts.length === 0 ? (
              <p className="text-gray-500 text-sm">No contracts expiring in the next 30 days</p>
            ) : (
              expiringContracts.map(contract => {
                const endDate = contract.end_date || contract.endDate;
                const days = getDaysUntilExpiration(endDate);
                return (
                  <div key={contract.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{contract.title}</p>
                      <p className="text-sm text-gray-600">Expires: {formatDate(endDate)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(days)}`}>
                      {days} days
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expiring Licenses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Award className="w-5 h-5 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Expiring Licenses</h2>
          </div>
          <div className="space-y-3">
            {expiringLicenses.length === 0 ? (
              <p className="text-gray-500 text-sm">No licenses expiring in the next 30 days</p>
            ) : (
              expiringLicenses.map(license => {
                const expirationDate = license.expiration_date || license.expirationDate;
                const days = getDaysUntilExpiration(expirationDate);
                return (
                  <div key={license.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{license.name}</p>
                      <p className="text-sm text-gray-600">Expires: {formatDate(expirationDate)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(days)}`}>
                      {days} days
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
          </div>
          <span className="text-sm text-gray-500">{criticalComplaints.length} critical/high priority</span>
        </div>
        <div className="space-y-3">
          {activeComplaints.slice(0, 5).map(complaint => (
            <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{complaint.title}</p>
                <p className="text-sm text-gray-600">{complaint.propertyUnit}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  complaint.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  complaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {complaint.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  complaint.status === 'open' ? 'bg-red-100 text-red-800' :
                  complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;