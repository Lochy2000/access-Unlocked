import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { testConnection, closePool } from './utils/database';
import { facilitiesRoutes } from './routes/facilities';
import { osmRoutes } from './routes/osm';

const server = Fastify({
  logger: {
    level: config.log.level,
    transport:
      config.env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Register CORS
server.register(cors, {
  origin: true,
});

// Health check routes
server.get('/health', async () => {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  };
});

server.get('/health/db', async () => {
  const isConnected = await testConnection();
  return {
    status: isConnected ? 'OK' : 'ERROR',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  };
});

// API routes
server.register(facilitiesRoutes, { prefix: '/api/facilities' });
server.register(osmRoutes, { prefix: '/api/osm' });

// Root route
server.get('/', async () => {
  return {
    name: 'Access-Unlocked API',
    version: '1.0.0',
    description: 'API for finding accessible facilities',
    endpoints: {
      health: '/health',
      database: '/health/db',
      facilities: {
        search: '/api/facilities/nearby?lat=<lat>&lng=<lng>&radius=<meters>',
        getById: '/api/facilities/:id',
        types: '/api/facilities/types',
      },
      osm: {
        import: '/api/osm/import?lat=<lat>&lng=<lng>&radius=<meters>',
        sync: '/api/osm/sync?lat=<lat>&lng=<lng>&radius=<meters>',
      },
    },
  };
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await closePool();
    await server.close();
    process.exit(0);
  });
});

// Start server
const start = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Please ensure PostgreSQL is running.');
      console.error('Run: docker compose up -d');
      process.exit(1);
    }

    // Start listening
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`\n🚀 Server ready at http://localhost:${config.port}`);
    console.log(`📍 API Documentation: http://localhost:${config.port}/`);
    console.log(`💚 Health Check: http://localhost:${config.port}/health`);
    console.log(`🗄️  Database Check: http://localhost:${config.port}/health/db\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
