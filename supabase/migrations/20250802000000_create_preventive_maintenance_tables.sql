-- Preventive Maintenance Module Database Schema (camelCase)

-- Enable RLS on all tables
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 1. Asset Categories Table
CREATE TABLE IF NOT EXISTS public.assetCategories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assetCategories ENABLE ROW LEVEL SECURITY;

-- 2. Maintenance Assets Table
CREATE TABLE IF NOT EXISTS public.maintenanceAssets (
  id SERIAL PRIMARY KEY,
  assetName TEXT NOT NULL,
  assetCode TEXT UNIQUE,
  categoryId INTEGER REFERENCES public.assetCategories(id),
  locationBuilding TEXT,
  locationFloor TEXT,
  locationRoom TEXT,
  makeModel TEXT,
  serialNumber TEXT,
  purchaseDate DATE,
  warrantyExpiry DATE,
  installationDate DATE,
  specifications JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired', 'maintenance')),
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenanceAssets ENABLE ROW LEVEL SECURITY;

-- 3. Maintenance Types Table
CREATE TABLE IF NOT EXISTS public.maintenanceTypes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'preventive' CHECK (category IN ('preventive', 'corrective', 'predictive', 'condition_based')),
  estimatedDuration INTEGER, -- in minutes
  requiredSkills TEXT[],
  safetyRequirements TEXT[],
  toolsRequired TEXT[],
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenanceTypes ENABLE ROW LEVEL SECURITY;

-- 4. Maintenance Schedules Table
CREATE TABLE IF NOT EXISTS public.maintenanceSchedules (
  id SERIAL PRIMARY KEY,
  assetId INTEGER REFERENCES public.maintenanceAssets(id) ON DELETE CASCADE,
  maintenanceTypeId INTEGER REFERENCES public.maintenanceTypes(id),
  scheduleName TEXT NOT NULL,
  description TEXT,
  frequencyType TEXT NOT NULL CHECK (frequencyType IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom')),
  frequencyValue INTEGER DEFAULT 1, -- every X days/weeks/months
  startDate DATE NOT NULL,
  endDate DATE,
  nextDueDate DATE NOT NULL,
  lastCompletedDate DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimatedDuration INTEGER, -- in minutes
  assignedTo TEXT, -- staff member or contractor
  instructions TEXT,
  checklist JSONB, -- array of checklist items
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenanceSchedules ENABLE ROW LEVEL SECURITY;

-- 5. Maintenance Tasks Table
CREATE TABLE IF NOT EXISTS public.maintenanceTasks (
  id SERIAL PRIMARY KEY,
  scheduleId INTEGER REFERENCES public.maintenanceSchedules(id),
  assetId INTEGER REFERENCES public.maintenanceAssets(id),
  taskNumber TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  scheduledDate DATE NOT NULL,
  scheduledStartTime TIME,
  scheduledEndTime TIME,
  assignedTo TEXT,
  actualStartTime TIMESTAMPTZ,
  actualEndTime TIMESTAMPTZ,
  actualDuration INTEGER, -- in minutes
  completionNotes TEXT,
  checklistResults JSONB,
  partsUsed JSONB, -- array of parts with quantities and costs
  laborCost DECIMAL(10,2),
  partsCost DECIMAL(10,2),
  totalCost DECIMAL(10,2),
  attachments TEXT[], -- array of file URLs
  createdBy TEXT,
  completedBy TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenanceTasks ENABLE ROW LEVEL SECURITY;

-- 6. Maintenance History Table
CREATE TABLE IF NOT EXISTS public.maintenanceHistory (
  id SERIAL PRIMARY KEY,
  assetId INTEGER REFERENCES public.maintenanceAssets(id),
  taskId INTEGER REFERENCES public.maintenanceTasks(id),
  actionType TEXT NOT NULL CHECK (actionType IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'overdue')),
  actionDate TIMESTAMPTZ DEFAULT NOW(),
  performedBy TEXT,
  details TEXT,
  oldValues JSONB,
  newValues JSONB,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenanceHistory ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for all tables
-- Asset Categories Policies
CREATE POLICY "Users can view assetCategories" ON public.assetCategories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert assetCategories" ON public.assetCategories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update assetCategories" ON public.assetCategories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete assetCategories" ON public.assetCategories FOR DELETE TO authenticated USING (true);

-- Maintenance Assets Policies
CREATE POLICY "Users can view maintenanceAssets" ON public.maintenanceAssets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenanceAssets" ON public.maintenanceAssets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenanceAssets" ON public.maintenanceAssets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenanceAssets" ON public.maintenanceAssets FOR DELETE TO authenticated USING (true);

-- Maintenance Types Policies
CREATE POLICY "Users can view maintenanceTypes" ON public.maintenanceTypes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenanceTypes" ON public.maintenanceTypes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenanceTypes" ON public.maintenanceTypes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenanceTypes" ON public.maintenanceTypes FOR DELETE TO authenticated USING (true);

-- Maintenance Schedules Policies
CREATE POLICY "Users can view maintenanceSchedules" ON public.maintenanceSchedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenanceSchedules" ON public.maintenanceSchedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenanceSchedules" ON public.maintenanceSchedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenanceSchedules" ON public.maintenanceSchedules FOR DELETE TO authenticated USING (true);

-- Maintenance Tasks Policies
CREATE POLICY "Users can view maintenanceTasks" ON public.maintenanceTasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenanceTasks" ON public.maintenanceTasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenanceTasks" ON public.maintenanceTasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenanceTasks" ON public.maintenanceTasks FOR DELETE TO authenticated USING (true);

-- Maintenance History Policies
CREATE POLICY "Users can view maintenanceHistory" ON public.maintenanceHistory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert maintenanceHistory" ON public.maintenanceHistory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update maintenanceHistory" ON public.maintenanceHistory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete maintenanceHistory" ON public.maintenanceHistory FOR DELETE TO authenticated USING (true);

-- Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenanceAssets_category ON public.maintenanceAssets(categoryId);
CREATE INDEX IF NOT EXISTS idx_maintenanceAssets_status ON public.maintenanceAssets(status);
CREATE INDEX IF NOT EXISTS idx_maintenanceAssets_location ON public.maintenanceAssets(locationBuilding);

CREATE INDEX IF NOT EXISTS idx_maintenanceSchedules_asset ON public.maintenanceSchedules(assetId);
CREATE INDEX IF NOT EXISTS idx_maintenanceSchedules_nextDue ON public.maintenanceSchedules(nextDueDate);
CREATE INDEX IF NOT EXISTS idx_maintenanceSchedules_active ON public.maintenanceSchedules(isActive);

CREATE INDEX IF NOT EXISTS idx_maintenanceTasks_schedule ON public.maintenanceTasks(scheduleId);
CREATE INDEX IF NOT EXISTS idx_maintenanceTasks_asset ON public.maintenanceTasks(assetId);
CREATE INDEX IF NOT EXISTS idx_maintenanceTasks_status ON public.maintenanceTasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenanceTasks_scheduledDate ON public.maintenanceTasks(scheduledDate);
CREATE INDEX IF NOT EXISTS idx_maintenanceTasks_assignedTo ON public.maintenanceTasks(assignedTo);

CREATE INDEX IF NOT EXISTS idx_maintenanceHistory_asset ON public.maintenanceHistory(assetId);
CREATE INDEX IF NOT EXISTS idx_maintenanceHistory_task ON public.maintenanceHistory(taskId);
CREATE INDEX IF NOT EXISTS idx_maintenanceHistory_actionDate ON public.maintenanceHistory(actionDate);

-- Insert Sample Asset Categories (camelCase)
INSERT INTO public.assetCategories (name, description, icon, color) VALUES
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

-- Insert Sample Maintenance Types (camelCase)
INSERT INTO public.maintenanceTypes (name, description, category, estimatedDuration, requiredSkills, safetyRequirements, toolsRequired) VALUES
('Visual Inspection', 'Basic visual inspection for wear and damage', 'preventive', 30, ARRAY['observation'], ARRAY['safety_glasses'], ARRAY['flashlight', 'checklist']),
('Lubrication', 'Apply lubricants to moving parts', 'preventive', 45, ARRAY['mechanical'], ARRAY['gloves', 'safety_glasses'], ARRAY['lubricants', 'grease_gun']),
('Filter Replacement', 'Replace air and water filters', 'preventive', 60, ARRAY['mechanical'], ARRAY['gloves', 'dust_mask'], ARRAY['new_filters', 'screwdriver']),
('Cleaning', 'Deep cleaning of equipment and systems', 'preventive', 90, ARRAY['cleaning'], ARRAY['gloves', 'protective_clothing'], ARRAY['cleaning_supplies', 'vacuum']),
('Calibration', 'Calibrate sensors and control systems', 'preventive', 120, ARRAY['electrical', 'instrumentation'], ARRAY['electrical_safety'], ARRAY['multimeter', 'calibration_tools']),
('Performance Testing', 'Test system performance and efficiency', 'preventive', 180, ARRAY['technical'], ARRAY['safety_procedures'], ARRAY['testing_equipment']),
('Emergency Repair', 'Urgent repair work', 'corrective', 240, ARRAY['technical'], ARRAY['full_safety_kit'], ARRAY['tool_kit', 'spare_parts'])
ON CONFLICT DO NOTHING;

-- Create function to automatically update nextDueDate (camelCase)
CREATE OR REPLACE FUNCTION update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate next due date based on frequency
  CASE NEW.frequencyType
    WHEN 'daily' THEN
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue || ' months')::INTERVAL;
    WHEN 'quarterly' THEN
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue * 3 || ' months')::INTERVAL;
    WHEN 'semi_annual' THEN
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue * 6 || ' months')::INTERVAL;
    WHEN 'annual' THEN
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue || ' years')::INTERVAL;
    ELSE
      NEW.nextDueDate := NEW.startDate + (NEW.frequencyValue || ' days')::INTERVAL;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintenanceSchedules
CREATE TRIGGER trigger_update_next_due_date
  BEFORE INSERT OR UPDATE ON public.maintenanceSchedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_due_date();

-- Create function to generate task numbers (camelCase)
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.taskNumber IS NULL THEN
    NEW.taskNumber := 'MT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('maintenance_task_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for task numbers
CREATE SEQUENCE IF NOT EXISTS maintenance_task_seq START 1;

-- Create trigger for task number generation
CREATE TRIGGER trigger_generate_task_number
  BEFORE INSERT ON public.maintenanceTasks
  FOR EACH ROW
  EXECUTE FUNCTION generate_task_number();

-- Create function to automatically log maintenance history
CREATE OR REPLACE FUNCTION log_maintenance_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Log task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.maintenanceHistory (
      assetId, taskId, actionType, actionDate, performedBy, details, newValues
    ) VALUES (
      NEW.assetId, NEW.id, 'scheduled', NOW(), NEW.createdBy, 
      'Task created: ' || NEW.title,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  
  -- Log task updates
  IF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO public.maintenanceHistory (
        assetId, taskId, actionType, actionDate, performedBy, details, oldValues, newValues
      ) VALUES (
        NEW.assetId, NEW.id, NEW.status, NOW(), NEW.completedBy,
        'Status changed from ' || OLD.status || ' to ' || NEW.status,
        to_jsonb(OLD), to_jsonb(NEW)
      );
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintenance history logging
CREATE TRIGGER trigger_log_maintenance_history
  AFTER INSERT OR UPDATE ON public.maintenanceTasks
  FOR EACH ROW
  EXECUTE FUNCTION log_maintenance_history();

-- Add comments for documentation
COMMENT ON TABLE public.assetCategories IS 'Categories for organizing maintenance assets';
COMMENT ON TABLE public.maintenanceAssets IS 'Physical assets that require maintenance';
COMMENT ON TABLE public.maintenanceTypes IS 'Types of maintenance activities';
COMMENT ON TABLE public.maintenanceSchedules IS 'Recurring maintenance schedules for assets';
COMMENT ON TABLE public.maintenanceTasks IS 'Individual maintenance tasks generated from schedules';
COMMENT ON TABLE public.maintenanceHistory IS 'Audit trail for all maintenance activities';

COMMENT ON FUNCTION update_next_due_date() IS 'Automatically calculates the next due date for maintenance schedules';
COMMENT ON FUNCTION generate_task_number() IS 'Generates unique task numbers for maintenance tasks';
COMMENT ON FUNCTION log_maintenance_history() IS 'Automatically logs maintenance task changes to history table';
