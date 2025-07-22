-- Update jobs table to reference contacts(id) instead of technicians(id)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_technicianid_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_technicianid_fkey FOREIGN KEY (technicianId) REFERENCES public.contacts(id); 