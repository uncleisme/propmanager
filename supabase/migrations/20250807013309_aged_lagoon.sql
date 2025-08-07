/*
  # Create work_order table

  1. New Tables
    - `work_order`
      - `id` (uuid, primary key)
      - `type` (text, work order type)
      - `title` (text, work order title)
      - `description` (text, detailed description)
      - `status` (text, current status)
      - `priority` (text, priority level)
      - `propertyUnit` (text, property unit)
      - `scheduledDate` (date, scheduled date)
      - `scheduledStart` (text, scheduled start time)
      - `scheduledEnd` (text, scheduled end time)
      - `assignedTo` (text, assigned technician)
      - `createdAt` (timestamp, creation time)
      - `updatedAt` (timestamp, last update time)
      - `resolvedAt` (timestamp, resolution time)
      - `comment` (text, additional comments)

  2. Security
    - Enable RLS on `work_order` table
    - Add policy for authenticated users to manage work orders
*/

-- Create enum for work order type
CREATE TYPE work_order_type AS ENUM ('job', 'complaint', 'maintenance', 'inspection');

-- Create work_order table
CREATE TABLE IF NOT EXISTS work_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type work_order_type NOT NULL DEFAULT 'job',
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text DEFAULT 'medium',
  "propertyUnit" text,
  "scheduledDate" date,
  "scheduledStart" text,
  "scheduledEnd" text,
  "assignedTo" text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  "resolvedAt" timestamptz,
  comment text
);

-- Add constraints for status values
ALTER TABLE work_order ADD CONSTRAINT work_order_status_check 
CHECK (status IN ('open', 'in-progress', 'in_progress', 'pending', 'completed', 'resolved', 'closed', 'cancelled'));

-- Add constraints for priority values
ALTER TABLE work_order ADD CONSTRAINT work_order_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_order_status ON work_order(status);
CREATE INDEX IF NOT EXISTS idx_work_order_type ON work_order(type);
CREATE INDEX IF NOT EXISTS idx_work_order_scheduled_date ON work_order("scheduledDate");
CREATE INDEX IF NOT EXISTS idx_work_order_assigned_to ON work_order("assignedTo");
CREATE INDEX IF NOT EXISTS idx_work_order_created_at ON work_order("createdAt");

-- Enable RLS
ALTER TABLE work_order ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view work orders" ON work_order FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert work orders" ON work_order FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update work orders" ON work_order FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete work orders" ON work_order FOR DELETE TO authenticated USING (true);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_work_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_updated_at
  BEFORE UPDATE ON work_order
  FOR EACH ROW
  EXECUTE FUNCTION update_work_order_updated_at();