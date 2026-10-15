import type { Prisma, Profession } from '@prisma/client';
import { encounterDecision, encounters, type Encounter } from './encounter-rules.js';

export const specializations: Record<Profession, [string, string]> = {
  POLICE: ['Investigação', 'Operações'], THIEF: ['Informação', 'Aquisição'], DOCTOR: ['Cuidado comunitário', 'Resposta emergencial'],
};

type Continuation = { name: string; description: string; stages: string[]; choices: [string, string]; endings: [string, string] };
const stories: Record<Profession, [Continuation, Continuation]> = {
  POLICE: [
    { name: 'A rede de testemunhas', description: 'Os relatos da feira abriram uma investigação sobre fraudes no bairro.', stages: ['Reunir os relatos', 'Cruzar evidências', 'Apresentar o caso'], choices: ['Construir o dossiê', 'Coordenar a investigação regional'], endings: ['O dossiê conectou as vítimas e protegeu as testemunhas.', 'A investigação regional identificou os responsáveis pela rede de fraudes.'] },
    { name: 'A rota dos depósitos', description: 'A carga recuperada revelou outros depósitos. A equipe solicita sua liderança.', stages: ['Reunir a equipe', 'Localizar as cargas', 'Devolver os bens'], choices: ['Organizar a recuperação', 'Liderar a operação conjunta'], endings: ['As cargas identificadas voltaram aos comerciantes.', 'A operação conjunta recuperou os bens de vários bairros.'] },
  ],
  THIEF: [
    { name: 'Os nomes do catálogo', description: 'Os contatos encontrados na galeria oferecem uma rede de informação para explorar.', stages: ['Encontrar o contato', 'Avaliar a informação', 'Fechar o acordo'], choices: ['Verificar as informações', 'Negociar com a rede de informantes'], endings: ['As informações verificadas fortaleceram seus contatos.', 'A rede de informantes confiou a você um acordo de maior alcance.'] },
    { name: 'A encomenda do colecionador', description: 'O comprador da peça de exposição voltou com uma encomenda mais ambiciosa.', stages: ['Avaliar a encomenda', 'Organizar o serviço', 'Concluir a entrega'], choices: ['Aceitar uma encomenda pequena', 'Assumir a coleção completa'], endings: ['A primeira encomenda consolidou sua relação com o colecionador.', 'A coleção foi entregue e o contratante reconheceu sua especialização.'] },
  ],
  DOCTOR: [
    { name: 'O retorno das famílias', description: 'As famílias orientadas no mutirão retornaram. O acompanhamento pode virar um programa do bairro.', stages: ['Ouvir as famílias', 'Coordenar o acompanhamento', 'Avaliar o programa'], choices: ['Criar o acompanhamento local', 'Expandir o programa para o bairro'], endings: ['O acompanhamento aproximou as famílias da equipe e fortaleceu o cuidado comunitário.', 'O programa do bairro estabeleceu uma rede permanente de acompanhamento.'] },
    { name: 'A rede de plantões', description: 'O trabalho na unidade móvel rendeu um convite para organizar a resposta entre clínicas.', stages: ['Reunir as equipes', 'Organizar as escalas', 'Concluir a resposta'], choices: ['Integrar duas equipes', 'Coordenar a resposta regional'], endings: ['Duas equipes passaram a compartilhar os recursos do plantão.', 'A rede regional concluiu a resposta conjunta e reconheceu sua liderança.'] },
  ],
};

export function professionEncounters(profession: Profession): Encounter[] {
  const base = encounters[profession];
  const followups = stories[profession].map((story, track): Encounter => ({
    id: `${profession.toLowerCase()}_followup_${track}`, name: story.name, description: story.description,
    level: 4, track, stages: story.stages, requires: { encounterId: base[0].id, choiceId: base[0].approaches[track].id },
    approaches: story.choices.map((name, index) => ({ id: index === 0 ? 'establish' : 'expand', name,
      description: index === 0 ? 'Consolide sua especialização e prepare o próximo desafio.' : 'Use sua experiência nessa área para assumir uma missão de maior alcance.',
      power: index === 0 ? 60 : 80, gold: index === 0 ? 140 : 240, exp: index === 0 ? 260 : 360,
      minExpertise: index + 1, ending: story.endings[index],
    })),
  }));
  return [...base, ...followups];
}

type ProgressRecord = { missionId: string; stageResults: { enemies: Prisma.JsonValue }[] };
export function decisionProgress(profession: Profession, records: ProgressRecord[]) {
  const definitions = professionEncounters(profession);
  const completed = new Set<string>();
  const points = [0, 0];
  for (const record of records) {
    const mission = definitions.find(m => `mvp_encounter_${m.id}` === record.missionId);
    const decision = encounterDecision(record.stageResults[0]?.enemies ?? null);
    const index = mission?.approaches.findIndex(c => c.id === decision?.id) ?? -1;
    if (!mission || index < 0) continue;
    const key = `${mission.id}:${mission.approaches[index].id}`;
    if (completed.has(key)) continue;
    completed.add(key); points[mission.track ?? index]++;
  }
  return { completed, points };
}

export async function loadDecisionProgress(db: Pick<Prisma.TransactionClient, 'stageAttempt'>, id: string, profession: Profession) {
  const records = await db.stageAttempt.findMany({ where: { characterId: id, outcome: 'BOSS_DEFEATED', missionId: { startsWith: 'mvp_encounter_' } }, select: { missionId: true, stageResults: { where: { stageNumber: 1 }, select: { enemies: true } } } });
  return decisionProgress(profession, records);
}

export function progressionView(profession: Profession, progress: ReturnType<typeof decisionProgress>, power: number) {
  const definitions = professionEncounters(profession);
  const paths = specializations[profession].map((name, index) => ({ name, points: progress.points[index], bonus: progress.points[index] * 3 }));
  return { specializations: paths, encounters: definitions.map(m => {
    const source = definitions.find(d => d.id === m.requires?.encounterId);
    const sourceChoice = source?.approaches.find(c => c.id === m.requires?.choiceId);
    const lockReason = m.requires && !progress.completed.has(`${m.requires.encounterId}:${m.requires.choiceId}`)
      ? `Conclua ${source?.name} com a abordagem ${sourceChoice?.name}.` : null;
    return { ...m, lockReason, approaches: m.approaches.map((c, index) => {
      const path = paths[m.track ?? index];
      const completed = progress.completed.has(`${m.id}:${c.id}`);
      const unlocks = definitions.filter(d => d.requires?.encounterId === m.id && d.requires.choiceId === c.id).map(d => d.name);
      return { ...c, specialization: path.name, expertise: path.points, bonus: path.bonus, effectivePower: power + path.bonus, completed, unlocks,
        lockReason: path.points < (c.minExpertise ?? 0) ? `Requer ${c.minExpertise} pontos em ${path.name}; você tem ${path.points}.` : null };
    }) };
  }) };
}
