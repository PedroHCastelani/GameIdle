import type { Character, Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from '../../lib/security.js';
import { lockCharacter } from './character-lock.js';
import { campaignPower, careers, chapterRules, gear, resolveChapter, staminaAt } from './campaign-rules.js';
import { levelFromExperience } from './idle.js';
import { encounterCooldown, encounterDecision, encounters } from './encounter-rules.js';

function freeToAct(character: Character) {
  if (character.isPrisoned) throw new ApiError(409, 'Personagem detido não pode realizar esta ação.');
}
async function inventory(tx: Prisma.TransactionClient, characterId: string) {
  return tx.inventoryItem.findMany({ where: { characterId }, include: { template: true }, orderBy: { obtainedAt: 'asc' } });
}
export async function campaignView(db: PrismaClient, char: Character) {
  const items = await inventory(db, char.id);
  const stamina = staminaAt(char.staminaCurrent, char.staminaLastRegen, new Date());
  const power = campaignPower(char.level, char.campaignCycles, items.filter(i => i.isEquipped).map(i => i.templateId));
  const history = await db.stageAttempt.findMany({ where: { characterId: char.id }, orderBy: { startedAt: 'desc' }, take: 5, include: { mission: { select: { name: true } }, stageResults: { orderBy: { stageNumber: 'asc' } } } });
  const lastEncounter = await db.stageAttempt.findFirst({ where: { characterId: char.id, missionId: { startsWith: 'mvp_encounter_' } }, orderBy: { startedAt: 'desc' } });
  return {
    encounters: encounters[char.profession], encounterWaitSeconds: lastEncounter ? Math.max(0, Math.ceil((lastEncounter.startedAt.getTime() + encounterCooldown - Date.now()) / 1000)) : 0,
    chapter: char.campaignChapter, completed: char.campaignChapter >= 3, ending: careers[char.profession].ending,
    power, skillName: careers[char.profession].skill, skillLevel: 1 + Math.floor(Math.sqrt(char.campaignCycles / 5)), cycles: char.campaignCycles,
    stamina: stamina.value, staminaNextAt: stamina.nextAt, nextLevelExperience: (100n * BigInt(char.level) ** 2n).toString(),
    chapters: chapterRules.map((rule, index) => ({ ...rule, chapter: index + 1, name: careers[char.profession].chapters[index], stages: careers[char.profession].stages })),
    shop: gear.filter(g => g.price > 0),
    inventory: items.map(i => ({ id: i.id, name: i.template.name, description: i.template.description, quantity: i.quantity, equipped: i.isEquipped, slot: i.template.slot, power: gear.find(g => g.id === i.templateId)?.power ?? 0, level: gear.find(g => g.id === i.templateId)?.level ?? 1, sell: i.template.baseValueGold, rarity: i.template.rarity })),
    history: history.map(h => ({ id: h.id, name: h.mission.name, outcome: h.outcome, gold: h.goldGained, exp: h.expGained, decision: encounterDecision(h.stageResults[0]?.enemies ?? null), stages: h.stageResults.map(s => ({ number: s.stageNumber, outcome: s.outcome })) })),
  };
}
export async function grantCycleDrops(tx: Prisma.TransactionClient, char: Character, cycles: number) {
  const quantity = Math.floor((char.campaignCycles + cycles) / 5) - Math.floor(char.campaignCycles / 5);
  await tx.character.update({ where: { id: char.id }, data: { campaignCycles: { increment: cycles } } });
  if (!quantity) return;
  const existing = await tx.inventoryItem.findFirst({ where: { characterId: char.id, templateId: 'mvp_supplies' } });
  const item = existing ? await tx.inventoryItem.update({ where: { id: existing.id }, data: { quantity: { increment: quantity } } })
    : await tx.inventoryItem.create({ data: { characterId: char.id, templateId: 'mvp_supplies', quantity, isIdentified: true, obtainedFrom: 'MISSION' } });
  await tx.economyLog.create({ data: { type: 'ITEM_DROP', characterId: char.id, itemId: item.id, metadata: { quantity, source: 'LOCAL_CAMPAIGN' } } });
}

export function campaignService(db: PrismaClient) {
  return {
    async buy(userId: string, id: string, templateId: string) {
      const item = gear.find(g => g.id === templateId && g.price > 0);
      if (!item) throw new ApiError(400, 'Item não disponível na loja.');
      return db.$transaction(async tx => {
        const char = await lockCharacter(tx, userId, id); freeToAct(char);
        if (char.goldHand < BigInt(item.price)) throw new ApiError(409, 'Gold insuficiente. Complete mais ciclos.');
        if (await tx.inventoryItem.count({ where: { characterId: id } }) >= 40) throw new ApiError(409, 'Inventário cheio. Venda itens antes de comprar.');
        const created = await tx.inventoryItem.create({ data: { characterId: id, templateId, isIdentified: true, obtainedFrom: 'NPC' } });
        await tx.character.update({ where: { id }, data: { goldHand: { decrement: item.price } } });
        await tx.economyLog.create({ data: { type: 'NPC_PURCHASE', characterId: id, itemId: created.id, goldAmount: -BigInt(item.price) } });
        return { message: `Compra concluída: ${item.name}. Equipe no inventário.` };
      });
    },
    async item(userId: string, id: string, itemId: string, action: 'equip' | 'unequip' | 'sell') {
      return db.$transaction(async tx => {
        const char = await lockCharacter(tx, userId, id); freeToAct(char);
        const item = await tx.inventoryItem.findFirst({ where: { id: itemId, characterId: id }, include: { template: true } });
        if (!item || !item.templateId.startsWith('mvp_')) throw new ApiError(404, 'Item não encontrado.');
        if (action === 'sell') {
          if (item.isEquipped) throw new ApiError(409, 'Remova o equipamento antes de vender.');
          const gold = BigInt(item.template.baseValueGold) * BigInt(item.quantity);
          await tx.inventoryItem.delete({ where: { id: itemId } });
          await tx.character.update({ where: { id }, data: { goldHand: { increment: gold } } });
          await tx.economyLog.create({ data: { type: 'NPC_SALE', characterId: id, itemId, goldAmount: gold, metadata: { quantity: item.quantity } } });
          return { message: `Venda concluída: +${gold} gold.` };
        }
        const definition = gear.find(g => g.id === item.templateId);
        if (!definition || !item.template.slot) throw new ApiError(400, 'Este item não pode ser equipado.');
        if (char.level < definition.level) throw new ApiError(409, 'Nível insuficiente para equipar.');
        if (action === 'equip') await tx.inventoryItem.updateMany({ where: { characterId: id, equippedSlot: item.template.slot }, data: { isEquipped: false, equippedSlot: null } });
        await tx.inventoryItem.update({ where: { id: itemId }, data: { isEquipped: action === 'equip', equippedSlot: action === 'equip' ? item.template.slot : null } });
        await tx.economyLog.create({ data: { type: 'EQUIPMENT_CHANGE', characterId: id, itemId, metadata: { action } } });
        return { message: action === 'equip' ? 'Equipamento atualizado.' : 'Equipamento removido.' };
      });
    },
    async challenge(userId: string, id: string, chapter: number, requestId: string) {
      return db.$transaction(async tx => {
        const char = await lockCharacter(tx, userId, id); freeToAct(char);
        const requestKey = `${id}:${requestId}`;
        const previous = await tx.stageAttempt.findUnique({ where: { requestKey } });
        const missionId = `mvp_stage_${char.profession}_${chapter}`;
        if (previous) {
          if (previous.missionId !== missionId) throw new ApiError(409, 'Solicitação já usada para outro desafio.');
          return { message: 'Resultado já registrado. Consulte o diário.', outcome: previous.outcome };
        }
        const rule = chapterRules[chapter - 1];
        if (!rule || chapter !== char.campaignChapter + 1) throw new ApiError(409, 'Conclua os capítulos na ordem.');
        if (char.level < rule.level) throw new ApiError(409, 'Ganhe mais experiência antes deste desafio.');
        const now = new Date(), stamina = staminaAt(char.staminaCurrent, char.staminaLastRegen, now);
        if (!stamina.value) throw new ApiError(409, 'Stamina insuficiente. Ela se recupera com o tempo; missões idle continuam disponíveis.');
        const items = await inventory(tx, id);
        const power = campaignPower(char.level, char.campaignCycles, items.filter(i => i.isEquipped).map(i => i.templateId));
        const stages = resolveChapter(power, rule.power), success = stages.every(s => s.success);
        const gold = success ? BigInt(rule.gold) : 0n, exp = success ? BigInt(rule.exp) : 0n;
        const attempt = await tx.stageAttempt.create({ data: { characterId: id, missionId, requestKey, difficulty: 'EASY', staminaSpent: 1, stageReached: stages.filter(s => s.success).length, totalStages: 3, outcome: success ? 'BOSS_DEFEATED' : 'FAILED', goldGained: gold, expGained: exp, endedAt: now } });
        await tx.stageResult.createMany({ data: stages.map(s => ({ attemptId: attempt.id, stageNumber: s.stage, enemies: [{ name: careers[char.profession].stages[s.stage - 1], required: s.required, power }], goldGained: 0n, expGained: 0n, outcome: s.success ? 'SUCCESS' : 'FAILED' })) });
        await tx.character.update({ where: { id }, data: { staminaCurrent: stamina.value - 1, staminaLastRegen: stamina.cursor, campaignChapter: success ? chapter : char.campaignChapter, goldHand: { increment: gold }, experience: { increment: exp }, level: levelFromExperience(char.experience + exp, char.level) } });
        await tx.staminaLog.create({ data: { characterId: id, delta: -1, reason: 'LOCAL_CAMPAIGN' } });
        if (success && rule.reward) await tx.inventoryItem.create({ data: { characterId: id, templateId: rule.reward, isIdentified: true, obtainedFrom: 'CAMPAIGN' } });
        await tx.economyLog.create({ data: { type: success ? 'STAGE_REWARD' : 'STAGE_PENALTY', characterId: id, goldAmount: gold, metadata: { attemptId: attempt.id, exp: exp.toString(), power, staminaSpent: 1, chapter } } });
        return { message: success ? `Capítulo ${chapter} concluído! +${gold} gold e +${exp} EXP. Confira seu inventário.` : 'Operação interrompida. Você perdeu 1 stamina; melhore o equipamento e tente novamente.', outcome: attempt.outcome };
      });
    },
  };
}
