import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export async function healthRoutes(app: FastifyInstance, db: PrismaClient) {
  async function checks() {
    const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null, connectTimeout: 2000,
    });
    redis.on('error', () => { /* Availability is reported without connection details. */ });
    try {
      const [database, cache] = await Promise.allSettled([db.$queryRaw`SELECT 1`, redis.ping()]);
      return { database: database.status === 'fulfilled', redis: cache.status === 'fulfilled' };
    } finally { redis.disconnect(); }
  }
  app.get('/health/light', async () => ({ status: 'ok', service: '@the-life/api' }));
  for (const path of ['/health', '/ready']) {
    app.get(path, async (_request, reply) => {
      const result = await checks();
      const ready = result.database && result.redis;
      reply.code(ready ? 200 : 503);
      return { status: ready ? 'ok' : 'not_ready', checks: result };
    });
  }
}
