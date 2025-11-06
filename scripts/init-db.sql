-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions are installed
SELECT PostGIS_version();

-- Create facility_types table
CREATE TABLE IF NOT EXISTS facility_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert facility types
INSERT INTO facility_types (id, name, description, icon, category, sort_order) VALUES
    ('toilet', 'Accessible Toilet', 'Public toilets with accessibility features', 'toilet', 'amenity', 1),
    ('parking', 'Accessible Parking', 'Designated accessible parking spaces', 'parking', 'transport', 2),
    ('ramp', 'Wheelchair Ramp', 'Ramps for wheelchair access', 'ramp', 'access', 3),
    ('elevator', 'Elevator', 'Elevators for multi-level access', 'elevator', 'access', 4),
    ('entrance', 'Accessible Entrance', 'Step-free building entrances', 'entrance', 'access', 5),
    ('station', 'Transit Station', 'Accessible public transit stations', 'station', 'transport', 6)
ON CONFLICT (id) DO NOTHING;

-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    facility_type_id VARCHAR(50) REFERENCES facility_types(id),

    -- Location (PostGIS geography type for accurate distance calculations)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    address TEXT,

    -- Accessibility features (boolean flags for quick filtering)
    wheelchair_accessible BOOLEAN,
    has_ramp BOOLEAN,
    has_elevator BOOLEAN,
    has_accessible_toilet BOOLEAN,
    has_accessible_parking BOOLEAN,
    has_automatic_door BOOLEAN,

    -- Opening hours (JSON)
    opening_hours JSONB,

    -- Contact information
    phone VARCHAR(50),
    website TEXT,

    -- Data quality
    verified BOOLEAN DEFAULT FALSE,
    data_quality_score DECIMAL(3, 2),

    -- Data sources (can have multiple)
    data_sources JSONB DEFAULT '[]'::jsonb,
    external_ids JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create spatial index on location for fast proximity queries
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST(location);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(facility_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_wheelchair ON facilities(wheelchair_accessible) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_verified ON facilities(verified) WHERE deleted_at IS NULL;

-- Create full text search index on name and address
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_address_trgm ON facilities USING GIN(address gin_trgm_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facility_types_updated_at BEFORE UPDATE ON facility_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
