import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { exampleRoutes, healthRoutes } from './routes/index.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } }
          : undefined,
    },
  });

  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://thelife.app']
      : ['http://localhost:3000'],
    credentials: true,
  });

  await app.register(cookie);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'The Life API',
        description: 'API backend do MMORPG idle The Life',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:3333', description: 'Local' }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(exampleRoutes, { prefix: '/api' });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    const statusCode = error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';

    reply.status(statusCode).send({
      error: message,
    });
  });

  return app;
}
