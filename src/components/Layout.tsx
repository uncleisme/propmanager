import React from 'react';
import { Building2, Users, FileText, Award, AlertTriangle, BarChart3, LogOut, Menu, X, MapPin, Package, UserCheck, Truck, Settings, User } from 'lucide-react';
import { ViewType } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface LayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard' as ViewType, icon: BarChart3, label: 'Dashboard' },
    { id: 'building-info' as ViewType, icon: Building2, label: 'Building Info' },
    { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
    { id: 'contracts' as ViewType, icon: FileText, label: 'Contracts' },
    { id: 'licenses' as ViewType, icon: Award, label: 'Licenses' },
    { id: 'complaints' as ViewType, icon: AlertTriangle, label: 'Complaints' },
    { id: 'amenities' as ViewType, icon: MapPin, label: 'Amenities' },
    { id: 'packages' as ViewType, icon: Package, label: 'Packages' },
    { id: 'guests' as ViewType, icon: UserCheck, label: 'Guests' },
    { id: 'move-requests' as ViewType, icon: Truck, label: 'Move Requests' },
    { id: 'user-settings' as ViewType, icon: User, label: 'User Settings' },
    { id: 'system-settings' as ViewType, icon: Settings, label: 'System Settings' },
  ];

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">PropManager</h1>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        

        
        <nav className="mt-6">
  <div className="px-6 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between text-m text-black font-bold">
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

  {/* Existing menu items mapping */}
  {menuItems.map((item) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    
    return (
      <button
        key={item.id}
        onClick={() => handleViewChange(item.id)}
        className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors duration-200 ${
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  })}
</nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">PropManager</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;