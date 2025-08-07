-- Migration: Create work_order table to unify jobs and complaints

CREATE TYPE work_order_type AS ENUM ('job', 'complaint');

CREATE TABLE IF NOT EXISTS public.work_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type work_order_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  propertyUnit TEXT,
  scheduledDate DATE,
  scheduledStart TIME,
  scheduledEnd TIME,
  technicianId UUID REFERENCES public.contacts(id),
  createdAt TIMESTAMPTZ DEFAULT now(),
  resolvedAt TIMESTAMPTZ,
  complaintId UUID,
  CONSTRAINT fk_complaint FOREIGN KEY (complaintId) REFERENCES public.work_order(id)
);

-- Enable Row Level Security
ALTER TABLE public.work_order ENABLE ROW LEVEL SECURITY;

-- Open RLS policy (adjust for production)
CREATE POLICY "Allow all" ON public.work_order FOR ALL USING (true) WITH CHECK (true); 