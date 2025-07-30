-- Migration: Add new status values for work_order table

-- Add new status values to work_order table
-- First, let's check if there's a constraint and add the new values
ALTER TABLE public.work_order 
DROP CONSTRAINT IF EXISTS work_order_status_check;

-- Add a new constraint that includes the new status values
ALTER TABLE public.work_order 
ADD CONSTRAINT work_order_status_check 
CHECK (status IN ('open', 'in-progress', 'ready-for-review', 'pending-confirmation', 'completed', 'resolved', 'closed'));

-- Add comment to document the status values
COMMENT ON COLUMN public.work_order.status IS 'Status values: open, in-progress, ready-for-review, pending-confirmation, completed, resolved, closed'; 