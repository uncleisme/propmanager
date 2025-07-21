import React from 'react';
import { 
  Building2, Users, FileText, Award, AlertTriangle, BarChart3, LogOut, 
  Menu, X, MapPin, Package, UserCheck, Truck, Settings, User as UserIcon, Clock, Calendar, 
  ChevronDown, ChevronRight, Shield, Sparkles 
} from 'lucide-react';
import { ViewType } from '../types';
import { User as User } from '@supabase/supabase-js';

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
        { id: 'complaints' as ViewType, icon: AlertTriangle, label: 'Complaints' },
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:w-64`}
        style={{ minWidth: 0 }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">PropManager</h1>
              {user && (
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        {/* Date/Time */}
        <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200">
          <div className="flex items-center justify-between text-xs sm:text-m text-black font-bold">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        {/* Menu Sections */}
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
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200 text-xs sm:text-base"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-2 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">PropManager</h1>
              {user && (
                <span className="text-xs text-gray-500 truncate max-w-[100px]">
                  ({user.email})
                </span>
              )}
            </div>
            <div className="w-10" />
          </div>
        </div>
        <main className="p-2 sm:p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;