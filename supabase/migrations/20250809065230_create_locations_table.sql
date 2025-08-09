-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    block TEXT NOT NULL,
    floor TEXT NOT NULL,
    room TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Office', 'Meeting Room', 'Storage', 'Common Area', 'Utility', 'Parking', 'Residential', 'Commercial', 'Other')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_locations_location_id ON locations(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_block ON locations(block);
CREATE INDEX IF NOT EXISTS idx_locations_floor ON locations(floor);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_locations_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view locations" ON locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert locations" ON locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update locations" ON locations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete locations" ON locations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample locations
INSERT INTO locations (location_id, name, block, floor, room, type, description) VALUES
('main-building-1-101', 'Main Building', 'A', '1', '101', 'Office', 'Reception area'),
('main-building-1-102', 'Main Building', 'A', '1', '102', 'Meeting Room', 'Small conference room'),
('main-building-2-201', 'Main Building', 'A', '2', '201', 'Office', 'Manager office'),
('storage-building-g-001', 'Storage Building', 'B', 'G', '001', 'Storage', 'General storage room'),
('parking-area-g-p01', 'Parking Area', 'C', 'G', 'P01', 'Parking', 'Visitor parking space');

COMMENT ON TABLE locations IS 'Locations table for tracking physical locations in the property';
COMMENT ON COLUMN locations.location_id IS 'Generated location identifier in format {name}-{floor}-{room}';
COMMENT ON COLUMN locations.name IS 'Name of the building or area';
COMMENT ON COLUMN locations.block IS 'Block or building identifier';
COMMENT ON COLUMN locations.floor IS 'Floor level';
COMMENT ON COLUMN locations.room IS 'Room number or identifier';
COMMENT ON COLUMN locations.type IS 'Type of location (Office, Meeting Room, etc.)';
