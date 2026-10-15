import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './server.js';

const enabled = process.env.RUN_DB_TESTS === 'true';
const origin = 'http://localhost:3000';
const password = 'test-only-password-123';
const unique = () => randomUUID().slice(0, 12);

describe.skipIf(!enabled)('prototype with real PostgreSQL', () => {
  const db = new PrismaClient();
  let app: Awaited<ReturnType<typeof buildServer>>;
  let missionId: string;
  const fixtureMissions: string[] = [];
  beforeAll(async () => {
    const database = new URL(process.env.DATABASE_URL ?? '').pathname;
    if (!database.endsWith('_test')) throw new Error('Integration suite requires a dedicated database ending in _test');
    vi.stubEnv('LOCAL_PROTOTYPE', 'true'); vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('JWT_SECRET', 'integration-only-secret-not-for-production-1234'); vi.stubEnv('WEB_ORIGIN', origin);
    const mission = await db.missionDefinition.create({ data: {
      name: 'Integration patrol', description: 'Fixture', profession: 'POLICE', minLevel: 1,
      type: 'IDLE', durationBase: 60, goldMin: 10, goldMax: 20, expBase: 15, skillXpRewards: {},
    } });
    missionId = mission.id;
    fixtureMissions.push(mission.id);
  });
  beforeEach(async () => { app = await buildServer({ db, logger: false }); });
  afterEach(async () => { await app?.close(); });
  afterAll(async () => {
    if (fixtureMissions.length) await db.missionDefinition.updateMany({ where: { id: { in: fixtureMissions } }, data: { isActive: false } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });

  async function account() {
    const email = `${unique()}@example.test`;
    const response = await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload: { email, password } });
    expect(response.statusCode).toBe(201);
    return { email, token: response.json().accessToken as string, cookie: response.cookies[0].value };
  }
  function headers(token: string) { return { authorization: `Bearer ${token}`, origin }; }
  async function character(token: string) {
    const response = await app.inject({ method: 'POST', url: '/api/characters', headers: headers(token), payload: { name: `Test ${unique()}`, profession: 'POLICE' } });
    expect(response.statusCode).toBe(201); return response.json().id as string;
  }
  async function start(token: string, id: string) {
    const response = await app.inject({ method: 'POST', url: `/api/characters/${id}/mission`, headers: headers(token), payload: { missionId } });
    expect(response.statusCode).toBe(200);
  }
  function claim(token: string, id: string) { return app.inject({ method: 'POST', url: `/api/characters/${id}/claim`, headers: headers(token), payload: {} }); }

  it('registers, creates, starts and collects with durable logs and no duplicate rewards', async () => {
    const user = await account(); const id = await character(user.token); await start(user.token, id);
    await db.character.update({ where: { id }, data: { lastOnlineAt: new Date(Date.now() - 125000) } });
    const first = await claim(user.token, id);
    expect(first.statusCode).toBe(200); expect(first.json()).toMatchObject({ cycles: 2, gold: '30', exp: '30' });
    expect((await claim(user.token, id)).json().cycles).toBe(0);
    const saved = await db.character.findUniqueOrThrow({ where: { id } });
    expect(saved.goldHand).toBe(130n); expect(saved.experience).toBe(30n);
    expect(Date.now() - saved.lastOnlineAt.getTime()).toBeGreaterThanOrEqual(5000);
    expect(await db.missionLog.count({ where: { characterId: id } })).toBe(1);
    expect(await db.economyLog.count({ where: { characterId: id } })).toBe(2);
    const secondApp = await buildServer({ db, logger: false });
    try { expect((await secondApp.inject({ url: '/api/game', headers: headers(user.token) })).json().character.gold).toBe('130'); }
    finally { await secondApp.close(); }
  });
  it('serializes concurrent claims against the same cursor', async () => {
    const user = await account(); const id = await character(user.token); await start(user.token, id);
    await db.character.update({ where: { id }, data: { lastOnlineAt: new Date(Date.now() - 125000) } });
    const results = await Promise.all(Array.from({ length: 5 }, () => claim(user.token, id)));
    expect(results.every(r => r.statusCode === 200)).toBe(true);
    expect(results.reduce((n, r) => n + r.json().cycles, 0)).toBe(2);
    expect((await db.character.findUniqueOrThrow({ where: { id } })).goldHand).toBe(130n);
    expect(await db.missionLog.count({ where: { characterId: id } })).toBe(1);
  });
  it('enforces ownership, session authentication, mission compatibility and imprisonment', async () => {
    const a = await account(), b = await account(); const id = await character(a.token);
    expect((await claim(b.token, id)).statusCode).toBe(404);
    expect((await app.inject('/api/game')).statusCode).toBe(401);
    expect((await app.inject({ url: '/api/game', headers: headers('bad-token') })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: `/api/characters/${id}/mission`, headers: headers(a.token), payload: { missionId: 'missing' } })).statusCode).toBe(400);
    await db.character.update({ where: { id }, data: { isPrisoned: true } });
    expect((await claim(a.token, id)).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: `/api/characters/${id}/mission`, headers: headers(a.token), payload: { missionId } })).statusCode).toBe(409);
    expect((await db.character.findUniqueOrThrow({ where: { id } })).goldHand).toBe(100n);
  });
  it('caps offline time and rejects client-controlled rewards/time', async () => {
    const user = await account(); const id = await character(user.token); await start(user.token, id);
    await db.character.update({ where: { id }, data: { lastOnlineAt: new Date(Date.now() - 8 * 86400000) } });
    expect((await claim(user.token, id)).json()).toMatchObject({ cycles: 720, gold: '10800', capped: true });
    expect((await claim(user.token, id)).json().cycles).toBe(0);
    expect((await app.inject({ method: 'POST', url: `/api/characters/${id}/claim`, headers: headers(user.token), payload: { gold: 999, now: 999 } })).statusCode).toBe(400);
  });
  it('settles a previous mission atomically on switching and preserves same-mission cursor', async () => {
    const user = await account(); const id = await character(user.token); await start(user.token, id);
    const since = new Date(Date.now() - 125000);
    await db.character.update({ where: { id }, data: { lastOnlineAt: since } });
    await start(user.token, id);
    expect((await db.character.findUniqueOrThrow({ where: { id } })).lastOnlineAt).toEqual(since);
    const alternative = await db.missionDefinition.create({ data: { name: 'Alternative', description: 'Fixture', profession: 'POLICE', minLevel: 1, type: 'IDLE', durationBase: 60, goldMin: 1, goldMax: 1, expBase: 1, skillXpRewards: {} } });
    fixtureMissions.push(alternative.id);
    const response = await app.inject({ method: 'POST', url: `/api/characters/${id}/mission`, headers: headers(user.token), payload: { missionId: alternative.id } });
    expect(response.statusCode).toBe(200);
    const saved = await db.character.findUniqueOrThrow({ where: { id } });
    expect(saved.goldHand).toBe(130n); expect(saved.currentMissionId).toBe(alternative.id);
  });
  it('allows only one character even with concurrent creation', async () => {
    const user = await account();
    const results = await Promise.all([1, 2].map(() => app.inject({ method: 'POST', url: '/api/characters', headers: headers(user.token), payload: { name: `Test ${unique()}`, profession: 'DOCTOR' } })));
    expect(results.map(r => r.statusCode).sort()).toEqual([201, 409]);
    const owner = await db.user.findUniqueOrThrow({ where: { email: user.email } });
    expect(owner.accountSide).toBe('NEUTRAL'); expect(await db.character.count({ where: { userId: owner.id } })).toBe(1);
  });
  it('invalidates old sessions on login and stores only refresh hashes', async () => {
    const user = await account();
    const response = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: user.email, password } });
    expect(response.statusCode).toBe(200);
    expect((await app.inject({ url: '/api/game', headers: headers(user.token) })).statusCode).toBe(401);
    expect((await app.inject({ url: '/api/game', headers: headers(response.json().accessToken) })).statusCode).toBe(200);
    const sessions = await db.session.findMany({ where: { user: { email: user.email } } });
    expect(sessions).toHaveLength(1); expect(sessions[0].refreshToken).not.toBe(response.cookies[0].value);
    expect(response.headers['set-cookie']).toContain('HttpOnly');
  });
  it('serializes concurrent logins and refresh token rotation', async () => {
    const user = await account();
    const logins = await Promise.all([1, 2].map(() => app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: user.email, password } })));
    const checks = await Promise.all(logins.map(r => app.inject({ url: '/api/game', headers: headers(r.json().accessToken) })));
    expect(checks.map(r => r.statusCode).sort()).toEqual([200, 401]);
    const active = logins[checks.findIndex(r => r.statusCode === 200)];
    const rotations = await Promise.all([1, 2].map(() => app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { origin, cookie: `refresh=${active.cookies[0].value}` } })));
    expect(rotations.map(r => r.statusCode).sort()).toEqual([200, 401]);
    const fresh = rotations.find(r => r.statusCode === 200)!;
    const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin, cookie: `refresh=${fresh.cookies[0].value}` } });
    expect(logout.statusCode).toBe(200);
    expect((await app.inject({ url: '/api/game', headers: headers(fresh.json().accessToken) })).statusCode).toBe(401);
  });
  it('rejects invalid input, duplicate email, wrong password, expired and banned sessions', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload: { email: 'bad', password: 'short' } })).statusCode).toBe(400);
    const user = await account();
    expect((await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload: { email: user.email.toUpperCase(), password } })).statusCode).toBe(409);
    for (const email of [user.email, 'missing@example.test']) {
      expect((await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email, password: 'wrong-password-123' } })).statusCode).toBe(401);
    }
    const owner = await db.user.findUniqueOrThrow({ where: { email: user.email } });
    expect(owner.emailVerified).toBe(false); expect(owner.cpfHash).toMatch(/^prototype:/);
    await db.session.updateMany({ where: { userId: owner.id }, data: { expiresAt: new Date(0) } });
    expect((await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { origin, cookie: `refresh=${user.cookie}` } })).statusCode).toBe(401);
    await db.user.update({ where: { id: owner.id }, data: { isBanned: true } });
    expect((await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: { email: user.email, password } })).statusCode).toBe(401);
  });
  it('rejects foreign cookie origins and limits authentication attempts', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { origin: 'https://other.test' } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { origin } })).statusCode).toBe(401);
    let status = 0;
    for (let i = 0; i < 11; i++) status = (await app.inject({ method: 'POST', url: '/api/auth/login', headers: { origin }, payload: {} })).statusCode;
    expect(status).toBe(429);
  });
  it('reports readiness and hides infrastructure details when Redis is unavailable', async () => {
    const healthy = await app.inject('/api/ready');
    expect(healthy.statusCode).toBe(200);
    const previous = process.env.REDIS_URL;
    process.env.REDIS_URL = 'redis://127.0.0.1:1';
    try {
      const failed = await app.inject('/api/ready');
      expect(failed.statusCode).toBe(503);
      expect(failed.json()).toEqual({ status: 'not_ready', checks: { database: true, redis: false } });
      expect(failed.body).not.toContain('127.0.0.1');
    } finally { process.env.REDIS_URL = previous; }
  });
});
