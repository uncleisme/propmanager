-- Database schema for Security and Cleaning personnel tables

-- Create security_persons table
CREATE TABLE IF NOT EXISTS public.security_persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  identificationNumber TEXT NOT NULL,
  nationality TEXT NOT NULL,
  visaExpiryDate DATE,
  permitExpiryDate DATE,
  phoneNumber TEXT NOT NULL,
  address TEXT NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Create cleaning_persons table
CREATE TABLE IF NOT EXISTS public.cleaning_persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  identificationNumber TEXT NOT NULL,
  nationality TEXT NOT NULL,
  visaExpiryDate DATE,
  permitExpiryDate DATE,
  phoneNumber TEXT NOT NULL,
  address TEXT NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.security_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_persons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_persons
CREATE POLICY "Users can view security persons" 
ON public.security_persons 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert security persons" 
ON public.security_persons 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update security persons" 
ON public.security_persons 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can delete security persons" 
ON public.security_persons 
FOR DELETE 
USING (true);

-- Create RLS policies for cleaning_persons
CREATE POLICY "Users can view cleaning persons" 
ON public.cleaning_persons 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert cleaning persons" 
ON public.cleaning_persons 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update cleaning persons" 
ON public.cleaning_persons 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can delete cleaning persons" 
ON public.cleaning_persons 
FOR DELETE 
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_persons_name ON public.security_persons(name);
CREATE INDEX IF NOT EXISTS idx_security_persons_identification ON public.security_persons(identificationNumber);
CREATE INDEX IF NOT EXISTS idx_security_persons_nationality ON public.security_persons(nationality);
CREATE INDEX IF NOT EXISTS idx_security_persons_visa_expiry ON public.security_persons(visaExpiryDate);
CREATE INDEX IF NOT EXISTS idx_security_persons_permit_expiry ON public.security_persons(permitExpiryDate);

CREATE INDEX IF NOT EXISTS idx_cleaning_persons_name ON public.cleaning_persons(name);
CREATE INDEX IF NOT EXISTS idx_cleaning_persons_identification ON public.cleaning_persons(identificationNumber);
CREATE INDEX IF NOT EXISTS idx_cleaning_persons_nationality ON public.cleaning_persons(nationality);
CREATE INDEX IF NOT EXISTS idx_cleaning_persons_visa_expiry ON public.cleaning_persons(visaExpiryDate);
CREATE INDEX IF NOT EXISTS idx_cleaning_persons_permit_expiry ON public.cleaning_persons(permitExpiryDate);
