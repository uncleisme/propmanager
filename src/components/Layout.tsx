import React from 'react';
import {
  Building2, Users, FileText, Award, BarChart3, LogOut,
  Menu, X, MapPin, Package, UserCheck, Truck, Settings, User as UserIcon,
  Shield, Sparkles, Home, ArrowUpDown, UserCog, Wrench
} from 'lucide-react';
import { ViewType } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  children: React.ReactNode;
  user: SupabaseUser | null;
}

const menuSections = [
  {
    title: 'MENU',
    items: [
      { id: 'dashboard' as ViewType, icon: Home, label: 'Dashboard' },
    ]
  },
  {
    title: 'ASSET MANAGEMENT',
    items: [
      { id: 'asset-listing' as ViewType, icon: Package, label: 'Assets' },
      { id: 'location-listing' as ViewType, icon: MapPin, label: 'Locations' },
      { id: 'work-orders' as ViewType, icon: Wrench, label: 'Work Orders' },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { id: 'building-info' as ViewType, icon: Building2, label: 'Building Info' },
      { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
      { id: 'contracts' as ViewType, icon: FileText, label: 'Contracts' },
      { id: 'licenses' as ViewType, icon: Award, label: 'Licenses' },
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
    title: 'VENDOR MANAGEMENT',
    items: [
      { id: 'security' as ViewType, icon: Shield, label: 'Security' },
      { id: 'cleaning' as ViewType, icon: Sparkles, label: 'Cleaning' },
      { id: 'lift-maintenance' as ViewType, icon: ArrowUpDown, label: 'Lift Maintenance' },
      { id: 'staff-management' as ViewType, icon: UserCog, label: 'Staff Management' },
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

const Layout: React.FC<LayoutProps> = ({
  currentView,
  onViewChange,
  onLogout,
  children,
  user
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [now, setNow] = React.useState(new Date());
  const [dbStatus, setDbStatus] = React.useState<'Connected' | 'Disconnected'>('Connected');
  const [contactPhoto, setContactPhoto] = React.useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const checkDb = async () => {
      try {
        const { error } = await supabase.from('contacts').select('id').limit(1);
        setDbStatus(error ? 'Disconnected' : 'Connected');
      } catch {
        setDbStatus('Disconnected');
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 10000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (!error && data?.avatar_url) {
          setContactPhoto(data.avatar_url);
        } else {
          setContactPhoto(null);
        }
      }
    };
    fetchProfilePhoto();
  }, [user]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 bg-[#292745] text-white">
        {/* Logo/Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <span className="font-bold text-xl tracking-wide">PropManager</span>
        </div>
        {/* Clock and Date */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-lg font-mono" data-testid="sidebar-clock">{timeString}</div>
          <div className="text-xs text-gray-500" data-testid="sidebar-date">{dateString}</div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuSections.map(section => (
            <div key={section.title} className="mb-6">
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">{section.title}</div>
              <ul className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => { onViewChange(item.id); setSidebarOpen(false); }}
                        className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-150 ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            {contactPhoto ? (
              <img
                src={contactPhoto}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover bg-gray-700"
              />
            ) : (
              <span className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-300" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email || ''}</div>
            </div>
            <button onClick={onLogout} className="ml-2 text-gray-400 hover:text-red-400" title="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile Sidebar */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 flex-col w-56 h-screen bg-[#292745] text-white lg:hidden transition-transform duration-[1000ms] ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}
        style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <span className="font-bold text-xl tracking-wide">PropManager</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Clock and Date */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-lg font-mono" data-testid="sidebar-clock">{timeString}</div>
          <div className="text-xs text-gray-500" data-testid="sidebar-date">{dateString}</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuSections.map(section => (
            <div key={section.title} className="mb-6">
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wider">{section.title}</div>
              <ul className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => { onViewChange(item.id); setSidebarOpen(false); }}
                        className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-150 ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            {contactPhoto ? (
              <img
                src={contactPhoto}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover bg-gray-700"
              />
            ) : (
              <span className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-300" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || 'User'}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email || ''}</div>
            </div>
            <button onClick={onLogout} className="ml-2 text-gray-400 hover:text-red-400" title="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      {/* Main content area */}
      <div className="flex-1 bg-gray-100">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white shadow flex items-center justify-between h-16 px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-lg text-gray-800">Property Management System</span>
          </div>
          <div className="relative hidden md:flex" ref={profileDropdownRef}>
            <button
              className="flex items-center focus:outline-none"
              onClick={() => setProfileDropdownOpen((open) => !open)}
              aria-label="Open profile menu"
            >
              {contactPhoto ? (
                <img
                  src={contactPhoto}
                  alt="User Avatar"
                  className="h-10 w-10 rounded-full object-cover bg-gray-300 border border-gray-200"
                />
              ) : (
                <span className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center border border-gray-200">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </span>
              )}
            </button>
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-100">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onViewChange('user-settings');
                  }}
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onViewChange('system-settings');
                  }}
                >
                  Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 xl:px-12">
          {children}
        </main>
        <footer className="w-full py-4 px-8 bg-white text-center text-xs text-gray-400 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} PropManager. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${dbStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Database: {dbStatus}
          </span>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
