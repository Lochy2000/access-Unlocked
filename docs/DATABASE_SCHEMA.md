# Database Schema

This document describes the database schema for Access-Unlocked using PostgreSQL with PostGIS extension.

## Overview

The database is designed to efficiently store and query accessibility information with a focus on:
- Geospatial data and proximity searches
- User contributions and verification
- Data from multiple sources
- Scalability and performance

## Database Technology

- **DBMS**: PostgreSQL 14+
- **Extensions**: 
  - PostGIS (geospatial data)
  - uuid-ossp (UUID generation)
  - pg_trgm (fuzzy text search)

## Schema Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users    │───┐   │   facilities     │───┐   │ facility_types   │
└─────────────┘   │   └──────────────────┘   │   └──────────────────┘
                  │            │              │
                  │            │              │
                  │   ┌────────▼──────────┐   │
                  │   │ accessibility_    │   │
                  │   │    features       │   │
                  │   └───────────────────┘   │
                  │                            │
                  │   ┌────────────────────┐  │
                  └──▶│ user_contributions │◀─┘
                      └────────────────────┘
                               │
                      ┌────────▼─────────┐
                      │    reviews       │
                      └──────────────────┘
```

## Tables

### 1. users

Stores user account information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    
    -- User stats
    contribution_count INTEGER DEFAULT 0,
    reputation_points INTEGER DEFAULT 0,
    verified_contributor BOOLEAN DEFAULT FALSE,
    
    -- Preferences stored as JSONB
    preferences JSONB DEFAULT '{
        "mobilityAids": [],
        "defaultRadius": 1000,
        "preferredFacilities": [],
        "notifications": {
            "email": true,
            "push": true
        }
    }'::jsonb,
    
    -- Authentication
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_reputation ON users(reputation_points DESC);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Example Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "contribution_count": 42,
  "reputation_points": 1250,
  "verified_contributor": true,
  "preferences": {
    "mobilityAids": ["wheelchair"],
    "defaultRadius": 1500,
    "preferredFacilities": ["toilet", "parking"]
  }
}
```

---

### 2. facility_types

Defines types of accessible facilities.

```sql
CREATE TABLE facility_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50), -- e.g., 'transport', 'amenity', 'building'
    
    -- Display order
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial data
INSERT INTO facility_types (id, name, description, icon, category, sort_order) VALUES
    ('toilet', 'Accessible Toilet', 'Public toilets with accessibility features', 'toilet', 'amenity', 1),
    ('parking', 'Accessible Parking', 'Designated accessible parking spaces', 'parking', 'transport', 2),
    ('ramp', 'Wheelchair Ramp', 'Ramps for wheelchair access', 'ramp', 'access', 3),
    ('elevator', 'Elevator', 'Elevators for multi-level access', 'elevator', 'access', 4),
    ('entrance', 'Accessible Entrance', 'Step-free building entrances', 'entrance', 'access', 5),
    ('station', 'Transit Station', 'Accessible public transit stations', 'station', 'transport', 6);
```

---

### 3. facilities

Core table storing information about accessible facilities.

```sql
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    facility_type_id VARCHAR(50) REFERENCES facility_types(id),
    
    -- Location (PostGIS geography type for accurate distance calculations)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    address TEXT,
    
    -- Accessibility summary (for quick filtering)
    wheelchair_accessible BOOLEAN,
    has_ramp BOOLEAN,
    has_elevator BOOLEAN,
    has_accessible_toilet BOOLEAN,
    has_accessible_parking BOOLEAN,
    has_automatic_door BOOLEAN,
    has_braille_signage BOOLEAN,
    has_hearing_loop BOOLEAN,
    
    -- Opening hours (stored as JSONB)
    opening_hours JSONB,
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    
    -- Data quality
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    data_quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    
    -- Rating
    rating DECIMAL(3, 2), -- 0.00 to 5.00
    review_count INTEGER DEFAULT 0,
    
    -- Data sources (can have multiple)
    data_sources JSONB DEFAULT '[]'::jsonb, -- ['osm', 'wheelmap', 'google', 'user']
    external_ids JSONB DEFAULT '{}'::jsonb, -- {'osm': '123', 'wheelmap': '456'}
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX idx_facilities_type ON facilities(facility_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_wheelchair ON facilities(wheelchair_accessible) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_verified ON facilities(verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_rating ON facilities(rating DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_updated_at ON facilities(updated_at);

-- Composite indexes for common queries
CREATE INDEX idx_facilities_type_location ON facilities(facility_type_id) 
    USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_wheelchair_location ON facilities(wheelchair_accessible) 
    USING GIST(location) WHERE wheelchair_accessible = TRUE AND deleted_at IS NULL;

-- Full text search
CREATE INDEX idx_facilities_name_trgm ON facilities USING GIN(name gin_trgm_ops);
```

**Example Query - Find nearby accessible toilets:**
```sql
SELECT 
    id,
    name,
    ST_Distance(location, ST_MakePoint($1, $2)::geography) as distance
FROM facilities
WHERE 
    facility_type_id = 'toilet'
    AND wheelchair_accessible = TRUE
    AND ST_DWithin(location, ST_MakePoint($1, $2)::geography, 1000)
    AND deleted_at IS NULL
ORDER BY distance
LIMIT 20;
```

---

### 4. accessibility_features

Detailed accessibility features for each facility.

```sql
CREATE TABLE accessibility_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    
    -- Feature type
    feature_type VARCHAR(50) NOT NULL, -- e.g., 'entrance', 'toilet', 'parking', 'elevator'
    
    -- Availability
    available BOOLEAN NOT NULL,
    temporarily_unavailable BOOLEAN DEFAULT FALSE,
    unavailable_reason TEXT,
    estimated_available_date DATE,
    
    -- Details
    description TEXT,
    
    -- Measurements (in meters)
    width DECIMAL(5, 2),
    height DECIMAL(5, 2),
    
    -- Additional attributes (flexible JSONB)
    attributes JSONB DEFAULT '{}'::jsonb,
    -- Examples:
    -- {'grabBars': true, 'emergencyButton': true} for toilets
    -- {'spacesCount': 5, 'signage': true} for parking
    -- {'brailleButtons': true, 'audioAnnouncement': true} for elevator
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_accessibility_features_facility ON accessibility_features(facility_id);
CREATE INDEX idx_accessibility_features_type ON accessibility_features(feature_type);
CREATE INDEX idx_accessibility_features_available ON accessibility_features(available);
```

**Example Data:**
```json
{
  "id": "uuid",
  "facility_id": "facility_uuid",
  "feature_type": "toilet",
  "available": true,
  "description": "Accessible toilet with grab bars on both sides",
  "width": 2.5,
  "attributes": {
    "grabBars": true,
    "emergencyButton": true,
    "babyChanging": true,
    "handDryer": true,
    "lighting": "good"
  }
}
```

---

### 5. user_contributions

Tracks user contributions and changes.

```sql
CREATE TABLE user_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    facility_id UUID REFERENCES facilities(id),
    
    -- Contribution type
    contribution_type VARCHAR(50) NOT NULL, -- 'add_facility', 'update_facility', 'add_photo', 'report_issue', 'add_review'
    
    -- Change data
    before_data JSONB, -- State before the change
    after_data JSONB,  -- State after the change
    description TEXT,
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'auto_approved'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Points awarded
    points_awarded INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_contributions_user ON user_contributions(user_id);
CREATE INDEX idx_contributions_facility ON user_contributions(facility_id);
CREATE INDEX idx_contributions_status ON user_contributions(status);
CREATE INDEX idx_contributions_created_at ON user_contributions(created_at DESC);
```

---

### 6. reviews

User reviews and ratings for facilities.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Rating (1-5)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Review content
    title VARCHAR(255),
    content TEXT,
    
    -- Specific ratings
    accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
    staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
    maintenance_rating INTEGER CHECK (maintenance_rating >= 1 AND maintenance_rating <= 5),
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Moderation
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    moderation_status VARCHAR(20) DEFAULT 'active', -- 'active', 'hidden', 'removed'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reviews_facility ON reviews(facility_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful ON reviews(helpful_count DESC);
```

---

### 7. photos

Photos of facilities and accessibility features.

```sql
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES accessibility_features(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    
    -- Image URLs
    original_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    medium_url TEXT,
    
    -- Image metadata
    caption TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    
    -- Moderation
    approved BOOLEAN DEFAULT FALSE,
    moderation_status VARCHAR(20) DEFAULT 'pending',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_photos_facility ON photos(facility_id);
CREATE INDEX idx_photos_feature ON photos(feature_id);
CREATE INDEX idx_photos_user ON photos(uploaded_by);
```

---

### 8. issues

Reported issues with facilities.

```sql
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id),
    
    -- Issue details
    issue_type VARCHAR(50) NOT NULL, -- 'temporarily_unavailable', 'incorrect_info', 'closed_permanently', 'safety_concern'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_issues_facility ON issues(facility_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
```

---

### 9. routes

Saved accessible routes.

```sql
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Route details
    name VARCHAR(255),
    start_location GEOGRAPHY(POINT, 4326) NOT NULL,
    start_address TEXT,
    end_location GEOGRAPHY(POINT, 4326) NOT NULL,
    end_address TEXT,
    
    -- Route data
    geometry GEOGRAPHY(LINESTRING, 4326),
    distance INTEGER, -- in meters
    duration INTEGER, -- in seconds
    
    -- Accessibility
    accessible BOOLEAN DEFAULT TRUE,
    avoid_stairs BOOLEAN DEFAULT TRUE,
    max_incline DECIMAL(5, 2), -- in degrees
    
    -- Route details (JSONB)
    steps JSONB, -- Turn-by-turn instructions
    warnings JSONB, -- Accessibility warnings
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_routes_user ON routes(user_id);
CREATE INDEX idx_routes_start ON routes USING GIST(start_location);
CREATE INDEX idx_routes_end ON routes USING GIST(end_location);
```

---

### 10. sessions

User sessions for authentication.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token
    token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    
    -- Session data
    user_agent TEXT,
    ip_address INET,
    
    -- Expiry
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Auto-delete expired sessions
CREATE INDEX idx_sessions_cleanup ON sessions(expires_at) 
    WHERE expires_at < CURRENT_TIMESTAMP;
```

---

## Views

### v_facilities_with_distance

Materialized view for popular locations (can be refreshed periodically).

```sql
CREATE MATERIALIZED VIEW v_facilities_summary AS
SELECT 
    f.id,
    f.name,
    f.facility_type_id,
    ft.name as facility_type_name,
    f.lat,
    f.lng,
    f.wheelchair_accessible,
    f.rating,
    f.review_count,
    f.verified,
    COUNT(DISTINCT af.id) as features_count,
    COUNT(DISTINCT p.id) as photos_count
FROM facilities f
LEFT JOIN facility_types ft ON f.facility_type_id = ft.id
LEFT JOIN accessibility_features af ON f.id = af.facility_id AND af.available = TRUE
LEFT JOIN photos p ON f.id = p.facility_id AND p.approved = TRUE
WHERE f.deleted_at IS NULL
GROUP BY f.id, ft.name;

CREATE UNIQUE INDEX idx_facilities_summary_id ON v_facilities_summary(id);
CREATE INDEX idx_facilities_summary_type ON v_facilities_summary(facility_type_id);
```

---

## Functions

### Calculate Distance Function

```sql
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lng1, lat1)::geography,
        ST_MakePoint(lng2, lat2)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Update Facility Rating

```sql
CREATE OR REPLACE FUNCTION update_facility_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE facilities
    SET 
        rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM reviews
            WHERE facility_id = NEW.facility_id
            AND moderation_status = 'active'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE facility_id = NEW.facility_id
            AND moderation_status = 'active'
        )
    WHERE id = NEW.facility_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_facility_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_facility_rating();
```

### Update User Stats

```sql
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE users
        SET 
            contribution_count = contribution_count + 1,
            reputation_points = reputation_points + NEW.points_awarded
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER UPDATE ON user_contributions
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();
```

---

## Maintenance

### Vacuum and Analyze

```sql
-- Run regularly
VACUUM ANALYZE facilities;
VACUUM ANALYZE accessibility_features;
VACUUM ANALYZE reviews;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY v_facilities_summary;
```

### Archive Old Data

```sql
-- Archive old sessions (older than 30 days)
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Archive resolved issues (older than 6 months)
DELETE FROM issues 
WHERE status = 'resolved' 
AND resolved_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
```

---

## Backup Strategy

1. **Daily full backup**: Complete database backup
2. **Continuous WAL archiving**: Point-in-time recovery
3. **Weekly backup verification**: Test restore procedures
4. **Offsite backup**: Store copies in different geographic locations

---

## Performance Considerations

1. **Spatial Indexes**: PostGIS GIST indexes for fast proximity queries
2. **Partial Indexes**: Index only active (non-deleted) records
3. **Covering Indexes**: Include commonly queried columns
4. **Materialized Views**: Pre-computed aggregations for common queries
5. **Connection Pooling**: Use pgBouncer for connection management
6. **Query Optimization**: Regular EXPLAIN ANALYZE on slow queries
