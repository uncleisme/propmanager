import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';

import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import BuildingInfo from './components/BuildingInfo';
import Contacts from './components/Contacts';
import Contracts from './components/Contracts';
import Licenses from './components/Licenses';
import Complaints from './components/Complaints';
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
import SchedulerModule from './components/Scheduler';
import SchedulerProvider from './components/SchedulerContext';
import StaffManagement from './components/StaffManagement';

import { ViewType } from './types';
type AppViewType = ViewType | 'scheduler';

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<AppViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
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

    return () => subscription.unsubscribe();
  }, [isNewUser]);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
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
  };

  // Handle registration
  const handleRegister = async (full_name: string, email: string, password: string) => {
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
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Dynamically render view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'building-info': return <BuildingInfo user={user} />;
      case 'contacts': return <Contacts user={user} />;
      case 'contracts': return <Contracts user={user} />;
      case 'licenses': return <Licenses user={user} />;
      case 'complaints': return <Complaints user={user} />;
      case 'amenities': return <Amenities user={user} />;
      case 'packages': return <Packages user={user} />;
      case 'guests': return <Guests user={user} />;
      case 'move-requests': return <MoveRequests user={user} />;
      case 'security': return <Security user={user} />;
      case 'cleaning': return <Cleaning user={user} />;
      case 'lift-maintenance': return <LiftMaintenance user={user} onViewChange={setCurrentView} />;
      case 'breakdown-history': return <BreakdownHistory user={user} onBack={() => setCurrentView('lift-maintenance')} />;
      case 'user-settings': return <UserSettings user={user} />;
      case 'system-settings': return <SystemSettings />;
      case 'water-utility': return <WaterUtility user={user} />;
      case 'electricity-utility': return <ElectricityUtility user={user} />;
      case 'reporting': return <Reporting user={user} />;
      case 'scheduler': return <SchedulerModule />;
      case 'staff-management': return <StaffManagement user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

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
    <SchedulerProvider>
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        user={user}
      >
        {renderCurrentView()}
      </Layout>
    </SchedulerProvider>
  );
};

export default App;
