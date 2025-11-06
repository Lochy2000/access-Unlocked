// Location types
export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  formatted?: string;
}

// Facility types
export interface FacilityType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  sortOrder: number;
}

export interface AccessibilityFeatures {
  wheelchairAccessible?: boolean;
  hasRamp?: boolean;
  hasElevator?: boolean;
  hasAccessibleToilet?: boolean;
  hasAccessibleParking?: boolean;
  hasAutomaticDoor?: boolean;
}

export interface Facility {
  id: string;
  name: string;
  description?: string;
  facilityTypeId: string;

  // Location
  location: Location;
  address?: string;

  // Accessibility
  accessibility: AccessibilityFeatures;

  // Opening hours
  openingHours?: Record<string, string>;

  // Contact
  phone?: string;
  website?: string;

  // Quality
  verified: boolean;
  dataQualityScore?: number;

  // Sources
  dataSources: string[];
  externalIds: Record<string, string>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
}

export interface FacilitySearchParams {
  lat: number;
  lng: number;
  radius?: number; // in meters, default 1000
  facilityTypes?: string[];
  wheelchairAccessible?: boolean;
  limit?: number;
  offset?: number;
}

export interface FacilityWithDistance extends Facility {
  distance: number; // in meters
}

// OpenStreetMap types
export interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags: Record<string, string>;
}

export type OSMElement = OSMNode | OSMWay;

export interface OSMResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OSMElement[];
}
