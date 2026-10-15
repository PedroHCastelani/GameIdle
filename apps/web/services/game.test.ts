import { afterEach, expect, it, vi } from 'vitest';
import { accountApi, gameApi, restoreSession, useSession } from './game';

afterEach(() => { vi.unstubAllGlobals(); useSession.getState().setToken(null); });
const response = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data });

it('keeps tokens in memory, sends credentials, logs out and exposes account operations', async () => {
  const fetch = vi.fn().mockResolvedValue(response({ accessToken: 'access', message: 'ok' })); vi.stubGlobal('fetch', fetch);
  await gameApi.enter('login', 'a@example.test', 'password');
  expect(useSession.getState().token).toBe('access');
  await gameApi.state(); await gameApi.create('Test', 'POLICE'); await gameApi.start('character', 'mission'); await gameApi.claim('character');
  await accountApi.status(); await accountApi.requestVerification(); await accountApi.confirm('code'); await accountApi.requestReset('a@example.test');
  expect(fetch.mock.calls[1][1]).toMatchObject({ credentials: 'include', headers: { Authorization: 'Bearer access' } });
  await accountApi.reset('code', 'replacement'); expect(useSession.getState().token).toBeNull();
  useSession.getState().setToken('again'); await gameApi.logout(); expect(useSession.getState().token).toBeNull();
});
it('shares refresh calls, retries unauthorized requests and clears expired sessions', async () => {
  const fetch = vi.fn().mockResolvedValue(response({ accessToken: 'new' })); vi.stubGlobal('fetch', fetch);
  expect(await Promise.all([restoreSession(), restoreSession()])).toEqual([true, true]); expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockReset().mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ accessToken: 'rotated' })).mockResolvedValueOnce(response({ character: null }));
  expect(await gameApi.state()).toEqual({ character: null }); expect(fetch).toHaveBeenCalledTimes(3);
  fetch.mockReset().mockResolvedValue(response({}, 401));
  await expect(gameApi.state()).rejects.toThrow('Sua sessão terminou'); expect(useSession.getState().token).toBeNull();
});
it('surfaces network/server errors without retrying business failures', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('offline')); vi.stubGlobal('fetch', fetch);
  await expect(gameApi.state()).rejects.toThrow('conectar');
  fetch.mockResolvedValue(response({ error: 'Invalid mission' }, 400));
  await expect(gameApi.start('c', 'm')).rejects.toThrow('Invalid mission');
  fetch.mockResolvedValue(response({}, 503));
  await expect(restoreSession()).rejects.toThrow('concluir');
});
