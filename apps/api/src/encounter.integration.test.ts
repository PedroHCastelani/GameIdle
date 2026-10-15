import { randomUUID } from 'node:crypto';
import { PrismaClient, type Profession } from '@prisma/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './server.js';
import { seedCampaign } from './modules/game/campaign-seed.js';
import { encounterDecision, encounters } from './modules/game/encounter-rules.js';

it('reads persisted decisions without misinterpreting old campaign records', () => {
  for (const value of [null, {}, [], [null], ['text'], [[]], [{ name: 'old' }]]) expect(encounterDecision(value)).toBeNull();
  expect(encounterDecision([{choiceId:'a',choiceName:'A',ending:'Done'}])).toEqual({id:'a',name:'A',ending:'Done'});
});
describe.skipIf(process.env.RUN_DB_TESTS !== 'true')('profession encounters with PostgreSQL', () => {
  const db = new PrismaClient(); const origin = 'http://localhost:3000';
  let app: Awaited<ReturnType<typeof buildServer>>;
  beforeAll(async () => {
    if (!new URL(process.env.DATABASE_URL ?? '').pathname.endsWith('_test')) throw new Error('Dedicated _test database required');
    vi.stubEnv('LOCAL_PROTOTYPE', 'true'); vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('JWT_SECRET', 'encounter-test-secret-at-least-32-characters'); vi.stubEnv('WEB_ORIGIN', origin);
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

  async function advanceCooldown(id: string) {
    await db.stageAttempt.updateMany({ where: { characterId: id }, data: { startedAt: new Date(Date.now() - 61000) } });
  }
  it.each(['POLICE', 'THIEF', 'DOCTOR'] as const)('persists distinct decisions and exact rewards for all encounters as %s', async profession => {
    const p = await player(profession);
    await db.character.update({ where: { id: p.id }, data: { level: 10, experience: 9000, campaignChapter: 3 } });
    const initial = await p.state();
    expect(initial.adventure.encounters.map((e: {id:string}) => e.id)).toEqual(encounters[profession].map(e => e.id));
    for (const encounter of encounters[profession]) for (const choice of encounter.approaches) {
      const before = await db.character.findUniqueOrThrow({ where: { id: p.id } });
      const payload = { encounterId: encounter.id, choiceId: choice.id, requestId: randomUUID() };
      const reply = await p.post('encounter', payload);
      expect(reply.statusCode).toBe(200); expect(reply.json().message).toContain(choice.ending);
      expect(reply.json().outcome).toBe('BOSS_DEFEATED');
      const after = await db.character.findUniqueOrThrow({ where: { id: p.id } });
      expect(after.goldHand - before.goldHand).toBe(BigInt(choice.gold));
      expect(after.experience - before.experience).toBe(BigInt(choice.exp));
      expect(after.staminaCurrent).toBe(before.staminaCurrent - 1); expect(after.campaignChapter).toBe(3);
      const state = await p.state();
      expect(state.adventure.encounterWaitSeconds).toBeGreaterThan(0);
      expect(state.adventure.history[0].decision).toEqual({ id: choice.id, name: choice.name, ending: choice.ending });
      expect(state.adventure.history[0].stages).toHaveLength(3);
      expect((await p.post('encounter', payload)).statusCode).toBe(200);
      expect((await p.post('encounter', { ...payload, choiceId: encounter.approaches.find(c => c.id !== choice.id)!.id })).statusCode).toBe(409);
      await advanceCooldown(p.id);
    }
    expect(await db.stageAttempt.count({where:{characterId:p.id}})).toBe(6);
    expect((await p.state()).adventure.encounterWaitSeconds).toBe(0);
  });
  it('serializes duplicate attempts and rejects racing new requests during cooldown', async () => {
    const p = await player();
    await db.character.update({where:{id:p.id},data:{level:4,experience:900}});
    const payload = { encounterId:'police_market',choiceId:'witnesses',requestId:randomUUID() };
    const replies = await Promise.all([p.post('encounter',payload),p.post('encounter',payload)]);
    expect(replies.map(r => r.statusCode)).toEqual([200,200]);
    expect((await p.post('encounter',{...payload,requestId:randomUUID()})).statusCode).toBe(409);
    expect((await p.post('encounter',{...payload,encounterId:'police_station',choiceId:'isolate'})).statusCode).toBe(409);
    expect(await db.stageAttempt.count({where:{characterId:p.id}})).toBe(1);
    expect((await p.state()).adventure.stamina).toBe(9);
    await advanceCooldown(p.id);
    const races = await Promise.all([p.post('encounter',{...payload,requestId:randomUUID()}),p.post('encounter',{...payload,requestId:randomUUID()})]);
    expect(races.map(r=>r.statusCode).sort()).toEqual([200,409]);
    expect(await db.economyLog.count({where:{characterId:p.id,type:'STAGE_REWARD'}})).toBe(2);
  });
  it('records a failed choice, spends stamina once, and permits a later prepared attempt', async () => {
    const p=await player();
    await db.character.update({where:{id:p.id},data:{level:2,experience:100}});
    const payload={encounterId:'police_market',choiceId:'trail',requestId:randomUUID()};
    const reply=await p.post('encounter',payload);
    expect(reply.json().outcome).toBe('FAILED');
    const state=await p.state();
    expect(state.character.gold).toBe('100'); expect(state.character.experience).toBe('100');
    expect(state.adventure.stamina).toBe(9); expect(state.adventure.history[0].decision.ending).toContain('preparação foi insuficiente');
    expect((await p.post('encounter',payload)).statusCode).toBe(200);
    await advanceCooldown(p.id);
    await db.character.update({where:{id:p.id},data:{level:4,experience:900}});
    expect((await p.post('encounter',{...payload,requestId:randomUUID()})).json().outcome).toBe('BOSS_DEFEATED');
  });
  it('rejects invalid input, other careers, ownership, locked level, prison and empty stamina', async () => {
    const p=await player(), other=await player('DOCTOR');
    const payload={encounterId:'police_market',choiceId:'witnesses',requestId:randomUUID()};
    expect((await p.post('encounter',{...payload,gold:999})).statusCode).toBe(400);
    expect((await p.post('encounter',{...payload,choiceId:'unknown'})).statusCode).toBe(400);
    expect((await other.post('encounter',payload)).statusCode).toBe(400);
    expect((await app.inject({method:'POST',url:'/api/characters/'+p.id+'/encounter',headers:other.headers,payload})).statusCode).toBe(404);
    expect((await app.inject({method:'POST',url:'/api/characters/'+p.id+'/encounter',payload})).statusCode).toBe(401);
    expect((await p.post('encounter',payload)).statusCode).toBe(409);
    await db.character.update({where:{id:p.id},data:{level:4,isPrisoned:true}});
    expect((await p.post('encounter',payload)).statusCode).toBe(409);
    await db.character.update({where:{id:p.id},data:{isPrisoned:false,staminaCurrent:0,staminaLastRegen:new Date()}});
    expect((await p.post('encounter',payload)).statusCode).toBe(409);
    expect(await db.stageAttempt.count({where:{characterId:p.id}})).toBe(0);
  });
});
