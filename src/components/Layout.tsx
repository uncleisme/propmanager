import React, { useEffect, useState } from 'react';
import { 
  Building2, Users, FileText, Award, AlertTriangle, BarChart3, LogOut, 
  Menu, X, MapPin, Package, UserCheck, Truck, Settings, User as UserIcon, Clock, Calendar, 
  ChevronDown, ChevronRight, Shield, Sparkles, Calendar as CalendarIcon, Home
} from 'lucide-react';
import { ViewType, BuildingInfo } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

// Footer component
const Footer = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const { error } = await supabase.from('contacts').select('id').limit(1);
        if (isMounted) setStatus(error ? 'offline' : 'online');
      } catch {
        if (isMounted) setStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000); // check every 15s
    return () => { isMounted = false; clearInterval(interval); };
  }, []);
  return (
    <footer className="border-t border-stroke bg-white px-4 py-4 dark:border-strokedark dark:bg-boxdark md:px-6 2xl:px-11">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-sm text-body dark:text-bodydark">
          © {new Date().getFullYear()} PropManager. All rights reserved.
        </div>
        <div className="flex items-center gap-2 text-sm text-body dark:text-bodydark">
          <span className={`inline-block h-2 w-2 rounded-full ${
            status === 'online' ? 'bg-success' : 'bg-danger'
          }`}></span>
          Database: {status === 'online' ? 'Connected' : 'Disconnected'}
        </div>
      </div>
    </footer>
  );
};

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  children: React.ReactNode;
  user: SupabaseUser | null;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onViewChange, 
  onLogout, 
  children,
  user 
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['overview', 'management']));

  const menuSections = [
    {
      title: 'MENU',
      items: [
        { id: 'dashboard' as ViewType, icon: Home, label: 'Dashboard' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'building-info' as ViewType, icon: Building2, label: 'Building Info' },
        { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
        { id: 'contracts' as ViewType, icon: FileText, label: 'Contracts' },
        { id: 'licenses' as ViewType, icon: Award, label: 'Licenses' },
        { id: 'complaints' as ViewType, icon: AlertTriangle, label: 'Work Orders' },
      ]
    },
    {
      title: 'SERVICES',
      items: [
        { id: 'amenities' as ViewType, icon: MapPin, label: 'Amenities' },
        { id: 'packages' as ViewType, icon: Package, label: 'Packages' },
        { id: 'guests' as ViewType, icon: UserCheck, label: 'Guests' },
        { id: 'move-requests' as ViewType, icon: Truck, label: 'Move Requests' },
      ]
    },
    {
      title: 'STAFF',
      items: [
        { id: 'security' as ViewType, icon: Shield, label: 'Security' },
        { id: 'cleaning' as ViewType, icon: Sparkles, label: 'Cleaning' },
      ]
    },
    {
      title: 'UTILITIES',
      items: [
        { id: 'water-utility' as ViewType, icon: BarChart3, label: 'Water' },
        { id: 'electricity-utility' as ViewType, icon: BarChart3, label: 'Electricity' },
      ]
    },
    {
      title: 'TOOLS',
      items: [
        { id: 'reporting' as ViewType, icon: BarChart3, label: 'Reporting' },
        { id: 'scheduler' as ViewType, icon: CalendarIcon, label: 'Scheduler' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'user-settings' as ViewType, icon: UserIcon, label: 'Profile' },
        { id: 'system-settings' as ViewType, icon: Settings, label: 'System' },
      ]
    }
  ];

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    setSidebarOpen(false);
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">PropManager</h1>
              {user && (
                <p className="text-xs text-gray-400 truncate max-w-[150px]">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="block lg:hidden text-white hover:bg-gray-800 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Menu */}
        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
            {menuSections.map((section, sectionIndex) => {
              const isExpanded = expandedSections.has(section.title);
              return (
                <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
                  <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                    {section.title}
                  </h3>
                  <ul className="mb-6 flex flex-col gap-1.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleViewChange(item.id)}
                            className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 w-full text-left ${
                              isActive ? 'bg-graydark dark:bg-meta-4' : ''
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto border-t border-stroke px-6 py-4 dark:border-strokedark">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3.5 py-4 px-6 text-sm font-medium text-bodydark1 duration-300 ease-in-out hover:text-white lg:text-base"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col lg:ml-72.5">
        {/* Header */}
        <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
          <div className="flex flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11">
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden sm:block">
              <div className="relative">
                <h1 className="text-title-md2 font-semibold text-black dark:text-white">
                  Property Management System
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 2xsm:gap-7">
              <ul className="flex items-center gap-2 2xsm:gap-4">
                {/* User Profile */}
                <li className="relative">
                  <div className="flex items-center gap-4">
                    <span className="hidden text-right lg:block">
                      <span className="block text-sm font-medium text-black dark:text-white">
                        {user?.user_metadata?.full_name || 'User'}
                      </span>
                      <span className="block text-xs text-body dark:text-bodydark">
                        Property Manager
                      </span>
                    </span>
                    <span className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-600" />
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
