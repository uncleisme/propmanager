-- Create lift_maintenance table
CREATE TABLE IF NOT EXISTS public.lift_maintenance (
  id SERIAL PRIMARY KEY,
  asset_name TEXT NOT NULL,
  asset_type TEXT DEFAULT 'Lift / Elevator',
  make_model TEXT,
  serial_number TEXT,
  capacity_kg INTEGER,
  capacity_persons INTEGER,
  installation_date DATE,
  location_building TEXT,
  location_floor TEXT,
  location_block TEXT,
  dosh_registration_number TEXT,
  last_cf_renewal_date DATE,
  next_cf_due_date DATE,
  contractor_vendor_name TEXT,
  competent_person_assigned TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.lift_maintenance ENABLE ROW LEVEL SECURITY;

-- Create policies for lift_maintenance
CREATE POLICY "Users can view lift_maintenance"
  ON public.lift_maintenance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert lift_maintenance"
  ON public.lift_maintenance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update lift_maintenance"
  ON public.lift_maintenance
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete lift_maintenance"
  ON public.lift_maintenance
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lift_maintenance_asset_name ON public.lift_maintenance(asset_name);
CREATE INDEX IF NOT EXISTS idx_lift_maintenance_location_building ON public.lift_maintenance(location_building);
CREATE INDEX IF NOT EXISTS idx_lift_maintenance_next_cf_due_date ON public.lift_maintenance(next_cf_due_date);
CREATE INDEX IF NOT EXISTS idx_lift_maintenance_contractor_vendor_name ON public.lift_maintenance(contractor_vendor_name); 