-- Migration: Add preventive maintenance work order type and maintenance task reference

-- Add preventive_maintenance to the work_order_type enum
ALTER TYPE work_order_type ADD VALUE IF NOT EXISTS 'preventive_maintenance';

-- Add maintenance task reference to work_order table
ALTER TABLE public.work_order 
ADD COLUMN IF NOT EXISTS maintenanceTaskId INTEGER REFERENCES public.maintenance_tasks(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_work_order_maintenance_task ON public.work_order(maintenanceTaskId);

-- Update the auto-generation function to use the new type and reference
CREATE OR REPLACE FUNCTION auto_generate_work_order_from_maintenance_task()
RETURNS TRIGGER AS $$
DECLARE
    asset_info RECORD;
    work_order_title TEXT;
    config_record RECORD;
BEGIN
    -- Only create work order for scheduled tasks (not completed/cancelled)
    IF NEW.status = 'scheduled' AND (OLD IS NULL OR OLD.status != 'scheduled') THEN
        
        -- Check if auto-generation is enabled
        SELECT "autoGenerateWorkOrders", "workOrderPrefix", "markOverdueInTitle"
        INTO config_record
        FROM maintenance_schedules ms
        WHERE ms.id = NEW."scheduleId";
        
        -- Only proceed if auto-generation is enabled
        IF config_record.autoGenerateWorkOrders THEN
            -- Get asset information for the work order
            SELECT 
                ma."assetName",
                ma."locationBuilding",
                ma."locationFloor",
                ma."locationRoom"
            INTO asset_info
            FROM maintenance_assets ma
            WHERE ma.id = NEW."assetId";
            
            -- Create descriptive title with prefix
            work_order_title := COALESCE(config_record.workOrderPrefix, 'PM') || ': ' || NEW.title;
            
            -- Add overdue prefix if task is overdue and setting is enabled
            IF NEW.status = 'overdue' AND config_record.markOverdueInTitle THEN
                work_order_title := 'OVERDUE: ' || work_order_title;
            END IF;
            
            -- Insert work order with preventive_maintenance type
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
                maintenanceTaskId,
                createdAt,
                comment
            ) VALUES (
                'preventive_maintenance'::work_order_type,
                work_order_title,
                COALESCE(NEW.description, 'Preventive maintenance task: ' || NEW.title),
                'open',
                NEW.priority,
                COALESCE(asset_info."locationBuilding" || ' - ' || asset_info."locationFloor" || ' - ' || asset_info."locationRoom", asset_info."locationBuilding"),
                NEW."scheduledDate",
                NEW."scheduledStartTime"::TEXT,
                NEW."scheduledEndTime"::TEXT,
                NEW."assignedTo",
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
BEGIN
    -- If work order is completed and has a maintenance task reference
    IF NEW.status = 'completed' AND NEW.maintenanceTaskId IS NOT NULL AND 
       (OLD IS NULL OR OLD.status != 'completed') THEN
        
        -- Update the maintenance task status
        UPDATE public.maintenance_tasks 
        SET 
            status = 'completed',
            "actualEndTime" = NOW(),
            "completedBy" = NEW.assignedTo,
            "completionNotes" = NEW.comment,
            "updatedAt" = NOW()
        WHERE id = NEW.maintenanceTaskId;
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
COMMENT ON COLUMN public.work_order.maintenanceTaskId IS 'Reference to maintenance task that generated this work order';
COMMENT ON FUNCTION auto_generate_work_order_from_maintenance_task() IS 'Auto-generates preventive maintenance work orders from scheduled maintenance tasks';
COMMENT ON FUNCTION sync_work_order_completion_to_maintenance_task() IS 'Syncs work order completion back to the originating maintenance task';
