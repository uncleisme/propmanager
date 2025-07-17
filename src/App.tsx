import React, { useState, useEffect } from 'react';
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
import UserSettings from './components/UserSettings';
import SystemSettings from './components/SystemSettings';
import { ViewType } from './types';
import { login, register, logout, isAuthenticated } from './utils/auth';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        setAuthenticated(true);
      } else {
        throw new Error('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (full_name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const success = await register(full_name, email, password);
      if (success) {
        setAuthenticated(true);
      } else {
        throw new Error('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'building-info':
        return <BuildingInfo />;
      case 'contacts':
        return <Contacts />;
      case 'contracts':
        return <Contracts />;
      case 'licenses':
        return <Licenses />;
      case 'complaints':
        return <Complaints />;
      case 'amenities':
        return <Amenities />;
      case 'packages':
        return <Packages />;
      case 'guests':
        return <Guests />;
      case 'move-requests':
        return <MoveRequests />;
      case 'user-settings':
        return <UserSettings />;
      case 'system-settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  if (!authenticated) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowRegister(false)}
          isLoading={isLoading}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
    >
      {renderCurrentView()}
    </Layout>
  );
}

export default App;
