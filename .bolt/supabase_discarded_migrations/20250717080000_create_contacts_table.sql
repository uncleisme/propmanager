-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  address TEXT,
  type TEXT CHECK (type IN ('contractor', 'supplier', 'serviceProvider', 'resident', 'government', 'others')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view contacts"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert contacts"
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update contacts"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete contacts"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON public.contacts(type); 