import { randomUUID } from 'node:crypto';
import { PrismaClient, type Profession } from '@prisma/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './server.js';
import { seedCampaign } from './modules/game/campaign-seed.js';
import { campaignPower, staminaAt, resolveChapter } from './modules/game/campaign-rules.js';

it('preserves partial stamina regeneration and resolves power thresholds', () => {
  const since = new Date(0), now = new Date(8640000 + 3000);
  expect(staminaAt(5, since, now)).toMatchObject({ value: 6, cursor: new Date(8640000), nextAt: new Date(17280000) });
  expect(staminaAt(10, since, now)).toMatchObject({ value: 10, cursor: now, nextAt: null });
  expect(staminaAt(1, now, since).value).toBe(1);
  expect(campaignPower(2, 5, ['mvp_tool', 'unknown'])).toBe(27);
  expect(resolveChapter(21, 25).map(s => s.success)).toEqual([true, true, false]);
});

describe.skipIf(process.env.RUN_DB_TESTS !== 'true')('local MVP campaign', () => {
  const db = new PrismaClient(); const origin = 'http://localhost:3000';
  let app: Awaited<ReturnType<typeof buildServer>>;
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test')) throw new Error('Dedicated _test database required');
    vi.stubEnv('LOCAL_PROTOTYPE', 'true'); vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('JWT_SECRET', 'local-campaign-test-secret-at-least-32'); vi.stubEnv('WEB_ORIGIN', origin);
    await seedCampaign(db);
  });
  beforeEach(async () => { app = await buildServer({ db, logger: false }); });
  afterEach(async () => { await app.close(); });
  afterAll(async () => { await db.$disconnect(); vi.unstubAllEnvs(); });
  async function player(profession: Profession = 'POLICE') {
    const signup = await app.inject({ method: 'POST', url: '/api/auth/register', headers: { origin }, payload: { email: `${randomUUID()}@example.test`, password: 'mvp-test-password-123' } });
    const headers = { authorization: `Bearer ${signup.json().accessToken}`, origin };
    const created = await app.inject({ method: 'POST', url: '/api/characters', headers, payload: { name: `MVP ${randomUUID().slice(0, 12)}`, profession } });
    expect(created.statusCode).toBe(201);
    const id = created.json().id as string;
    return { id, headers, async state() { return (await app.inject({ url: '/api/game', headers })).json(); },
      post(action: string, payload: Record<string, unknown> = {}) { return app.inject({ method: 'POST', url: `/api/characters/${id}/${action}`, headers, payload }); } };
  }
  async function cycles(p: Awaited<ReturnType<typeof player>>, count: number) {
    await db.character.update({ where: { id: p.id }, data: { lastOnlineAt: new Date(Date.now() - count * 10000 - 100) } });
    expect((await p.post('claim')).statusCode).toBe(200);
  }
  it.each(['POLICE', 'THIEF', 'DOCTOR'] as const)('completes all chapters as %s with unlocks, gear, drops and persistence', async profession => {
    const p = await player(profession);
    expect((await p.state()).lockedMissions).toHaveLength(2);
    expect((await p.post('mission', { missionId: `mvp_${profession}_2` })).statusCode).toBe(400);
    await p.post('mission', { missionId: `mvp_${profession}_1` });
    await cycles(p, 5);
    expect((await p.state()).adventure.inventory[0].quantity).toBe(1);
    expect((await p.post('claim')).json().cycles).toBe(0);
    expect((await p.post('buy', { templateId: 'mvp_tool' })).statusCode).toBe(200);
    const tool = (await p.state()).adventure.inventory.find((i: { name: string }) => i.name === 'Ferramenta de trabalho');
    await p.post('item', { itemId: tool.id, action: 'equip' });
    await p.post('buy', { templateId: 'mvp_vest' });
    const vest = (await p.state()).adventure.inventory.find((i: { name: string }) => i.name === 'Vestuário reforçado');
    await p.post('item', { itemId: vest.id, action: 'equip' });
    for (let chapter = 1; chapter <= 3; chapter++) {
      if (chapter > 1) {
        const reward = (await p.state()).adventure.inventory.find((i: { name: string }) => i.name === (chapter === 2 ? 'Kit profissional' : 'Uniforme especializado'));
        await p.post('item', { itemId: reward.id, action: 'equip' });
        await p.post('mission', { missionId: `mvp_${profession}_${chapter}` });
        await cycles(p, 5);
      }
      const result = await p.post('challenge', { chapter, requestId: randomUUID() });
      expect(result.statusCode).toBe(200); expect(result.json().outcome).toBe('BOSS_DEFEATED');
    }
    const final = await p.state();
    expect(final.adventure.completed).toBe(true); expect(final.adventure.stamina).toBe(7);
    expect(final.adventure.history).toHaveLength(3); expect(final.adventure.history[0].stages).toHaveLength(3);
    const reloaded = await buildServer({ db, logger: false });
    try { expect((await reloaded.inject({ url: '/api/game', headers: p.headers })).json().adventure.chapter).toBe(3); } finally { await reloaded.close(); }
  });
  it('serializes duplicate challenge requests without double rewards or stamina', async () => {
    const p = await player();
    await db.character.update({ where: { id: p.id }, data: { level: 4, experience: 950 } });
    const requestId = randomUUID();
    const replies = await Promise.all([1, 2, 3].map(() => p.post('challenge', { chapter: 1, requestId })));
    expect(replies.every(r => r.statusCode === 200)).toBe(true);
    expect(await db.stageAttempt.count({ where: { characterId: p.id } })).toBe(1);
    expect((await p.state()).adventure.stamina).toBe(9);
    expect((await p.post('challenge', { chapter: 2, requestId })).statusCode).toBe(409);
    expect((await p.post('challenge', { chapter: 1, requestId: randomUUID() })).statusCode).toBe(409);
  });
  it('guards ownership, payloads, inventory slots, sales and spending under concurrency', async () => {
    const p = await player(), other = await player();
    expect((await app.inject({ method: 'POST', url: `/api/characters/${p.id}/buy`, headers: other.headers, payload: { templateId: 'mvp_tool' } })).statusCode).toBe(404);
    expect((await p.post('buy', { templateId: 'mvp_tool_rare' })).statusCode).toBe(400);
    const buys = await Promise.all([1, 2, 3].map(() => p.post('buy', { templateId: 'mvp_tool' })));
    expect(buys.map(r => r.statusCode).sort()).toEqual([200, 200, 409]);
    const items = (await p.state()).adventure.inventory;
    for (const item of items) expect((await p.post('item', { itemId: item.id, action: 'equip' })).statusCode).toBe(200);
    expect((await p.state()).adventure.inventory.filter((i: { equipped: boolean }) => i.equipped)).toHaveLength(1);
    expect((await p.post('item', { itemId: items[1].id, action: 'sell' })).statusCode).toBe(409);
    await p.post('item', { itemId: items[1].id, action: 'unequip' });
    const sales = await Promise.all([1, 2].map(() => p.post('item', { itemId: items[1].id, action: 'sell' })));
    expect(sales.map(r => r.statusCode).sort()).toEqual([200, 404]);
    expect((await p.state()).character.gold).toBe('20');
    expect((await other.post('item', { itemId: items[0].id, action: 'equip' })).statusCode).toBe(404);
    expect((await p.post('challenge', { chapter: 1, requestId: randomUUID(), power: 999 })).statusCode).toBe(400);
  });
  it('records failure and prevents progression without level, stamina or freedom', async () => {
    const p = await player();
    const attempt = () => p.post('challenge', { chapter: 1, requestId: randomUUID() });
    expect((await attempt()).statusCode).toBe(409);
    await db.character.update({ where: { id: p.id }, data: { level: 2, experience: 100 } });
    expect((await attempt()).json().outcome).toBe('FAILED');
    expect((await p.state()).adventure.chapter).toBe(0); expect((await p.state()).character.gold).toBe('100');
    await db.character.update({ where: { id: p.id }, data: { staminaCurrent: 0, staminaLastRegen: new Date() } });
    expect((await attempt()).statusCode).toBe(409);
    await db.character.update({ where: { id: p.id }, data: { isPrisoned: true } });
    expect((await p.post('buy', { templateId: 'mvp_tool' })).statusCode).toBe(409);
  });
  it('rejects materials as equipment and grows stacked drops without duplicate collection', async () => {
    const p = await player(); await p.post('mission', { missionId: 'mvp_POLICE_1' });
    await cycles(p, 5); await cycles(p, 5);
    const supplies = (await p.state()).adventure.inventory[0]; expect(supplies.quantity).toBe(2);
    expect((await p.post('item', { itemId: supplies.id, action: 'equip' })).statusCode).toBe(400);
    expect((await p.post('item', { itemId: supplies.id, action: 'sell' })).statusCode).toBe(200);
    expect((await p.state()).adventure.inventory).toHaveLength(0);
  });
});
