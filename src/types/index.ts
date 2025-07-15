export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  type: 'contractor' | 'vendor' | 'maintenance' | 'legal' | 'other';
  notes?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  title: string;
  contactId: string;
  startDate: string;
  endDate: string;
  value: number;
  status: 'active' | 'expired' | 'pending';
  description: string;
  renewalNotice: number; // days before expiration to notify
}

export interface License {
  id: string;
  name: string;
  type: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  licenseNumber: string;
  status: 'active' | 'expired' | 'expiring';
  contactId?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  contactId?: string;
  propertyUnit?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type ViewType = 'dashboard' | 'contacts' | 'contracts' | 'licenses' | 'complaints';