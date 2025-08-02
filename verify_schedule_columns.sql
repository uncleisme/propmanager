-- Query to verify all columns in maintenance_schedules table
-- Run this in Supabase SQL Editor to see what columns exist

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'maintenance_schedules'
ORDER BY ordinal_position;

-- Expected columns based on the form:
-- id, assetId, maintenanceTypeId, scheduleName, description
-- frequencyType, frequencyValue, startDate, endDate, nextDueDate
-- lastCompletedDate, priority, estimatedDuration, assignedTo
-- instructions, checklist, isActive, autoGenerateWorkOrders
-- createdBy, createdAt, updatedAt
