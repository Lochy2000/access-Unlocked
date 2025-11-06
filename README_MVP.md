# Access-Unlocked MVP

> **Zero-cost MVP** - Focus on data flow and architecture

A travel companion application API for finding accessible facilities near you using OpenStreetMap data.

## 🎯 What is This?

This MVP provides a **working API** to search for accessible facilities (toilets, parking, ramps, elevators) near any location. It uses:
- **PostgreSQL + PostGIS** for fast geospatial queries
- **OpenStreetMap** for free, open accessibility data
- **Node.js + TypeScript** for type-safe backend
- **Fastify** for fast, modern API

## ✨ Features

- 🔍 **Proximity Search** - Find facilities within a radius
- 📍 **Distance Calculation** - Accurate distance using PostGIS
- 🗺️ **OpenStreetMap Integration** - Import real accessibility data
- 🏗️ **Clean Architecture** - Easy to extend and build upon
- 💰 **Zero Cost** - Runs entirely locally, no cloud fees

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Lochy2000/access-Unlocked.git
cd access-Unlocked
npm install
```

### 2. Start Database (Docker)

```bash
# Start PostgreSQL + PostGIS and Redis
npm run docker:up

# Check logs
npm run docker:logs

# The database will automatically:
# - Enable PostGIS extension
# - Create tables
# - Seed facility types
```

### 3. Start API Server

```bash
npm run dev
```

You should see:
```
✅ Database connected
🚀 Server ready at http://localhost:3000
📍 API Documentation: http://localhost:3000/
```

### 4. Import Some Data

Import OpenStreetMap data for your area (e.g., Berlin center):

```bash
# Import facilities within 1km of coordinates
curl -X POST "http://localhost:3000/api/osm/import?lat=52.5200&lng=13.4050&radius=1000"
```

This will fetch and import accessible facilities from OpenStreetMap.

### 5. Search for Facilities

```bash
# Search for facilities near a location
curl "http://localhost:3000/api/facilities/nearby?lat=52.5200&lng=13.4050&radius=1000"

# Filter by type (toilet, parking, ramp, elevator, entrance, station)
curl "http://localhost:3000/api/facilities/nearby?lat=52.5200&lng=13.4050&types=toilet,parking"

# Filter by wheelchair accessibility
curl "http://localhost:3000/api/facilities/nearby?lat=52.5200&lng=13.4050&wheelchairAccessible=true"
```

## 📚 API Endpoints

### Root
```
GET /
```
Returns API documentation and available endpoints.

### Health Checks
```
GET /health
GET /health/db
```

### Facility Search
```
GET /api/facilities/nearby?lat=<lat>&lng=<lng>&radius=<meters>
```
Search for nearby facilities.

**Query Parameters:**
- `lat` (required) - Latitude (-90 to 90)
- `lng` (required) - Longitude (-180 to 180)
- `radius` (optional) - Search radius in meters (default: 1000)
- `types` (optional) - Comma-separated types (toilet, parking, ramp, elevator, entrance, station)
- `wheelchairAccessible` (optional) - Filter by wheelchair accessibility (true/false)
- `limit` (optional) - Max results (default: 20)
- `offset` (optional) - Pagination offset

**Example Response:**
```json
{
  "success": true,
  "data": {
    "facilities": [
      {
        "id": "uuid",
        "name": "Central Station Toilet",
        "facilityTypeId": "toilet",
        "location": {
          "lat": 52.5205,
          "lng": 13.4048
        },
        "address": "Europaplatz 1, Berlin",
        "accessibility": {
          "wheelchairAccessible": true,
          "hasRamp": true,
          "hasElevator": false,
          "hasAccessibleToilet": true,
          "hasAccessibleParking": false,
          "hasAutomaticDoor": true
        },
        "verified": false,
        "dataSources": ["openstreetmap"],
        "distance": 87.5
      }
    ],
    "count": 1
  }
}
```

### Get Facility by ID
```
GET /api/facilities/:id
```

### Get Facility Types
```
GET /api/facilities/types
```

### Import OSM Data
```
POST /api/osm/import?lat=<lat>&lng=<lng>&radius=<meters>
```
Import OpenStreetMap data for a specific location.

```
POST /api/osm/sync?lat=<lat>&lng=<lng>&radius=<meters>
```
Sync larger area (default 5km radius).

## 🏗️ Architecture

```
┌─────────────────┐
│   Fastify API   │  ← Node.js + TypeScript
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  ← PostGIS for geospatial queries
│   + PostGIS     │     ST_Distance, ST_DWithin, etc.
└────────┬────────┘
         │
┌────────▼────────┐
│  OpenStreetMap  │  ← Free accessibility data
│  Overpass API   │     Wheelchair tags, facilities
└─────────────────┘
```

## 📁 Project Structure

```
access-Unlocked/
├── src/
│   ├── config/           # Configuration
│   ├── services/         # Business logic
│   │   ├── facilityService.ts   # Database queries
│   │   └── osmService.ts        # OSM integration
│   ├── routes/           # API routes
│   │   ├── facilities.ts
│   │   └── osm.ts
│   ├── types/            # TypeScript types
│   ├── utils/            # Database utilities
│   └── server.ts         # Main server
├── scripts/
│   └── init-db.sql       # Database initialization
├── docker-compose.yml    # Docker services
├── .env                  # Environment variables
└── package.json
```

## 🗄️ Database Schema

### Tables
- **facility_types** - Types of facilities (toilet, parking, etc.)
- **facilities** - Individual accessible facilities

### PostGIS Queries
The app uses PostGIS for accurate geospatial queries:

```sql
-- Find facilities within 1km
SELECT *, ST_Distance(location, ST_MakePoint(lng, lat)::geography) as distance
FROM facilities
WHERE ST_DWithin(location, ST_MakePoint(lng, lat)::geography, 1000)
ORDER BY distance;
```

## 🔧 Development

### Environment Variables

See `.env` file:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/access_unlocked_dev
REDIS_URL=redis://localhost:6379
OSM_OVERPASS_URL=https://overpass-api.de/api/interpreter
LOG_LEVEL=info
```

### Useful Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Docker commands
npm run docker:up       # Start services
npm run docker:down     # Stop services
npm run docker:logs     # View logs
```

### Example Locations for Testing

```bash
# Berlin, Germany
lat=52.5200&lng=13.4050

# London, UK
lat=51.5074&lng=-0.1278

# New York, USA
lat=40.7128&lng=-74.0060

# Sydney, Australia
lat=-33.8688&lng=151.2093
```

## 🌍 OpenStreetMap Data

This project uses free data from OpenStreetMap. The app looks for:
- `wheelchair=yes` - Wheelchair accessible
- `toilets:wheelchair=yes` - Accessible toilets
- `parking:disabled=yes` - Accessible parking
- `elevator=yes` or `highway=elevator` - Elevators
- `ramp=yes` - Wheelchair ramps
- `entrance` + `wheelchair=yes` - Accessible entrances

**Data Quality:** OSM data quality varies by region. Urban areas generally have better coverage.

**Rate Limits:** The public Overpass API has rate limits (2 requests/second). The app respects these automatically.

## 🛣️ Next Steps

This is a working MVP! Here's what you can build next:

### Short Term
- [ ] Add caching with Redis
- [ ] Add full-text search on facility names
- [ ] Add more OSM tags (braille, hearing loops, etc.)
- [ ] Add data validation and duplicate detection
- [ ] Add API tests

### Medium Term
- [ ] Build simple web frontend
- [ ] Add user authentication
- [ ] Add user contributions
- [ ] Add facility reviews/ratings
- [ ] Integrate more data sources (Wheelmap, local government APIs)

### Long Term
- [ ] Add route planning
- [ ] Build mobile apps
- [ ] Add offline mode
- [ ] Add photos
- [ ] Add real-time updates

## 📖 Documentation

- **[PROJECT_PLAN.md](PROJECT_PLAN.md)** - Complete 28-week development plan
- **[TECH_STACK_DECISION.md](TECH_STACK_DECISION.md)** - Technology choices and rationale
- **[SPRINT_1_SETUP_GUIDE.md](SPRINT_1_SETUP_GUIDE.md)** - Detailed setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[API_INTEGRATION.md](API_INTEGRATION.md)** - External API integrations
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Database design

## 🤝 Contributing

This is a personal project, but contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) file.

## 🙏 Credits

- **OpenStreetMap** - Free geographic data
- **PostGIS** - Spatial database extension
- **Fastify** - Fast web framework

---

**Built with ❤️ for accessibility**

Questions? Open an issue or check the documentation!
