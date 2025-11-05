# Access-Unlocked Architecture

## High-Level Architecture Overview

Access-Unlocked is designed as a modern, scalable application that aggregates accessibility data from multiple sources and delivers it to users through a responsive interface.

## System Architecture

### 1. Client Layer

#### Web Application
- **Technology**: React/Vue.js or Angular
- **Features**:
  - Responsive design for desktop and mobile browsers
  - Progressive Web App (PWA) capabilities
  - Geolocation API integration
  - Interactive maps
  - Real-time search and filtering

#### Mobile Applications
- **iOS**: Swift/SwiftUI
- **Android**: Kotlin/Jetpack Compose
- **Cross-platform Option**: React Native or Flutter
- **Features**:
  - Native geolocation services
  - Push notifications
  - Offline data caching
  - Background location updates (with permission)

### 2. API Gateway Layer

```
┌─────────────────────────────────────────┐
│         Load Balancer / CDN             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           API Gateway                   │
│  - Rate Limiting                        │
│  - Authentication                       │
│  - Request Routing                      │
│  - Response Caching                     │
└─────────────────┬───────────────────────┘
```

**Components**:
- **Rate Limiting**: Prevent abuse (1000 requests/hour per user)
- **Authentication**: JWT-based authentication for registered users
- **API Versioning**: Support multiple API versions
- **CORS**: Configured for web client access
- **Request Validation**: Input sanitization and validation

### 3. Application Layer

#### Core Services

##### Location Service
```javascript
Location Service
├── Geolocation Handler
│   ├── GPS coordinate processing
│   ├── Address geocoding
│   └── Reverse geocoding
├── Proximity Calculator
│   ├── Distance calculations (Haversine formula)
│   ├── Radius-based searches
│   └── Bounding box queries
└── Location Privacy Manager
    ├── Location data anonymization
    └── User consent management
```

##### Search Service
```javascript
Search Service
├── Query Parser
│   ├── Natural language processing
│   ├── Filter extraction
│   └── Intent detection
├── Multi-source Aggregator
│   ├── API orchestration
│   ├── Result merging
│   └── Deduplication
├── Ranking Engine
│   ├── Distance-based scoring
│   ├── Quality scoring
│   └── User preference weighting
└── Cache Manager
    ├── Hot data caching
    └── Geospatial indexes
```

##### Route Planning Service
```javascript
Route Planning Service
├── Path Finding
│   ├── Accessible route calculation
│   ├── Step-free route options
│   └── Multi-modal transport
├── Obstacle Detection
│   ├── Known barriers
│   └── User-reported issues
└── Turn-by-turn Navigation
    ├── Voice guidance
    └── Visual waypoints
```

##### User Contribution Service
```javascript
User Contribution Service
├── Data Submission
│   ├── New facility reports
│   ├── Updates to existing data
│   └── Accessibility ratings
├── Verification System
│   ├── Community voting
│   ├── Admin moderation
│   └── Automated validation
└── Reputation System
    ├── User credibility scoring
    └── Contribution tracking
```

### 4. Data Aggregation Layer

The system integrates data from multiple external sources:

```
┌──────────────────────────────────────────────┐
│       External API Integrations              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────┐  ┌────────────┐            │
│  │ OpenStreet │  │  Wheelmap  │            │
│  │    Map     │  │    API     │            │
│  └─────┬──────┘  └─────┬──────┘            │
│        │                │                    │
│  ┌─────▼──────┐  ┌─────▼──────┐            │
│  │   Google   │  │   Local    │            │
│  │  Places    │  │ Government │            │
│  │    API     │  │    APIs    │            │
│  └─────┬──────┘  └─────┬──────┘            │
│        │                │                    │
│  ┌─────▼────────────────▼──────┐            │
│  │   Data Normalization Layer  │            │
│  └─────────────┬─────────────────┘          │
│                │                             │
└────────────────┼─────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Internal Cache │
         │   & Storage    │
         └────────────────┘
```

#### API Integration Details

**OpenStreetMap (OSM)**
- Primary source for base geographical data
- Access via Overpass API
- Tags used: `wheelchair=yes/limited/no`, `ramp=yes`, `elevator=yes`
- Free and open-source
- Rate limit: Reasonable use policy

**Wheelmap API**
- Specialized wheelchair accessibility database
- RESTful API
- Global coverage with community contributions
- Rate limit: 100 requests/minute

**Google Places API**
- Enhanced place information
- Photos and user reviews
- Accessibility attributes (limited)
- Cost: $0-$200/month depending on usage

**Local Government Open Data APIs**
- City-specific accessible parking data
- Public building accessibility info
- Transit accessibility information
- Varies by region

### 5. Data Storage Layer

#### Primary Database (PostgreSQL)

```sql
-- Database Schema Overview

-- Facilities table
facilities
├── id (UUID, PK)
├── name (VARCHAR)
├── location (GEOGRAPHY) -- PostGIS type
├── facility_type (ENUM)
├── accessibility_features (JSONB)
├── verified (BOOLEAN)
├── data_source (VARCHAR)
└── last_updated (TIMESTAMP)

-- Accessibility Features table
accessibility_features
├── id (UUID, PK)
├── facility_id (UUID, FK)
├── feature_type (ENUM) -- ramp, elevator, toilet, parking
├── available (BOOLEAN)
├── description (TEXT)
└── verified_by (UUID, FK to users)

-- User Contributions table
user_contributions
├── id (UUID, PK)
├── user_id (UUID, FK)
├── facility_id (UUID, FK)
├── contribution_type (ENUM) -- add, update, rating
├── data (JSONB)
├── status (ENUM) -- pending, approved, rejected
└── created_at (TIMESTAMP)
```

**PostGIS Extension**:
- Spatial indexing for fast proximity queries
- Geography type for accurate distance calculations
- Spatial queries: `ST_DWithin`, `ST_Distance`

#### Cache Layer (Redis)

```
Redis Cache Structure
├── Location Cache
│   ├── Key: "loc:{lat}:{lng}:{radius}"
│   ├── TTL: 1 hour
│   └── Value: Serialized facility list
├── Search Results Cache
│   ├── Key: "search:{query}:{lat}:{lng}"
│   ├── TTL: 30 minutes
│   └── Value: Search results
└── User Session Data
    ├── Key: "session:{user_id}"
    ├── TTL: 24 hours
    └── Value: User preferences and state
```

#### Search Index (Elasticsearch)

```
Elasticsearch Indices
└── facilities_index
    ├── Geospatial queries
    ├── Full-text search
    ├── Faceted filtering
    └── Aggregations for analytics
```

### 6. Background Services

#### Data Synchronization Service
- **Schedule**: Every 6 hours
- **Function**: Sync with external APIs
- **Process**:
  1. Fetch updated data from APIs
  2. Normalize and validate
  3. Merge with existing data
  4. Update search indices
  5. Invalidate affected caches

#### Data Quality Service
- **Schedule**: Daily
- **Function**: Maintain data quality
- **Process**:
  1. Identify stale data (>6 months)
  2. Flag for re-verification
  3. Remove duplicates
  4. Validate coordinates
  5. Check data consistency

#### Analytics Service
- **Schedule**: Real-time + daily aggregation
- **Function**: Track usage and patterns
- **Metrics**:
  - Popular search queries
  - Most requested facility types
  - Geographic usage patterns
  - API performance metrics

## Data Flow

### Search Flow

```
User Request
    │
    ▼
[1] Geolocation Detection
    │
    ▼
[2] Cache Check (Redis)
    │
    ├─── Hit ──→ Return Cached Results
    │
    └─── Miss
         │
         ▼
[3] Database Query (PostgreSQL)
    │
    ├─── Spatial Query (PostGIS)
    ├─── Filter by Accessibility Features
    └─── Sort by Distance
         │
         ▼
[4] External API Augmentation (if needed)
    │
    ├─── Fetch additional details
    └─── Enrich with photos/reviews
         │
         ▼
[5] Result Ranking & Formatting
    │
    ▼
[6] Cache Results (Redis)
    │
    ▼
[7] Return to User
```

### User Contribution Flow

```
User Submits Contribution
    │
    ▼
[1] Validation
    │
    ├─── Format check
    ├─── Required fields
    └─── Geolocation verification
         │
         ▼
[2] Save to Database (pending status)
    │
    ▼
[3] Trigger Verification Workflow
    │
    ├─── Automated checks
    │    ├─── Duplicate detection
    │    ├─── Coordinate validation
    │    └─── Spam detection
    │
    ├─── Community Verification (if enabled)
    │    └─── Require N confirmations
    │
    └─── Admin Review (for high-impact changes)
         │
         ▼
[4] Update Status (approved/rejected)
    │
    ▼
[5] If Approved:
    │
    ├─── Update facility record
    ├─── Update search index
    ├─── Invalidate related caches
    └─── Update user reputation
         │
         ▼
[6] Send Notification to User
```

## Security Architecture

### Authentication & Authorization

```
Authentication Flow
├── JWT-based token authentication
├── OAuth 2.0 for third-party login
│   ├── Google
│   ├── Apple
│   └── Facebook
├── Token refresh mechanism
└── Role-based access control (RBAC)
    ├── Anonymous users (read-only)
    ├── Registered users (contribute)
    ├── Verified contributors (bypass some checks)
    └── Administrators (full access)
```

### Data Security

- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **API Key Management**: Secrets stored in environment variables or vault
- **Input Sanitization**: Prevent SQL injection and XSS
- **Rate Limiting**: Prevent DoS attacks

### Privacy

- **Location Data**: 
  - Not stored without user consent
  - Anonymized for analytics
  - User control over location sharing
- **GDPR Compliance**:
  - Right to access data
  - Right to deletion
  - Data portability
  - Privacy by design

## Scalability Considerations

### Horizontal Scaling

```
┌─────────────────────────────────────┐
│        Load Balancer (HAProxy)      │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐     ┌───▼───┐     ┌─────────┐
│ App   │     │ App   │ ... │  App    │
│Server │     │Server │     │ Server  │
│  1    │     │  2    │     │   N     │
└───┬───┘     └───┬───┘     └────┬────┘
    │             │               │
    └──────┬──────┴───────────────┘
           │
    ┌──────▼──────────────────────┐
    │   Database Cluster          │
    │   (Primary + Replicas)      │
    └─────────────────────────────┘
```

### Performance Optimization

1. **Database Optimization**
   - Geospatial indexes on location columns
   - Partitioning by geographic regions
   - Read replicas for query distribution

2. **Caching Strategy**
   - Multi-level caching (memory, Redis, CDN)
   - Cache warming for popular locations
   - Smart cache invalidation

3. **API Optimization**
   - Request batching
   - Response compression (gzip)
   - Pagination for large result sets
   - GraphQL for flexible queries

4. **CDN Integration**
   - Static assets on CDN
   - Edge caching for geographic distribution
   - Reduced latency for global users

## Deployment Architecture

### Development Environment
```
Developer Machine
├── Docker Compose
│   ├── App Container
│   ├── PostgreSQL Container
│   ├── Redis Container
│   └── Elasticsearch Container
└── Local API mocks
```

### Production Environment (Cloud - AWS Example)

```
Route 53 (DNS)
    │
    ▼
CloudFront (CDN)
    │
    ▼
Application Load Balancer
    │
    ├─── ECS/EKS Cluster
    │    ├── App Containers (Auto-scaling)
    │    └── Background Workers
    │
    ├─── RDS PostgreSQL (Multi-AZ)
    │    ├── Primary
    │    └── Read Replicas
    │
    ├─── ElastiCache Redis (Cluster mode)
    │
    ├─── Amazon Elasticsearch Service
    │
    └─── S3 (Static Assets, Backups)
```

### Monitoring & Observability

```
Monitoring Stack
├── Application Metrics
│   ├── Prometheus
│   └── Grafana
├── Logging
│   ├── ELK Stack (Elasticsearch, Logstash, Kibana)
│   └── CloudWatch Logs
├── APM (Application Performance Monitoring)
│   ├── New Relic or DataDog
│   └── Custom dashboards
└── Error Tracking
    └── Sentry
```

## Technology Stack Summary

### Backend
- **Language**: Node.js (TypeScript) or Python (FastAPI/Django)
- **Framework**: Express.js/Fastify or FastAPI/Django REST
- **Database**: PostgreSQL 14+ with PostGIS
- **Cache**: Redis 6+
- **Search**: Elasticsearch 8+
- **Queue**: Redis Queue or AWS SQS

### Frontend
- **Web Framework**: React 18+ or Vue.js 3+
- **Mobile**: React Native or Flutter
- **State Management**: Redux/Zustand or Pinia
- **Maps**: Mapbox GL JS or Google Maps
- **UI Library**: Material-UI or Tailwind CSS

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes or AWS ECS
- **CI/CD**: GitHub Actions or GitLab CI
- **Infrastructure as Code**: Terraform or AWS CloudFormation
- **Monitoring**: Prometheus + Grafana

## Future Enhancements

### Phase 1 (Months 1-3)
- Core API integrations
- Basic search functionality
- Web application MVP
- PostgreSQL + Redis setup

### Phase 2 (Months 4-6)
- Mobile applications
- User contribution system
- Advanced filtering
- Route planning

### Phase 3 (Months 7-12)
- AI/ML recommendations
- Offline mode
- Multi-language support
- Community features
- Real-time updates

### Long-term Vision
- AR wayfinding
- IoT integration (smart building data)
- Predictive accessibility (crowd levels, maintenance schedules)
- Partnerships with municipalities and businesses
- Global expansion with regional customization
