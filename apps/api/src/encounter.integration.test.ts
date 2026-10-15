import { randomUUID } from 'node:crypto';
import { PrismaClient, type Profession } from '@prisma/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './server.js';
import { seedCampaign } from './modules/game/campaign-seed.js';
import { encounterDecision, encounters } from './modules/game/encounter-rules.js';
import { decisionProgress, professionEncounters, progressionView } from './modules/game/encounter-progression.js';

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
    expect(initial.adventure.encounters.map((e: {id:string}) => e.id)).toEqual(professionEncounters(profession).map(e => e.id));
    for (const encounter of encounters[profession]) for (const choice of encounter.approaches) {
      const before = await db.character.findUniqueOrThrow({ where: { id: p.id } });
      const payload = { encounterId: encounter.id, choiceId: choice.id, requestId: randomUUID() };
      const reply = await p.post('encounter', payload);
      expect(reply.statusCode).toBe(200); expect(reply.json().message).toContain(choice.ending);
      expect(reply.json().outcome).toBe('BOSS_DEFEATED');
      const after = await db.character.findUniqueOrThrow({ where: { id: p.id } });
      expect(BigInt(after.goldHand) - BigInt(before.goldHand)).toBe(BigInt(choice.gold));
      expect(BigInt(after.experience) - BigInt(before.experience)).toBe(BigInt(choice.exp));
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
    expect(state.adventure.specializations.map((s: { points: number }) => s.points)).toEqual([0, 0]);
    expect(state.adventure.encounters[4].lockReason).toBeTruthy();
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
  it.each(['POLICE', 'THIEF', 'DOCTOR'] as const)('unlocks both followups through decisions and persists expertise as %s', async profession => {
    const p = await player(profession);
    await db.character.update({ where: { id: p.id }, data: { level: 10, experience: 9000 } });
    const definitions = professionEncounters(profession);
    const play = (mission: typeof definitions[number], choiceIndex: number) => p.post('encounter', { encounterId: mission.id, choiceId: mission.approaches[choiceIndex].id, requestId: randomUUID() });
    for (const track of [0, 1]) {
      const next = definitions[3 + track];
      expect((await play(next, 0)).statusCode).toBe(409);
      expect((await play(definitions[0], track)).json().outcome).toBe('BOSS_DEFEATED');
      await advanceCooldown(p.id);
      let view = (await p.state()).adventure;
      expect(view.encounters[3 + track].lockReason).toBeNull();
      expect(view.encounters[3 + track].approaches[1].lockReason).toBeTruthy();
      expect((await play(next, 1)).statusCode).toBe(409);
      expect((await play(next, 0)).json().outcome).toBe('BOSS_DEFEATED');
      await advanceCooldown(p.id);
      view = (await p.state()).adventure;
      expect(view.encounters[3 + track].approaches[1].lockReason).toBeNull();
      expect((await play(next, 1)).json().outcome).toBe('BOSS_DEFEATED');
      await advanceCooldown(p.id);
      expect((await play(next, 1)).json().outcome).toBe('BOSS_DEFEATED');
      await advanceCooldown(p.id);
      expect((await p.state()).adventure.specializations[track].points).toBe(3);
    }
    const saved = (await p.state()).adventure;
    expect(saved.specializations.map((s: { bonus: number }) => s.bonus)).toEqual([9, 9]);
    expect(saved.stamina).toBe(2);
    expect(saved.history).toHaveLength(5); // Progress survives beyond the five visible diary entries.
    expect(saved.encounters[3].approaches[0].completed).toBe(true);
  });
  it('uses earned specialization power to turn a later mission into success', async () => {
    const p = await player('DOCTOR');
    await db.character.update({where:{id:p.id},data:{level:4,experience:900,campaignCycles:1620}});
    expect((await p.post('encounter',{encounterId:'doctor_square',choiceId:'prevention',requestId:randomUUID()})).statusCode).toBe(200);
    await advanceCooldown(p.id);
    const view = (await p.state()).adventure;
    expect(view.power).toBe(58);
    expect(view.encounters[3].approaches[0].effectivePower).toBe(61);
    const payload = {encounterId:'doctor_followup_0',choiceId:'establish',requestId:randomUUID()};
    const results = await Promise.all([p.post('encounter',payload),p.post('encounter',payload)]);
    expect(results.map(r => r.json().outcome)).toEqual(['BOSS_DEFEATED','BOSS_DEFEATED']);
    expect((await p.state()).adventure.specializations[0].points).toBe(2);
    await advanceCooldown(p.id);
    expect((await p.post('encounter',{...payload,choiceId:'expand',requestId:randomUUID()})).json().outcome).toBe('FAILED');
    expect((await p.state()).adventure.specializations[0].points).toBe(2);
  });
  it.each(['POLICE', 'THIEF', 'DOCTOR'] as const)('changes NPC support, events and rewards from the latest commitment as %s', async profession => {
    const p = await player(profession), prefix = profession.toLowerCase();
    await db.character.update({where:{id:p.id},data:{level:20,experience:36100}});
    const definitions = professionEncounters(profession);
    const post = (encounterId: string, choiceId: string, requestId = randomUUID()) => p.post('encounter',{encounterId,choiceId,requestId});
    const meeting = `${prefix}_story_meeting`, crisis = `${prefix}_story_crisis`;
    expect((await post(meeting,'partner')).statusCode).toBe(409);
    expect((await post(crisis,'careful')).statusCode).toBe(409);
    const track = profession === 'THIEF' ? 1 : 0;
    await post(definitions[0].id,definitions[0].approaches[track].id); await advanceCooldown(p.id);
    await post(`${prefix}_followup_${track}`,'establish'); await advanceCooldown(p.id);
    let state = (await p.state()).adventure;
    expect(state.encounters[5].lockReason).toBeNull();
    expect(state.encounters[5].character.dialogue).not.toContain('Ainda não');
    const requestId = randomUUID();
    const replies = await Promise.all([post(meeting,'partner',requestId),post(meeting,'partner',requestId)]);
    expect(replies.map(r => r.json().outcome)).toEqual(['BOSS_DEFEATED','BOSS_DEFEATED']);
    await advanceCooldown(p.id);
    state = (await p.state()).adventure;
    expect(state.encounters[6].character.relationship).toBe('Parceria ativa');
    const partnered = state.encounters[6];
    expect(partnered.approaches[0].effectivePower).toBe(state.power + state.specializations[0].bonus + 12);
    const first = await post(crisis,'careful'); expect(first.json().message).toContain(partnered.approaches[0].ending);
    const oldAttempt = await db.stageAttempt.findFirstOrThrow({where:{characterId:p.id,missionId:`mvp_encounter_${crisis}`},include:{stageResults:true}});
    await advanceCooldown(p.id);
    expect((await post(meeting,'independent')).json().outcome).toBe('BOSS_DEFEATED'); await advanceCooldown(p.id);
    expect((await post(meeting,'partner',requestId)).statusCode).toBe(200); // Replaying an old request cannot change today's relationship.
    state = (await p.state()).adventure;
    expect(state.encounters[6].character.relationship).toBe('Autonomia respeitada');
    expect(state.encounters[6].event).not.toBe(partnered.event);
    expect(state.encounters[6].approaches[1].storyBonus).toBe(0);
    expect(state.encounters[6].approaches[1].gold).toBe(380);
    const before = await db.character.findUniqueOrThrow({where:{id:p.id}});
    const direct = await post(crisis,'direct'); expect(direct.json().outcome).toBe('BOSS_DEFEATED');
    const after = await db.character.findUniqueOrThrow({where:{id:p.id}});
    expect(BigInt(after.goldHand) - BigInt(before.goldHand)).toBe(380n);
    expect(BigInt(after.experience) - BigInt(before.experience)).toBe(300n);
    expect(after.staminaCurrent).toBe(before.staminaCurrent - 1);
    expect((await db.stageResult.findMany({where:{attemptId:oldAttempt.id}}))).toEqual(oldAttempt.stageResults);
    await advanceCooldown(p.id);
    const points = state.specializations.map((s: {points:number}) => s.points);
    await post(meeting,'partner'); // A repeated older choice changes commitment without another expertise point.
    state = (await p.state()).adventure;
    expect(state.encounters[6].character.relationship).toBe('Parceria ativa');
    expect(state.encounters[6].approaches[1].gold).toBe(300);
    expect(state.specializations.map((s: {points:number}) => s.points)).toEqual([points[0],points[1]+1]);
    expect((await post(meeting,'partner',requestId)).statusCode).toBe(200);
    expect(await db.stageAttempt.count({where:{characterId:p.id}})).toBe(7);
    const other = await player(profession);
    expect((await other.state()).adventure.encounters[6].character.relationship).toBe('Aguardando compromisso');
  });
  it('keeps the NPC commitment on failure and uses collaboration power in actual resolution', async () => {
    const p = await player('DOCTOR');
    await db.character.update({where:{id:p.id},data:{level:10,experience:8100}});
    const post = (encounterId:string,choiceId:string) => p.post('encounter',{encounterId,choiceId,requestId:randomUUID()});
    for (const [id,choice] of [['doctor_square','prevention'],['doctor_followup_0','establish'],['doctor_story_meeting','partner']]) {
      expect((await post(id,choice)).json().outcome).toBe('BOSS_DEFEATED'); await advanceCooldown(p.id);
    }
    await db.character.update({where:{id:p.id},data:{level:5,experience:1600,campaignCycles:0}});
    expect((await post('doctor_story_meeting','independent')).json().outcome).toBe('FAILED'); await advanceCooldown(p.id);
    expect((await p.state()).adventure.encounters[6].character.relationship).toBe('Parceria ativa');
    await db.character.update({where:{id:p.id},data:{level:9,experience:6400,campaignCycles:0}});
    const state = (await p.state()).adventure;
    expect(state.power + state.specializations[0].bonus).toBeLessThan(105);
    expect(state.encounters[6].approaches[0].effectivePower).toBeGreaterThanOrEqual(105);
    expect((await post('doctor_story_crisis','careful')).json().outcome).toBe('BOSS_DEFEATED');
  });
});

it('derives bounded expertise from valid historical decisions, ignoring duplicates and legacy data', () => {
  const valid = { missionId: 'mvp_encounter_police_market', stageResults: [{enemies:[{choiceId:'witnesses',choiceName:'Ouvir',ending:'Fim'}]}] };
  const progress = decisionProgress('POLICE', [valid, valid, {missionId:'old',stageResults:[]}, {...valid,stageResults:[{enemies:[{choiceId:'unknown',choiceName:'?',ending:'?'}]}]}]);
  expect(progress.points).toEqual([1,0]);
  const view = progressionView('POLICE', progress, 58);
  expect(view.encounters[3].approaches[0].effectivePower).toBe(61);
  expect(view.encounters[4].lockReason).toContain('Seguir o rastro');
});
