import { Prisma, type PrismaClient, type Character, type Profession } from '@prisma/client';
import { ApiError } from '../../lib/security.js';
import { lockUser } from '../auth/auth.service.js';
import { calculateIdle, levelFromExperience } from './idle.js';

const characterView = (c: Character) => ({
  id: c.id, name: c.name, profession: c.profession, level: c.level,
  experience: c.experience, gold: c.goldHand, missionId: c.currentMissionId,
  isOnMission: c.isOnMission, isPrisoned: c.isPrisoned, lastCollectedAt: c.lastOnlineAt,
});

export function gameService(db: PrismaClient) {
  async function lockCharacter(tx: Prisma.TransactionClient, userId: string, id: string) {
    await tx.$queryRaw`SELECT id FROM characters WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`;
    const char = await tx.character.findFirst({ where: { id, userId } });
    if (!char) throw new ApiError(404, 'Personagem não encontrado.');
    return char;
  }
  async function collect(tx: Prisma.TransactionClient, char: Character, now: Date) {
    if (char.isPrisoned) throw new ApiError(409, 'Personagem preso não recebe progresso.');
    if (!char.isOnMission || !char.currentMissionId) return { cycles: 0, gold: 0n, exp: 0n, capped: false };
    const mission = await tx.missionDefinition.findUnique({ where: { id: char.currentMissionId } });
    if (!mission || mission.type !== 'IDLE' || !mission.isActive || mission.profession !== char.profession) {
      throw new ApiError(409, 'Missão indisponível.');
    }
    const premium = await tx.userPremium.findUnique({ where: { userId: char.userId } });
    const result = calculateIdle({ since: char.lastOnlineAt, now, premium: Boolean(premium?.activeUntil && premium.activeUntil > now),
      duration: mission.durationBase, goldMin: mission.goldMin, goldMax: mission.goldMax, exp: mission.expBase });
    if (!result.cycles) return { cycles: 0, gold: 0n, exp: 0n, capped: result.capped };
    await tx.character.update({ where: { id: char.id }, data: {
      goldHand: { increment: result.gold }, experience: { increment: result.exp },
      level: levelFromExperience(char.experience + result.exp, char.level), lastOnlineAt: result.cursor,
    } });
    const log = await tx.missionLog.create({ data: {
      characterId: char.id, missionId: mission.id, startedAt: char.lastOnlineAt,
      endedAt: result.cursor, cycles: result.cycles, goldGained: result.gold, expGained: result.exp, skillXpGained: {},
    } });
    await tx.economyLog.create({ data: { type: 'MISSION_REWARD', characterId: char.id,
      goldAmount: result.gold, metadata: { missionLogId: log.id, cycles: result.cycles, capped: result.capped } } });
    return { cycles: result.cycles, gold: result.gold, exp: result.exp, capped: result.capped };
  }
  return {
    async state(userId: string) {
      const chars = await db.character.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
      const char = chars[0];
      const missions = char ? await db.missionDefinition.findMany({
        where: { profession: char.profession, type: 'IDLE', isActive: true, minLevel: { lte: char.level },
          OR: [{ maxLevel: null }, { maxLevel: { gte: char.level } }] }, orderBy: { minLevel: 'asc' },
        select: { id: true, name: true, description: true, durationBase: true, goldMin: true, goldMax: true, expBase: true },
      }) : [];
      return { character: char ? characterView(char) : null, missions, serverTime: new Date() };
    },
    async createCharacter(userId: string, name: string, profession: Profession) {
      try {
        return await db.$transaction(async tx => {
          await lockUser(tx, userId);
          if (await tx.character.count({ where: { userId } })) throw new ApiError(409, 'O protótipo permite um personagem por conta.');
          const char = await tx.character.create({ data: { userId, name, profession, isFirstCreated: true } });
          await tx.user.update({ where: { id: userId }, data: {
            accountSide: profession === 'POLICE' ? 'LAW' : profession === 'THIEF' ? 'CRIME' : 'NEUTRAL', slot1CharId: char.id,
          } });
          await tx.economyLog.create({ data: { type: 'MISSION_REWARD', characterId: char.id, goldAmount: char.goldHand,
            metadata: { reason: 'PROTOTYPE_STARTING_BALANCE' } } });
          return characterView(char);
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ApiError(409, 'Nome indisponível.');
        throw error;
      }
    },
    async start(userId: string, characterId: string, missionId: string) {
      return db.$transaction(async tx => {
        const char = await lockCharacter(tx, userId, characterId);
        if (char.isPrisoned) throw new ApiError(409, 'Personagem preso não pode iniciar missão.');
        const mission = await tx.missionDefinition.findFirst({ where: {
          id: missionId, type: 'IDLE', isActive: true, profession: char.profession, minLevel: { lte: char.level },
          OR: [{ maxLevel: null }, { maxLevel: { gte: char.level } }],
        } });
        if (!mission) throw new ApiError(400, 'Missão incompatível com o personagem.');
        if (char.isOnMission && char.currentMissionId === missionId) return { started: true };
        const now = new Date();
        await collect(tx, char, now);
        await tx.character.update({ where: { id: char.id }, data: {
          isOnMission: true, currentMissionId: missionId, missionStartedAt: now, lastOnlineAt: now,
        } });
        return { started: true };
      });
    },
    async claim(userId: string, characterId: string) {
      return db.$transaction(async tx => {
        const char = await lockCharacter(tx, userId, characterId);
        return collect(tx, char, new Date());
      });
    },
  };
}
