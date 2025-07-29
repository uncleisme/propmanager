import { User } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { Users, FileText, Award, AlertTriangle, Calendar, TrendingUp, UserCheck, Truck, Building2, Box, BarChart3, Droplet, Zap, ArrowUpRight, ArrowDownRight, Wrench, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getDaysUntilExpiration, getStatusColor, formatDate } from '../utils/dateUtils';
import { BuildingInfo, Contact, Contract, License, Complaint, Package, Guest, MoveRequest } from '../types';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({
    overview: false,
    buildingInfo: false,
    tasks: false,
    maintenance: false,
    residents: false,
    utilities: false,
    packages: false,
    security: false,
    documents: false,
  });
  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const [quickActionOpen, setQuickActionOpen] = React.useState(false); // For floating quick action button

  // Add state for pagination for each list
  const [showCounts, setShowCounts] = React.useState<Record<string, number>>({
    upcomingWorkOrders: 5,
    pendingMoveRequests: 5,
    pendingGuestRequests: 5,
    recentActivity: 5,
    scheduledJobs: 5,
    openIssues: 5,
    completedTasks: 5,
    residents: 5,
    moveRequests: 5,
    pendingPickups: 5,
    recentDeliveries: 5,
    visitors: 5,
    expiringLicenses: 5,
    contracts: 5,
  } as Record<string, number>);
  const handleLoadMore = (key: string, total: number) => setShowCounts(prev => ({ ...prev, [key]: Math.min(prev[key] + 5, total) }));

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
  const elecTrendStr = (elecTrend > 0 ? '+' : '') + elecTrend + '%';
  const waterTrendStr = (waterTrend > 0 ? '+' : '') + waterTrend + '%';
  const jobsTrendStr = (jobsTrend > 0 ? '+' : '') + jobsTrend + '%';

  const stats = [
    // Open Complaints and Open Jobs at the top
    {
      title: 'Open Complaints',
      value: activeComplaints.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-8%'
    },
    {
      title: 'Open Jobs',
      value: activeJobs.length,
      icon: Wrench,
      color: 'bg-blue-600',
      trend: jobsTrendStr
    },
    // Water and Electricity metrics
    {
      title: 'Water',
      value: utilities.water.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
      icon: Droplet,
      color: 'bg-blue-400',
      trend: waterTrendStr
    },
    {
      title: 'Electricity',
      value: utilities.electricity.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
      icon: Zap,
      color: 'bg-yellow-400',
      trend: elecTrendStr
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
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* OVERVIEW */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-10">
          <div className="flex items-center gap-3 mb-2 cursor-pointer select-none" onClick={() => toggleSection('overview')}>
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide">Overview</h1>
            {buildingInfo && (
              <span className="text-lg font-semibold text-blue-600 ml-2">{buildingInfo.buildingName}</span>
            )}
            <span className="ml-auto">{collapsed.overview ? <ChevronRight className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}</span>
          </div>
          <div className="border-b border-gray-200 mb-4"></div>
          <div style={{ maxHeight: collapsed.overview ? 0 : '2000px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
      {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
                // Tooltip logic for all cards
                const showTooltip = hoveredCard === index && typeof window !== 'undefined' && window.innerWidth > 640;
                // Compute details for tooltip
                let prevValue = null;
                let percent = null;
                if (stat.title === 'Open Jobs') {
                  prevValue = activeJobsPrev.length;
                } else if (stat.title === 'Open Complaints') {
                  // Example: you can add prevValue/percent for complaints if you want
                  prevValue = null;
                  percent = stat.trend;
                } else {
                  prevValue = null;
                  percent = stat.trend;
                }
        return (
          <div
            key={index}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl p-4 sm:p-6 relative min-w-0 hover:bg-gray-50 font-sans text-base transition-all duration-200"
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-blue-600">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1 sm:mt-2 truncate" style={{ wordBreak: 'break-all' }}>{stat.value}</p>
              </div>
                    <div className={`bg-blue-600 p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 sm:ml-4`}>
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
                  {/* Trend Row - always show */}
            <div className="mt-2 sm:mt-4 flex items-center min-h-[20px] sm:min-h-[24px]">
                    {stat.trend ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-xs sm:text-sm text-blue-600 font-medium">{stat.trend}</span>
                        <span className="text-xs sm:text-sm text-gray-400 ml-1">from last month</span>
                      </>
                    ) : (
                      <span className="invisible">placeholder</span>
                    )}
            </div>
                  {/* Tooltip for all cards */}
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-50" style={{ transform: 'translate(-50%, -100%)' }}>
                      <div className="bg-white border border-gray-200 rounded shadow-lg p-3 text-xs text-blue-600 min-w-[180px] font-sans text-base">
                        <div className="mb-1 font-semibold">{stat.title ? stat.title + ' Details' : 'Metric Details'}</div>
                        <div>Current: <span className="font-bold text-gray-900">{stat.value}</span></div>
                        <div>Previous: <span className="font-bold text-gray-900">{prevValue != null ? prevValue : 0}</span></div>
                        <div>Change: <span className="font-bold text-gray-900">{percent && percent !== '' && percent !== '0%' ? percent : '-'}</span></div>
              </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
        </div>
      </section>

      {/* Building Info Section (standalone) */}
    {buildingInfo && (
        <section className="bg-white rounded-xl shadow-md p-6 mb-10">
          <div className="flex items-center gap-2 mb-4 cursor-pointer select-none" onClick={() => toggleSection('buildingInfo')}>
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 tracking-wide">Building Info</h2>
            <span className="ml-auto">{collapsed.buildingInfo ? <ChevronRight className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}</span>
          </div>
          <div className="border-b border-gray-200 mb-4"></div>
          <div style={{ maxHeight: collapsed.buildingInfo ? 0 : '2000px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500 text-xs mb-1">Name</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.buildingName}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Address</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.buildingAddress}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Type</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.buildingType}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Total Units</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.totalUnits}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Total Floors</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.totalFloors}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Year Built</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.yearBuilt}</div>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <div className="text-gray-500 text-xs mb-1">Property Manager</div>
                <div className="text-gray-800 font-semibold">{buildingInfo.propertyManagerName} ({buildingInfo.propertyManagerCompany})</div>
                <div className="text-gray-500 text-xs">{buildingInfo.propertyManagerEmail} {buildingInfo.propertyManagerPhone && <>| {buildingInfo.propertyManagerPhone}</>}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TASKS & REQUESTS */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-10">
        <div className="flex items-center gap-2 mb-2 cursor-pointer select-none" onClick={() => toggleSection('tasks')}>
          <Truck className="w-7 h-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">Tasks & Requests</h2>
          <span className="ml-auto">{collapsed.tasks ? <ChevronRight className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}</span>
        </div>
        <div className="border-b border-gray-200 mb-4"></div>
        <div style={{ maxHeight: collapsed.tasks ? 0 : '2000px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
          {/* Upcoming Work Orders */}
          <div className="mb-4">
            <h3 className="font-semibold text-md text-blue-600 mb-1">Upcoming Work Orders (Next 7 Days)</h3>
            {(() => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const weekFromNow = new Date();
              weekFromNow.setDate(today.getDate() + 7);
              weekFromNow.setHours(23,59,59,999);
              const upcoming = workOrders
                .filter(wo =>
                  (wo.type === 'job' || wo.type === 'complaint') &&
                  wo.scheduledDate &&
                  new Date(wo.scheduledDate).getTime() >= today.getTime() &&
                  new Date(wo.scheduledDate).getTime() <= weekFromNow.getTime()
                )
                .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                .slice(0, showCounts.upcomingWorkOrders);
              if (upcoming.length === 0) {
                return <p className="text-gray-400 text-xs sm:text-sm">No jobs or complaints scheduled in the next 7 days</p>;
              }
              return (
                <>
                  {upcoming.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-100 rounded-lg gap-1 sm:gap-0 mb-2 font-sans text-base">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-xs sm:text-sm">[{order.type}] {order.title}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{order.propertyUnit || '-'}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Scheduled: {order.scheduledDate || '-'}</p>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {order.priority && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white`}>
                            {order.priority}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'open' ? 'bg-red-500 text-white' :
                          order.status === 'in-progress' ? 'bg-blue-600 text-white' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {workOrders.filter(wo =>
                    (wo.type === 'job' || wo.type === 'complaint') &&
                    wo.scheduledDate &&
                    new Date(wo.scheduledDate).getTime() >= today.getTime() &&
                    new Date(wo.scheduledDate).getTime() <= weekFromNow.getTime()
                  ).length > showCounts.upcomingWorkOrders && (
                    <button onClick={() => handleLoadMore('upcomingWorkOrders', workOrders.filter(wo =>
                      (wo.type === 'job' || wo.type === 'complaint') &&
                      wo.scheduledDate &&
                      new Date(wo.scheduledDate).getTime() >= today.getTime() &&
                      new Date(wo.scheduledDate).getTime() <= weekFromNow.getTime()
                    ).length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
                  )}
                </>
              );
            })()}
          </div>
          {/* Pending Approvals */}
          <div className="mb-4">
            <h3 className="font-semibold text-md text-blue-600 mb-1">Pending Approvals</h3>
            {/* Move Requests */}
            <div className="mb-2">
              <h4 className="font-semibold text-xs text-blue-600">Move Requests</h4>
              {moveRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-gray-400 text-xs">No pending move requests</p>
              ) : moveRequests.filter(r => r.status === 'pending').slice(0, showCounts.pendingMoveRequests).map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                  <span className="text-gray-900">{r.residentName} ({r.unitNumber})</span>
                  <span className="text-xs text-blue-600">Pending</span>
                </div>
              ))}
              {moveRequests.filter(r => r.status === 'pending').length > showCounts.pendingMoveRequests && (
                <button onClick={() => handleLoadMore('pendingMoveRequests', moveRequests.filter(r => r.status === 'pending').length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
              )}
            </div>
            {/* Guest Requests */}
            <div>
              <h4 className="font-semibold text-xs text-blue-600">Guest Requests</h4>
              {guests.filter(g => g.status === 'pending').length === 0 ? (
                <p className="text-gray-400 text-xs">No pending guest requests</p>
              ) : guests.filter(g => g.status === 'pending').slice(0, showCounts.pendingGuestRequests).map(g => (
                <div key={g.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                  <span className="text-gray-900">{g.visitorName} (Host: {g.hostName}, Unit: {g.hostUnit})</span>
                  <span className="text-xs text-blue-600">Pending</span>
                </div>
              ))}
              {guests.filter(g => g.status === 'pending').length > showCounts.pendingGuestRequests && (
                <button onClick={() => handleLoadMore('pendingGuestRequests', guests.filter(g => g.status === 'pending').length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
              )}
            </div>
          </div>
          {/* Recent Activity */}
          <div>
            <h3 className="font-semibold text-md text-blue-600 mb-1">Recent Activity</h3>
            {(() => {
              const recent = workOrders
                .filter(wo =>
                  (wo.status === 'completed' || wo.status === 'resolved' || wo.status === 'closed') &&
                  wo.createdAt &&
                  new Date(wo.createdAt).getTime() >= new Date().setDate(new Date().getDate() - 7)
                )
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, showCounts.recentActivity);
              if (recent.length === 0) {
                return <p className="text-gray-400 text-xs sm:text-sm">No recent completed jobs or complaints</p>;
              }
              return (
                <>
                  {recent.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                      <span className="text-gray-800">({order.type}) {order.title}</span>
                      <span className={`text-xs ${
                        order.status === 'open' ? 'text-red-500' :
                        order.status === 'in-progress' ? 'text-blue-600' :
                        order.status === 'completed' || order.status === 'resolved' || order.status === 'closed' ? 'text-emerald-500' :
                        'text-amber-500'
                      }`}>{order.status}</span>
                    </div>
                  ))}
                  {workOrders.filter(wo =>
                    (wo.status === 'completed' || wo.status === 'resolved' || wo.status === 'closed') &&
                    wo.createdAt &&
                    new Date(wo.createdAt).getTime() >= new Date().setDate(new Date().getDate() - 7)
                  ).length > showCounts.recentActivity && (
                    <button onClick={() => handleLoadMore('recentActivity', workOrders.filter(wo =>
                      (wo.status === 'completed' || wo.status === 'resolved' || wo.status === 'closed') &&
                      wo.createdAt &&
                      new Date(wo.createdAt).getTime() >= new Date().setDate(new Date().getDate() - 7)
                    ).length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* PACKAGES & DELIVERIES */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-10">
        <div className="flex items-center gap-2 mb-2 cursor-pointer select-none" onClick={() => toggleSection('packages')}>
          <Box className="w-7 h-7 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">Packages & Deliveries</h2>
          <span className="ml-auto">{collapsed.packages ? <ChevronRight className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}</span>
        </div>
        <div className="border-b border-gray-200 mb-4"></div>
        <div style={{ maxHeight: collapsed.packages ? 0 : '2000px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
          {/* Pending Pickups */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm text-blue-600 mb-1">Pending Pickups</h3>
            {packages.filter(p => p.status === 'notified' || p.status === 'received').length === 0 ? (
              <p className="text-gray-500 text-xs">No pending pickups</p>
            ) : packages.filter(p => p.status === 'notified' || p.status === 'received').slice(0, showCounts.pendingPickups).map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                <span>{p.trackingNumber} ({p.recipientName})</span>
                <span className="text-xs text-blue-600">{p.status}</span>
              </div>
            ))}
            {packages.filter(p => p.status === 'notified' || p.status === 'received').length > showCounts.pendingPickups && (
              <button onClick={() => handleLoadMore('pendingPickups', packages.filter(p => p.status === 'notified' || p.status === 'received').length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
            )}
          </div>
          {/* Recent Deliveries */}
          <div>
            <h3 className="font-semibold text-sm text-emerald-700 mb-1">Recent Deliveries</h3>
            {packages.length === 0 ? (
              <p className="text-gray-500 text-xs">No deliveries found</p>
            ) : packages.slice(0, showCounts.recentDeliveries).map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                <span>{p.trackingNumber} ({p.recipientName})</span>
                <span className="text-xs text-emerald-700">{p.status}</span>
      </div>
            ))}
            {packages.length > showCounts.recentDeliveries && (
              <button onClick={() => handleLoadMore('recentDeliveries', packages.length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
            )}
          </div>
        </div>
      </section>

      {/* SECURITY & ACCESS */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-10">
        <div className="flex items-center gap-2 mb-2 cursor-pointer select-none" onClick={() => toggleSection('security')}>
          <UserCheck className="w-7 h-7 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">Security & Access</h2>
          <span className="ml-auto">{collapsed.security ? <ChevronRight className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}</span>
                  </div>
        <div className="border-b border-gray-200 mb-4"></div>
        <div style={{ maxHeight: collapsed.security ? 0 : '2000px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
          {/* Visitor Log */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm text-blue-600 mb-1">Visitor Log</h3>
            {guests.length === 0 ? (
              <p className="text-gray-500 text-xs">No visitors found</p>
            ) : guests.slice(0, showCounts.visitors).map(g => (
              <div key={g.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                <span>{g.visitorName} (Host: {g.hostName}, Unit: {g.hostUnit})</span>
                <span className="text-xs text-blue-600">{g.status}</span>
                </div>
            ))}
            {guests.length > showCounts.visitors && (
              <button onClick={() => handleLoadMore('visitors', guests.length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
            )}
          </div>
          {/* Access Requests Placeholder */}
          <div>
            <h3 className="font-semibold text-sm text-purple-700 mb-1">Access Requests</h3>
            <p className="text-gray-500 text-xs">(Access requests not implemented)</p>
          </div>
        </div>
      </section>

      {/* DOCUMENTS & COMPLIANCE */}
      <section className="bg-white rounded-xl shadow-md p-6 mb-10">
        <div className="flex items-center gap-2 mb-2 cursor-pointer select-none" onClick={() => toggleSection('documents')}>
          <FileText className="w-7 h-7 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">Documents & Compliance</h2>
          <span className="ml-auto">{collapsed.documents ? <ChevronRight className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}</span>
        </div>
        <div className="border-b border-gray-200 mb-4"></div>
        <div style={{ maxHeight: collapsed.documents ? 0 : '2000px', overflow: 'hidden', transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
          {/* Expiring Licenses */}
          <div className="mb-4">
            <h3 className="font-semibold text-base text-red-700 mb-1">Expiring Licenses</h3>
          {expiringLicenses.length === 0 ? (
              <p className="text-gray-500 text-xs">No licenses expiring in the next 30 days</p>
            ) : expiringLicenses.slice(0, showCounts.expiringLicenses).map(license => {
              const expirationDate = license.expirationDate;
              const days = getDaysUntilExpiration(expirationDate);
              return (
                <div key={license.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                  <span>{license.name} (Expires: {formatDate(expirationDate)})</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(days)}`}>{days} days</span>
                </div>
              );
            })}
            {licenses.filter(license => {
              const expirationDate = license.expirationDate;
              if (!expirationDate) return false;
              const days = getDaysUntilExpiration(expirationDate);
              return days <= 30 && days >= 0;
            }).length > showCounts.expiringLicenses && (
              <button onClick={() => handleLoadMore('expiringLicenses', licenses.filter(license => {
                const expirationDate = license.expirationDate;
                if (!expirationDate) return false;
                const days = getDaysUntilExpiration(expirationDate);
                return days <= 30 && days >= 0;
              }).length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
            )}
          </div>
          {/* Contracts */}
          <div>
            <h3 className="font-semibold text-base text-blue-600 mb-1">Contracts</h3>
            {contracts.length === 0 ? (
              <p className="text-gray-500 text-xs">No contracts found</p>
            ) : contracts.slice(0, showCounts.contracts).map(contract => (
              <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-100 rounded mb-1 font-sans text-base">
                <span>{contract.title} (End: {formatDate(contract.endDate)})</span>
                <span className="text-xs text-blue-600">{contract.status}</span>
              </div>
            ))}
            {contracts.length > showCounts.contracts && (
              <button onClick={() => handleLoadMore('contracts', contracts.length)} className="mt-2 text-blue-600 hover:underline text-sm">Load More</button>
          )}
        </div>
      </div>
      </section>
      {/* Floating Quick Action Button */}
              </div>
      {/* Floating Quick Action Button */}
      <div className="fixed z-50 bottom-6 right-6 flex flex-col items-end">
        {/* Overlay for closing menu */}
        {quickActionOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-0"
            onClick={() => setQuickActionOpen(false)}
            aria-label="Close Quick Actions"
          />
        )}
        {/* Action Buttons */}
        <div className={`flex flex-col items-end mb-3 space-y-2 transition-all duration-300 ${quickActionOpen ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`}> 
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
            style={{ minWidth: 180 }}
            tabIndex={quickActionOpen ? 0 : -1}
          >
            + Add Work Order
          </button>
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
            style={{ minWidth: 180 }}
            tabIndex={quickActionOpen ? 0 : -1}
          >
            + Register Guest
          </button>
        </div>
        {/* FAB */}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={quickActionOpen ? 'Close Quick Actions' : 'Open Quick Actions'}
          onClick={() => setQuickActionOpen(open => !open)}
        >
          <Plus className={`w-8 h-8 transition-transform duration-200 ${quickActionOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
