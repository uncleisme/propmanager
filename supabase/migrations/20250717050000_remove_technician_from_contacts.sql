-- Migration: Remove 'technician' from contacts type enum

-- First, update any existing contacts with type 'technician' to 'serviceProvider'
UPDATE public.contacts 
SET type = 'serviceProvider' 
WHERE type = 'technician';

-- Create a new enum without 'technician'
CREATE TYPE contact_type_new AS ENUM ('contractor', 'supplier', 'serviceProvider', 'resident', 'government', 'others');

-- Update the contacts table to use the new enum
ALTER TABLE public.contacts 
ALTER COLUMN type TYPE contact_type_new 
USING type::text::contact_type_new;

-- Drop the old enum
DROP TYPE IF EXISTS contact_type;

-- Rename the new enum to the original name
ALTER TYPE contact_type_new RENAME TO contact_type; 