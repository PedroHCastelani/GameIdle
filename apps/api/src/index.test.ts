import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './server.js';

afterEach(() => vi.unstubAllEnvs());
describe('server boundary', () => {
  it('responds to liveness without opening a database connection', async () => {
    vi.stubEnv('LOCAL_PROTOTYPE', 'false');
    const app = await buildServer({ logger: false });
    try {
      const result = await app.inject('/api/health/light');
      expect(result.statusCode).toBe(200);
      expect(result.json().status).toBe('ok');
      expect(result.headers['cache-control']).toBe('no-store');
      expect((await app.inject({ method: 'POST', url: '/api/auth/register' })).statusCode).toBe(404);
    } finally { await app.close(); }
  });
  it('refuses production prototype and missing secrets', async () => {
    vi.stubEnv('LOCAL_PROTOTYPE', 'true'); vi.stubEnv('NODE_ENV', 'production');
    await expect(buildServer()).rejects.toThrow('production');
    vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('JWT_SECRET', 'short');
    await expect(buildServer()).rejects.toThrow('JWT_SECRET');
  });
});
