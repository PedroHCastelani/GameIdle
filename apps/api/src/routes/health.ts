import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  latency?: number;
  message?: string;
}

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthStatus;
    redis: HealthStatus;
  };
}

async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

async function checkRedis(redisUrl: string): Promise<HealthStatus> {
  const start = Date.now();
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    connectTimeout: 2000,
  });

  try {
    await redis.ping();
    await redis.quit();
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    redis.disconnect();

    return {
      status: 'error',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown redis error',
    };
  }
}

export async function healthRoutes(app: FastifyInstance) {
  app.get<{ Reply: HealthCheckResponse }>('/health', async () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    const [dbCheck, redisCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(redisUrl),
    ]);

    const allOk = dbCheck.status === 'ok' && redisCheck.status === 'ok';
    const anyError = dbCheck.status === 'error' || redisCheck.status === 'error';

    const overallStatus = allOk ? 'ok' : anyError ? 'error' : 'degraded';

    return {
      status: overallStatus,
      service: '@the-life/api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
      },
    };
  });

  // Health check leve (sem verificações externas)
  app.get('/health/light', async () => {
    return {
      status: 'ok',
      service: '@the-life/api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Ready check para Kubernetes/orquestração
  app.get('/ready', async (_request, reply) => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    const [dbCheck, redisCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(redisUrl),
    ]);

    if (dbCheck.status === 'error' || redisCheck.status === 'error') {
      reply.code(503);
      return {
        status: 'not_ready',
        checks: {
          database: dbCheck,
          redis: redisCheck,
        },
      };
    }

    return {
      status: 'ready',
      checks: {
        database: dbCheck,
        redis: redisCheck,
      },
    };
  });
}
