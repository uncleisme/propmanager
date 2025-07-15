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
  type: 'contractor' | 'supplier' | 'serviceProvider' | 'resident' | 'government' | 'others';
  notes?: string;
  created_at: string;
}

export interface Contract {
  expiration_date: string;
  id: string;
  title: string;
  contact_id: string;
  start_date: string;
  end_date: string;
  value: number;
  status: 'active' | 'expired' | 'pending';
  description: string;
  renewal_notice: number; // days before expiration to notify
}

export interface License {
  id: string;
  name: string;
  type: string;
  issuer: string;
  issue_date: string;
  expiration_date: string;
  license_number: string;
  status: 'active' | 'expired' | 'expiring';
  contact_id?: string;
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