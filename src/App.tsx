import React, { useState, useEffect, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from './utils/supabaseClient';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout and Auth Components
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';

// Feature Components
import Dashboard from './components/Dashboard';
import BuildingInfo from './components/BuildingInfo';
import Contacts from './components/Contacts';
import Contracts from './components/Contracts';
import Licenses from './components/Licenses';
import Amenities from './components/Amenities';
import Packages from './components/Packages';
import Guests from './components/Guests';
import MoveRequests from './components/MoveRequests';
import Security from './components/Security';
import Cleaning from './components/Cleaning';
import LiftMaintenance from './components/LiftMaintenance';
import BreakdownHistory from './components/BreakdownHistory';
import UserSettings from './components/UserSettings';
import SystemSettings from './components/SystemSettings';
import WaterUtility from './components/WaterUtility';
import ElectricityUtility from './components/ElectricityUtility';
import Reporting from './components/Reporting';
import StaffManagement from './components/StaffManagement';
import AssetListing from './components/AssetListing';
import LocationListing from './components/LocationListing';
import WorkOrderManagement from './components/WorkOrderManagement';

import { ViewType } from './types';
type AppViewType = ViewType;

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<AppViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Handle authentication state
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthenticated(!!session);
      setUser(session?.user ?? null);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(!!session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setCurrentView('dashboard');
        setIsNewUser(false);
      }
      
      if (event === 'SIGNED_IN' && isNewUser) {
        setCurrentView('user-settings');
        setIsNewUser(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isNewUser]);

  // Handle login
  const handleLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle registration
  const handleRegister = useCallback(async (full_name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } }
      });
      if (error) throw error;
      setIsNewUser(true);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Dynamically render view based on current route
  const renderCurrentView = useCallback(() => {
    // Components that require the user prop
    const componentsWithUser = {
      'user-settings': <UserSettings user={user} />,
      'security': <Security user={user} />,
      'cleaning': <Cleaning user={user} />,
      'breakdown-history': <BreakdownHistory user={user} onBack={() => setCurrentView('lift-maintenance')} />,
      'staff-management': <StaffManagement user={user} />,
      'asset-listing': <AssetListing user={user} />,
      'location-listing': <LocationListing user={user} />,
      'work-orders': <WorkOrderManagement user={user} />,
      'lift-maintenance': <LiftMaintenance user={user} onViewChange={(view) => setCurrentView(view as ViewType)} />,
      'building-info': <BuildingInfo user={user} />
    };

    // Components that don't need the user prop
    const componentsWithoutUser = {
      'dashboard': <Dashboard user={user} />,
      'contacts': <Contacts />,
      'contracts': <Contracts />,
      'licenses': <Licenses />,
      'amenities': <Amenities />,
      'packages': <Packages />,
      'guests': <Guests />,
      'move-requests': <MoveRequests />,
      'system-settings': <SystemSettings />,
      'water-utility': <WaterUtility />,
      'electricity-utility': <ElectricityUtility />,
      'reporting': <Reporting />
    };

    // Check if the current view is in the componentsWithUser object
    if (Object.prototype.hasOwnProperty.call(componentsWithUser, currentView)) {
      return componentsWithUser[currentView as keyof typeof componentsWithUser];
    }

    // Check if the current view is in the componentsWithoutUser object
    if (Object.prototype.hasOwnProperty.call(componentsWithoutUser, currentView)) {
      return componentsWithoutUser[currentView as keyof typeof componentsWithoutUser];
    }

    // Default to dashboard with user prop
    return <Dashboard user={user} />;
  }, [currentView, user]);



  // Render authentication views
  if (!authenticated) {
    return showRegister ? (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setShowRegister(false)}
        isLoading={isLoading}
      />
    ) : (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
        isLoading={isLoading}
      />
    );
  }

  // Render main app layout
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        <Layout
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
          user={user}
        >
          {renderCurrentView()}
        </Layout>
      </div>
    </NotificationProvider>
  );
};

export default App;
