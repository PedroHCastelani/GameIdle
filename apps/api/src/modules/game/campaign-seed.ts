import type { PrismaClient, Profession } from '@prisma/client';
import { careers, chapterRules, gear } from './campaign-rules.js';
import { encounters } from './encounter-rules.js';

export async function seedCampaign(db: PrismaClient) {
  for (const profession of Object.keys(careers) as Profession[]) {
    for (const encounter of encounters[profession]) {
      const id = `mvp_encounter_${encounter.id}`;
      const data = { name: encounter.name, description: encounter.description, profession, minLevel: encounter.level, type: 'STAGE' as const, durationBase: 0, goldMin: 0, goldMax: 0, expBase: 0, skillXpRewards: {}, isActive: true, hasStages: true, stageCount: 3 };
      await db.missionDefinition.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    for (let i = 0; i < 3; i++) {
      const idle = { name: careers[profession].missions[i], description: `Capítulo ${i + 1}: ganhe experiência, recursos e prática de ${careers[profession].skill.toLowerCase()}.`, profession, minLevel: i + 1, maxLevel: null, type: 'IDLE' as const, durationBase: 10, goldMin: [15,25,40][i], goldMax: [15,25,40][i], expBase: [20,40,60][i], skillXpRewards: {}, isActive: true };
      await db.missionDefinition.upsert({ where: { id: `mvp_${profession}_${i + 1}` }, create: { id: `mvp_${profession}_${i + 1}`, ...idle }, update: idle });
      const stage = { ...idle, name: careers[profession].chapters[i], description: 'Desafio de campanha local: três etapas e recompensa única.', type: 'STAGE' as const, minLevel: chapterRules[i].level, durationBase: 0, hasStages: true, stageCount: 3 };
      await db.missionDefinition.upsert({ where: { id: `mvp_stage_${profession}_${i + 1}` }, create: { id: `mvp_stage_${profession}_${i + 1}`, ...stage }, update: stage });
    }
  }
  for (const item of gear) {
    const data = { name: item.name, description: item.description, type: 'EQUIPMENT' as const, rarity: item.price ? 'COMMON' as const : 'RARE' as const, slot: item.slot, professions: ['ALL'], baseValueGold: item.sell };
    await db.itemTemplate.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
  }
  const supplies = { name: 'Suprimentos recuperados', description: 'Venda por 10 gold cada. Encontrados a cada cinco ciclos locais.', type: 'MATERIAL' as const, rarity: 'COMMON' as const, professions: ['ALL'], isStackable: true, maxStack: 1000000, baseValueGold: 10 };
  await db.itemTemplate.upsert({ where: { id: 'mvp_supplies' }, create: { id: 'mvp_supplies', ...supplies }, update: supplies });
}
