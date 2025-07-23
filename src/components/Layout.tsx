import React from 'react';
import { 
  Building2, Users, FileText, Award, AlertTriangle, BarChart3, LogOut, 
  Menu, X, MapPin, Package, UserCheck, Truck, Settings, User as UserIcon, Clock, Calendar, 
  ChevronDown, ChevronRight, Shield, Sparkles, Calendar as CalendarIcon 
} from 'lucide-react';
import { ViewType, BuildingInfo, User as AppUser } from '../types';
import { User as User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { useEffect, useState } from 'react';

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
    <footer className="w-full bg-white border-t border-gray-200 py-2 px-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-500">
      <span>© {new Date().getFullYear()} PropManager. All rights reserved.</span>
      <span className="flex items-center gap-1 mt-1 sm:mt-0">
        <span className={status === 'online' ? 'inline-block w-2 h-2 rounded-full bg-green-500' : 'inline-block w-2 h-2 rounded-full bg-red-500'}></span>
        Supabase: {status === 'online' ? 'Online' : 'Offline'}
      </span>
    </footer>
  );
};

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  children: React.ReactNode;
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  onViewChange, 
  onLogout, 
  children,
  user 
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());
  // Header state for building info and avatar dropdown
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchBuildingInfo = async () => {
      const { data } = await supabase.from('buildingInfo').select('*').limit(1).single();
      setBuildingInfo(data);
    };
    fetchBuildingInfo();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [user && user.id]);

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard' },
        { id: 'building-info' as ViewType, icon: Building2, label: 'Building Info' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
        { id: 'contracts' as ViewType, icon: FileText, label: 'Contracts' },
        { id: 'licenses' as ViewType, icon: Award, label: 'Licenses' },
        { id: 'complaints' as ViewType, icon: AlertTriangle, label: 'Work Order' },
      ]
    },
    {
      title: 'Services',
      items: [
        { id: 'amenities' as ViewType, icon: MapPin, label: 'Amenities' },
        { id: 'packages' as ViewType, icon: Package, label: 'Packages' },
        { id: 'guests' as ViewType, icon: UserCheck, label: 'Guests' },
        { id: 'move-requests' as ViewType, icon: Truck, label: 'Move Requests' },
      ]
    },
    {
      title: 'Service Providers',
      items: [
        { id: 'security' as ViewType, icon: Shield, label: 'Security' },
        { id: 'cleaning' as ViewType, icon: Sparkles, label: 'Cleaning' },
      ]
    },
    {
      title: 'Utilities',
      items: [
        { id: 'water-utility' as ViewType, icon: BarChart3, label: 'Water' },
        { id: 'electricity-utility' as ViewType, icon: BarChart3, label: 'Electricity' },
      ]
    },
    {
      title: 'Reporting',
      items: [
        { id: 'reporting' as ViewType, icon: BarChart3, label: 'Reporting' },
      ]
    },
    {
      title: 'Scheduler',
      items: [
        { id: 'scheduler' as ViewType, icon: CalendarIcon, label: 'Scheduler' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { id: 'user-settings' as ViewType, icon: UserIcon, label: 'User Settings' },
        { id: 'system-settings' as ViewType, icon: Settings, label: 'System Settings' },
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
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg border-r border-gray-200 z-40 flex flex-col">
          <div className="h-16 flex items-center justify-center border-b">
            <span className="font-bold text-lg">PropManager</span>
          </div>
          {/* Navigation links here (existing nav code) */}
          <nav className="flex-1 overflow-y-auto pb-24">
            {menuSections.map((section, sectionIndex) => {
              const isExpanded = expandedSections.has(section.title);
              return (
                <div key={section.title} className={sectionIndex > 0 ? 'border-t border-gray-200 mt-2 pt-2' : ''}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-2 text-left hover:bg-gray-50 transition-colors duration-200"
                  >
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {section.title}
                    </h3>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div className={`transition-all duration-200 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleViewChange(item.id)}
                          className={`w-full flex items-center space-x-3 px-6 py-2.5 text-left transition-colors duration-200 text-xs sm:text-sm ${isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>
        {/* Main content area */}
        <div className="flex-1 min-h-screen ml-0 lg:ml-64 flex flex-col">
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b py-4 px-8 w-full lg:ml-64 h-14 flex items-center">
            <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
              <span className="font-semibold text-gray-900 text-lg">Dashboard</span>
              {user && (
                <div className="relative flex items-center">
                  <button
                    className="focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={avatarMenuOpen ? 'true' : 'false'}
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                    tabIndex={0}
                  >
                    {profile && profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full border border-gray-300 object-cover ring-2 ring-blue-100"
                        title={user.email || 'User'}
                      />
                    ) : user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full border border-gray-300 object-cover ring-2 ring-blue-100"
                        title={user.email || 'User'}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-gray-300 ring-2 ring-blue-100"
                        title={user.email}
                      >
                        {user.email ? user.email.split('@')[0].slice(0,2).toUpperCase() : ''}
                      </div>
                    )}
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                      <button
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          if (typeof onLogout === 'function') {
                            onLogout();
                          } else {
                            window.location.reload();
                          }
                        }}
                      >
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>
          {/* Main content */}
          <main className="flex-1 max-w-6xl mx-auto w-full p-4 pt-14">
            {children}
          </main>
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Layout;