# API Integration Guide

This document details all the external APIs and data sources integrated into Access-Unlocked, including setup instructions, rate limits, and best practices.

## Overview

Access-Unlocked aggregates data from multiple sources to provide comprehensive accessibility information. This multi-source approach ensures better coverage, data redundancy, and up-to-date information.

## Required APIs

### 1. OpenStreetMap (OSM) via Overpass API

**Purpose**: Primary source for geographical data and accessibility features

**Website**: https://www.openstreetmap.org/  
**API Documentation**: https://wiki.openstreetmap.org/wiki/Overpass_API

#### Setup
1. No API key required for public Overpass API
2. For production, consider hosting your own Overpass instance or use a paid service
3. Public endpoint: `https://overpass-api.de/api/interpreter`

#### Rate Limits
- Public instance: Reasonable use policy (typically 10,000 queries/day)
- Recommended: Max 2 queries/second
- For higher usage, use commercial hosting or self-hosted instance

#### Data Available
```javascript
// Accessibility tags in OSM
{
  "wheelchair": "yes|limited|no",
  "wheelchair:description": "Detailed description",
  "ramp": "yes|no",
  "elevator": "yes|no",
  "automatic_door": "yes|no",
  "toilets:wheelchair": "yes|no",
  "parking:disabled": "yes|designated|no",
  "tactile_paving": "yes|no",
  "entrance": "yes|main|service",
  "width": "value in meters"
}
```

#### Example Query
```javascript
// Overpass QL to find wheelchair-accessible toilets within 1km
const query = `
[out:json][timeout:25];
(
  node["amenity"="toilets"]["toilets:wheelchair"="yes"]
    (around:1000,${lat},${lng});
  way["amenity"="toilets"]["toilets:wheelchair"="yes"]
    (around:1000,${lat},${lng});
);
out body;
>;
out skel qt;
`;

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: query
});
```

#### Best Practices
- Cache results for at least 24 hours
- Use bounding box queries instead of radius when possible
- Batch queries to reduce API calls
- Respect rate limits and implement exponential backoff

#### Cost
- **Public API**: Free
- **Self-hosted**: Infrastructure costs (~$50-200/month for VPS)
- **Commercial hosting**: Varies by provider

---

### 2. Wheelmap API

**Purpose**: Specialized wheelchair accessibility database with community contributions

**Website**: https://wheelmap.org/  
**API Documentation**: https://wheelmap.org/en/api

#### Setup
1. Register at https://wheelmap.org/
2. Request API access through their developer portal
3. Obtain API key

#### Rate Limits
- 100 requests/minute
- 10,000 requests/day (free tier)
- For higher limits, contact Wheelmap team

#### Configuration
```env
WHEELMAP_API_KEY=your_api_key_here
WHEELMAP_API_BASE_URL=https://wheelmap.org/api
```

#### Data Available
```javascript
// Wheelmap place object
{
  "id": 12345,
  "name": "Local Cafe",
  "wheelchair": "yes|limited|no|unknown",
  "wheelchair_toilet": "yes|no|unknown",
  "wheelchair_description": "Step-free entrance, accessible toilet",
  "lat": 52.5200,
  "lon": 13.4050,
  "category": {
    "id": 23,
    "identifier": "food"
  },
  "photos": []
}
```

#### Example Request
```javascript
const axios = require('axios');

async function searchWheelmapPlaces(lat, lng, radius = 1000) {
  const response = await axios.get('https://wheelmap.org/api/nodes', {
    params: {
      api_key: process.env.WHEELMAP_API_KEY,
      lat: lat,
      lon: lng,
      limit: 50,
      distance: radius,
      wheelchair: 'yes' // Filter for accessible places
    }
  });
  return response.data;
}
```

#### Best Practices
- Implement request queuing to stay within rate limits
- Cache results for 6-12 hours
- Contribute back data from user submissions
- Attribute data to Wheelmap in UI

#### Cost
- **Free tier**: 10,000 requests/day
- **Premium**: Contact for pricing

---

### 3. Google Places API

**Purpose**: Enhanced place information, photos, reviews, and additional details

**Website**: https://developers.google.com/maps/documentation/places  
**API Documentation**: https://developers.google.com/maps/documentation/places/web-service/overview

#### Setup
1. Create a Google Cloud Platform account
2. Enable Places API in GCP Console
3. Create credentials (API Key)
4. Restrict API key to specific APIs and domains/IP addresses

#### Rate Limits
- 1,000 requests/day (free tier with credit)
- 100 requests/second (after billing enabled)
- Different pricing for different request types

#### Configuration
```env
GOOGLE_PLACES_API_KEY=your_google_api_key
GOOGLE_PLACES_API_BASE_URL=https://maps.googleapis.com/maps/api/place
```

#### Data Available
```javascript
// Place Details Response
{
  "name": "Central Library",
  "formatted_address": "123 Main St, City, State",
  "geometry": {
    "location": { "lat": 40.7128, "lng": -74.0060 }
  },
  "photos": [...],
  "rating": 4.5,
  "user_ratings_total": 234,
  "opening_hours": {...},
  "wheelchair_accessible_entrance": true, // Limited availability
  "reviews": [...]
}
```

#### Example Request
```javascript
const axios = require('axios');

async function getNearbyPlaces(lat, lng, type, radius = 1000) {
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    {
      params: {
        key: process.env.GOOGLE_PLACES_API_KEY,
        location: `${lat},${lng}`,
        radius: radius,
        type: type // e.g., 'parking', 'transit_station'
      }
    }
  );
  return response.data.results;
}

async function getPlaceDetails(placeId) {
  const response = await axios.get(
    'https://maps.googleapis.com/maps/api/place/details/json',
    {
      params: {
        key: process.env.GOOGLE_PLACES_API_KEY,
        place_id: placeId,
        fields: 'name,formatted_address,geometry,photos,wheelchair_accessible_entrance'
      }
    }
  );
  return response.data.result;
}
```

#### Best Practices
- Use field masks to reduce costs (only request needed fields)
- Cache Place Details for 24 hours minimum
- Implement session tokens for autocomplete
- Monitor usage in GCP Console

#### Cost (as of 2024)
- **Nearby Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests (basic), $32 (contact/atmosphere)
- **Text Search**: $32 per 1,000 requests
- **Free tier**: $200 credit/month

**Cost Optimization**:
- Use Places API only for data not available in OSM/Wheelmap
- Cache aggressively
- Use field masks
- Consider Google Maps Platform's $200 monthly credit

---

### 4. Mapbox API (Optional)

**Purpose**: Enhanced mapping, geocoding, and routing

**Website**: https://www.mapbox.com/  
**API Documentation**: https://docs.mapbox.com/api/

#### Setup
1. Create Mapbox account
2. Get access token from account dashboard
3. Configure API restrictions

#### Rate Limits
- 100,000 free requests/month per API
- Different limits for different APIs
- Pay-as-you-go after free tier

#### Configuration
```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token
MAPBOX_API_BASE_URL=https://api.mapbox.com
```

#### Features Used
1. **Geocoding**: Convert addresses to coordinates
2. **Reverse Geocoding**: Convert coordinates to addresses
3. **Directions**: Calculate routes
4. **Maps**: Display interactive maps

#### Example Request
```javascript
const axios = require('axios');

// Geocoding
async function geocode(address) {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
    {
      params: {
        access_token: process.env.MAPBOX_ACCESS_TOKEN,
        limit: 1
      }
    }
  );
  return response.data.features[0];
}

// Directions with accessibility options
async function getAccessibleRoute(start, end) {
  const response = await axios.get(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${end.lng},${end.lat}`,
    {
      params: {
        access_token: process.env.MAPBOX_ACCESS_TOKEN,
        geometries: 'geojson',
        steps: true,
        banner_instructions: true
      }
    }
  );
  return response.data.routes[0];
}
```

#### Cost
- **Free tier**: 100,000 requests/month per API
- **Geocoding**: $0.50 per 1,000 requests after free tier
- **Directions**: $0.50 per 1,000 requests after free tier
- **Maps**: Varies by usage

---

### 5. Local Government Open Data APIs

Many cities and municipalities provide open data APIs with accessibility information.

#### Examples

**NYC Open Data**
- **URL**: https://data.cityofnewyork.us/
- **APIs**: Accessible parking, building accessibility
- **Format**: JSON, CSV via Socrata API
- **Cost**: Free
- **Example**: https://data.cityofnewyork.us/resource/dvnq-f8za.json

**London Datastore**
- **URL**: https://data.london.gov.uk/
- **APIs**: Accessible toilets, step-free access tube stations
- **Cost**: Free

**San Francisco Open Data**
- **URL**: https://datasf.org/opendata/
- **APIs**: Accessible parking, curb ramps
- **Cost**: Free

#### Integration Pattern
```javascript
// Generic function for Socrata-based APIs
async function getSocrataData(baseUrl, datasetId, filters = {}) {
  const params = new URLSearchParams({
    $limit: 1000,
    ...filters
  });
  
  const response = await axios.get(
    `${baseUrl}/resource/${datasetId}.json?${params}`
  );
  return response.data;
}

// Example: Get accessible parking in NYC
const accessibleParkingNYC = await getSocrataData(
  'https://data.cityofnewyork.us',
  'dvnq-f8za',
  {
    $where: `within_circle(location, ${lat}, ${lng}, 1000)`
  }
);
```

---

## Optional APIs

### 6. Transit APIs

**Purpose**: Public transportation accessibility information

#### Common Options
- **Transit API**: https://transitapp.com/
- **Google Transit**: Part of Google Maps Platform
- **Citymapper**: Selected cities

#### Use Cases
- Step-free access at stations
- Elevator/escalator status
- Accessible vehicle information

---

### 7. Accessibility Review APIs

**Purpose**: User reviews and ratings focused on accessibility

#### Yelp Fusion API
- Accessibility attribute in business details
- User reviews mentioning accessibility
- **Cost**: Free tier available

#### TripAdvisor API
- Wheelchair accessibility information
- **Cost**: Partnership required

---

## Data Normalization

Different APIs return data in different formats. Implement a normalization layer:

```javascript
class AccessibilityDataNormalizer {
  static normalize(data, source) {
    switch(source) {
      case 'osm':
        return this.normalizeOSM(data);
      case 'wheelmap':
        return this.normalizeWheelmap(data);
      case 'google':
        return this.normalizeGoogle(data);
      default:
        return data;
    }
  }

  static normalizeOSM(osmData) {
    return {
      id: `osm_${osmData.id}`,
      name: osmData.tags.name,
      location: {
        lat: osmData.lat,
        lng: osmData.lon
      },
      accessibility: {
        wheelchair: osmData.tags.wheelchair,
        ramp: osmData.tags.ramp === 'yes',
        elevator: osmData.tags.elevator === 'yes',
        wheelchairToilet: osmData.tags['toilets:wheelchair'] === 'yes'
      },
      source: 'openstreetmap',
      lastUpdated: new Date()
    };
  }

  static normalizeWheelmap(wheelmapData) {
    return {
      id: `wheelmap_${wheelmapData.id}`,
      name: wheelmapData.name,
      location: {
        lat: wheelmapData.lat,
        lng: wheelmapData.lon
      },
      accessibility: {
        wheelchair: wheelmapData.wheelchair,
        wheelchairToilet: wheelmapData.wheelchair_toilet === 'yes',
        description: wheelmapData.wheelchair_description
      },
      source: 'wheelmap',
      lastUpdated: new Date()
    };
  }

  static normalizeGoogle(googleData) {
    return {
      id: `google_${googleData.place_id}`,
      name: googleData.name,
      location: {
        lat: googleData.geometry.location.lat,
        lng: googleData.geometry.location.lng
      },
      accessibility: {
        wheelchairEntrance: googleData.wheelchair_accessible_entrance
      },
      photos: googleData.photos,
      rating: googleData.rating,
      source: 'google_places',
      lastUpdated: new Date()
    };
  }
}
```

---

## API Rate Limiting Strategy

Implement a centralized rate limiter:

```javascript
const Bottleneck = require('bottleneck');

// Rate limiters for each API
const limiters = {
  osm: new Bottleneck({
    minTime: 500, // 2 requests/second
    maxConcurrent: 2
  }),
  
  wheelmap: new Bottleneck({
    reservoir: 100, // 100 requests
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 60 * 1000, // per minute
    maxConcurrent: 5
  }),
  
  google: new Bottleneck({
    reservoir: 100, // Adjust based on your quota
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000, // per second
    maxConcurrent: 10
  })
};

// Wrap API calls with rate limiter
const googlePlacesService = {
  nearbySearch: limiters.google.wrap(async (params) => {
    // API call implementation
  }),
  
  placeDetails: limiters.google.wrap(async (placeId) => {
    // API call implementation
  })
};
```

---

## Error Handling

```javascript
class APIError extends Error {
  constructor(message, statusCode, source) {
    super(message);
    this.statusCode = statusCode;
    this.source = source;
  }
}

async function fetchWithRetry(fetchFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Monitoring and Logging

Track API usage and performance:

```javascript
const apiMetrics = {
  logRequest(api, endpoint, duration, success) {
    // Log to monitoring service
    console.log({
      api,
      endpoint,
      duration,
      success,
      timestamp: new Date()
    });
  }
};

// Middleware to track API calls
async function trackedAPICall(api, endpoint, callFn) {
  const start = Date.now();
  try {
    const result = await callFn();
    apiMetrics.logRequest(api, endpoint, Date.now() - start, true);
    return result;
  } catch (error) {
    apiMetrics.logRequest(api, endpoint, Date.now() - start, false);
    throw error;
  }
}
```

---

## Cost Estimation

Based on 10,000 daily active users:

| API | Requests/Day | Monthly Cost | Notes |
|-----|--------------|--------------|-------|
| OpenStreetMap | 50,000 | $0 | Free (public) or $100 (self-hosted) |
| Wheelmap | 25,000 | $0 | Within free tier |
| Google Places | 15,000 | $240-480 | Depends on request types |
| Mapbox | 30,000 | $0 | Within free tier |
| **Total** | **120,000** | **$240-580** | With aggressive caching |

**Cost Optimization Tips**:
1. Cache aggressively (Redis/PostgreSQL)
2. Use OSM/Wheelmap as primary sources
3. Use Google Places only for enrichment
4. Implement request deduplication
5. Batch requests where possible

---

## Testing API Integrations

```javascript
// Mock API responses for testing
const mockOSMResponse = {
  elements: [
    {
      type: 'node',
      id: 123456,
      lat: 52.5200,
      lon: 13.4050,
      tags: {
        name: 'Test Location',
        wheelchair: 'yes',
        'toilets:wheelchair': 'yes'
      }
    }
  ]
};

// Integration test example
describe('API Integration Tests', () => {
  it('should fetch accessible places from OSM', async () => {
    const places = await osmService.findAccessiblePlaces(52.5200, 13.4050, 1000);
    expect(places).toBeDefined();
    expect(places.length).toBeGreaterThan(0);
  });
});
```

---

## Security Best Practices

1. **API Key Management**
   - Store keys in environment variables
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly
   - Never commit keys to version control

2. **API Key Restrictions**
   - Restrict by IP address (backend)
   - Restrict by HTTP referrer (frontend)
   - Restrict by API/service
   - Set usage quotas

3. **Request Validation**
   - Validate all user inputs
   - Sanitize location data
   - Implement request signing for sensitive endpoints

---

## Next Steps

1. Obtain API keys for all required services
2. Implement rate limiting and caching
3. Create data normalization layer
4. Set up monitoring and alerting
5. Test integrations thoroughly
6. Document any additional regional APIs
