import { query } from '../utils/database';
import { Facility, FacilitySearchParams, FacilityWithDistance, FacilityType } from '../types';

/**
 * Search for facilities near a location using PostGIS spatial queries
 */
export async function searchNearbyFacilities(
  params: FacilitySearchParams
): Promise<FacilityWithDistance[]> {
  const {
    lat,
    lng,
    radius = 1000, // default 1km
    facilityTypes,
    wheelchairAccessible,
    limit = 20,
    offset = 0,
  } = params;

  // Build WHERE clause conditions
  const conditions: string[] = ['deleted_at IS NULL'];
  const queryParams: any[] = [lng, lat, radius];
  let paramIndex = 4;

  // Filter by facility types
  if (facilityTypes && facilityTypes.length > 0) {
    conditions.push(`facility_type_id = ANY($${paramIndex})`);
    queryParams.push(facilityTypes);
    paramIndex++;
  }

  // Filter by wheelchair accessibility
  if (wheelchairAccessible !== undefined) {
    conditions.push(`wheelchair_accessible = $${paramIndex}`);
    queryParams.push(wheelchairAccessible);
    paramIndex++;
  }

  // Add limit and offset
  queryParams.push(limit, offset);

  const sql = `
    SELECT
      id,
      name,
      description,
      facility_type_id,
      lat,
      lng,
      address,
      wheelchair_accessible,
      has_ramp,
      has_elevator,
      has_accessible_toilet,
      has_accessible_parking,
      has_automatic_door,
      opening_hours,
      phone,
      website,
      verified,
      data_quality_score,
      data_sources,
      external_ids,
      created_at,
      updated_at,
      last_verified_at,
      ST_Distance(location, ST_MakePoint($1, $2)::geography) as distance
    FROM facilities
    WHERE
      ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
      AND ${conditions.join(' AND ')}
    ORDER BY distance ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const results = await query<any>(sql, queryParams);

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    facilityTypeId: row.facility_type_id,
    location: {
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
    },
    address: row.address,
    accessibility: {
      wheelchairAccessible: row.wheelchair_accessible,
      hasRamp: row.has_ramp,
      hasElevator: row.has_elevator,
      hasAccessibleToilet: row.has_accessible_toilet,
      hasAccessibleParking: row.has_accessible_parking,
      hasAutomaticDoor: row.has_automatic_door,
    },
    openingHours: row.opening_hours,
    phone: row.phone,
    website: row.website,
    verified: row.verified,
    dataQualityScore: row.data_quality_score ? parseFloat(row.data_quality_score) : undefined,
    dataSources: row.data_sources,
    externalIds: row.external_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastVerifiedAt: row.last_verified_at,
    distance: parseFloat(row.distance),
  }));
}

/**
 * Get a facility by ID
 */
export async function getFacilityById(id: string): Promise<Facility | null> {
  const sql = `
    SELECT
      id,
      name,
      description,
      facility_type_id,
      lat,
      lng,
      address,
      wheelchair_accessible,
      has_ramp,
      has_elevator,
      has_accessible_toilet,
      has_accessible_parking,
      has_automatic_door,
      opening_hours,
      phone,
      website,
      verified,
      data_quality_score,
      data_sources,
      external_ids,
      created_at,
      updated_at,
      last_verified_at
    FROM facilities
    WHERE id = $1 AND deleted_at IS NULL
  `;

  const results = await query<any>(sql, [id]);

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    facilityTypeId: row.facility_type_id,
    location: {
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
    },
    address: row.address,
    accessibility: {
      wheelchairAccessible: row.wheelchair_accessible,
      hasRamp: row.has_ramp,
      hasElevator: row.has_elevator,
      hasAccessibleToilet: row.has_accessible_toilet,
      hasAccessibleParking: row.has_accessible_parking,
      hasAutomaticDoor: row.has_automatic_door,
    },
    openingHours: row.opening_hours,
    phone: row.phone,
    website: row.website,
    verified: row.verified,
    dataQualityScore: row.data_quality_score ? parseFloat(row.data_quality_score) : undefined,
    dataSources: row.data_sources,
    externalIds: row.external_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastVerifiedAt: row.last_verified_at,
  };
}

/**
 * Get all facility types
 */
export async function getFacilityTypes(): Promise<FacilityType[]> {
  const sql = `
    SELECT
      id,
      name,
      description,
      icon,
      category,
      sort_order
    FROM facility_types
    ORDER BY sort_order ASC
  `;

  const results = await query<any>(sql);

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category,
    sortOrder: row.sort_order,
  }));
}

/**
 * Insert a new facility
 */
export async function createFacility(facility: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const sql = `
    INSERT INTO facilities (
      name,
      description,
      facility_type_id,
      location,
      lat,
      lng,
      address,
      wheelchair_accessible,
      has_ramp,
      has_elevator,
      has_accessible_toilet,
      has_accessible_parking,
      has_automatic_door,
      opening_hours,
      phone,
      website,
      verified,
      data_quality_score,
      data_sources,
      external_ids
    ) VALUES (
      $1, $2, $3, ST_MakePoint($4, $5)::geography, 
      ST_Y(ST_MakePoint($4, $5)::geometry), 
      ST_X(ST_MakePoint($4, $5)::geometry), 
      $6,
      $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    )
    RETURNING id
  `;

  const results = await query<{ id: string }>(sql, [
    facility.name,
    facility.description,
    facility.facilityTypeId,
    facility.location.lng,
    facility.location.lat,
    facility.address,
    facility.accessibility.wheelchairAccessible,
    facility.accessibility.hasRamp,
    facility.accessibility.hasElevator,
    facility.accessibility.hasAccessibleToilet,
    facility.accessibility.hasAccessibleParking,
    facility.accessibility.hasAutomaticDoor,
    JSON.stringify(facility.openingHours),
    facility.phone,
    facility.website,
    facility.verified,
    facility.dataQualityScore,
    JSON.stringify(facility.dataSources),
    JSON.stringify(facility.externalIds),
  ]);

  return results[0].id;
}
