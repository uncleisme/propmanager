-- Add complaintId to jobs table to link jobs to complaints
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS complaintId uuid REFERENCES public.complaints(id); 