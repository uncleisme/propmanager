-- Add userId and role columns to technicians table
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS userId uuid;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS role text DEFAULT 'technician';
-- Optionally, add a foreign key constraint to auth.users (if supported by your Supabase setup)
-- ALTER TABLE public.technicians ADD CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES auth.users(id); 