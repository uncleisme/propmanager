-- Create breakdown_history table
CREATE TABLE IF NOT EXISTS public.breakdown_history (
  id SERIAL PRIMARY KEY,
  liftId INTEGER NOT NULL,
  breakdownDate DATE NOT NULL,
  breakdownTime TIME NOT NULL,
  attendedDate DATE,
  attendedTime TIME,
  reason TEXT NOT NULL CHECK (reason IN ('hardware', 'system', 'power-failure', 'others')),
  technicianId UUID,
  attachmentUrl TEXT,
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.breakdown_history ENABLE ROW LEVEL SECURITY;

-- Create policies for breakdown_history
CREATE POLICY "Users can view breakdown_history"
  ON public.breakdown_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert breakdown_history"
  ON public.breakdown_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update breakdown_history"
  ON public.breakdown_history
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete breakdown_history"
  ON public.breakdown_history
  FOR DELETE
  TO authenticated
  USING (true);

-- Create foreign key constraint to lift_maintenance table
ALTER TABLE public.breakdown_history 
ADD CONSTRAINT fk_breakdown_history_lift 
FOREIGN KEY (liftId) REFERENCES public.lift_maintenance(id) ON DELETE CASCADE;

-- Create foreign key constraint to profiles table for technician
ALTER TABLE public.breakdown_history 
ADD CONSTRAINT fk_breakdown_history_technician 
FOREIGN KEY (technicianId) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_breakdown_history_lift_id ON public.breakdown_history(liftId);
CREATE INDEX IF NOT EXISTS idx_breakdown_history_date ON public.breakdown_history(breakdownDate);
CREATE INDEX IF NOT EXISTS idx_breakdown_history_reason ON public.breakdown_history(reason);
CREATE INDEX IF NOT EXISTS idx_breakdown_history_technician ON public.breakdown_history(technicianId);

-- Insert some sample data for testing
INSERT INTO public.breakdown_history (
  liftId, breakdownDate, breakdownTime, attendedDate, attendedTime, 
  reason, technicianId, attachmentUrl
) VALUES
(1, '2024-12-15', '09:30:00', '2024-12-15', '10:15:00', 'hardware', NULL, NULL),
(2, '2024-12-10', '14:20:00', '2024-12-10', '15:45:00', 'system', NULL, NULL),
(1, '2024-12-05', '11:00:00', '2024-12-05', '12:30:00', 'power-failure', NULL, NULL); 