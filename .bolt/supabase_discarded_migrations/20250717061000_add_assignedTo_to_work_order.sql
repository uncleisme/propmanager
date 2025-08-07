-- Migration: Add assignedTo column to work_order table

-- Add assignedTo column to work_order table
ALTER TABLE public.work_order 
ADD COLUMN IF NOT EXISTS assignedTo UUID REFERENCES public.profiles(id);

-- Create an index on the assignedTo column for better performance
CREATE INDEX IF NOT EXISTS idx_work_order_assignedTo ON public.work_order(assignedTo); 