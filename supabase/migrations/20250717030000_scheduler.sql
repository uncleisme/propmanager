-- Scheduler module: jobs and technicians tables (camelCase)

-- Technicians table
CREATE TABLE IF NOT EXISTS public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  skills TEXT[],
  availability JSONB,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'complete')),
  scheduledDate DATE NOT NULL,
  scheduledStart TIME NOT NULL,
  scheduledEnd TIME NOT NULL,
  technicianId UUID REFERENCES public.technicians(id),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Open RLS policies (adjust for production)
CREATE POLICY "Allow all" ON public.technicians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.jobs FOR ALL USING (true) WITH CHECK (true); 