import { User } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { Users, FileText, Award, AlertTriangle, Calendar, TrendingUp, UserCheck, Truck, Building2, Box, BarChart3, Droplet, Zap, ArrowUpRight, ArrowDownRight, Wrench, ChevronDown, ChevronRight, Eye, Plus } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getDaysUntilExpiration, getStatusColor, formatDate } from '../utils/dateUtils';
import { BuildingInfo, Contact, Contract, License, Complaint, Package, Guest, MoveRequest } from '../types';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [moveRequests, setMoveRequests] = useState<MoveRequest[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [utilities, setUtilities] = useState<{ water: number; electricity: number }>({ water: 0, electricity: 0 });
  const [utilitiesPrev, setUtilitiesPrev] = useState<{ water: number; electricity: number }>({ water: 0, electricity: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [
        { data: buildingData },
        { data: contactsData }, 
        { data: contractsData }, 
        { data: licensesData }, 
        { data: complaintsData },
        { data: packagesData },
        { data: guestsData },
        { data: moveRequestsData },
        { data: workOrdersData }
      ] = await Promise.all([
        supabase.from('buildingInfo').select('*').limit(1).single(),
        supabase.from('contacts').select('*'),
        supabase.from('contracts').select('*'),
        supabase.from('licenses').select('*'),
        supabase.from('complaints').select('*'),
        supabase.from('packages').select('*'),
        supabase.from('guests').select('*'),
        supabase.from('moveRequests').select('*'),
        supabase.from('work_order').select('id,type,status,createdAt,scheduledDate,title,propertyUnit,priority')
      ]);
      
      setBuildingInfo(buildingData);
      setContacts(contactsData || []);
      setContracts(contractsData || []);
      setLicenses(licensesData || []);
      setComplaints(complaintsData || []);
      setPackages(packagesData || []);
      setGuests(guestsData || []);
      setMoveRequests(moveRequestsData || []);
      setWorkOrders(workOrdersData || []);
      
      // Fetch utilities for current and previous month
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonthStr = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
      const monthDateStr = `${monthStr}-01`;
      const prevMonthDateStr = `${prevMonthStr}-01`;
      
      const { data: waterData } = await supabase
        .from('utilities_consumption')
        .select('cost')
        .eq('type', 'water')
        .eq('month', monthDateStr);
      const { data: elecData } = await supabase
        .from('utilities_consumption')
        .select('cost')
        .eq('type', 'electricity')
        .eq('month', monthDateStr);
      const { data: waterPrevData } = await supabase
        .from('utilities_consumption')
        .select('cost')
        .eq('type', 'water')
        .eq('month', prevMonthDateStr);
      const { data: elecPrevData } = await supabase
        .from('utilities_consumption')
        .select('cost')
        .eq('type', 'electricity')
        .eq('month', prevMonthDateStr);
      
      setUtilities({
        water: (waterData || []).reduce((sum, row) => sum + (row.cost || 0), 0),
        electricity: (elecData || []).reduce((sum, row) => sum + (row.cost || 0), 0),
      });
      setUtilitiesPrev({
        water: (waterPrevData || []).reduce((sum, row) => sum + (row.cost || 0), 0),
        electricity: (elecPrevData || []).reduce((sum, row) => sum + (row.cost || 0), 0),
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const activeComplaints = complaints.filter(c => c.status === 'open' || c.status === 'in-progress');
  const activeJobs = workOrders.filter(
    (wo) => wo.type === 'job' && (
      wo.status === 'open' ||
      wo.status === 'in-progress' ||
      wo.status === 'pending' ||
      wo.status === 'in_progress'
    )
  );

  const expiringContracts = contracts.filter(contract => {
    const endDate = contract.endDate;
    if (!endDate) return false;
    const days = getDaysUntilExpiration(endDate);
    return days <= 30 && days >= 0;
  });

  const expiringLicenses = licenses.filter(license => {
    const expirationDate = license.expirationDate;
    if (!expirationDate) return false;
    const days = getDaysUntilExpiration(expirationDate);
    return days <= 30 && days >= 0;
  });

  // Helper to calculate percent change
  function percentChange(current: number, prev: number) {
    if (prev === 0 && current === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((current - prev) / Math.abs(prev || 1)) * 100);
  }

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const activeJobsPrev = workOrders.filter(
    (wo) => wo.type === 'job' && (
      wo.status === 'open' ||
      wo.status === 'in-progress' ||
      wo.status === 'pending' ||
      wo.status === 'in_progress'
    ) && wo.createdAt && wo.createdAt.startsWith(prevMonthStr)
  );

  const jobsTrend = percentChange(activeJobs.length, activeJobsPrev.length);
  const waterTrend = percentChange(utilities.water, utilitiesPrev.water);
  const elecTrend = percentChange(utilities.electricity, utilitiesPrev.electricity);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-title-md2 font-semibold text-black dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-regular text-body dark:text-bodydark">
          Welcome back! Here's what's happening with your property today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
        {/* Total Contracts */}
        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <FileText className="fill-primary dark:fill-white w-5 h-5" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {contracts.filter(c => c.status === 'active').length}
              </h4>
              <span className="text-sm font-medium">Active Contracts</span>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-meta-3">
              +5%
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Valid Licenses */}
        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <Award className="fill-primary dark:fill-white w-5 h-5" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {licenses.filter(l => l.status === 'active').length}
              </h4>
              <span className="text-sm font-medium">Valid Licenses</span>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-meta-5">
              0%
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Open Complaints */}
        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <AlertTriangle className="fill-primary dark:fill-white w-5 h-5" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {activeComplaints.length}
              </h4>
              <span className="text-sm font-medium">Open Complaints</span>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-meta-5">
              -8%
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Pending Guests */}
        <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <UserCheck className="fill-primary dark:fill-white w-5 h-5" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {guests.filter(g => g.status === 'pending').length}
              </h4>
              <span className="text-sm font-medium">Pending Guests</span>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-meta-3">
              +15%
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:gap-7.5 xl:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Work Orders */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Recent Work Orders
              </h3>
            </div>
            <div className="p-6.5">
              <div className="space-y-4">
                {workOrders.slice(0, 5).map((order, index) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-2 dark:bg-meta-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'open' ? 'bg-danger' :
                        order.status === 'in-progress' ? 'bg-warning' :
                        'bg-success'
                      }`}></div>
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {order.title}
                        </p>
                        <p className="text-sm text-body dark:text-bodydark">
                          {order.propertyUnit ? `Unit ${order.propertyUnit}` : 'General'} • {order.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full py-1 px-3 text-xs font-medium ${
                        order.status === 'open' ? 'bg-danger bg-opacity-10 text-danger' :
                        order.status === 'in-progress' ? 'bg-warning bg-opacity-10 text-warning' :
                        'bg-success bg-opacity-10 text-success'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {workOrders.length === 0 && (
                  <div className="text-center py-8 text-body dark:text-bodydark">
                    No work orders found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Pending Approvals
              </h3>
            </div>
            <div className="p-6.5">
              <div className="space-y-4">
                {/* Move Requests */}
                {moveRequests.filter(r => r.status === 'pending').slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border border-stroke dark:border-strokedark">
                    <div className="flex items-center space-x-3">
                      <Truck className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          Move Request - {request.residentName}
                        </p>
                        <p className="text-sm text-body dark:text-bodydark">
                          Unit {request.unitNumber} • {new Date(request.requestedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="rounded bg-primary py-2 px-4 text-xs font-medium text-white hover:bg-opacity-90">
                      Review
                    </button>
                  </div>
                ))}
                
                {/* Guest Requests */}
                {guests.filter(g => g.status === 'pending').slice(0, 3).map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-4 rounded-lg border border-stroke dark:border-strokedark">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          Guest Request - {guest.visitorName}
                        </p>
                        <p className="text-sm text-body dark:text-bodydark">
                          Host: {guest.hostName} • Unit {guest.hostUnit}
                        </p>
                      </div>
                    </div>
                    <button className="rounded bg-primary py-2 px-4 text-xs font-medium text-white hover:bg-opacity-90">
                      Approve
                    </button>
                  </div>
                ))}

                {moveRequests.filter(r => r.status === 'pending').length === 0 && 
                 guests.filter(g => g.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-body dark:text-bodydark">
                    No pending approvals
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Building Info Card */}
          {buildingInfo && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Building Information
                </h3>
              </div>
              <div className="p-6.5">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-black dark:text-white text-lg">
                      {buildingInfo.buildingName}
                    </h4>
                    <p className="text-sm text-body dark:text-bodydark capitalize">
                      {buildingInfo.buildingType.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-body dark:text-bodydark">Total Units</p>
                      <p className="font-semibold text-black dark:text-white">
                        {buildingInfo.totalUnits}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-body dark:text-bodydark">Total Floors</p>
                      <p className="font-semibold text-black dark:text-white">
                        {buildingInfo.totalFloors}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-body dark:text-bodydark">Property Manager</p>
                    <p className="font-medium text-black dark:text-white">
                      {buildingInfo.propertyManagerName}
                    </p>
                    <p className="text-sm text-body dark:text-bodydark">
                      {buildingInfo.propertyManagerCompany}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Quick Stats
              </h3>
            </div>
            <div className="p-6.5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm text-body dark:text-bodydark">Total Packages</span>
                  </div>
                  <span className="font-semibold text-black dark:text-white">
                    {packages.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span className="text-sm text-body dark:text-bodydark">Pending Pickup</span>
                  </div>
                  <span className="font-semibold text-black dark:text-white">
                    {packages.filter(p => p.status === 'received' || p.status === 'notified').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-sm text-body dark:text-bodydark">Total Contacts</span>
                  </div>
                  <span className="font-semibold text-black dark:text-white">
                    {contacts.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-danger"></div>
                    <span className="text-sm text-body dark:text-bodydark">Expiring Soon</span>
                  </div>
                  <span className="font-semibold text-black dark:text-white">
                    {expiringContracts.length + expiringLicenses.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Utilities Overview */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Monthly Utilities
              </h3>
            </div>
            <div className="p-6.5">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-meta-4">
                  <div className="flex items-center space-x-3">
                    <Droplet className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-black dark:text-white">Water</p>
                      <p className="text-sm text-body dark:text-bodydark">
                        {waterTrend > 0 ? '+' : ''}{waterTrend}% from last month
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-black dark:text-white">
                    RM {utilities.water.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-meta-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-black dark:text-white">Electricity</p>
                      <p className="text-sm text-body dark:text-bodydark">
                        {elecTrend > 0 ? '+' : ''}{elecTrend}% from last month
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-black dark:text-white">
                    RM {utilities.electricity.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Activity */}
      <div className="mt-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex items-center justify-between">
            <h3 className="font-medium text-black dark:text-white">
              Recent Activity
            </h3>
            <button className="text-primary hover:text-primary-dark text-sm font-medium">
              View All
            </button>
          </div>
          <div className="p-6.5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Completed Tasks */}
              <div>
                <h4 className="font-medium text-black dark:text-white mb-4">Completed Tasks</h4>
                <div className="space-y-3">
                  {workOrders
                    .filter(wo => wo.status === 'completed' || wo.status === 'resolved')
                    .slice(0, 3)
                    .map(order => (
                      <div key={order.id} className="flex items-center space-x-3 p-3 rounded-lg border border-stroke dark:border-strokedark">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black dark:text-white">
                            {order.title}
                          </p>
                          <p className="text-xs text-body dark:text-bodydark">
                            {order.type} • Completed
                          </p>
                        </div>
                      </div>
                    ))}
                  {workOrders.filter(wo => wo.status === 'completed' || wo.status === 'resolved').length === 0 && (
                    <p className="text-sm text-body dark:text-bodydark">No completed tasks</p>
                  )}
                </div>
              </div>

              {/* Upcoming Schedule */}
              <div>
                <h4 className="font-medium text-black dark:text-white mb-4">Upcoming Schedule</h4>
                <div className="space-y-3">
                  {workOrders
                    .filter(wo => wo.scheduledDate && new Date(wo.scheduledDate) >= new Date())
                    .slice(0, 3)
                    .map(order => (
                      <div key={order.id} className="flex items-center space-x-3 p-3 rounded-lg border border-stroke dark:border-strokedark">
                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black dark:text-white">
                            {order.title}
                          </p>
                          <p className="text-xs text-body dark:text-bodydark">
                            {new Date(order.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  {workOrders.filter(wo => wo.scheduledDate && new Date(wo.scheduledDate) >= new Date()).length === 0 && (
                    <p className="text-sm text-body dark:text-bodydark">No upcoming schedule</p>
                  )}
                </div>
              </div>

              {/* Recent Packages */}
              <div>
                <h4 className="font-medium text-black dark:text-white mb-4">Recent Packages</h4>
                <div className="space-y-3">
                  {packages.slice(0, 3).map(pkg => (
                    <div key={pkg.id} className="flex items-center space-x-3 p-3 rounded-lg border border-stroke dark:border-strokedark">
                      <div className={`w-2 h-2 rounded-full ${
                        pkg.status === 'picked_up' ? 'bg-success' :
                        pkg.status === 'notified' ? 'bg-warning' :
                        'bg-primary'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black dark:text-white">
                          {pkg.recipientName}
                        </p>
                        <p className="text-xs text-body dark:text-bodydark">
                          Unit {pkg.recipientUnit} • {pkg.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {packages.length === 0 && (
                    <p className="text-sm text-body dark:text-bodydark">No recent packages</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;