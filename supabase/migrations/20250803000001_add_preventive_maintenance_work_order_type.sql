-- Migration: Add preventive maintenance work order type and maintenance task reference

-- Add preventive_maintenance to the work_order_type enum
ALTER TYPE work_order_type ADD VALUE IF NOT EXISTS 'preventive_maintenance';

-- Add maintenance task reference to work_order table
ALTER TABLE public.work_order 
ADD COLUMN IF NOT EXISTS "maintenanceTaskId" INTEGER REFERENCES public.maintenance_tasks(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_work_order_maintenance_task ON public.work_order("maintenanceTaskId");

-- Update the auto-generation function to use the new type and reference
CREATE OR REPLACE FUNCTION auto_generate_work_order_from_maintenance_task()
RETURNS TRIGGER AS $$
DECLARE
    asset_info RECORD;
    work_order_title TEXT;
    config_record RECORD;
    assigned_user_id UUID;
BEGIN
    -- Only create work order for scheduled tasks (not completed/cancelled)
    IF NEW.status = 'scheduled' AND (OLD IS NULL OR OLD.status != 'scheduled') THEN
        
        -- Check if auto-generation is enabled
        SELECT "autoGenerateWorkOrders"
        INTO config_record
        FROM maintenance_schedules ms
        WHERE ms.id = NEW."scheduleId";
        
        -- Only proceed if auto-generation is enabled
        IF config_record."autoGenerateWorkOrders" THEN
            -- Get asset information for the work order
            SELECT 
                ma."assetName",
                ma."locationBuilding",
                ma."locationFloor",
                ma."locationRoom"
            INTO asset_info
            FROM maintenance_assets ma
            WHERE ma.id = NEW."assetId";
            
            -- Look up the assigned user UUID from profiles table
            assigned_user_id := NULL;
            IF NEW."assignedTo" IS NOT NULL AND NEW."assignedTo" != '' THEN
                SELECT id INTO assigned_user_id
                FROM public.profiles
                WHERE email = NEW."assignedTo" OR id::TEXT = NEW."assignedTo"
                LIMIT 1;
            ELSE
                assigned_user_id := NULL;
            END IF;
            
            -- Create descriptive title with default prefix
            work_order_title := 'PM: ' || NEW.title;
            
            -- Add overdue prefix if task is overdue
            IF NEW.status = 'overdue' THEN
                work_order_title := 'OVERDUE: ' || work_order_title;
            END IF;
            
            -- Insert work order with preventive_maintenance type
            INSERT INTO public.work_order (
                type,
                title,
                description,
                status,
                priority,
                "propertyUnit",
                "scheduledDate",
                "scheduledStart",
                "scheduledEnd",
                "assignedTo",
                "maintenanceTaskId",
                "createdAt",
                comment
            ) VALUES (
                'preventive_maintenance'::work_order_type,
                work_order_title,
                COALESCE(NEW.description, 'Preventive maintenance task: ' || NEW.title),
                'open',
                NEW.priority,
                COALESCE(asset_info."locationBuilding" || ' - ' || asset_info."locationFloor" || ' - ' || asset_info."locationRoom", asset_info."locationBuilding"),
                NEW."scheduledDate",
                NEW."scheduledStartTime"::TIME,
                NEW."scheduledEndTime"::TIME,
                assigned_user_id,
                NEW.id,
                NOW(),
                'Auto-generated from maintenance task: ' || NEW."taskNumber"
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to use the new function (if not already exists)
DROP TRIGGER IF EXISTS trigger_auto_generate_work_order ON public.maintenance_tasks;
CREATE TRIGGER trigger_auto_generate_work_order
    AFTER INSERT OR UPDATE ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_work_order_from_maintenance_task();

-- Function to sync work order completion back to maintenance task
CREATE OR REPLACE FUNCTION sync_work_order_completion_to_maintenance_task()
RETURNS TRIGGER AS $$
DECLARE
    completed_by_text TEXT;
    completed_by_uuid UUID;
    completed_by_email TEXT;
BEGIN
    -- Only proceed if work order is marked as completed and has a maintenance task reference
    IF NEW.status = 'completed' AND NEW."maintenanceTaskId" IS NOT NULL AND 
       (OLD IS NULL OR OLD.status != 'completed') THEN
        
        -- Initialize variables
        completed_by_text := NULL;
        completed_by_uuid := NULL;
        completed_by_email := NULL;
        
        -- Try to get the assigned user's email from profiles table
        IF NEW."assignedTo" IS NOT NULL THEN
            -- First try to get the email directly if assignedTo is a UUID
            BEGIN
                SELECT email INTO completed_by_email 
                FROM public.profiles 
                WHERE id = NEW."assignedTo"::UUID 
                LIMIT 1;
                
                -- If no email found, try to see if assignedTo is already an email
                IF completed_by_email IS NULL THEN
                    SELECT email INTO completed_by_email 
                    FROM public.profiles 
                    WHERE email = NEW."assignedTo"::TEXT 
                    LIMIT 1;
                END IF;
                
                -- If we found an email, use it, otherwise use the assignedTo as-is
                IF completed_by_email IS NOT NULL THEN
                    completed_by_text := completed_by_email;
                ELSE
                    completed_by_text := NEW."assignedTo"::TEXT;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- If UUID casting fails, try to use assignedTo as email
                BEGIN
                    SELECT email INTO completed_by_email 
                    FROM public.profiles 
                    WHERE email = NEW."assignedTo"::TEXT 
                    LIMIT 1;
                    
                    IF completed_by_email IS NOT NULL THEN
                        completed_by_text := completed_by_email;
                    ELSE
                        completed_by_text := NEW."assignedTo"::TEXT;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    -- If all else fails, log the error but don't fail
                    RAISE NOTICE 'Error resolving completedBy: %', SQLERRM;
                    completed_by_text := NULL;
                END;
            END;
        END IF;
        
        -- Update the maintenance task status with the resolved completedBy value
        UPDATE public.maintenance_tasks 
        SET 
            status = 'completed',
            "actualEndTime" = COALESCE(NEW."completedAt", NOW()),
            "completedBy" = completed_by_text,
            "completionNotes" = COALESCE(NEW.comment, 'Completed via work order #' || NEW.id::TEXT),
            "updatedAt" = NOW()
        WHERE id = NEW."maintenanceTaskId";
        
        RAISE NOTICE 'Updated maintenance task % with completed status', NEW."maintenanceTaskId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work order completion sync
DROP TRIGGER IF EXISTS trigger_sync_work_order_completion ON public.work_order;
CREATE TRIGGER trigger_sync_work_order_completion
    AFTER UPDATE ON public.work_order
    FOR EACH ROW
    EXECUTE FUNCTION sync_work_order_completion_to_maintenance_task();

-- Add comments for documentation
COMMENT ON COLUMN public.work_order."maintenanceTaskId" IS 'Reference to maintenance task that generated this work order';
COMMENT ON FUNCTION auto_generate_work_order_from_maintenance_task() IS 'Auto-generates preventive maintenance work orders from scheduled maintenance tasks';
COMMENT ON FUNCTION sync_work_order_completion_to_maintenance_task() IS 'Syncs work order completion back to the originating maintenance task';
