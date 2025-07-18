export interface User {
  id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
  password?: string;
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
  propertyUnit?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Amenity {
  id: string;
  name: string;
  type: 'gym' | 'pool' | 'bbqArea' | 'clubhouse' | 'tennisCourt' | 'playground' | 'parking' | 'other';
  description?: string;
  capacity: number;
  hourlyRate: number;
  availableHours: string;
  rules?: string;
  status: 'active' | 'maintenance' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  amenityId: string;
  residentName: string;
  residentUnit: string;
  residentEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  guestsCount: number;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  trackingNumber: string;
  recipientName: string;
  recipientUnit: string;
  recipientPhone?: string;
  sender: string;
  packageType: 'standard' | 'fragile' | 'perishable' | 'large' | 'document';
  deliveryDate: string;
  deliveryTime?: string;
  status: 'received' | 'notified' | 'picked_up' | 'returned';
  location: string;
  notes?: string;
  receivedBy?: string;
  pickedUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  hostName: string;
  hostUnit: string;
  hostPhone: string;
  visitDate: string;
  visitTimeStart?: string;
  visitTimeEnd?: string;
  purpose?: string;
  vehicleInfo?: string;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoveRequest {
  id: string;
  requestType: 'move_in' | 'move_out';
  residentName: string;
  unitNumber: string;
  contactPhone: string;
  contactEmail: string;
  requestedDate: string;
  preferredTime?: string;
  elevatorNeeded: boolean;
  movingCompany?: string;
  estimatedDuration?: string;
  specialRequirements?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'completed' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingInfo {
  id: string;
  buildingName: string;
  buildingAddress: string;
  buildingType: 'condominium' | 'apartment' | 'townhouse' | 'commercial' | 'mixed_use';
  totalUnits: number;
  totalFloors: number;
  yearBuilt: number;
  propertyManagerName: string;
  propertyManagerCompany: string;
  propertyManagerPhone: string;
  propertyManagerEmail: string;
  jmbName?: string;
  jmbPhone?: string;
  jmbEmail?: string;
  jmbMembers: JmbMember[];
  maintenanceFee: number;
  sinkingFund: number;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  facilities: string[];
  parkingSpaces: number;
  securityFeatures: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface JmbMember {
  name: string;
  phone: string;
  email: string;
  position: string;
}
export interface SecurityPerson {
  id: string;
  name: string;
  identificationNumber: string;
  nationality: string;
  visaExpiryDate?: string;
  permitExpiryDate?: string;
  phoneNumber: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningPerson {
  id: string;
  name: string;
  identificationNumber: string;
  nationality: string;
  visaExpiryDate?: string;
  permitExpiryDate?: string;
  phoneNumber: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'dashboard' | 'building-info' | 'contacts' | 'contracts' | 'licenses' | 'complaints' | 'amenities' | 'packages' | 'guests' | 'move-requests' | 'security' | 'cleaning' | 'user-settings' | 'system-settings';