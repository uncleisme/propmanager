-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id TEXT NOT NULL UNIQUE,
    work_type TEXT NOT NULL CHECK (work_type IN ('Preventive', 'Complaint', 'Job', 'Repair')),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Active', 'In Progress', 'Review', 'Done')) DEFAULT 'Active',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE NOT NULL,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Preventive-specific fields
    recurrence_rule TEXT, -- RRULE format (e.g., FREQ=MONTHLY;INTERVAL=1)
    recurrence_start_date DATE,
    recurrence_end_date DATE,
    next_scheduled_date DATE,
    
    -- Job-specific fields
    job_type TEXT CHECK (job_type IN ('Cleaning', 'Maintenance', 'Repair')),
    service_provider_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contact_person TEXT,
    contact_number TEXT,
    contact_email TEXT,
    reference_text TEXT, -- Free text reference field for job work orders
    
    -- Repair-specific fields
    unit_number TEXT,
    repair_contact_person TEXT,
    repair_contact_number TEXT,
    repair_contact_email TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create work_order_history table for tracking changes
CREATE TABLE IF NOT EXISTS work_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(work_order_id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'Created', 'Updated', 'Status Changed', 'Assigned', 'Deleted', etc.
    description TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_orders_work_order_id ON work_orders(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_work_type ON work_orders(work_type);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_location_id ON work_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_requested_by ON work_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_date ON work_orders(created_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_service_provider_id ON work_orders(service_provider_id);

CREATE INDEX IF NOT EXISTS idx_work_order_history_work_order_id ON work_order_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_history_performed_by ON work_order_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_work_order_history_performed_at ON work_order_history(performed_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_work_orders_updated_at();

-- Create function to generate work order ID
CREATE OR REPLACE FUNCTION generate_work_order_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    current_date_str TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    current_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the count of work orders created today
    SELECT COUNT(*) + 1 INTO counter
    FROM work_orders
    WHERE work_order_id LIKE 'WO' || current_date_str || '%';
    
    -- Generate the new work order ID
    new_id := 'WO' || current_date_str || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically calculate next scheduled date for preventive work orders
CREATE OR REPLACE FUNCTION calculate_next_scheduled_date(
    recurrence_rule TEXT,
    start_date DATE
)
RETURNS DATE AS $$
DECLARE
    next_date DATE;
    frequency TEXT;
    interval_val INTEGER;
BEGIN
    -- Simple RRULE parsing for basic frequencies
    -- This is a simplified version - in production, you might want a more robust RRULE parser
    
    IF recurrence_rule IS NULL OR recurrence_rule = '' THEN
        RETURN NULL;
    END IF;
    
    -- Extract frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
    frequency := SUBSTRING(recurrence_rule FROM 'FREQ=([A-Z]+)');
    
    -- Extract interval (default to 1 if not specified)
    interval_val := COALESCE(
        SUBSTRING(recurrence_rule FROM 'INTERVAL=([0-9]+)')::INTEGER,
        1
    );
    
    -- Calculate next date based on frequency
    CASE frequency
        WHEN 'DAILY' THEN
            next_date := start_date + (interval_val || ' days')::INTERVAL;
        WHEN 'WEEKLY' THEN
            next_date := start_date + (interval_val * 7 || ' days')::INTERVAL;
        WHEN 'MONTHLY' THEN
            next_date := start_date + (interval_val || ' months')::INTERVAL;
        WHEN 'YEARLY' THEN
            next_date := start_date + (interval_val || ' years')::INTERVAL;
        ELSE
            next_date := NULL;
    END CASE;
    
    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically set next_scheduled_date for preventive work orders
CREATE OR REPLACE FUNCTION set_next_scheduled_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate for preventive work orders
    IF NEW.work_type = 'Preventive' AND NEW.recurrence_rule IS NOT NULL AND NEW.recurrence_start_date IS NOT NULL THEN
        NEW.next_scheduled_date := calculate_next_scheduled_date(NEW.recurrence_rule, NEW.recurrence_start_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set next_scheduled_date
CREATE TRIGGER trigger_set_next_scheduled_date
    BEFORE INSERT OR UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_next_scheduled_date();

-- Create function to get work orders due within specified days
CREATE OR REPLACE FUNCTION get_work_orders_due_within_days(days_ahead INTEGER DEFAULT 3)
RETURNS TABLE (
    id UUID,
    work_order_id TEXT,
    title TEXT,
    due_date DATE,
    priority TEXT,
    status TEXT,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wo.id,
        wo.work_order_id,
        wo.title,
        wo.due_date,
        wo.priority,
        wo.status,
        (wo.due_date - CURRENT_DATE)::INTEGER as days_until_due
    FROM work_orders wo
    WHERE wo.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + days_ahead)
    AND wo.status NOT IN ('Done')
    ORDER BY wo.due_date ASC, wo.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get work order statistics
CREATE OR REPLACE FUNCTION get_work_order_stats()
RETURNS TABLE (
    total_active INTEGER,
    total_in_progress INTEGER,
    total_review INTEGER,
    total_completed INTEGER,
    total_overdue INTEGER,
    total_due_today INTEGER,
    total_due_this_week INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'Active')::INTEGER as total_active,
        COUNT(*) FILTER (WHERE status = 'In Progress')::INTEGER as total_in_progress,
        COUNT(*) FILTER (WHERE status = 'Review')::INTEGER as total_review,
        COUNT(*) FILTER (WHERE status = 'Done')::INTEGER as total_completed,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('Done'))::INTEGER as total_overdue,
        COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status NOT IN ('Done'))::INTEGER as total_due_today,
        COUNT(*) FILTER (WHERE due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7) AND status NOT IN ('Done'))::INTEGER as total_due_this_week
    FROM work_orders;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional - remove in production)
-- INSERT INTO work_orders (
--     work_order_id,
--     work_type,
--     asset_id,
--     location_id,
--     title,
--     description,
--     due_date,
--     requested_by,
--     priority,
--     status
-- ) VALUES (
--     generate_work_order_id(),
--     'Complaint',
--     (SELECT id FROM assets LIMIT 1),
--     (SELECT id FROM locations LIMIT 1),
--     'Sample Work Order',
--     'This is a sample work order for testing purposes',
--     CURRENT_DATE + 7,
--     (SELECT id FROM profiles LIMIT 1),
--     'Medium',
--     'Active'
-- );

-- Add comments for documentation
COMMENT ON TABLE work_orders IS 'Main table for storing work orders with all types (Preventive, Complaint, Job, Repair)';
COMMENT ON TABLE work_order_history IS 'Audit trail table for tracking all changes made to work orders';

COMMENT ON COLUMN work_orders.work_order_id IS 'Human-readable unique identifier (e.g., WO20250809001)';
COMMENT ON COLUMN work_orders.work_type IS 'Type of work order: Preventive, Complaint, Job, or Repair';
COMMENT ON COLUMN work_orders.recurrence_rule IS 'RRULE format string for preventive maintenance scheduling';
COMMENT ON COLUMN work_orders.reference_text IS 'Free text reference field for job type work orders';
COMMENT ON COLUMN work_orders.next_scheduled_date IS 'Auto-calculated next occurrence date for preventive work orders';

COMMENT ON FUNCTION generate_work_order_id() IS 'Generates unique work order ID in format WO{YYYYMMDD}{0001}';
COMMENT ON FUNCTION calculate_next_scheduled_date(TEXT, DATE) IS 'Calculates next scheduled date based on RRULE and start date';
COMMENT ON FUNCTION get_work_orders_due_within_days(INTEGER) IS 'Returns work orders due within specified number of days';
COMMENT ON FUNCTION get_work_order_stats() IS 'Returns comprehensive statistics about work orders';
