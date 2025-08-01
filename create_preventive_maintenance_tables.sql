-- Preventive Maintenance Module Database Schema

-- 1. Asset Categories Table
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Maintenance Assets Table
CREATE TABLE IF NOT EXISTS public.maintenance_assets (
  id SERIAL PRIMARY KEY,
  asset_name TEXT NOT NULL,
  asset_code TEXT UNIQUE,
  category_id INTEGER REFERENCES public.asset_categories(id),
  location_building TEXT,
  location_floor TEXT,
  location_room TEXT,
  make_model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  installation_date DATE,
  specifications JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired', 'maintenance')),
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Maintenance Types Table
CREATE TABLE IF NOT EXISTS public.maintenance_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'preventive' CHECK (category IN ('preventive', 'corrective', 'predictive', 'condition_based')),
  estimated_duration INTEGER, -- in minutes
  required_skills TEXT[],
  safety_requirements TEXT[],
  tools_required TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Maintenance Schedules Table
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES public.maintenance_assets(id) ON DELETE CASCADE,
  maintenance_type_id INTEGER REFERENCES public.maintenance_types(id),
  schedule_name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom')),
  frequency_value INTEGER DEFAULT 1, -- every X days/weeks/months
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_duration INTEGER, -- in minutes
  assigned_to TEXT, -- staff member or contractor
  instructions TEXT,
  checklist JSONB, -- array of checklist items
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Maintenance Tasks Table
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES public.maintenance_schedules(id),
  asset_id INTEGER REFERENCES public.maintenance_assets(id),
  task_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  assigned_to TEXT,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  actual_duration INTEGER, -- in minutes
  completion_notes TEXT,
  checklist_results JSONB,
  parts_used JSONB, -- array of parts with quantities and costs
  labor_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  attachments TEXT[], -- array of file URLs
  created_by TEXT,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Maintenance History Table
CREATE TABLE IF NOT EXISTS public.maintenance_history (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES public.maintenance_assets(id),
  task_id INTEGER REFERENCES public.maintenance_tasks(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'overdue')),
  action_date TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT,
  details TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view asset_categories" ON public.asset_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert asset_categories" ON public.asset_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update asset_categories" ON public.asset_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete asset_categories" ON public.asset_categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view maintenance_assets" ON public.maintenance_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenance_assets" ON public.maintenance_assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenance_assets" ON public.maintenance_assets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenance_assets" ON public.maintenance_assets FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view maintenance_types" ON public.maintenance_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenance_types" ON public.maintenance_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenance_types" ON public.maintenance_types FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenance_types" ON public.maintenance_types FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view maintenance_schedules" ON public.maintenance_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenance_schedules" ON public.maintenance_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenance_schedules" ON public.maintenance_schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenance_schedules" ON public.maintenance_schedules FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view maintenance_tasks" ON public.maintenance_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenance_tasks" ON public.maintenance_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenance_tasks" ON public.maintenance_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenance_tasks" ON public.maintenance_tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view maintenance_history" ON public.maintenance_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenance_history" ON public.maintenance_history FOR INSERT TO authenticated WITH CHECK (true);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_category ON public.maintenance_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_status ON public.maintenance_assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_location ON public.maintenance_assets(location_building);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_asset ON public.maintenance_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_due ON public.maintenance_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_active ON public.maintenance_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_schedule ON public.maintenance_tasks(schedule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_asset ON public.maintenance_tasks(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON public.maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_scheduled_date ON public.maintenance_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_assigned ON public.maintenance_tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_maintenance_history_asset ON public.maintenance_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_task ON public.maintenance_history(task_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_date ON public.maintenance_history(action_date);

-- Insert Sample Asset Categories
INSERT INTO public.asset_categories (name, description, icon, color) VALUES
('HVAC', 'Heating, Ventilation, and Air Conditioning systems', 'wind', '#10B981'),
('Electrical', 'Electrical systems and equipment', 'zap', '#F59E0B'),
('Plumbing', 'Water and drainage systems', 'droplets', '#3B82F6'),
('Elevators', 'Vertical transportation systems', 'arrow-up-down', '#8B5CF6'),
('Fire Safety', 'Fire detection and suppression systems', 'flame', '#EF4444'),
('Security', 'Access control and surveillance systems', 'shield', '#6B7280'),
('Lighting', 'Indoor and outdoor lighting systems', 'lightbulb', '#FBBF24'),
('Structural', 'Building structure and exterior', 'building', '#6366F1'),
('Landscaping', 'Gardens and outdoor areas', 'trees', '#22C55E'),
('General', 'General building maintenance', 'wrench', '#64748B')
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Maintenance Types
INSERT INTO public.maintenance_types (name, description, category, estimated_duration, required_skills, safety_requirements, tools_required) VALUES
('Visual Inspection', 'Basic visual inspection for wear and damage', 'preventive', 30, ARRAY['observation'], ARRAY['safety_glasses'], ARRAY['flashlight', 'checklist']),
('Lubrication', 'Apply lubricants to moving parts', 'preventive', 45, ARRAY['mechanical'], ARRAY['gloves', 'safety_glasses'], ARRAY['lubricants', 'grease_gun']),
('Filter Replacement', 'Replace air and water filters', 'preventive', 60, ARRAY['mechanical'], ARRAY['gloves', 'dust_mask'], ARRAY['new_filters', 'screwdriver']),
('Cleaning', 'Deep cleaning of equipment and systems', 'preventive', 90, ARRAY['cleaning'], ARRAY['gloves', 'protective_clothing'], ARRAY['cleaning_supplies', 'vacuum']),
('Calibration', 'Calibrate sensors and control systems', 'preventive', 120, ARRAY['electrical', 'instrumentation'], ARRAY['electrical_safety'], ARRAY['multimeter', 'calibration_tools']),
('Performance Testing', 'Test system performance and efficiency', 'preventive', 180, ARRAY['technical'], ARRAY['safety_procedures'], ARRAY['testing_equipment']),
('Emergency Repair', 'Urgent repair work', 'corrective', 240, ARRAY['technical'], ARRAY['full_safety_kit'], ARRAY['tool_kit', 'spare_parts'])
ON CONFLICT DO NOTHING;

-- Create function to automatically update next_due_date
CREATE OR REPLACE FUNCTION update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate next due date based on frequency
  CASE NEW.frequency_type
    WHEN 'daily' THEN
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value || ' months')::INTERVAL;
    WHEN 'quarterly' THEN
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value * 3 || ' months')::INTERVAL;
    WHEN 'semi_annual' THEN
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value * 6 || ' months')::INTERVAL;
    WHEN 'annual' THEN
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value || ' years')::INTERVAL;
    ELSE
      NEW.next_due_date := NEW.start_date + (NEW.frequency_value || ' days')::INTERVAL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintenance_schedules
CREATE TRIGGER trigger_update_next_due_date
  BEFORE INSERT OR UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_due_date();

-- Create function to generate task numbers
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_number IS NULL THEN
    NEW.task_number := 'MT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('maintenance_task_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for task numbers
CREATE SEQUENCE IF NOT EXISTS maintenance_task_seq START 1;

-- Create trigger for task number generation
CREATE TRIGGER trigger_generate_task_number
  BEFORE INSERT ON public.maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_task_number();