-- Migration: Scheduled task generation for preventive maintenance (camelCase version)
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
        SELECT ms.*, ma."assetName", ma."locationBuilding", ma."locationFloor", ma."locationRoom"
        FROM maintenance_schedules ms
        JOIN maintenance_assets ma ON ms."assetId" = ma.id
        WHERE ms."isActive" = true
        AND ms."nextDueDate" <= CURRENT_DATE + (days_ahead || ' days')::INTERVAL
        AND ms."nextDueDate" >= CURRENT_DATE
        -- Don't create duplicate tasks for the same schedule and date
        AND NOT EXISTS (
            SELECT 1 FROM maintenance_tasks mt 
            WHERE mt."scheduleId" = ms.id 
            AND mt."scheduledDate" = ms."nextDueDate"
            AND mt.status IN ('scheduled', 'in_progress')
        )
    LOOP
        -- Create task title
        task_title := schedule_record."scheduleName" || ' - ' || schedule_record."assetName";
        
        -- Insert maintenance task
        INSERT INTO public.maintenance_tasks (
            "scheduleId",
            "assetId",
            title,
            description,
            priority,
            status,
            "scheduledDate",
            "assignedTo",
            "createdBy"
        ) VALUES (
            schedule_record.id,
            schedule_record."assetId",
            task_title,
            COALESCE(schedule_record.description, 'Scheduled maintenance task'),
            schedule_record.priority,
            'scheduled',
            schedule_record."nextDueDate",
            schedule_record."assignedTo",
            'system'
        ) RETURNING id INTO new_task_id;
        
        -- Calculate next due date for the schedule
        CASE schedule_record."frequencyType"
            WHEN 'daily' THEN
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" || ' weeks')::INTERVAL;
            WHEN 'monthly' THEN
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" || ' months')::INTERVAL;
            WHEN 'quarterly' THEN
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" * 3 || ' months')::INTERVAL;
            WHEN 'semi_annual' THEN
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" * 6 || ' months')::INTERVAL;
            WHEN 'annual' THEN
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" || ' years')::INTERVAL;
            ELSE
                next_date := schedule_record."nextDueDate" + (schedule_record."frequencyValue" || ' days')::INTERVAL;
        END CASE;
        
        -- Update schedule's next due date
        UPDATE public.maintenance_schedules 
        SET 
            "nextDueDate" = next_date,
            "updatedAt" = NOW()
        WHERE id = schedule_record.id;
        
        -- Check if work order was created (the trigger should have handled this)
        work_order_created := EXISTS (
            SELECT 1 FROM work_orders wo 
            WHERE wo.description LIKE '%maintenance task ID: ' || new_task_id || '%'
        );
        
        -- Return information about created task
        RETURN QUERY SELECT 
            schedule_record.id,
            new_task_id,
            schedule_record."assetName",
            task_title,
            schedule_record."nextDueDate",
            work_order_created;
            
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to mark overdue tasks
CREATE OR REPLACE FUNCTION mark_overdue_maintenance_tasks()
RETURNS TABLE(
    task_id INTEGER,
    asset_name TEXT,
    days_overdue INTEGER
) AS $$
DECLARE
    task_record RECORD;
    days_overdue INTEGER;
BEGIN
    -- Find tasks that are overdue but not marked as such
    FOR task_record IN 
        SELECT mt.*, ma."assetName"
        FROM maintenance_tasks mt
        JOIN maintenance_assets ma ON mt."assetId" = ma.id
        WHERE mt.status = 'scheduled'
        AND mt."scheduledDate" < CURRENT_DATE
    LOOP
        days_overdue := CURRENT_DATE - task_record."scheduledDate";
        
        -- Update task status to overdue
        UPDATE public.maintenance_tasks 
        SET 
            status = 'overdue',
            "updatedAt" = NOW()
        WHERE id = task_record.id;
        
        -- Log the overdue status
        INSERT INTO public.maintenance_history (
            "assetId",
            "taskId",
            "actionType",
            "actionDate",
            "performedBy",
            details
        ) VALUES (
            task_record."assetId",
            task_record.id,
            'overdue',
            NOW(),
            'system',
            'Task marked as overdue (' || days_overdue || ' days)'
        );
        
        RETURN QUERY SELECT 
            task_record.id,
            task_record."assetName",
            days_overdue;
            
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a master function to run all maintenance automation
CREATE OR REPLACE FUNCTION run_maintenance_automation(days_ahead INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
    tasks_created INTEGER := 0;
    tasks_overdue INTEGER := 0;
    result JSON;
BEGIN
    -- Generate new scheduled tasks
    SELECT COUNT(*) INTO tasks_created
    FROM generate_scheduled_maintenance_tasks(days_ahead);
    
    -- Mark overdue tasks
    SELECT COUNT(*) INTO tasks_overdue
    FROM mark_overdue_maintenance_tasks();
    
    -- Return summary
    result := json_build_object(
        'timestamp', NOW(),
        'tasks_created', tasks_created,
        'tasks_marked_overdue', tasks_overdue,
        'days_ahead_scheduled', days_ahead
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION generate_scheduled_maintenance_tasks(INTEGER) IS 'Generates maintenance tasks from active schedules for the next N days';
COMMENT ON FUNCTION mark_overdue_maintenance_tasks() IS 'Marks overdue maintenance tasks and updates corresponding work orders';
COMMENT ON FUNCTION run_maintenance_automation(INTEGER) IS 'Master function to run all maintenance automation tasks';
