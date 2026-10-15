import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from './lib/security.js';
import { healthRoutes } from './routes/health.js';
import { prototypeRoutes } from './modules/prototype.routes.js';

export async function buildServer(options: { db?: PrismaClient; logger?: boolean } = {}) {
  const prototype = process.env.LOCAL_PROTOTYPE === 'true';
  if (prototype && process.env.NODE_ENV === 'production') throw new Error('Local prototype cannot run in production');
  if (prototype && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('JWT_SECRET must contain at least 32 characters');
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const db = options.db ?? new PrismaClient();
  const app = Fastify({ logger: options.logger === false ? false : {
    level: 'info', redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  } });
  if (!options.db) app.addHook('onClose', async () => { await db.$disconnect(); });
  await app.register(cors, { origin: [webOrigin], credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(swagger, { openapi: { info: { title: 'The Life API', version: '0.2.0' } } });
  await app.register(swaggerUi, { routePrefix: '/docs' });
  await app.register(async scope => healthRoutes(scope, db), { prefix: '/api' });
  if (prototype) {
    await app.register(jwt, { secret: process.env.JWT_SECRET! });
    await prototypeRoutes(app, db, webOrigin);
  }
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    return payload;
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: 'Dados inválidos. Confira os campos enviados.' });
    if (error instanceof ApiError) return reply.code(error.statusCode).send({ error: error.message });
    const status = error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
    app.log.error({ requestId: request.id, status }, 'Request failed');
    return reply.code(status).send({ error: status === 429 ? 'Muitas tentativas. Aguarde um minuto.' : status < 500 ? 'Requisição inválida.' : 'Erro interno. Tente novamente.' });
  });
  return app;
}
