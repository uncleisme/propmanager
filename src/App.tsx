import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import Contracts from './components/Contracts';
import Licenses from './components/Licenses';
import Complaints from './components/Complaints';
import { ViewType, Contact, Contract, License, Complaint } from './types';
import { login, register, logout, isAuthenticated } from './utils/auth';
import { mockContacts, mockContracts, mockLicenses, mockComplaints } from './utils/mockData';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for data management
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [licenses, setLicenses] = useState<License[]>(mockLicenses);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);

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

  const handleRegister = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const success = await register(name, email, password);
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

  const handleAddContact = (newContact: Omit<Contact, 'id'>) => {
    const contact: Contact = {
      ...newContact,
      id: (contacts.length + 1).toString()
    };
    setContacts([...contacts, contact]);
  };

  const handleAddComplaint = (newComplaint: Omit<Complaint, 'id'>) => {
    const complaint: Complaint = {
      ...newComplaint,
      id: (complaints.length + 1).toString()
    };
    setComplaints([...complaints, complaint]);
  };

  const handleUpdateComplaint = (id: string, updatedComplaint: Partial<Complaint>) => {
    setComplaints(complaints.map(complaint => 
      complaint.id === id ? { ...complaint, ...updatedComplaint } : complaint
    ));
  };

  const handleAddContract = (newContract: Omit<Contract, 'id'>) => {
    const contract: Contract = {
      ...newContract,
      id: (contracts.length + 1).toString()
    };
    setContracts([...contracts, contract]);
  };

  const handleAddLicense = (newLicense: Omit<License, 'id'>) => {
    const license: License = {
      ...newLicense,
      id: (licenses.length + 1).toString()
    };
    setLicenses([...licenses, license]);
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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            contacts={contacts}
            contracts={contracts}
            licenses={licenses}
            complaints={complaints}
          />
        );
      case 'contacts':
        return <Contacts contacts={contacts} onAddContact={handleAddContact} />;
      case 'contracts':
        return <Contracts contracts={contracts} contacts={contacts} onAddContract={handleAddContract} />;
      case 'licenses':
        return <Licenses licenses={licenses} onAddLicense={handleAddLicense} />;
      case 'complaints':
        return (
          <Complaints
            complaints={complaints}
            contacts={contacts}
            onAddComplaint={handleAddComplaint}
            onUpdateComplaint={handleUpdateComplaint}
          />
        );
      default:
        return <Dashboard contacts={contacts} contracts={contracts} licenses={licenses} complaints={complaints} />;
    }
  };

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