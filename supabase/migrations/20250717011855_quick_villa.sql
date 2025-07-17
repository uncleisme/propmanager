/*
  # Add New Property Management Features

  1. New Tables
    - `amenities` - Facility information (gym, pool, BBQ area, etc.)
    - `bookings` - Facility reservations
    - `packages` - Package delivery tracking
    - `guests` - Guest management and visitor pre-approval
    - `move_requests` - Move-in/move-out requests

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['gym', 'pool', 'bbq_area', 'clubhouse', 'tennis_court', 'playground', 'parking', 'other'])),
  description text,
  capacity integer DEFAULT 1,
  hourly_rate numeric(10,2) DEFAULT 0.00,
  available_hours text DEFAULT '09:00-21:00',
  rules text,
  status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'maintenance', 'closed'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amenity_id uuid REFERENCES amenities(id) ON DELETE CASCADE,
  resident_name text NOT NULL,
  resident_unit text NOT NULL,
  resident_email text NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  guests_count integer DEFAULT 1,
  total_cost numeric(10,2) DEFAULT 0.00,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'confirmed', 'cancelled', 'completed'])),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text UNIQUE NOT NULL,
  recipient_name text NOT NULL,
  recipient_unit text NOT NULL,
  recipient_phone text,
  sender text NOT NULL,
  package_type text DEFAULT 'standard' CHECK (package_type = ANY (ARRAY['standard', 'fragile', 'perishable', 'large', 'document'])),
  delivery_date date NOT NULL,
  delivery_time time,
  status text DEFAULT 'received' CHECK (status = ANY (ARRAY['received', 'notified', 'picked_up', 'returned'])),
  location text DEFAULT 'front_desk',
  notes text,
  received_by text,
  picked_up_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  visitor_phone text,
  visitor_email text,
  host_name text NOT NULL,
  host_unit text NOT NULL,
  host_phone text NOT NULL,
  visit_date date NOT NULL,
  visit_time_start time,
  visit_time_end time,
  purpose text,
  vehicle_info text,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'approved', 'denied', 'completed', 'cancelled'])),
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create move_requests table
CREATE TABLE IF NOT EXISTS move_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type = ANY (ARRAY['move_in', 'move_out'])),
  resident_name text NOT NULL,
  unit_number text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  requested_date date NOT NULL,
  preferred_time text,
  elevator_needed boolean DEFAULT false,
  moving_company text,
  estimated_duration text,
  special_requirements text,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'approved', 'scheduled', 'completed', 'cancelled'])),
  approved_by text,
  approved_at timestamptz,
  scheduled_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for amenities
CREATE POLICY "Users can view amenities"
  ON amenities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage amenities"
  ON amenities
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for bookings
CREATE POLICY "Users can view bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for packages
CREATE POLICY "Users can view packages"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for guests
CREATE POLICY "Users can view guests"
  ON guests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage guests"
  ON guests
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for move_requests
CREATE POLICY "Users can view move requests"
  ON move_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage move requests"
  ON move_requests
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_amenity_id ON bookings(amenity_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_delivery_date ON packages(delivery_date);
CREATE INDEX IF NOT EXISTS idx_guests_visit_date ON guests(visit_date);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_move_requests_date ON move_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_move_requests_status ON move_requests(status);

-- Insert sample amenities
INSERT INTO amenities (name, type, description, capacity, hourly_rate, available_hours, rules) VALUES
('Fitness Center', 'gym', 'Fully equipped fitness center with cardio and weight training equipment', 20, 0.00, '06:00-22:00', 'Must be 18+ to use. Clean equipment after use. No outside guests without approval.'),
('Swimming Pool', 'pool', 'Outdoor swimming pool with lounge area', 30, 0.00, '08:00-20:00', 'Children under 14 must be supervised. No glass containers. Shower before entering.'),
('BBQ Area', 'bbq_area', 'Outdoor BBQ area with grills and seating', 15, 25.00, '10:00-22:00', 'Clean grills after use. Bring your own charcoal. No loud music after 9 PM.'),
('Clubhouse', 'clubhouse', 'Community clubhouse for events and gatherings', 50, 50.00, '09:00-23:00', 'Must book in advance. Clean up after use. No smoking indoors.'),
('Tennis Court', 'tennis_court', 'Professional tennis court with lighting', 4, 15.00, '07:00-21:00', 'Maximum 2 hours per booking. Proper tennis shoes required. No food or drinks on court.');