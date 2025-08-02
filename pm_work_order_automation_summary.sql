-- ========================================
-- PREVENTIVE MAINTENANCE TO WORK ORDER AUTOMATION
-- Complete SQL Summary for PM → Work Order Integration
-- ========================================

-- ==========================================
-- 1. AUTO WORK ORDER CREATION TRIGGER
-- ==========================================
-- This trigger automatically creates work orders when maintenance tasks are scheduled

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
            ma.assetName,           -- Updated to camelCase
            ma.locationBuilding,    -- Updated to camelCase
            ma.locationFloor,       -- Updated to camelCase
            ma.locationRoom         -- Updated to camelCase
        INTO asset_info
        FROM maintenanceAssets ma   -- Updated to camelCase
        WHERE ma.id = NEW.assetId;  -- Updated to camelCase
        
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
            comment
        ) VALUES (
            'job'::work_order_type,
            work_order_title,
            COALESCE(NEW.description, 'Preventive maintenance task: ' || NEW.title),
            'open',
            NEW.priority,
            COALESCE(asset_info.locationBuilding || ' - ' || asset_info.locationFloor || ' - ' || asset_info.locationRoom, asset_info.locationBuilding),
            NEW.scheduledDate,      -- Updated to camelCase
            NEW.scheduledStartTime::TEXT,  -- Updated to camelCase
            NEW.scheduledEndTime::TEXT,    -- Updated to camelCase
            NEW.assignedTo,         -- Updated to camelCase
            NOW(),
            'Auto-generated from maintenance task ID: ' || NEW.id || ' | Asset: ' || COALESCE(asset_info.assetName, 'Unknown')
        );
        
        -- Log the action in maintenance history
        INSERT INTO public.maintenanceHistory (  -- Updated to camelCase
            assetId,        -- Updated to camelCase
            taskId,         -- Updated to camelCase
            actionType,     -- Updated to camelCase
            actionDate,     -- Updated to camelCase
            performedBy,    -- Updated to camelCase
            details
        ) VALUES (
            NEW.assetId,    -- Updated to camelCase
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

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_work_order ON public.maintenanceTasks;
CREATE TRIGGER trigger_auto_generate_work_order
    AFTER INSERT OR UPDATE ON public.maintenanceTasks  -- Updated to camelCase
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_work_order_from_maintenance_task();

-- ==========================================
-- 2. SCHEDULED TASK GENERATION FROM PM SCHEDULES
-- ==========================================
-- This function generates maintenance tasks from active schedules

CREATE OR REPLACE FUNCTION generate_scheduled_maintenance_tasks(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(
    schedule_id INTEGER,
    task_id INTEGER,
    asset_name TEXT,
    task_title TEXT,
    scheduled_date DATE,
    work_order_created BOOLEAN
) AS $$
DECLARE
    schedule_record RECORD;
    new_task_id INTEGER;
    task_title TEXT;
    next_date DATE;
    work_order_created BOOLEAN := false;
BEGIN
    -- Loop through active schedules that are due within the specified days
    FOR schedule_record IN 
        SELECT ms.*, ma.assetName, ma.locationBuilding, ma.locationFloor, ma.locationRoom
        FROM maintenanceSchedules ms    -- Updated to camelCase
        JOIN maintenanceAssets ma ON ms.assetId = ma.id  -- Updated to camelCase
        WHERE ms.isActive = true        -- Updated to camelCase
        AND ms.nextDueDate <= CURRENT_DATE + (days_ahead || ' days')::INTERVAL  -- Updated to camelCase
        AND ms.nextDueDate >= CURRENT_DATE  -- Updated to camelCase
        -- Don't create duplicate tasks for the same schedule and date
        AND NOT EXISTS (
            SELECT 1 FROM maintenanceTasks mt   -- Updated to camelCase
            WHERE mt.scheduleId = ms.id         -- Updated to camelCase
            AND mt.scheduledDate = ms.nextDueDate  -- Updated to camelCase
            AND mt.status IN ('scheduled', 'in_progress')
        )
    LOOP
        -- Create task title
        task_title := schedule_record.scheduleName || ' - ' || schedule_record.assetName;  -- Updated to camelCase
        
        -- Insert maintenance task
        INSERT INTO public.maintenanceTasks (  -- Updated to camelCase
            scheduleId,     -- Updated to camelCase
            assetId,        -- Updated to camelCase
            title,
            description,
            priority,
            status,
            scheduledDate,  -- Updated to camelCase
            assignedTo,     -- Updated to camelCase
            createdBy       -- Updated to camelCase
        ) VALUES (
            schedule_record.id,
            schedule_record.assetId,    -- Updated to camelCase
            task_title,
            COALESCE(schedule_record.description, 'Scheduled maintenance task'),
            schedule_record.priority,
            'scheduled',
            schedule_record.nextDueDate,    -- Updated to camelCase
            schedule_record.assignedTo,     -- Updated to camelCase
            'system'
        ) RETURNING id INTO new_task_id;
        
        -- Calculate next due date for the schedule
        CASE schedule_record.frequencyType  -- Updated to camelCase
            WHEN 'daily' THEN
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue || ' days')::INTERVAL;  -- Updated to camelCase
            WHEN 'weekly' THEN
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue || ' weeks')::INTERVAL;  -- Updated to camelCase
            WHEN 'monthly' THEN
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue || ' months')::INTERVAL;  -- Updated to camelCase
            WHEN 'quarterly' THEN
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue * 3 || ' months')::INTERVAL;  -- Updated to camelCase
            WHEN 'semi_annual' THEN
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue * 6 || ' months')::INTERVAL;  -- Updated to camelCase
            WHEN 'annual' THEN
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue || ' years')::INTERVAL;  -- Updated to camelCase
            ELSE
                next_date := schedule_record.nextDueDate + (schedule_record.frequencyValue || ' days')::INTERVAL;  -- Updated to camelCase
        END CASE;
        
        -- Update schedule's next due date
        UPDATE public.maintenanceSchedules  -- Updated to camelCase
        SET 
            nextDueDate = next_date,    -- Updated to camelCase
            updatedAt = NOW()           -- Updated to camelCase
        WHERE id = schedule_record.id;
        
        -- Check if work order was created (the trigger should have handled this)
        work_order_created := EXISTS (
            SELECT 1 FROM work_order wo 
            WHERE wo.comment LIKE '%maintenance task ID: ' || new_task_id || '%'
        );
        
        -- Return information about created task
        RETURN QUERY SELECT 
            schedule_record.id,
            new_task_id,
            schedule_record.assetName,  -- Updated to camelCase
            task_title,
            schedule_record.nextDueDate,    -- Updated to camelCase
            work_order_created;
            
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. OVERDUE TASK HANDLING
-- ==========================================
-- This function marks overdue tasks and creates urgent work orders

CREATE OR REPLACE FUNCTION mark_overdue_maintenance_tasks()
RETURNS TABLE(
    task_id INTEGER,
    asset_name TEXT,
    days_overdue INTEGER,
    work_order_updated BOOLEAN
) AS $$
DECLARE
    task_record RECORD;
    days_overdue INTEGER;
    work_order_updated BOOLEAN := false;
BEGIN
    -- Find tasks that are overdue but not marked as such
    FOR task_record IN 
        SELECT mt.*, ma.assetName    -- Updated to camelCase
        FROM maintenanceTasks mt     -- Updated to camelCase
        JOIN maintenanceAssets ma ON mt.assetId = ma.id  -- Updated to camelCase
        WHERE mt.status = 'scheduled'
        AND mt.scheduledDate < CURRENT_DATE  -- Updated to camelCase
    LOOP
        days_overdue := CURRENT_DATE - task_record.scheduledDate;  -- Updated to camelCase
        
        -- Update task status to overdue
        UPDATE public.maintenanceTasks  -- Updated to camelCase
        SET 
            status = 'overdue',
            updatedAt = NOW()       -- Updated to camelCase
        WHERE id = task_record.id;
        
        -- Update corresponding work order to high priority
        UPDATE public.work_order 
        SET 
            priority = 'high',
            title = 'PM (Overdue): ' || SUBSTRING(title FROM 5), -- Remove "PM: " and add "PM (Overdue): "
            updatedAt = NOW()
        WHERE comment LIKE '%maintenance task ID: ' || task_record.id || '%'
        AND status NOT IN ('completed', 'resolved', 'closed');
        
        work_order_updated := FOUND;
        
        -- Log overdue status
        INSERT INTO public.maintenanceHistory (  -- Updated to camelCase
            assetId,        -- Updated to camelCase
            taskId,         -- Updated to camelCase
            actionType,     -- Updated to camelCase
            actionDate,     -- Updated to camelCase
            performedBy,    -- Updated to camelCase
            details
        ) VALUES (
            task_record.assetId,    -- Updated to camelCase
            task_record.id,
            'overdue',
            NOW(),
            'system',
            'Task marked as overdue (' || days_overdue || ' days)'
        );
        
        RETURN QUERY SELECT 
            task_record.id,
            task_record.assetName,  -- Updated to camelCase
            days_overdue,
            work_order_updated;
            
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. WORK ORDER COMPLETION SYNC
-- ==========================================
-- This function syncs completed work orders back to maintenance tasks

CREATE OR REPLACE FUNCTION sync_work_order_completion()
RETURNS INTEGER AS $$
DECLARE
    sync_count INTEGER := 0;
    wo_record RECORD;
    task_id_match TEXT;
BEGIN
    -- Find completed work orders that have corresponding maintenance tasks
    FOR wo_record IN 
        SELECT wo.*
        FROM work_order wo
        WHERE wo.status IN ('completed', 'resolved', 'closed')
        AND wo.comment LIKE '%maintenance task ID:%'
        AND wo.resolvedAt IS NOT NULL
    LOOP
        -- Extract task ID from comment
        task_id_match := substring(wo_record.comment from 'maintenance task ID: (\d+)');
        
        IF task_id_match IS NOT NULL THEN
            -- Update maintenance task to completed
            UPDATE public.maintenanceTasks  -- Updated to camelCase
            SET 
                status = 'completed',
                actualEndTime = wo_record.resolvedAt,       -- Updated to camelCase
                completionNotes = wo_record.comment,        -- Updated to camelCase
                completedBy = wo_record.assignedTo,         -- Updated to camelCase
                updatedAt = NOW()                           -- Updated to camelCase
            WHERE id = task_id_match::INTEGER
            AND status != 'completed';
            
            IF FOUND THEN
                sync_count := sync_count + 1;
                
                -- Log completion
                INSERT INTO public.maintenanceHistory (  -- Updated to camelCase
                    assetId,        -- Updated to camelCase
                    taskId,         -- Updated to camelCase
                    actionType,     -- Updated to camelCase
                    actionDate,     -- Updated to camelCase
                    performedBy,    -- Updated to camelCase
                    details
                ) SELECT 
                    mt.assetId,     -- Updated to camelCase
                    mt.id,
                    'completed',
                    wo_record.resolvedAt,
                    wo_record.assignedTo,
                    'Task completed via work order #' || wo_record.id
                FROM maintenanceTasks mt    -- Updated to camelCase
                WHERE mt.id = task_id_match::INTEGER;
            END IF;
        END IF;
    END LOOP;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. MASTER AUTOMATION FUNCTION
-- ==========================================
-- Run all maintenance automation processes

CREATE OR REPLACE FUNCTION run_maintenance_automation(days_ahead INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
    tasks_created INTEGER := 0;
    tasks_overdue INTEGER := 0;
    tasks_synced INTEGER := 0;
    result JSON;
BEGIN
    -- Generate new scheduled tasks
    SELECT COUNT(*) INTO tasks_created
    FROM generate_scheduled_maintenance_tasks(days_ahead);
    
    -- Mark overdue tasks
    SELECT COUNT(*) INTO tasks_overdue
    FROM mark_overdue_maintenance_tasks();
    
    -- Sync completed work orders
    SELECT sync_work_order_completion() INTO tasks_synced;
    
    -- Return summary
    result := json_build_object(
        'timestamp', NOW(),
        'tasks_created', tasks_created,
        'tasks_marked_overdue', tasks_overdue,
        'tasks_synced_from_work_orders', tasks_synced,
        'days_ahead_scheduled', days_ahead
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. CONFIGURATION TABLE
-- ==========================================
-- Settings for automation behavior

CREATE TABLE IF NOT EXISTS public.maintenanceConfig (  -- Updated to camelCase
    id SERIAL PRIMARY KEY,
    settingKey TEXT UNIQUE NOT NULL,        -- Updated to camelCase
    settingValue TEXT NOT NULL,             -- Updated to camelCase
    description TEXT,
    updatedAt TIMESTAMPTZ DEFAULT NOW()     -- Updated to camelCase
);

-- Insert default configuration
INSERT INTO public.maintenanceConfig (settingKey, settingValue, description) VALUES  -- Updated to camelCase
('auto_generate_work_orders', 'true', 'Automatically generate work orders from maintenance tasks'),
('work_order_prefix', 'PM:', 'Prefix for auto-generated work order titles'),
('include_overdue_in_title', 'true', 'Include "Overdue" in title for overdue tasks')
ON CONFLICT (settingKey) DO NOTHING;  -- Updated to camelCase

-- Enable RLS for config table
ALTER TABLE public.maintenanceConfig ENABLE ROW LEVEL SECURITY;  -- Updated to camelCase
CREATE POLICY "Users can view maintenance config" ON public.maintenanceConfig FOR SELECT TO authenticated USING (true);  -- Updated to camelCase
CREATE POLICY "Admins can modify maintenance config" ON public.maintenanceConfig FOR ALL TO authenticated USING (true);  -- Updated to camelCase

-- ==========================================
-- 7. USAGE EXAMPLES
-- ==========================================

-- Example 1: Run daily automation (typically scheduled via cron or pg_cron)
-- SELECT run_maintenance_automation(7); -- Generate tasks for next 7 days

-- Example 2: Manually generate tasks for next 14 days
-- SELECT * FROM generate_scheduled_maintenance_tasks(14);

-- Example 3: Check and mark overdue tasks
-- SELECT * FROM mark_overdue_maintenance_tasks();

-- Example 4: Sync completed work orders back to maintenance tasks
-- SELECT sync_work_order_completion();

-- Example 5: Check automation configuration
-- SELECT * FROM maintenanceConfig WHERE settingKey = 'auto_generate_work_orders';

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON FUNCTION auto_generate_work_order_from_maintenance_task() IS 'Automatically creates work orders when maintenance tasks are scheduled';
COMMENT ON FUNCTION generate_scheduled_maintenance_tasks(INTEGER) IS 'Generates maintenance tasks from active schedules for the next N days';
COMMENT ON FUNCTION mark_overdue_maintenance_tasks() IS 'Marks overdue maintenance tasks and updates corresponding work orders';
COMMENT ON FUNCTION sync_work_order_completion() IS 'Syncs completed work orders back to maintenance tasks';
COMMENT ON FUNCTION run_maintenance_automation(INTEGER) IS 'Master function to run all maintenance automation tasks';
COMMENT ON TABLE public.maintenanceConfig IS 'Configuration settings for maintenance automation features';  -- Updated to camelCase
