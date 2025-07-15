import { Contact, Contract, License, Complaint } from '../types';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Smith Plumbing Services',
    email: 'john@smithplumbing.com',
    phone: '(555) 123-4567',
    address: '123 Main Street, Springfield, IL 62701',
    type: 'contractor',
    notes: 'Reliable plumber, available for emergency calls',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'Elite Cleaning Co.',
    email: 'sarah@elitecleaning.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue, Springfield, IL 62702',
    type: 'maintenance',
    notes: 'Weekly cleaning service provider',
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    company: 'Rodriguez HVAC',
    email: 'mike@rodriguezhvac.com',
    phone: '(555) 345-6789',
    address: '789 Pine Road, Springfield, IL 62703',
    type: 'contractor',
    notes: 'HVAC specialist, annual maintenance contracts',
    createdAt: '2024-01-20'
  },
  {
    id: '4',
    name: 'Jennifer Lee',
    company: 'Property Legal Advisors',
    email: 'jlee@propertylegal.com',
    phone: '(555) 456-7890',
    address: '321 Elm Street, Suite 200, Springfield, IL 62704',
    type: 'legal',
    notes: 'Property law attorney',
    createdAt: '2024-02-01'
  }
];

export const mockContracts: Contract[] = [
  {
    id: '1',
    title: 'Annual HVAC Maintenance Contract',
    contactId: '3',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    value: 5000,
    status: 'active',
    description: 'Quarterly HVAC system maintenance and emergency repair services',
    renewalNotice: 30
  },
  {
    id: '2',
    title: 'Weekly Cleaning Services',
    contactId: '2',
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    value: 2400,
    status: 'active',
    description: 'Weekly cleaning of common areas and office spaces',
    renewalNotice: 14
  },
  {
    id: '3',
    title: 'Emergency Plumbing Services',
    contactId: '1',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    value: 3000,
    status: 'active',
    description: '24/7 emergency plumbing services and routine maintenance',
    renewalNotice: 60
  }
];

export const mockLicenses: License[] = [
  {
    id: '1',
    name: 'Property Management License',
    type: 'Business License',
    issuer: 'City of Springfield',
    issueDate: '2023-03-01',
    expirationDate: '2025-03-01',
    licenseNumber: 'PM-2023-001234',
    status: 'active'
  },
  {
    id: '2',
    name: 'Fire Safety Certificate',
    type: 'Safety Certificate',
    issuer: 'State Fire Department',
    issueDate: '2024-01-15',
    expirationDate: '2024-07-15',
    licenseNumber: 'FS-2024-5678',
    status: 'expiring'
  },
  {
    id: '3',
    name: 'Building Occupancy Permit',
    type: 'Occupancy Permit',
    issuer: 'Building Department',
    issueDate: '2023-09-01',
    expirationDate: '2024-09-01',
    licenseNumber: 'OP-2023-9012',
    status: 'active'
  }
];

export const mockComplaints: Complaint[] = [
  {
    id: '1',
    title: 'Water leak in Unit 204',
    description: 'Tenant reports water leak from ceiling in bathroom, causing damage to personal belongings.',
    priority: 'high',
    status: 'in-progress',
    contactId: '1',
    propertyUnit: 'Unit 204',
    createdAt: '2024-02-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Heating system not working',
    description: 'Multiple tenants in Building A report heating system failure.',
    priority: 'critical',
    status: 'open',
    contactId: '3',
    propertyUnit: 'Building A',
    createdAt: '2024-02-14T08:15:00Z'
  },
  {
    id: '3',
    title: 'Noise complaint from neighbor',
    description: 'Ongoing noise issues between units 301 and 302.',
    priority: 'medium',
    status: 'resolved',
    propertyUnit: 'Unit 301',
    createdAt: '2024-02-10T14:20:00Z',
    resolvedAt: '2024-02-12T16:00:00Z'
  },
  {
    id: '4',
    title: 'Parking space dispute',
    description: 'Tenants disputing assigned parking spaces in lot B.',
    priority: 'low',
    status: 'closed',
    propertyUnit: 'Parking Lot B',
    createdAt: '2024-02-08T11:45:00Z',
    resolvedAt: '2024-02-09T09:30:00Z'
  }
];