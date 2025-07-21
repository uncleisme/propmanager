
import { User } from '@supabase/supabase-js';import React, { useEffect, useState } from 'react';
import { Users, FileText, Award, AlertTriangle, Calendar, TrendingUp, UserCheck, Truck, Building2, Box, BarChart3, Droplet, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [utilities, setUtilities] = useState<{ water: number; electricity: number }>({ water: 0, electricity: 0 });
  const [utilitiesPrev, setUtilitiesPrev] = useState<{ water: number; electricity: number }>({ water: 0, electricity: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Handle window resize for responsive tooltip behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      setHoveredCard(null); // Clean up tooltip state
    };
  }, []);

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
        { data: moveRequestsData }
      ] = await Promise.all([
        supabase.from('buildingInfo').select('*').limit(1).single(),
        supabase.from('contacts').select('*'),
        supabase.from('contracts').select('*'),
        supabase.from('licenses').select('*'),
        supabase.from('complaints').select('*'),
        supabase.from('packages').select('*'),
        supabase.from('guests').select('*'),
        supabase.from('moveRequests').select('*')
      ]);
      setBuildingInfo(buildingData);
      setContacts(contactsData || []);
      setContracts(contractsData || []);
      setLicenses(licensesData || []);
      setComplaints(complaintsData || []);
      setPackages(packagesData || []);
      setGuests(guestsData || []);
      setMoveRequests(moveRequestsData || []);
      // Fetch utilities for current and previous month
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
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
  const criticalComplaints = complaints.filter(c => c.priority === 'critical' || c.priority === 'high');
  
  // Fixed: Ensure we're using the correct field name for contract end date
  const expiringContracts = contracts.filter(contract => {
    const endDate = contract.endDate;
    if (!endDate) return false;
    const days = getDaysUntilExpiration(endDate);
    return days <= 30 && days >= 0;
  });

  // Fixed: Ensure we're using the correct field name for license expiration
  const expiringLicenses = licenses.filter(license => {
    const expirationDate = license.expirationDate;
    if (!expirationDate) return false;
    const days = getDaysUntilExpiration(expirationDate);
    return days <= 30 && days >= 0;
  });

  // Helper to calculate percent change
  function percentChange(current: number, prev: number) {
    if (prev === 0 && current === 0) return { value: 0, up: false };
    if (prev === 0) return { value: 100, up: true };
    const diff = current - prev;
    const up = diff >= 0;
    const pct = Math.abs(diff / prev) * 100;
    return { value: Math.round(pct), up };
  }

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
    },
    {
      title: 'Water',
      value: utilities.water.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
      icon: Droplet,
      color: 'bg-blue-400',
      trend: '',
      percent: percentChange(utilities.water, utilitiesPrev.water)
    },
    {
      title: 'Electricity',
      value: utilities.electricity.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
      icon: Zap,
      color: 'bg-yellow-400',
      trend: '',
      percent: percentChange(utilities.electricity, utilitiesPrev.electricity)
    },
    {
      title: 'Pending Guests',
      value: guests.filter(g => g.status === 'pending').length,
      icon: UserCheck,
      color: 'bg-indigo-500',
      trend: '+15%'
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
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          {buildingInfo && (
            <span className="text-lg sm:text-1xl font-bold text-blue-400">{buildingInfo.buildingName}</span>
          )}
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Overview of your property management activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isUtility = stat.title === 'Water' || stat.title === 'Electricity';
          let tooltipContent = null;
          if (isUtility && stat.percent) {
            const prev = stat.title === 'Water' ? utilitiesPrev.water : utilitiesPrev.electricity;
            const curr = stat.title === 'Water' ? utilities.water : utilities.electricity;
            tooltipContent = (
              <div className="bg-white border border-gray-300 rounded shadow-lg p-3 text-xs text-gray-800 min-w-[180px]">
                <div className="mb-1 font-semibold">{stat.title} Details</div>
                <div>Current: <span className="font-bold">{curr.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
                <div>Previous: <span className="font-bold">{prev.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
                <div>Difference: <span className="font-bold">{(curr - prev).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span></div>
              </div>
            );
          }
          // Hide tooltip on mobile (sm and below)
          const showTooltip = isUtility && hoveredCard === index && windowWidth > 640;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 relative min-w-0"
              onMouseEnter={() => isUtility && setHoveredCard(index)}
              onMouseLeave={() => isUtility && setHoveredCard(null)}
              // Show tooltip on click for mobile
              onClick={e => {
                if (windowWidth <= 640 && isUtility) {
                  setHoveredCard(hoveredCard === index ? null : index);
                  e.stopPropagation();
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 truncate" style={{ wordBreak: 'break-all' }}>{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 sm:ml-4`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              {/* Trend/Percent Change Row - always present, same style for all cards */}
              <div className="mt-2 sm:mt-4 flex items-center min-h-[20px] sm:min-h-[24px]">
                {stat.percent ? (
                  <span className={`inline-flex items-center text-xs sm:text-sm font-medium ${stat.percent.up ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.percent.up ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {stat.percent.value}% {stat.percent.up ? 'increase' : 'decrease'}
                  </span>
                ) : stat.trend ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs sm:text-sm text-green-600 font-medium">{stat.trend}</span>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">from last month</span>
                  </>
                ) : null}
              </div>
              {/* Tooltip for utilities */}
              {showTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-50" style={{ transform: 'translate(-50%, -100%)' }}>
                  {tooltipContent}
                </div>
              )}
              {/* Tooltip for mobile (on click) */}
              {isUtility && hoveredCard === index && windowWidth <= 640 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-max max-w-xs">
                  {tooltipContent}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Building Overview */}
      {buildingInfo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Building Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{buildingInfo.totalUnits}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total Units</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{buildingInfo.totalFloors}</p>
              <p className="text-xs sm:text-sm text-gray-600">Floors</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{buildingInfo.parkingSpaces}</p>
              <p className="text-xs sm:text-sm text-gray-600">Parking Spaces</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{buildingInfo.yearBuilt}</p>
              <p className="text-xs sm:text-sm text-gray-600">Year Built</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              <strong>Type:</strong> {buildingInfo.buildingType?.replace('_', ' ') || 'Not specified'} •
              <strong> Manager:</strong> {buildingInfo.propertyManagerName || 'Not specified'}
            </p>
          </div>
        </div>
      )}

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Expiring Contracts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-2 sm:mb-4">
            <Calendar className="w-5 h-5 text-amber-500 mr-2" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Expiring Contracts</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {expiringContracts.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm">No contracts expiring in the next 30 days</p>
            ) : (
              expiringContracts.map(contract => {
                const endDate = contract.endDate;
                const days = getDaysUntilExpiration(endDate);
                return (
                  <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-amber-50 rounded-lg gap-1 sm:gap-0">
                    <div>
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">{contract.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Expires: {formatDate(endDate)}</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-2 sm:mb-4">
            <Award className="w-5 h-5 text-purple-500 mr-2" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Expiring Licenses</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {expiringLicenses.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm">No licenses expiring in the next 30 days</p>
            ) : (
              expiringLicenses.map(license => {
                const expirationDate = license.expirationDate;
                const days = getDaysUntilExpiration(expirationDate);
                return (
                  <div key={license.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg gap-1 sm:gap-0">
                    <div>
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">{license.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Expires: {formatDate(expirationDate)}</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4 gap-1 sm:gap-0">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Complaints</h2>
          </div>
          <span className="text-xs sm:text-sm text-gray-500">{criticalComplaints.length} critical/high priority</span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {activeComplaints.slice(0, 5).map(complaint => (
            <div key={complaint.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-1 sm:gap-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-xs sm:text-sm">{complaint.title}</p>
                <p className="text-xs sm:text-sm text-gray-600">{complaint.propertyUnit}</p>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
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