import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './server.js';
import { tokenHash } from './lib/security.js';
import type { AccountMessage } from './modules/auth/account.service.js';

describe.skipIf(process.env.RUN_DB_TESTS !== 'true')('account lifecycle with PostgreSQL', () => {
  const db = new PrismaClient();
  const origin = 'http://localhost:3000';
  const password = 'local-test-original-password';
  const newPassword = 'local-test-replacement-password';
  let app: Awaited<ReturnType<typeof buildServer>>;
  let messages: AccountMessage[];
  beforeAll(() => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test')) throw new Error('Dedicated _test database required');
    vi.stubEnv('LOCAL_PROTOTYPE', 'true'); vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('JWT_SECRET', 'account-tests-only-secret-at-least-32'); vi.stubEnv('WEB_ORIGIN', origin);
  });
  beforeEach(async () => {
    messages = [];
    app = await buildServer({ db, logger: false, deliver: async message => { messages.push(message); } });
  });
  afterEach(async () => { await app.close(); });
  afterAll(async () => { await db.$disconnect(); vi.unstubAllEnvs(); });
  function post(path: string, payload: Record<string, unknown>, token?: string) {
    return app.inject({ method: 'POST', url: `/api/auth/${path}`, headers: { origin, ...(token ? { authorization: `Bearer ${token}` } : {}) }, payload });
  }
  async function account() {
    const email = `${randomUUID()}@example.test`;
    const response = await post('register', { email, password });
    expect(response.statusCode).toBe(201);
    return { email, token: response.json().accessToken as string, cookie: response.cookies[0].value };
  }
  it('confirms email once, separates purposes, stores only a hash and respects resend cooldown', async () => {
    const user = await account();
    const headers = { authorization: `Bearer ${user.token}` };
    expect((await app.inject({ url: '/api/auth/account', headers })).json()).toMatchObject({ emailVerified: false });
    expect((await post('email/request', {}, user.token)).statusCode).toBe(200);
    await post('email/request', {}, user.token);
    expect(messages).toHaveLength(1);
    const code = messages[0].code;
    expect((await db.accountToken.findUniqueOrThrow({ where: { tokenHash: tokenHash(code) } })).tokenHash).not.toBe(code);
    expect((await post('password/reset', { code, password: newPassword })).statusCode).toBe(400);
    const results = await Promise.all([post('email/confirm', { code }), post('email/confirm', { code })]);
    expect(results.map(r => r.statusCode).sort()).toEqual([200, 400]);
    expect((await app.inject({ url: '/api/auth/account', headers })).json()).toMatchObject({ emailVerified: true });
    await post('email/request', {}, user.token);
    expect(messages).toHaveLength(1);
  });
  it('resets once under concurrency and revokes JWT, refresh and other outstanding codes', async () => {
    const user = await account();
    await post('email/request', {}, user.token);
    await post('password/request', { email: user.email });
    const code = messages[1].code;
    const responses = await Promise.all([post('password/reset', { code, password: newPassword }), post('password/reset', { code, password: newPassword })]);
    expect(responses.map(r => r.statusCode).sort()).toEqual([200, 400]);
    expect((await app.inject({ url: '/api/game', headers: { authorization: `Bearer ${user.token}` } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { origin, cookie: `refresh=${user.cookie}` } })).statusCode).toBe(401);
    expect((await post('email/confirm', { code: messages[0].code })).statusCode).toBe(400);
    expect((await post('login', { email: user.email, password })).statusCode).toBe(401);
    expect((await post('login', { email: user.email, password: newPassword })).statusCode).toBe(200);
    expect(await db.accountToken.count({ where: { user: { email: user.email } } })).toBe(0);
  });
  it('rejects expired codes, rotates on resend, hides absent and banned accounts', async () => {
    const user = await account();
    const existing = await post('password/request', { email: user.email });
    const missing = await post('password/request', { email: 'absent@example.test' });
    expect(missing.json()).toEqual(existing.json());
    const code = messages[0].code;
    await db.accountToken.update({ where: { tokenHash: tokenHash(code) }, data: { expiresAt: new Date(0), createdAt: new Date(0) } });
    expect((await post('password/reset', { code, password: newPassword })).statusCode).toBe(400);
    await post('password/request', { email: user.email });
    expect(messages).toHaveLength(2);
    expect((await post('password/reset', { code, password: newPassword })).statusCode).toBe(400);
    await db.user.update({ where: { email: user.email }, data: { isBanned: true } });
    expect((await post('password/request', { email: user.email })).json()).toEqual(existing.json());
    expect(messages).toHaveLength(2);
    expect((await post('password/reset', { code: messages[1].code, password: newPassword })).statusCode).toBe(400);
  });
  it('requires origin/authentication, rejects malformed payloads and rolls back failed delivery', async () => {
    const user = await account();
    expect((await post('email/request', {})).statusCode).toBe(401);
    expect((await post('email/confirm', { code: 'bad' })).statusCode).toBe(400);
    expect((await post('password/reset', { code: 'a'.repeat(64), password: 'short' })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/auth/password/request', payload: { email: user.email } })).statusCode).toBe(403);
    const broken = await buildServer({ db, logger: false, deliver: async () => { throw new Error('private delivery detail'); } });
    try {
      const response = await broken.inject({ method: 'POST', url: '/api/auth/password/request', headers: { origin }, payload: { email: user.email } });
      expect(response.statusCode).toBe(500); expect(response.body).not.toContain('private delivery');
      expect(await db.accountToken.count({ where: { user: { email: user.email } } })).toBe(0);
    } finally { await broken.close(); }
  });
});
