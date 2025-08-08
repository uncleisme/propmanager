-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Asset Categories Table
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_asset_category_name UNIQUE (name)
);

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    serial_number VARCHAR(100),
    model_number VARCHAR(100),
    manufacturer VARCHAR(200),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    current_value DECIMAL(12, 2),
    expected_life_months INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_maintenance', 'disposed', 'lost', 'stolen')),
    location_id UUID, -- Reference to a locations/building table
    assigned_to UUID, -- Reference to users or staff table
    notes TEXT,
    warranty_expiry DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_serial_number UNIQUE (serial_number)
);

-- Asset Images Table
CREATE TABLE IF NOT EXISTS asset_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    CONSTRAINT only_one_primary_image_per_asset 
        EXCLUDE USING btree (asset_id WITH =) 
        WHERE (is_primary = true)
);

-- Asset Maintenance Logs Table
CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_date TIMESTAMP WITH TIME ZONE NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(12, 2),
    performed_by VARCHAR(200),
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Asset Depreciation Table
CREATE TABLE IF NOT EXISTS asset_depreciation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    date_recorded DATE NOT NULL,
    current_value DECIMAL(12, 2) NOT NULL,
    depreciation_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Asset Assignment History
CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    assigned_to UUID, -- Reference to users or staff table
    assigned_by UUID REFERENCES auth.users(id),
    assignment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_return_date DATE,
    return_date TIMESTAMP WITH TIME ZONE,
    return_condition VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Documents Table
CREATE TABLE IF NOT EXISTS asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Asset Custom Fields Table (for additional attributes)
CREATE TABLE IF NOT EXISTS asset_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_type VARCHAR(50) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_asset_field_per_asset UNIQUE (asset_id, field_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_asset_images_asset_id ON asset_images(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON asset_maintenance_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assigned_to ON asset_assignments(assigned_to);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at columns
CREATE TRIGGER update_asset_categories_updated_at
BEFORE UPDATE ON asset_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_custom_fields_updated_at
BEFORE UPDATE ON asset_custom_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO asset_categories (name, description, created_at, updated_at, is_active)
VALUES 
    ('Electronics', 'Electronic devices and equipment', NOW(), NOW(), TRUE),
    ('Furniture', 'Office and home furniture', NOW(), NOW(), TRUE),
    ('Vehicles', 'Company vehicles', NOW(), NOW(), TRUE),
    ('IT Equipment', 'Computers, servers, and networking equipment', NOW(), NOW(), TRUE),
    ('Tools', 'Hand and power tools', NOW(), NOW(), TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert sample assets (assuming some categories exist)
INSERT INTO assets (
    name, description, category_id, serial_number, model_number, manufacturer,
    purchase_date, purchase_cost, current_value, status, created_at, updated_at, is_active
) VALUES 
    ('Dell XPS 15', 'Dell XPS 15 Laptop', 
     (SELECT id FROM asset_categories WHERE name = 'IT Equipment' LIMIT 1),
     'DXPS15789', 'XPS15-9500', 'Dell', '2023-01-15', 1799.99, 1500.00, 'active', NOW(), NOW(), TRUE),
     
    ('Ergonomic Office Chair', 'High-back ergonomic office chair',
     (SELECT id FROM asset_categories WHERE name = 'Furniture' LIMIT 1),
     'CHAIR-ERGO-001', 'ERG-2000', 'Herman Miller', '2023-02-20', 1299.00, 1100.00, 'active', NOW(), NOW(), TRUE),
     
    ('Toyota Camry', 'Company car for client visits',
     (SELECT id FROM asset_categories WHERE name = 'Vehicles' LIMIT 1),
     'TCAM2023001', 'Camry SE', 'Toyota', '2023-03-10', 28000.00, 26000.00, 'active', NOW(), NOW(), TRUE)
ON CONFLICT (serial_number) DO NOTHING;

-- Insert sample maintenance logs
INSERT INTO asset_maintenance_logs (
    asset_id, maintenance_date, maintenance_type, description, cost, performed_by, next_maintenance_date, notes
) VALUES 
    ((SELECT id FROM assets WHERE serial_number = 'DXPS15789' LIMIT 1), 
     NOW() - INTERVAL '1 month', 'Software Update', 'Updated all system drivers and software', 0, 'IT Department', 
     NOW() + INTERVAL '3 months', 'System running smoothly after updates'),
     
    ((SELECT id FROM assets WHERE serial_number = 'TCAM2023001' LIMIT 1),
     NOW() - INTERVAL '2 weeks', 'Oil Change', 'Regular oil and filter change', 89.99, 'Quick Lube Center',
     NOW() + INTERVAL '6 months', 'Next service at 10,000 miles')
ON CONFLICT DO NOTHING;

-- Create a view for asset reporting
CREATE OR REPLACE VIEW vw_asset_inventory AS
SELECT 
    a.id,
    a.name,
    a.serial_number,
    a.model_number,
    ac.name as category,
    a.status,
    a.purchase_date,
    a.purchase_cost,
    a.current_value,
    a.assigned_to,
    a.location_id,
    (SELECT COUNT(*) FROM asset_maintenance_logs WHERE asset_id = a.id) as maintenance_count,
    (SELECT MAX(maintenance_date) FROM asset_maintenance_logs WHERE asset_id = a.id) as last_maintenance_date,
    a.next_maintenance_date
FROM 
    assets a
LEFT JOIN 
    asset_categories ac ON a.category_id = ac.id
WHERE 
    a.is_active = TRUE;

-- Create a function to calculate depreciation
CREATE OR REPLACE FUNCTION calculate_asset_depreciation(asset_id UUID)
RETURNS TABLE (
    months_owned INTEGER,
    current_value DECIMAL(12,2),
    monthly_depreciation DECIMAL(12,2),
    remaining_life_months INTEGER
) AS $$
DECLARE
    v_asset RECORD;
    v_months_owned INTEGER;
    v_monthly_depr DECIMAL(12,2);
BEGIN
    SELECT * INTO v_asset 
    FROM assets 
    WHERE id = asset_id;
    
    IF v_asset IS NULL THEN
        RAISE EXCEPTION 'Asset not found';
    END IF;
    
    v_months_owned := EXTRACT(YEAR FROM age(NOW(), v_asset.purchase_date)) * 12 + 
                      EXTRACT(MONTH FROM age(NOW(), v_asset.purchase_date));
    
    IF v_asset.expected_life_months > 0 THEN
        v_monthly_depr := (v_asset.purchase_cost - COALESCE(v_asset.current_value, 0)) / v_asset.expected_life_months;
        
        RETURN QUERY 
        SELECT 
            v_months_owned,
            GREATEST(0, v_asset.purchase_cost - (v_monthly_depr * LEAST(v_months_owned, v_asset.expected_life_months))),
            v_monthly_depr,
            GREATEST(0, v_asset.expected_life_months - v_months_owned);
    ELSE
        RETURN QUERY 
        SELECT 
            v_months_owned,
            v_asset.current_value,
            0::DECIMAL(12,2),
            NULL::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get asset history
CREATE OR REPLACE FUNCTION get_asset_history(p_asset_id UUID)
RETURNS TABLE (
    event_type VARCHAR(100),
    event_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    performed_by VARCHAR(200),
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- Maintenance history
    SELECT 
        'Maintenance'::VARCHAR(100) as event_type,
        maintenance_date as event_date,
        maintenance_type || ': ' || description as description,
        performed_by,
        jsonb_build_object(
            'cost', cost,
            'next_maintenance_date', next_maintenance_date,
            'notes', notes
        ) as details
    FROM 
        asset_maintenance_logs
    WHERE 
        asset_id = p_asset_id
        
    UNION ALL
    
    -- Assignment history
    SELECT 
        'Assignment'::VARCHAR(100) as event_type,
        assignment_date as event_date,
        'Assigned to ' || assigned_to as description,
        (SELECT email FROM auth.users WHERE id = assigned_by) as performed_by,
        jsonb_build_object(
            'expected_return_date', expected_return_date,
            'return_date', return_date,
            'return_condition', return_condition,
            'notes', notes
        ) as details
    FROM 
        asset_assignments
    WHERE 
        asset_id = p_asset_id
        
    ORDER BY 
        event_date DESC;
END;
$$ LANGUAGE plpgsql;
