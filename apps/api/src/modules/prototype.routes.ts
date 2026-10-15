import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ApiError, publicJson } from '../lib/security.js';
import { authService } from './auth/auth.service.js';
import { gameService } from './game/game.service.js';
import { accountService, requestMessage, type DeliverMessage } from './auth/account.service.js';

const credentials = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(10).max(128) }).strict();
const characterInput = z.object({ name: z.string().trim().min(3).max(24).regex(/^[\p{L}\p{N} _-]+$/u), profession: z.enum(['POLICE', 'THIEF', 'DOCTOR']) }).strict();
const characterParams = z.object({ id: z.string().min(1).max(64) });
type Identity = { sub: string; sid: string };

export async function prototypeRoutes(app: FastifyInstance, db: PrismaClient, webOrigin: string, deliver: DeliverMessage) {
  const auth = authService(db), game = gameService(db);
  const account = accountService(db, deliver);
  const cookie = { httpOnly: true, sameSite: 'strict' as const, secure: webOrigin.startsWith('https://'), path: '/api/auth', maxAge: 30 * 86400 };
  const requireOrigin = async (request: FastifyRequest) => {
    if (request.headers.origin !== webOrigin) throw new ApiError(403, 'Origem não permitida.');
  };
  const authenticate = async (request: FastifyRequest) => {
    try { await request.jwtVerify(); } catch { throw new ApiError(401, 'Sessão encerrada. Entre novamente.'); }
    const identity = request.user as Identity;
    if (typeof identity.sub !== 'string' || typeof identity.sid !== 'string') throw new ApiError(401, 'Sessão inválida.');
    const session = await db.session.findFirst({ where: { id: identity.sid, userId: identity.sub, expiresAt: { gt: new Date() } }, include: { user: true } });
    if (!session || session.user.isBanned) throw new ApiError(401, 'Sessão encerrada. Entre novamente.');
  };
  const sessionReply = (result: { userId: string; sessionId: string; refresh: string }, reply: FastifyReply) => {
    reply.setCookie('refresh', result.refresh, cookie);
    return { accessToken: app.jwt.sign({ sub: result.userId, sid: result.sessionId }, { expiresIn: '15m' }) };
  };
  const authOptions = { preHandler: requireOrigin, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };
  const codeInput = z.string().regex(/^[a-f0-9]{64}$/);
  app.get('/api/auth/account', { preHandler: authenticate }, async req => {
    const user = await db.user.findUniqueOrThrow({ where: { id: (req.user as Identity).sub } });
    return { email: user.email, emailVerified: user.emailVerified };
  });
  app.post('/api/auth/email/request', { ...authOptions, preHandler: [requireOrigin, authenticate] }, async req => {
    z.object({}).strict().parse(req.body ?? {});
    await account.requestVerification((req.user as Identity).sub);
    return { message: requestMessage };
  });
  app.post('/api/auth/email/confirm', authOptions, async req => {
    const { code } = z.object({ code: codeInput }).strict().parse(req.body);
    await account.verify(code);
    return { message: 'E-mail confirmado.' };
  });
  app.post('/api/auth/password/request', authOptions, async req => {
    const { email } = z.object({ email: credentials.shape.email }).strict().parse(req.body);
    await account.requestReset(email);
    return { message: requestMessage };
  });
  app.post('/api/auth/password/reset', authOptions, async (req, reply) => {
    const { code, password } = z.object({ code: codeInput, password: credentials.shape.password }).strict().parse(req.body);
    await account.reset(code, password);
    reply.clearCookie('refresh', { path: cookie.path });
    return { message: 'Senha atualizada. Entre novamente; as sessões anteriores foram encerradas.' };
  });
  app.post('/api/auth/register', authOptions, async (req, reply) => {
    const input = credentials.parse(req.body);
    const result = await auth.register(input.email, input.password);
    reply.code(201);
    return sessionReply(result, reply);
  });
  app.post('/api/auth/login', authOptions, async (req, reply) => {
    const input = credentials.parse(req.body);
    return sessionReply(await auth.login(input.email, input.password), reply);
  });
  app.post('/api/auth/refresh', authOptions, async (req, reply) => {
    if (!req.cookies.refresh) throw new ApiError(401, 'Sessão encerrada. Entre novamente.');
    return sessionReply(await auth.refresh(req.cookies.refresh), reply);
  });
  app.post('/api/auth/logout', { preHandler: requireOrigin }, async (req, reply) => {
    if (req.cookies.refresh) await auth.logout(req.cookies.refresh);
    reply.clearCookie('refresh', { path: cookie.path });
    return { loggedOut: true };
  });
  app.get('/api/game', { preHandler: authenticate }, async req => publicJson(await game.state((req.user as Identity).sub)));
  app.post('/api/characters', { preHandler: authenticate }, async (req, reply) => {
    const input = characterInput.parse(req.body);
    const result = await game.createCharacter((req.user as Identity).sub, input.name, input.profession);
    reply.code(201);
    return publicJson(result);
  });
  app.post('/api/characters/:id/mission', { preHandler: authenticate }, async req => {
    const { id } = characterParams.parse(req.params);
    const { missionId } = z.object({ missionId: z.string().min(1).max(64) }).strict().parse(req.body);
    return publicJson(await game.start((req.user as Identity).sub, id, missionId));
  });
  app.post('/api/characters/:id/claim', { preHandler: authenticate }, async req => {
    const { id } = characterParams.parse(req.params);
    z.object({}).strict().parse(req.body ?? {});
    return publicJson(await game.claim((req.user as Identity).sub, id));
  });
}
