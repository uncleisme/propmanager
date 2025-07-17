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
  createdAt: string;
}

export interface Contract {
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
  issueDate: string;
  expirationDate: string;
  licenseNumber: string;
  status: 'active' | 'expired' | 'expiring';
  contact_id?: string;
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
  type: 'gym' | 'pool' | 'bbq_area' | 'clubhouse' | 'tennis_court' | 'playground' | 'parking' | 'other';
  description?: string;
  capacity: number;
  hourly_rate: number;
  available_hours: string;
  rules?: string;
  status: 'active' | 'maintenance' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  amenity_id: string;
  resident_name: string;
  resident_unit: string;
  resident_email: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  total_cost: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_unit: string;
  recipient_phone?: string;
  sender: string;
  package_type: 'standard' | 'fragile' | 'perishable' | 'large' | 'document';
  delivery_date: string;
  delivery_time?: string;
  status: 'received' | 'notified' | 'picked_up' | 'returned';
  location: string;
  notes?: string;
  received_by?: string;
  picked_up_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  visitor_name: string;
  visitor_phone?: string;
  visitor_email?: string;
  host_name: string;
  host_unit: string;
  host_phone: string;
  visit_date: string;
  visit_time_start?: string;
  visit_time_end?: string;
  purpose?: string;
  vehicle_info?: string;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MoveRequest {
  id: string;
  request_type: 'move_in' | 'move_out';
  resident_name: string;
  unit_number: string;
  contact_phone: string;
  contact_email: string;
  requested_date: string;
  preferred_time?: string;
  elevator_needed: boolean;
  moving_company?: string;
  estimated_duration?: string;
  special_requirements?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'completed' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  scheduled_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingInfo {
  id: string;
  building_name: string;
  building_address: string;
  building_type: 'condominium' | 'apartment' | 'townhouse' | 'commercial' | 'mixed_use';
  total_units: number;
  total_floors: number;
  year_built: number;
  property_manager_name: string;
  property_manager_company: string;
  property_manager_phone: string;
  property_manager_email: string;
  jmb_name?: string;
  jmb_chairman?: string;
  jmb_secretary?: string;
  jmb_treasurer?: string;
  jmb_phone?: string;
  jmb_email?: string;
  maintenance_fee: number;
  sinking_fund: number;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  facilities: string[];
  parking_spaces: number;
  security_features: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ViewType = 'dashboard' | 'building-info' | 'contacts' | 'contracts' | 'licenses' | 'complaints' | 'amenities' | 'packages' | 'guests' | 'move-requests';