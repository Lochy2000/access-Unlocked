# API Documentation

## Overview

This document describes the internal REST API for Access-Unlocked. The API allows clients to search for accessible facilities, retrieve facility details, contribute data, and manage user preferences.

**Base URL**: `https://api.access-unlocked.org/v1`  
**Authentication**: JWT Bearer Token (for protected endpoints)

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Search](#search)
  - [Facilities](#facilities)
  - [User Contributions](#user-contributions)
  - [User Profile](#user-profile)
  - [Routes](#routes)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)

## Authentication

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

## Endpoints

### Search

#### Search Nearby Facilities

Search for accessible facilities near a location.

```http
GET /search/nearby
Authorization: Bearer {token} (optional)

Query Parameters:
  - lat (required): Latitude (-90 to 90)
  - lng (required): Longitude (-180 to 180)
  - radius (optional): Search radius in meters (default: 1000, max: 5000)
  - types (optional): Comma-separated facility types
  - accessibility (optional): Comma-separated accessibility features
  - limit (optional): Max results (default: 20, max: 100)
  - offset (optional): Pagination offset (default: 0)
```

**Example Request:**
```http
GET /search/nearby?lat=52.5200&lng=13.4050&radius=1000&types=toilet,parking&accessibility=wheelchair,ramp
```

**Response:**
```json
{
  "success": true,
  "data": {
    "facilities": [
      {
        "id": "uuid",
        "name": "Central Station Accessible Toilet",
        "type": "toilet",
        "location": {
          "lat": 52.5205,
          "lng": 13.4048,
          "address": "Europaplatz 1, 10557 Berlin"
        },
        "distance": 87.5,
        "accessibility": {
          "wheelchair": true,
          "ramp": true,
          "elevator": false,
          "automaticDoor": true,
          "features": [
            {
              "type": "wheelchair_accessible",
              "available": true,
              "description": "Wide entrance, grab bars installed"
            }
          ]
        },
        "verified": true,
        "rating": 4.5,
        "lastUpdated": "2024-01-15T10:30:00Z",
        "photos": [
          {
            "url": "https://cdn.access-unlocked.org/photos/abc123.jpg",
            "thumbnail": "https://cdn.access-unlocked.org/photos/abc123_thumb.jpg"
          }
        ]
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Search by Address

```http
GET /search/address
Authorization: Bearer {token} (optional)

Query Parameters:
  - query (required): Address or place name
  - radius (optional): Search radius in meters (default: 1000)
  - types (optional): Facility types filter
  - limit (optional): Max results (default: 20)
```

**Example:**
```http
GET /search/address?query=Central%20Station%20Berlin&radius=500&types=toilet
```

#### Get Facility Types

```http
GET /search/types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      {
        "id": "toilet",
        "name": "Accessible Toilet",
        "icon": "toilet",
        "description": "Public toilets with accessibility features"
      },
      {
        "id": "parking",
        "name": "Accessible Parking",
        "icon": "parking",
        "description": "Designated accessible parking spaces"
      },
      {
        "id": "ramp",
        "name": "Wheelchair Ramp",
        "icon": "ramp",
        "description": "Ramps for wheelchair access"
      },
      {
        "id": "elevator",
        "name": "Elevator",
        "icon": "elevator",
        "description": "Elevators for multi-level access"
      }
    ]
  }
}
```

### Facilities

#### Get Facility Details

```http
GET /facilities/{facilityId}
Authorization: Bearer {token} (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "facility": {
      "id": "uuid",
      "name": "Central Library",
      "type": "public_building",
      "location": {
        "lat": 52.5200,
        "lng": 13.4050,
        "address": "123 Main Street, Berlin"
      },
      "accessibility": {
        "wheelchair": true,
        "ramp": true,
        "elevator": true,
        "automaticDoor": true,
        "accessibleToilet": true,
        "accessibleParking": true,
        "brailleSignage": true,
        "hearingLoop": false,
        "features": [
          {
            "type": "entrance",
            "available": true,
            "description": "Step-free main entrance with automatic doors"
          },
          {
            "type": "elevator",
            "available": true,
            "description": "2 elevators serving all floors, wide enough for wheelchairs"
          }
        ]
      },
      "openingHours": {
        "monday": "09:00-20:00",
        "tuesday": "09:00-20:00",
        "wednesday": "09:00-20:00",
        "thursday": "09:00-20:00",
        "friday": "09:00-18:00",
        "saturday": "10:00-16:00",
        "sunday": "closed"
      },
      "contact": {
        "phone": "+49 30 12345678",
        "email": "info@library.berlin",
        "website": "https://library.berlin"
      },
      "verified": true,
      "verifiedBy": "Admin",
      "verifiedDate": "2024-01-10T14:30:00Z",
      "rating": 4.7,
      "reviewCount": 23,
      "lastUpdated": "2024-01-15T10:30:00Z",
      "photos": [...],
      "reviews": [...],
      "dataSources": ["openstreetmap", "wheelmap", "user_contributions"]
    }
  }
}
```

#### Report New Facility

```http
POST /facilities
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Accessible Cafe",
  "type": "cafe",
  "location": {
    "lat": 52.5210,
    "lng": 13.4060,
    "address": "456 Side Street, Berlin"
  },
  "accessibility": {
    "wheelchair": true,
    "ramp": true,
    "accessibleToilet": true,
    "features": [
      {
        "type": "entrance",
        "available": true,
        "description": "Ramp at side entrance"
      }
    ]
  },
  "photos": ["base64_image_1", "base64_image_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "facility": {
      "id": "new_uuid",
      "status": "pending_verification",
      "message": "Thank you! Your submission will be reviewed."
    }
  }
}
```

#### Update Facility

```http
PATCH /facilities/{facilityId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "accessibility": {
    "elevator": false
  },
  "note": "Elevator is temporarily out of service"
}
```

#### Add Facility Photos

```http
POST /facilities/{facilityId}/photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "photo": [file],
  "caption": "Accessible entrance"
}
```

#### Report Issue

```http
POST /facilities/{facilityId}/issues
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "temporarily_unavailable",
  "description": "Ramp under repair, expected completion in 2 weeks",
  "photos": ["base64_image"]
}
```

### User Contributions

#### Get User Contributions

```http
GET /contributions
Authorization: Bearer {token}

Query Parameters:
  - status (optional): pending|approved|rejected
  - limit (optional): Max results (default: 20)
  - offset (optional): Pagination offset
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contributions": [
      {
        "id": "uuid",
        "type": "new_facility",
        "facilityId": "uuid",
        "facilityName": "New Cafe",
        "status": "approved",
        "submittedAt": "2024-01-14T10:00:00Z",
        "reviewedAt": "2024-01-15T09:30:00Z",
        "reviewedBy": "admin_user",
        "points": 50
      }
    ],
    "pagination": {...}
  }
}
```

#### Get Leaderboard

```http
GET /contributions/leaderboard

Query Parameters:
  - period (optional): week|month|year|all (default: month)
  - limit (optional): Max results (default: 10)
```

### User Profile

#### Get Profile

```http
GET /profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://cdn.access-unlocked.org/avatars/abc123.jpg",
      "stats": {
        "contributionsCount": 42,
        "points": 1250,
        "rank": 15,
        "verified": true
      },
      "preferences": {
        "mobilityAids": ["wheelchair"],
        "defaultRadius": 1000,
        "preferredFacilities": ["toilet", "parking", "elevator"],
        "notifications": {
          "email": true,
          "push": true
        }
      },
      "createdAt": "2023-06-01T10:00:00Z"
    }
  }
}
```

#### Update Profile

```http
PATCH /profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "preferences": {
    "mobilityAids": ["wheelchair", "cane"],
    "defaultRadius": 1500
  }
}
```

#### Update Preferences

```http
PUT /profile/preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "mobilityAids": ["wheelchair"],
  "defaultRadius": 2000,
  "preferredFacilities": ["toilet", "parking"],
  "notifications": {
    "email": true,
    "push": false
  }
}
```

### Routes

#### Calculate Accessible Route

```http
POST /routes/calculate
Authorization: Bearer {token} (optional)
Content-Type: application/json

{
  "start": {
    "lat": 52.5200,
    "lng": 13.4050
  },
  "end": {
    "lat": 52.5210,
    "lng": 13.4060
  },
  "options": {
    "avoidStairs": true,
    "maxIncline": 5,
    "preferPavedPaths": true,
    "includeAccessibleStops": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {
      "distance": 1250,
      "duration": 900,
      "accessible": true,
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [13.4050, 52.5200],
          [13.4055, 52.5205],
          [13.4060, 52.5210]
        ]
      },
      "steps": [
        {
          "instruction": "Head north on Main Street",
          "distance": 200,
          "duration": 150,
          "accessible": true,
          "features": {
            "surface": "paved",
            "width": 2.5,
            "incline": 2
          }
        }
      ],
      "accessibleFacilities": [
        {
          "id": "uuid",
          "name": "Accessible Toilet",
          "type": "toilet",
          "distanceFromRoute": 50
        }
      ],
      "warnings": [
        {
          "type": "temporary_obstacle",
          "description": "Construction ahead, detour available",
          "location": {
            "lat": 52.5205,
            "lng": 13.4055
          }
        }
      ]
    }
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid coordinates provided",
    "details": {
      "lat": "Latitude must be between -90 and 90",
      "lng": "Longitude must be between -180 and 180"
    }
  }
}
```

## Rate Limiting

Rate limits are applied per user (authenticated) or IP address (anonymous).

| User Type | Rate Limit |
|-----------|------------|
| Anonymous | 100 requests/hour |
| Authenticated | 1,000 requests/hour |
| Premium | 10,000 requests/hour |

**Rate limit headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642089600
```

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `limit`: Number of results per page (default: 20, max: 100)
- `offset`: Number of results to skip

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 40,
      "hasMore": true
    }
  }
}
```

## Webhooks (Coming Soon)

Subscribe to events:
- New facilities in your area
- Updates to favorited facilities
- Contribution status changes

## SDKs

Official SDKs available for:
- JavaScript/TypeScript (npm: `@access-unlocked/sdk`)
- Python (pip: `access-unlocked-sdk`)
- iOS Swift (CocoaPods/SPM)
- Android Kotlin (Maven)

## Support

- **API Status**: https://status.access-unlocked.org
- **Changelog**: https://api.access-unlocked.org/changelog
- **Support**: api-support@access-unlocked.org
