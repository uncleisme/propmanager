-- Create Asset Types Table
CREATE TABLE IF NOT EXISTS asset_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_asset_types_category ON asset_types(category);
CREATE INDEX IF NOT EXISTS idx_asset_types_name ON asset_types(name);

-- Insert asset types based on the CMMS asset types list
INSERT INTO asset_types (name, category, description) VALUES
-- HVAC Systems
('Air Handling Unit (AHU)', 'HVAC Systems', 'Central air handling equipment for building ventilation'),
('Packaged HVAC Unit', 'HVAC Systems', 'Self-contained heating, ventilation, and air conditioning unit'),
('Split System AC', 'HVAC Systems', 'Split-type air conditioning system with indoor and outdoor units'),
('Rooftop Unit (RTU)', 'HVAC Systems', 'HVAC equipment installed on building rooftops'),
('Exhaust Fan', 'HVAC Systems', 'Mechanical ventilation equipment for air extraction'),
('VAV Box (Variable Air Volume)', 'HVAC Systems', 'Variable air volume control equipment'),
('Ductwork', 'HVAC Systems', 'Air distribution system components'),
('Thermostat', 'HVAC Systems', 'Temperature control device'),

-- Electrical Systems
('Electrical Panel / Distribution Board', 'Electrical Systems', 'Main electrical distribution equipment'),
('Circuit Breaker', 'Electrical Systems', 'Electrical protection device'),
('Generator (Backup Power)', 'Electrical Systems', 'Emergency backup power generation equipment'),
('UPS (Uninterruptible Power Supply)', 'Electrical Systems', 'Battery backup power system'),
('Transformer', 'Electrical Systems', 'Voltage transformation equipment'),
('Lighting Fixture', 'Electrical Systems', 'Indoor and outdoor lighting equipment'),
('Emergency Exit Light', 'Electrical Systems', 'Emergency egress lighting system'),
('Power Outlet / Socket', 'Electrical Systems', 'Electrical power connection points'),

-- Plumbing Systems
('Water Heater', 'Plumbing Systems', 'Hot water generation equipment'),
('Pump (Booster, Sump, Sewage)', 'Plumbing Systems', 'Water and sewage pumping equipment'),
('Water Meter', 'Plumbing Systems', 'Water consumption measurement device'),
('Pressure Regulator', 'Plumbing Systems', 'Water pressure control equipment'),
('Toilet / WC', 'Plumbing Systems', 'Sanitary fixtures'),
('Faucet / Tap', 'Plumbing Systems', 'Water control fixtures'),
('Drainage System', 'Plumbing Systems', 'Wastewater collection and disposal system'),
('Water Tank', 'Plumbing Systems', 'Water storage equipment'),

-- Fire & Life Safety Systems
('Fire Alarm Panel', 'Fire & Life Safety', 'Central fire detection and alarm control system'),
('Smoke Detector', 'Fire & Life Safety', 'Smoke detection device'),
('Heat Detector', 'Fire & Life Safety', 'Temperature-based fire detection device'),
('Fire Sprinkler Head', 'Fire & Life Safety', 'Automatic fire suppression equipment'),
('Fire Extinguisher', 'Fire & Life Safety', 'Portable fire suppression equipment'),
('Emergency Exit Sign', 'Fire & Life Safety', 'Emergency egress signage'),
('Fire Hose Reel', 'Fire & Life Safety', 'Manual fire suppression equipment'),
('Fire Pump', 'Fire & Life Safety', 'Fire suppression water pressure equipment'),
('Gas Leak Detector', 'Fire & Life Safety', 'Gas detection and alarm system'),

-- Vertical Transportation
('Elevator / Lift', 'Vertical Transportation', 'Passenger and freight vertical transportation'),
('Escalator', 'Vertical Transportation', 'Moving stairway system'),
('Dumbwaiter', 'Vertical Transportation', 'Small freight elevator'),
('Stair Lift', 'Vertical Transportation', 'Accessibility stair climbing equipment'),

-- Security & Access Control
('CCTV Camera', 'Security & Access Control', 'Video surveillance equipment'),
('Door Access Controller / Keypad', 'Security & Access Control', 'Electronic access control system'),
('Intercom System', 'Security & Access Control', 'Two-way communication system'),
('Motion Sensor', 'Security & Access Control', 'Movement detection device'),
('Security Gate / Barrier', 'Security & Access Control', 'Physical access control equipment'),
('Biometric Scanner', 'Security & Access Control', 'Biometric identification system'),

-- Building Envelope
('Roof Membrane', 'Building Envelope', 'Waterproof roofing material'),
('Window (Glazing System)', 'Building Envelope', 'Building fenestration system'),
('Curtain Wall System', 'Building Envelope', 'Non-structural exterior wall system'),
('Doors (Fire-Rated / Main / Internal)', 'Building Envelope', 'Building access and egress doors'),
('Exterior Façade', 'Building Envelope', 'Building exterior finishing system'),

-- IT & Communications
('Server Rack', 'IT & Communications', 'Data center equipment housing'),
('Network Switch', 'IT & Communications', 'Network connectivity equipment'),
('Access Point (Wi-Fi)', 'IT & Communications', 'Wireless network equipment'),
('Data Cabling', 'IT & Communications', 'Network infrastructure cabling'),
('Telephone Panel', 'IT & Communications', 'Telecommunications distribution equipment'),

-- Furniture & Fixtures
('Office Desk / Chair', 'Furniture & Fixtures', 'Workplace furniture'),
('Built-in Cabinet', 'Furniture & Fixtures', 'Fixed storage furniture'),
('Partition Wall', 'Furniture & Fixtures', 'Movable wall system'),
('Lighting Fixtures (Chandeliers, Downlights)', 'Furniture & Fixtures', 'Decorative and functional lighting'),

-- Common Area Amenities
('Gym Equipment', 'Common Area Amenities', 'Fitness and exercise equipment'),
('Pool Pump / Filter', 'Common Area Amenities', 'Swimming pool maintenance equipment'),
('Sauna Heater', 'Common Area Amenities', 'Sauna heating equipment'),
('Playground Equipment', 'Common Area Amenities', 'Children''s recreational equipment'),
('BBQ Grill', 'Common Area Amenities', 'Outdoor cooking equipment'),
('Mailbox / Parcel Locker', 'Common Area Amenities', 'Mail and package delivery system'),

-- Commercial-Specific Asset Types
('HVAC Rooftop Units', 'Commercial Equipment', 'Commercial-grade rooftop HVAC systems'),
('Chillers & Cooling Towers', 'Commercial Equipment', 'Large-scale cooling equipment'),
('Building Management System (BMS)', 'Commercial Equipment', 'Integrated building control system'),
('Central Control Panels', 'Commercial Equipment', 'Centralized equipment control systems'),
('Conference Room AV Equipment', 'Commercial Equipment', 'Audio-visual presentation systems'),
('Industrial Lighting Systems', 'Commercial Equipment', 'High-performance lighting systems'),
('Public Address System', 'Commercial Equipment', 'Building-wide communication system'),
('Automatic Sliding Doors', 'Commercial Equipment', 'Automated entrance systems'),
('Escalators', 'Commercial Equipment', 'Commercial moving walkway systems'),
('Parking Lot Equipment (Ticket Dispensers, Boom Barriers)', 'Commercial Equipment', 'Parking management systems');

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_asset_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_types_updated_at
BEFORE UPDATE ON asset_types
FOR EACH ROW
EXECUTE FUNCTION update_asset_types_updated_at();

-- Update the assets table to reference asset_types
ALTER TABLE assets 
DROP COLUMN IF EXISTS asset_type;

ALTER TABLE assets 
ADD COLUMN asset_type_id UUID REFERENCES asset_types(id) ON DELETE SET NULL;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_assets_asset_type_id ON assets(asset_type_id);

-- Add a view for easier querying
CREATE OR REPLACE VIEW assets_with_types AS
SELECT 
    a.*,
    at.name as asset_type_name,
    at.category as asset_type_category
FROM assets a
LEFT JOIN asset_types at ON a.asset_type_id = at.id;

COMMENT ON TABLE asset_types IS 'Lookup table for asset types and categories';
COMMENT ON COLUMN asset_types.name IS 'Name of the asset type';
COMMENT ON COLUMN asset_types.category IS 'Category grouping for asset types';
COMMENT ON VIEW assets_with_types IS 'Assets joined with their type information';
