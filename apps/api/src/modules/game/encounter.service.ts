import type { PrismaClient } from '@prisma/client';
import { ApiError } from '../../lib/security.js';
import { lockCharacter } from './character-lock.js';
import { campaignPower, resolveChapter, staminaAt } from './campaign-rules.js';
import { encounterCooldown, encounterDecision, encounters } from './encounter-rules.js';
import { levelFromExperience } from './idle.js';

export function encounterService(db: PrismaClient) {
  return {
    play(userId: string, id: string, encounterId: string, choiceId: string, requestId: string) {
      return db.$transaction(async tx => {
        const char = await lockCharacter(tx, userId, id);
        if (char.isPrisoned) throw new ApiError(409, 'Personagem detido não pode atender ocorrências.');
        const encounter = encounters[char.profession].find(e => e.id === encounterId);
        const choice = encounter?.approaches.find(c => c.id === choiceId);
        if (!encounter || !choice) throw new ApiError(400, 'Ocorrência ou abordagem incompatível com sua profissão.');
        const requestKey = `${id}:${requestId}`, missionId = `mvp_encounter_${encounter.id}`;
        const previous = await tx.stageAttempt.findUnique({ where: { requestKey }, include: { stageResults: { orderBy: { stageNumber: 'asc' } } } });
        if (previous) {
          const decision = encounterDecision(previous.stageResults[0]?.enemies ?? null);
          if (previous.missionId !== missionId || decision?.id !== choiceId) throw new ApiError(409, 'Solicitação já usada para outra decisão.');
          return { message: `Resultado já registrado: ${decision.ending}`, outcome: previous.outcome };
        }
        if (char.level < encounter.level) throw new ApiError(409, 'Ganhe mais experiência para desbloquear esta ocorrência.');
        const now = new Date();
        const last = await tx.stageAttempt.findFirst({ where: { characterId: id, missionId: { startsWith: 'mvp_encounter_' } }, orderBy: { startedAt: 'desc' } });
        if (last && now.getTime() - last.startedAt.getTime() < encounterCooldown) throw new ApiError(409, 'Aguarde o intervalo entre ocorrências. As missões idle continuam disponíveis.');
        const stamina = staminaAt(char.staminaCurrent, char.staminaLastRegen, now);
        if (stamina.value < 1) throw new ApiError(409, 'Stamina insuficiente para esta ocorrência.');
        const items = await tx.inventoryItem.findMany({ where: { characterId: id, isEquipped: true } });
        const power = campaignPower(char.level, char.campaignCycles, items.map(i => i.templateId));
        const stages = resolveChapter(power, choice.power), success = stages.every(s => s.success);
        const gold = success ? BigInt(choice.gold) : 0n, exp = success ? BigInt(choice.exp) : 0n;
        const ending = success ? choice.ending : 'Sua preparação foi insuficiente. A equipe de apoio assumiu a ocorrência; você gastou 1 stamina e não recebeu recompensas.';
        const attempt = await tx.stageAttempt.create({ data: { characterId: id, missionId, requestKey, difficulty: 'EASY', staminaSpent: 1, stageReached: stages.filter(s => s.success).length, totalStages: stages.length, outcome: success ? 'BOSS_DEFEATED' : 'FAILED', goldGained: gold, expGained: exp, startedAt: now, endedAt: now } });
        await tx.stageResult.createMany({ data: stages.map(s => ({ attemptId: attempt.id, stageNumber: s.stage, enemies: [{ name: encounter.stages[s.stage - 1], required: s.required, power, choiceId, choiceName: choice.name, ending }], goldGained: 0n, expGained: 0n, outcome: s.success ? 'SUCCESS' : 'FAILED' })) });
        await tx.character.update({ where: { id }, data: { staminaCurrent: stamina.value - 1, staminaLastRegen: stamina.cursor, goldHand: { increment: gold }, experience: { increment: exp }, level: levelFromExperience(char.experience + exp, char.level) } });
        await tx.staminaLog.create({ data: { characterId: id, delta: -1, reason: 'LOCAL_ENCOUNTER' } });
        await tx.economyLog.create({ data: { type: success ? 'STAGE_REWARD' : 'STAGE_PENALTY', characterId: id, goldAmount: gold, metadata: { attemptId: attempt.id, encounterId, choiceId, exp: exp.toString(), power, staminaSpent: 1 } } });
        return { message: `${ending} +${gold} gold · +${exp} EXP.`, outcome: attempt.outcome };
      });
    },
  };
}
