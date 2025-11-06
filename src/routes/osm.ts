import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { importOSMFacilities, syncOSMDataForArea } from '../services/osmService';

interface ImportQuery {
  lat: string;
  lng: string;
  radius?: string;
}

export async function osmRoutes(fastify: FastifyInstance) {
  /**
   * POST /osm/import
   * Import OSM data for a specific location
   * This is useful for populating the database with initial data
   */
  fastify.post('/import', async (request: FastifyRequest<{ Querystring: ImportQuery }>, reply: FastifyReply) => {
    const { lat, lng, radius } = request.query;

    if (!lat || !lng) {
      return reply.status(400).send({
        error: 'Missing required parameters',
        message: 'lat and lng are required',
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = radius ? parseInt(radius) : 1000;

    if (isNaN(latNum) || isNaN(lngNum)) {
      return reply.status(400).send({
        error: 'Invalid parameters',
        message: 'lat and lng must be valid numbers',
      });
    }

    try {
      const importedCount = await importOSMFacilities(latNum, lngNum, radiusNum);

      return reply.send({
        success: true,
        data: {
          imported: importedCount,
          location: { lat: latNum, lng: lngNum },
          radius: radiusNum,
        },
        message: `Imported ${importedCount} facilities from OpenStreetMap`,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Import failed',
        message: error.message,
      });
    }
  });

  /**
   * POST /osm/sync
   * Sync OSM data for a larger area
   */
  fastify.post('/sync', async (request: FastifyRequest<{ Querystring: ImportQuery }>, reply: FastifyReply) => {
    const { lat, lng, radius } = request.query;

    if (!lat || !lng) {
      return reply.status(400).send({
        error: 'Missing required parameters',
        message: 'lat and lng are required',
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = radius ? parseInt(radius) : 5000;

    try {
      const result = await syncOSMDataForArea(latNum, lngNum, radiusNum);

      return reply.send({
        success: true,
        data: result,
        message: `Synced ${result.imported} facilities out of ${result.total} OSM elements`,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Sync failed',
        message: error.message,
      });
    }
  });
}
