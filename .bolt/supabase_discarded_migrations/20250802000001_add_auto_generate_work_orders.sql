-- Add missing columns to maintenance_schedules table
-- This migration ensures all columns used by the frontend form exist in the database

-- Add autoGenerateWorkOrders column
ALTER TABLE public.maintenance_schedules 
ADD COLUMN IF NOT EXISTS "autoGenerateWorkOrders" BOOLEAN DEFAULT true;

-- Add createdBy column
ALTER TABLE public.maintenance_schedules 
ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- Verify all required columns exist (this will help identify any other missing columns)
-- The following columns should already exist from the original migration:
-- id, assetId, maintenanceTypeId, scheduleName, description, frequencyType, frequencyValue
-- startDate, endDate, nextDueDate, lastCompletedDate, priority, estimatedDuration
-- assignedTo, instructions, checklist, isActive, createdAt, updatedAt

-- Add comments for documentation
COMMENT ON COLUMN public.maintenance_schedules."autoGenerateWorkOrders" IS 'Whether to automatically generate work orders from this schedule';
COMMENT ON COLUMN public.maintenance_schedules."createdBy" IS 'User ID who created this schedule';

-- Verify table structure by listing all columns (for debugging)
-- You can run this query to see all columns: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'maintenance_schedules';
