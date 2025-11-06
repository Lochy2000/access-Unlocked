import axios from 'axios';
import { config } from '../config';
import { OSMResponse, OSMElement, Facility } from '../types';
import { createFacility } from './facilityService';

// Rate limiter to respect OSM API limits (max 2 req/sec)
let lastRequestTime = 0;

async function rateLimitedRequest(url: string, data: string): Promise<any> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < config.osm.rateLimitMs) {
    await new Promise((resolve) => setTimeout(resolve, config.osm.rateLimitMs - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();

  const response = await axios.post(url, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  });

  return response.data;
}

/**
 * Build Overpass QL query to find accessible facilities
 */
function buildOverpassQuery(lat: number, lng: number, radius: number = 1000): string {
  return `
    [out:json][timeout:25];
    (
      // Accessible toilets
      node["amenity"="toilets"]["toilets:wheelchair"="yes"](around:${radius},${lat},${lng});
      way["amenity"="toilets"]["toilets:wheelchair"="yes"](around:${radius},${lat},${lng});

      // Wheelchair accessible parking
      node["amenity"="parking"]["parking:disabled"="yes"](around:${radius},${lat},${lng});
      way["amenity"="parking"]["parking:disabled"="yes"](around:${radius},${lat},${lng});

      // Places with wheelchair access
      node["wheelchair"="yes"](around:${radius},${lat},${lng});
      way["wheelchair"="yes"](around:${radius},${lat},${lng});

      // Elevators
      node["highway"="elevator"](around:${radius},${lat},${lng});

      // Accessible entrances
      node["entrance"]["wheelchair"="yes"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;
}

/**
 * Parse OSM element and convert to our Facility format
 */
function parseOSMElement(element: OSMElement): Omit<Facility, 'id' | 'createdAt' | 'updatedAt'> | null {
  if (element.type !== 'node') {
    // For now, we only handle nodes. Ways would need center calculation
    return null;
  }

  const tags = element.tags;

  // Determine facility type
  let facilityTypeId = 'entrance'; // default

  if (tags.amenity === 'toilets' || tags['toilets:wheelchair'] === 'yes') {
    facilityTypeId = 'toilet';
  } else if (tags.amenity === 'parking' || tags['parking:disabled'] === 'yes') {
    facilityTypeId = 'parking';
  } else if (tags.highway === 'elevator' || tags.elevator === 'yes') {
    facilityTypeId = 'elevator';
  } else if (tags.ramp === 'yes') {
    facilityTypeId = 'ramp';
  } else if (tags.entrance) {
    facilityTypeId = 'entrance';
  } else if (tags.railway === 'station' || tags.public_transport === 'station') {
    facilityTypeId = 'station';
  }

  // Extract accessibility features
  const accessibility = {
    wheelchairAccessible: tags.wheelchair === 'yes' || tags.wheelchair === 'limited',
    hasRamp: tags.ramp === 'yes',
    hasElevator: tags.elevator === 'yes' || tags.highway === 'elevator',
    hasAccessibleToilet: tags['toilets:wheelchair'] === 'yes',
    hasAccessibleParking: tags['parking:disabled'] === 'yes' || tags['parking:disabled'] === 'designated',
    hasAutomaticDoor: tags.automatic_door === 'yes' || tags.door === 'automatic',
  };

  // Build name
  const name = tags.name || tags.description || `${facilityTypeId.charAt(0).toUpperCase() + facilityTypeId.slice(1)} at ${tags['addr:street'] || 'location'}`;

  // Build address
  const addressParts = [];
  if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
  if (tags['addr:street']) addressParts.push(tags['addr:street']);
  if (tags['addr:city']) addressParts.push(tags['addr:city']);
  if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
  const address = addressParts.length > 0 ? addressParts.join(', ') : undefined;

  return {
    name,
    description: tags['wheelchair:description'] || tags.description,
    facilityTypeId,
    location: {
      lat: element.lat,
      lng: element.lon,
    },
    address,
    accessibility,
    openingHours: tags.opening_hours ? { raw: tags.opening_hours } : undefined,
    phone: tags.phone,
    website: tags.website,
    verified: false,
    dataQualityScore: 0.7, // OSM data is generally good quality
    dataSources: ['openstreetmap'],
    externalIds: {
      osm: `node/${element.id}`,
    },
  };
}

/**
 * Fetch accessible facilities from OpenStreetMap for a given location
 */
export async function fetchOSMFacilities(lat: number, lng: number, radius: number = 1000): Promise<OSMResponse> {
  console.log(`Fetching OSM data for (${lat}, ${lng}) within ${radius}m`);

  const query = buildOverpassQuery(lat, lng, radius);

  try {
    const data = await rateLimitedRequest(config.osm.overpassUrl, query);
    return data as OSMResponse;
  } catch (error: any) {
    console.error('Error fetching OSM data:', error.message);
    throw new Error(`Failed to fetch OSM data: ${error.message}`);
  }
}

/**
 * Import OSM facilities into our database
 */
export async function importOSMFacilities(lat: number, lng: number, radius: number = 1000): Promise<number> {
  const osmData = await fetchOSMFacilities(lat, lng, radius);

  let importedCount = 0;

  for (const element of osmData.elements) {
    const facility = parseOSMElement(element);

    if (facility) {
      try {
        // Check if facility already exists by external ID
        // (In a production system, you'd want to check for duplicates first)
        const facilityId = await createFacility(facility);
        console.log(`Imported facility: ${facility.name} (${facilityId})`);
        importedCount++;
      } catch (error: any) {
        console.error(`Failed to import facility ${facility.name}:`, error.message);
      }
    }
  }

  console.log(`Imported ${importedCount} facilities from OSM`);
  return importedCount;
}

/**
 * Sync OSM data for a specific area (useful for initial data population)
 */
export async function syncOSMDataForArea(
  centerLat: number,
  centerLng: number,
  radius: number = 5000
): Promise<{ total: number; imported: number }> {
  console.log(`Syncing OSM data for area centered at (${centerLat}, ${centerLng})`);

  const osmData = await fetchOSMFacilities(centerLat, centerLng, radius);

  let imported = 0;
  for (const element of osmData.elements) {
    const facility = parseOSMElement(element);
    if (facility) {
      try {
        await createFacility(facility);
        imported++;
      } catch (error) {
        // Silently skip duplicates or errors
      }
    }
  }

  return {
    total: osmData.elements.length,
    imported,
  };
}
