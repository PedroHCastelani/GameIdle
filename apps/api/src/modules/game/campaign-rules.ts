import type { Profession } from '@prisma/client';

export const careers = {
  POLICE: { skill: 'Investigação', missions: ['Ronda do bairro', 'Rastrear evidências', 'Vigiar o porto'], chapters: ['O depósito clandestino', 'A rede de contrabando', 'Operação Amanhecer'], stages: ['Reunir pistas', 'Cercar o local', 'Prender o responsável'], ending: 'O bairro está seguro. A cidade reconhece sua investigação.' },
  THIEF: { skill: 'Furtividade', missions: ['Observar a feira', 'Reconhecer rotas', 'Infiltrar o porto'], chapters: ['O cofre esquecido', 'O comboio blindado', 'O golpe da madrugada'], stages: ['Planejar a entrada', 'Evitar a vigilância', 'Concluir a fuga'], ending: 'O último golpe foi perfeito. Seu nome circula pelo submundo.' },
  DOCTOR: { skill: 'Medicina', missions: ['Triagem comunitária', 'Atender a clínica', 'Preparar o resgate'], chapters: ['Emergência no bairro', 'Resgate na estação', 'Plantão decisivo'], stages: ['Avaliar a emergência', 'Estabilizar pacientes', 'Concluir o resgate'], ending: 'Todos chegaram ao hospital. Você se tornou referência no bairro.' },
} satisfies Record<Profession, { skill: string; missions: string[]; chapters: string[]; stages: string[]; ending: string }>;

export const gear = [
  { id: 'mvp_tool', name: 'Ferramenta de trabalho', slot: 'WEAPON' as const, power: 6, price: 50, level: 1, sell: 20, description: 'Kit inicial adaptado à sua profissão. +6 de poder.' },
  { id: 'mvp_vest', name: 'Vestuário reforçado', slot: 'BODY' as const, power: 6, price: 80, level: 1, sell: 30, description: 'Proteção para trabalhar nas ruas. +6 de poder.' },
  { id: 'mvp_tool_rare', name: 'Kit profissional', slot: 'WEAPON' as const, power: 10, price: 0, level: 2, sell: 60, description: 'Recompensa do primeiro capítulo. +10 de poder.' },
  { id: 'mvp_vest_rare', name: 'Uniforme especializado', slot: 'BODY' as const, power: 12, price: 0, level: 3, sell: 80, description: 'Recompensa do segundo capítulo. +12 de poder.' },
];
export const chapterRules = [
  { level: 2, power: 25, gold: 100, exp: 200, reward: 'mvp_tool_rare' },
  { level: 3, power: 42, gold: 200, exp: 350, reward: 'mvp_vest_rare' },
  { level: 4, power: 62, gold: 500, exp: 500, reward: null },
];
export function staminaAt(current: number, since: Date, now: Date) {
  const interval = 8640000; // Free account: one point per 2.4 hours.
  const elapsed = Math.max(0, now.getTime() - since.getTime());
  const value = Math.min(10, current + Math.floor(elapsed / interval));
  return { value, cursor: value >= 10 ? now : new Date(now.getTime() - elapsed % interval), nextAt: value >= 10 ? null : new Date(now.getTime() - elapsed % interval + interval) };
}
export function campaignPower(level: number, cycles: number, equipped: string[]) {
  return level * 10 + Math.floor(Math.sqrt(cycles / 5)) + equipped.reduce((sum, id) => sum + (gear.find(g => g.id === id)?.power ?? 0), 0);
}
export function resolveChapter(power: number, required: number) {
  return [required - 8, required - 4, required].map((target, index) => ({ stage: index + 1, required: target, success: power >= target }));
}
