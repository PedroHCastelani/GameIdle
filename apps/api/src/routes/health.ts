import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: '@the-life/api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}
