-- Migration: Auto-generate work orders from maintenance tasks
-- This trigger creates work orders automatically when maintenance tasks are scheduled

-- Function to auto-generate work orders from maintenance tasks
CREATE OR REPLACE FUNCTION auto_generate_work_order_from_maintenance_task()
RETURNS TRIGGER AS $$
DECLARE
    asset_info RECORD;
    work_order_title TEXT;
BEGIN
    -- Only create work order for scheduled tasks (not completed/cancelled)
    IF NEW.status = 'scheduled' AND (OLD IS NULL OR OLD.status != 'scheduled') THEN
        
        -- Get asset information for the work order
        SELECT 
            ma.asset_name,
            ma.location_building,
            ma.location_floor,
            ma.location_room
        INTO asset_info
        FROM maintenance_assets ma
        WHERE ma.id = NEW.asset_id;
        
        -- Create descriptive title
        work_order_title := 'PM: ' || NEW.title;
        
        -- Insert work order
        INSERT INTO public.work_order (
            type,
            title,
            description,
            status,
            priority,
            propertyUnit,
            scheduledDate,
            scheduledStart,
            scheduledEnd,
            assignedTo,
            createdAt,
            -- Link to maintenance task via description or custom field
            comment
        ) VALUES (
            'job'::work_order_type,
            work_order_title,
            COALESCE(NEW.description, 'Preventive maintenance task: ' || NEW.title),
            'open',
            NEW.priority,
            COALESCE(asset_info.location_building || ' - ' || asset_info.location_floor || ' - ' || asset_info.location_room, asset_info.location_building),
            NEW.scheduled_date,
            NEW.scheduled_start_time::TEXT,
            NEW.scheduled_end_time::TEXT,
            NEW.assigned_to,
            NOW(),
            'Auto-generated from maintenance task ID: ' || NEW.id || ' | Asset: ' || COALESCE(asset_info.asset_name, 'Unknown')
        );
        
        -- Log the action in maintenance history
        INSERT INTO public.maintenance_history (
            asset_id,
            task_id,
            action_type,
            action_date,
            performed_by,
            details
        ) VALUES (
            NEW.asset_id,
            NEW.id,
            'scheduled',
            NOW(),
            'system',
            'Work order auto-generated for maintenance task'
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto work order generation
DROP TRIGGER IF EXISTS trigger_auto_generate_work_order ON public.maintenance_tasks;
CREATE TRIGGER trigger_auto_generate_work_order
    AFTER INSERT OR UPDATE ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_work_order_from_maintenance_task();

-- Function to generate work orders for existing overdue tasks (one-time setup)
CREATE OR REPLACE FUNCTION generate_work_orders_for_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
    task_record RECORD;
    asset_info RECORD;
    work_order_title TEXT;
    created_count INTEGER := 0;
BEGIN
    -- Find overdue maintenance tasks without corresponding work orders
    FOR task_record IN 
        SELECT mt.*
        FROM maintenance_tasks mt
        WHERE mt.status IN ('scheduled', 'overdue')
        AND mt.scheduled_date < CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM work_order wo 
            WHERE wo.comment LIKE '%maintenance task ID: ' || mt.id || '%'
        )
    LOOP
        -- Get asset information
        SELECT 
            ma.asset_name,
            ma.location_building,
            ma.location_floor,
            ma.location_room
        INTO asset_info
        FROM maintenance_assets ma
        WHERE ma.id = task_record.asset_id;
        
        -- Create work order title
        work_order_title := 'PM (Overdue): ' || task_record.title;
        
        -- Insert work order
        INSERT INTO public.work_order (
            type,
            title,
            description,
            status,
            priority,
            propertyUnit,
            scheduledDate,
            scheduledStart,
            scheduledEnd,
            assignedTo,
            createdAt,
            comment
        ) VALUES (
            'job'::work_order_type,
            work_order_title,
            COALESCE(task_record.description, 'Overdue preventive maintenance task: ' || task_record.title),
            'open',
            CASE 
                WHEN task_record.priority = 'critical' THEN 'critical'
                WHEN task_record.priority = 'high' THEN 'high'  
                ELSE 'medium'
            END,
            COALESCE(asset_info.location_building || ' - ' || asset_info.location_floor || ' - ' || asset_info.location_room, asset_info.location_building),
            task_record.scheduled_date,
            task_record.scheduled_start_time::TEXT,
            task_record.scheduled_end_time::TEXT,
            task_record.assigned_to,
            NOW(),
            'Auto-generated from overdue maintenance task ID: ' || task_record.id || ' | Asset: ' || COALESCE(asset_info.asset_name, 'Unknown')
        );
        
        created_count := created_count + 1;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Add configuration table for auto-generation settings
CREATE TABLE IF NOT EXISTS public.maintenance_config (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO public.maintenance_config (setting_key, setting_value, description) VALUES
('auto_generate_work_orders', 'true', 'Automatically generate work orders from maintenance tasks'),
('work_order_prefix', 'PM:', 'Prefix for auto-generated work order titles'),
('include_overdue_in_title', 'true', 'Include "Overdue" in title for overdue tasks')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS for config table
ALTER TABLE public.maintenance_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view maintenance config" ON public.maintenance_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can modify maintenance config" ON public.maintenance_config FOR ALL TO authenticated USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_config_key ON public.maintenance_config(setting_key);

COMMENT ON FUNCTION auto_generate_work_order_from_maintenance_task() IS 'Automatically creates work orders when maintenance tasks are scheduled';
COMMENT ON FUNCTION generate_work_orders_for_overdue_tasks() IS 'One-time function to create work orders for existing overdue maintenance tasks';
COMMENT ON TABLE public.maintenance_config IS 'Configuration settings for maintenance automation features';