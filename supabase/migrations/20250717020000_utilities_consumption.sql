-- Migration: Create utilities_consumption table
CREATE TABLE IF NOT EXISTS utilities_consumption (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(32) NOT NULL CHECK (type IN ('water', 'electricity')),
    month DATE NOT NULL,
    consumption NUMERIC(12,2) NOT NULL,
    cost NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Index for faster queries by type and month
CREATE INDEX IF NOT EXISTS idx_utilities_type_month ON utilities_consumption(type, month); 