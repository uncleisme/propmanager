-- Ensure maintenance_schedules table has camelCase column names
-- This migration fixes any snake_case columns to match the frontend expectations

-- Check if table exists with snake_case and rename columns to camelCase
DO $$
BEGIN
    -- Check if frequency_type exists and rename to frequencyType
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'frequency_type') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN frequency_type TO "frequencyType";
    END IF;

    -- Check if frequency_value exists and rename to frequencyValue
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'frequency_value') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN frequency_value TO "frequencyValue";
    END IF;

    -- Check if asset_id exists and rename to assetId
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'asset_id') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN asset_id TO "assetId";
    END IF;

    -- Check if maintenance_type_id exists and rename to maintenanceTypeId
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'maintenance_type_id') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN maintenance_type_id TO "maintenanceTypeId";
    END IF;

    -- Check if schedule_name exists and rename to scheduleName
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'schedule_name') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN schedule_name TO "scheduleName";
    END IF;

    -- Check if start_date exists and rename to startDate
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'start_date') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN start_date TO "startDate";
    END IF;

    -- Check if end_date exists and rename to endDate
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'end_date') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN end_date TO "endDate";
    END IF;

    -- Check if next_due_date exists and rename to nextDueDate
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'next_due_date') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN next_due_date TO "nextDueDate";
    END IF;

    -- Check if last_completed_date exists and rename to lastCompletedDate
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'last_completed_date') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN last_completed_date TO "lastCompletedDate";
    END IF;

    -- Check if estimated_duration exists and rename to estimatedDuration
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'estimated_duration') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN estimated_duration TO "estimatedDuration";
    END IF;

    -- Check if assigned_to exists and rename to assignedTo
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'assigned_to') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN assigned_to TO "assignedTo";
    END IF;

    -- Check if is_active exists and rename to isActive
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'is_active') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN is_active TO "isActive";
    END IF;

    -- Check if created_at exists and rename to createdAt
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'created_at') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN created_at TO "createdAt";
    END IF;

    -- Check if updated_at exists and rename to updatedAt
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'maintenance_schedules' 
               AND column_name = 'updated_at') THEN
        ALTER TABLE public.maintenance_schedules RENAME COLUMN updated_at TO "updatedAt";
    END IF;

END $$;
