import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  searchNearbyFacilities,
  getFacilityById,
  getFacilityTypes,
} from '../services/facilityService';
import { FacilitySearchParams } from '../types';

interface SearchQuery {
  lat: string;
  lng: string;
  radius?: string;
  types?: string;
  wheelchairAccessible?: string;
  limit?: string;
  offset?: string;
}

export async function facilitiesRoutes(fastify: FastifyInstance) {
  /**
   * GET /facilities/nearby
   * Search for nearby facilities
   */
  fastify.get('/nearby', async (request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) => {
    const { lat, lng, radius, types, wheelchairAccessible, limit, offset } = request.query;

    // Validate required parameters
    if (!lat || !lng) {
      return reply.status(400).send({
        error: 'Missing required parameters',
        message: 'lat and lng are required',
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        message: 'lat and lng must be valid numbers',
      });
    }

    if (latNum < -90 || latNum > 90) {
      return reply.status(400).send({
        error: 'Invalid latitude',
        message: 'Latitude must be between -90 and 90',
      });
    }

    if (lngNum < -180 || lngNum > 180) {
      return reply.status(400).send({
        error: 'Invalid longitude',
        message: 'Longitude must be between -180 and 180',
      });
    }

    const searchParams: FacilitySearchParams = {
      lat: latNum,
      lng: lngNum,
      radius: radius ? parseInt(radius) : undefined,
      facilityTypes: types ? types.split(',') : undefined,
      wheelchairAccessible: wheelchairAccessible === 'true' ? true : wheelchairAccessible === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    try {
      const facilities = await searchNearbyFacilities(searchParams);

      return reply.send({
        success: true,
        data: {
          facilities,
          count: facilities.length,
          searchParams: {
            location: { lat: latNum, lng: lngNum },
            radius: searchParams.radius || 1000,
          },
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Search failed',
        message: error.message,
      });
    }
  });

  /**
   * GET /facilities/:id
   * Get facility by ID
   */
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      const facility = await getFacilityById(id);

      if (!facility) {
        return reply.status(404).send({
          error: 'Not found',
          message: `Facility with id ${id} not found`,
        });
      }

      return reply.send({
        success: true,
        data: { facility },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch facility',
        message: error.message,
      });
    }
  });

  /**
   * GET /facilities/types
   * Get all facility types
   */
  fastify.get('/types', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const types = await getFacilityTypes();

      return reply.send({
        success: true,
        data: { types },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch facility types',
        message: error.message,
      });
    }
  });
}
