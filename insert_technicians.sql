-- Insert test technicians into profiles table

-- Insert sample technicians (replace with actual data as needed)
INSERT INTO public.profiles (id, full_name, email, type, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), 'John Technician', 'john.tech@example.com', 'technician', now(), now()),
  (gen_random_uuid(), 'Sarah Engineer', 'sarah.engineer@example.com', 'technician', now(), now()),
  (gen_random_uuid(), 'Mike Repair', 'mike.repair@example.com', 'technician', now(), now()),
  (gen_random_uuid(), 'Lisa Maintenance', 'lisa.maintenance@example.com', 'technician', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Verify the technicians were inserted
SELECT id, full_name, email, type FROM public.profiles WHERE type = 'technician'; 