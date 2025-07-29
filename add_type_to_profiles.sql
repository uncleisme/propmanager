-- Add type column and profile_type enum to profiles table

-- Create enum type for profile types
CREATE TYPE profile_type AS ENUM ('admin', 'technician');

-- Add type column to profiles table with enum
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS type profile_type DEFAULT 'admin';

-- Create an index on the type column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(type);

-- Update existing profiles to have a default type if needed
-- UPDATE public.profiles SET type = 'admin' WHERE type IS NULL; 