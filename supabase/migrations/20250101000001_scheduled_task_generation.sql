-- Migration: Scheduled task generation for preventive maintenance
-- This creates functions to automatically generate maintenance tasks from schedules

-- Function to generate maintenance tasks from active schedules
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
        SELECT ms.*, ma.asset_name, ma.location_building, ma.location_floor, ma.location_room
        FROM maintenance_schedules ms
        JOIN maintenance_assets ma ON ms.asset_id = ma.id
        WHERE ms.is_active = true
        AND ms.next_due_date <= CURRENT_DATE + (days_ahead || ' days')::INTERVAL
        AND ms.next_due_date >= CURRENT_DATE
        -- Don't create duplicate tasks for the same schedule and date
        AND NOT EXISTS (
            SELECT 1 FROM maintenance_tasks mt 
            WHERE mt.schedule_id = ms.id 
            AND mt.scheduled_date = ms.next_due_date
            AND mt.status IN ('scheduled', 'in_progress')
        )
    LOOP
        -- Create task title
        task_title := schedule_record.schedule_name || ' - ' || schedule_record.asset_name;
        
        -- Insert maintenance task
        INSERT INTO public.maintenance_tasks (
            schedule_id,
            asset_id,
            title,
            description,
            priority,
            status,
            scheduled_date,
            assigned_to,
            created_by
        ) VALUES (
            schedule_record.id,
            schedule_record.asset_id,
            task_title,
            COALESCE(schedule_record.description, 'Scheduled maintenance task'),
            schedule_record.priority,
            'scheduled',
            schedule_record.next_due_date,
            schedule_record.assigned_to,
            'system'
        ) RETURNING id INTO new_task_id;
        
        -- Calculate next due date for the schedule
        CASE schedule_record.frequency_type
            WHEN 'daily' THEN
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value || ' weeks')::INTERVAL;
            WHEN 'monthly' THEN
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value || ' months')::INTERVAL;
            WHEN 'quarterly' THEN
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value * 3 || ' months')::INTERVAL;
            WHEN 'semi_annual' THEN
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value * 6 || ' months')::INTERVAL;
            WHEN 'annual' THEN
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value || ' years')::INTERVAL;
            ELSE
                next_date := schedule_record.next_due_date + (schedule_record.frequency_value || ' days')::INTERVAL;
        END CASE;
        
        -- Update schedule's next due date
        UPDATE public.maintenance_schedules 
        SET 
            next_due_date = next_date,
            updated_at = NOW()
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
            schedule_record.asset_name,
            task_title,
            schedule_record.next_due_date,
            work_order_created;
            
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to mark overdue tasks and create urgent work orders
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
        SELECT mt.*, ma.asset_name
        FROM maintenance_tasks mt
        JOIN maintenance_assets ma ON mt.asset_id = ma.id
        WHERE mt.status = 'scheduled'
        AND mt.scheduled_date < CURRENT_DATE
    LOOP
        days_overdue := CURRENT_DATE - task_record.scheduled_date;
        
        -- Update task status to overdue
        UPDATE public.maintenance_tasks 
        SET 
            status = 'overdue',
            updated_at = NOW()
        WHERE id = task_record.id;
        
        -- Update corresponding work order priority if it exists
        UPDATE public.work_order 
        SET 
            priority = CASE 
                WHEN days_overdue > 7 THEN 'critical'
                WHEN days_overdue > 3 THEN 'high'
                ELSE priority
            END,
            title = CASE 
                WHEN title NOT LIKE '%OVERDUE%' THEN 'OVERDUE: ' || title
                ELSE title
            END,
            updatedAt = NOW()
        WHERE comment LIKE '%maintenance task ID: ' || task_record.id || '%'
        AND status NOT IN ('completed', 'resolved', 'closed');
        
        work_order_updated := FOUND;
        
        -- Log overdue status
        INSERT INTO public.maintenance_history (
            asset_id,
            task_id,
            action_type,
            action_date,
            performed_by,
            details
        ) VALUES (
            task_record.asset_id,
            task_record.id,
            'overdue',
            NOW(),
            'system',
            'Task marked as overdue (' || days_overdue || ' days)'
        );
        
        RETURN QUERY SELECT 
            task_record.id,
            task_record.asset_name,
            days_overdue,
            work_order_updated;
            
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to sync work order completion back to maintenance tasks
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
            UPDATE public.maintenance_tasks 
            SET 
                status = 'completed',
                actual_end_time = wo_record.resolvedAt,
                completion_notes = wo_record.comment,
                completed_by = wo_record.assignedTo,
                updated_at = NOW()
            WHERE id = task_id_match::INTEGER
            AND status != 'completed';
            
            IF FOUND THEN
                sync_count := sync_count + 1;
                
                -- Log completion
                INSERT INTO public.maintenance_history (
                    asset_id,
                    task_id,
                    action_type,
                    action_date,
                    performed_by,
                    details
                ) SELECT 
                    mt.asset_id,
                    mt.id,
                    'completed',
                    wo_record.resolvedAt,
                    wo_record.assignedTo,
                    'Task completed via work order #' || wo_record.id
                FROM maintenance_tasks mt
                WHERE mt.id = task_id_match::INTEGER;
            END IF;
        END IF;
    END LOOP;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- Create a master function to run all maintenance automation
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

-- Add comments
COMMENT ON FUNCTION generate_scheduled_maintenance_tasks(INTEGER) IS 'Generates maintenance tasks from active schedules for the next N days';
COMMENT ON FUNCTION mark_overdue_maintenance_tasks() IS 'Marks overdue maintenance tasks and updates corresponding work orders';
COMMENT ON FUNCTION sync_work_order_completion() IS 'Syncs completed work orders back to maintenance tasks';
COMMENT ON FUNCTION run_maintenance_automation(INTEGER) IS 'Master function to run all maintenance automation tasks';