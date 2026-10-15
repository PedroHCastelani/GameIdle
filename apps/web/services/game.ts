import { create } from 'zustand';

export const useSession = create<{ token: string | null; setToken: (token: string | null) => void }>(set => ({ token: null, setToken: token => set({ token }) }));
const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
let refreshing: Promise<boolean> | null = null;

async function raw(path: string, method = 'GET', body?: unknown) {
  const token = useSession.getState().token;
  let response: Response;
  try {
    response = await fetch(`${base}/api${path}`, {
      method, credentials: 'include', cache: 'no-store',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch { throw new RequestError(0, 'Não foi possível conectar ao servidor. Verifique se a API está iniciada.'); }
  const data = await response.json();
  if (!response.ok) throw new RequestError(response.status, data.error ?? 'Não foi possível concluir a operação.');
  return data;
}

export function restoreSession(): Promise<boolean> {
  if (!refreshing) refreshing = raw('/auth/refresh', 'POST').then(data => {
    useSession.getState().setToken(data.accessToken);
    return true;
  }).catch(error => {
    useSession.getState().setToken(null);
    if (error instanceof RequestError && error.status === 401) return false;
    throw error;
  }).finally(() => { refreshing = null; });
  return refreshing;
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  try { return await raw(path, method, body); }
  catch (error) {
    if (!(error instanceof RequestError) || error.status !== 401) throw error;
    if (await restoreSession()) return raw(path, method, body);
    throw new RequestError(401, 'Sua sessão terminou. Entre novamente.');
  }
}

export type Profession = 'POLICE' | 'THIEF' | 'DOCTOR';
export type GameState = {
  character: { id: string; name: string; profession: Profession; level: number; experience: string; gold: string; missionId: string | null; isOnMission: boolean; isPrisoned: boolean; lastCollectedAt: string } | null;
  missions: { id: string; name: string; description: string; durationBase: number; goldMin: number; goldMax: number; expBase: number }[];
  serverTime: string;
};
export const gameApi = {
  async enter(mode: 'login' | 'register', email: string, password: string) {
    const data = await raw(`/auth/${mode}`, 'POST', { email, password });
    useSession.getState().setToken(data.accessToken);
  },
  async logout() { await raw('/auth/logout', 'POST'); useSession.getState().setToken(null); },
  state: () => request<GameState>('/game'),
  create: (name: string, profession: Profession) => request('/characters', 'POST', { name, profession }),
  start: (id: string, missionId: string) => request(`/characters/${id}/mission`, 'POST', { missionId }),
  claim: (id: string) => request<{ cycles: number; gold: string; exp: string; capped: boolean }>(`/characters/${id}/claim`, 'POST', {}),
};

export const accountApi = {
  status: () => request<{ email: string; emailVerified: boolean }>('/auth/account'),
  requestVerification: () => request<{ message: string }>('/auth/email/request', 'POST', {}),
  confirm: (code: string) => raw('/auth/email/confirm', 'POST', { code }),
  requestReset: (email: string) => raw('/auth/password/request', 'POST', { email }),
  async reset(code: string, password: string) {
    const result = await raw('/auth/password/reset', 'POST', { code, password });
    useSession.getState().setToken(null);
    return result;
  },
};
