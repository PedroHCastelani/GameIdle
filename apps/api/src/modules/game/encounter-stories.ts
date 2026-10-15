import type { Profession } from '@prisma/client';
import type { Encounter } from './encounter-rules.js';

const cast = {
  POLICE: { name: 'Helena', role: 'Representante dos comerciantes', meeting: 'A assembleia da feira', crisis: 'A noite do mercado',
    invitation: ['Seu dossiê deu voz às testemunhas.', 'A recuperação das cargas devolveu nosso sustento.'],
    problem: 'Uma nova ameaça de extorsão chega aos comerciantes na véspera da feira.',
    shared: 'Helena organiza os comerciantes e compartilha os relatos antes da abertura.',
    alone: 'Helena mantém os comerciantes afastados; você precisa verificar as pistas por conta própria.',
    resolution: ['As testemunhas ajudaram a interromper a extorsão e o mercado reabriu.', 'A operação localizou a ameaça e garantiu a abertura da feira.'] },
  THIEF: { name: 'Íris', role: 'Intermediária da galeria', meeting: 'O acordo de Íris', crisis: 'O leilão das máscaras',
    invitation: ['Sua verificação protegeu nossa rede de informantes.', 'A encomenda entregue chamou a atenção dos compradores.'],
    problem: 'Um comprador anônimo muda as condições de uma negociação no último instante.',
    shared: 'Íris revela a identidade do comprador e envia um contato para acompanhar a negociação.',
    alone: 'Íris preserva seus contatos; você precisa avaliar o comprador sem a rede dela.',
    resolution: ['O contato de Íris confirmou as condições e o acordo foi concluído.', 'Você negociou diretamente e assumiu a responsabilidade pelo acordo.'] },
  DOCTOR: { name: 'Rosa', role: 'Agente comunitária', meeting: 'O conselho de Rosa', crisis: 'O abrigo da tempestade',
    invitation: ['O acompanhamento aproximou as famílias da equipe.', 'A integração dos plantões fez os recursos chegarem a tempo.'],
    problem: 'Uma tempestade interrompe os acessos e leva as famílias ao abrigo do bairro.',
    shared: 'Rosa mobiliza voluntários e traz os registros das famílias antes da abertura do abrigo.',
    alone: 'Rosa mantém os voluntários em suas rotas; sua equipe precisa organizar o abrigo sozinha.',
    resolution: ['Os voluntários orientaram as famílias e o abrigo concluiu o atendimento.', 'Sua equipe organizou os recursos e manteve o abrigo funcionando.'] },
} satisfies Record<Profession, unknown>;

export function storyEncounters(profession: Profession): Encounter[] {
  const person = cast[profession], prefix = profession.toLowerCase();
  const meeting = `${prefix}_story_meeting`;
  return [
    { id: meeting, name: person.meeting, description: `${person.name} quer decidir como vocês vão trabalhar no próximo acontecimento do bairro.`, level: 5,
      stages: ['Reencontrar o contato', 'Discutir prioridades', 'Firmar o compromisso'],
      requiresAny: [0, 1].map(track => ({ encounterId: `${prefix}_followup_${track}`, choiceId: 'establish' })),
      approaches: [
        { id: 'partner', name: 'Construir uma parceria', description: `Compartilhe as decisões com ${person.name}. No próximo episódio, a colaboração dará +12 poder às duas abordagens.`, power: 85, gold: 160, exp: 380, ending: `${person.name} aceita colaborar e promete mobilizar sua rede no próximo acontecimento.` },
        { id: 'independent', name: 'Manter a condução independente', description: `Assuma a condução sem a rede de ${person.name}. No próximo episódio, o contrato direto pagará +80 gold, sem o apoio de +12 poder.`, power: 85, gold: 160, exp: 380, ending: `${person.name} respeita sua autonomia, mas retira a oferta de apoio para o próximo acontecimento.` },
      ] },
    { id: `${prefix}_story_crisis`, name: person.crisis, description: person.problem, level: 5,
      stages: ['Avaliar o acontecimento', 'Organizar a resposta', 'Concluir o trabalho'],
      requiresAny: ['partner', 'independent'].map(choiceId => ({ encounterId: meeting, choiceId })),
      approaches: [
        { id: 'careful', name: 'Priorizar escuta e planejamento', description: 'Uma resposta cuidadosa rende mais experiência.', power: 105, gold: 180, exp: 480, ending: person.resolution[0] },
        { id: 'direct', name: 'Priorizar a execução', description: 'Uma resposta de maior exigência rende mais gold.', power: 120, gold: 300, exp: 300, ending: person.resolution[1] },
      ] },
  ];
}

// The latest successful meeting is the current commitment. Failed attempts never change it.
export function storyView(profession: Profession, definitions: Encounter[], completed: Set<string>, latest: Map<string, string>) {
  const person = cast[profession], prefix = profession.toLowerCase();
  const commitment = latest.get(`${prefix}_story_meeting`);
  const partner = commitment === 'partner', independent = commitment === 'independent';
  const invitations = person.invitation.filter((_, track) => completed.has(`${prefix}_followup_${track}:establish`));
  const dialogue = partner ? 'Combinamos uma parceria. Minha rede está pronta para ajudar.' : independent ? 'Você preferiu seguir com autonomia. Vou respeitar esse espaço e manter minha rede fora desta resposta.' : invitations.join(' ') || 'Ainda não trabalhamos juntos. Conclua uma continuidade para receber meu convite.';
  const character = { name: person.name, role: person.role, relationship: partner ? 'Parceria ativa' : independent ? 'Autonomia respeitada' : 'Aguardando compromisso', dialogue };
  return definitions.map(m => {
    if (!m.id.startsWith(`${prefix}_story_`)) return { ...m, storyBonus: 0 };
    if (m.id.endsWith('_meeting')) return { ...m, character, storyBonus: 0, event: invitations.join(' ') || dialogue };
    const event = partner ? person.shared : independent ? person.alone : 'O compromisso firmado no encontro definirá quem participa desta resposta.';
    return { ...m, character, event, storyBonus: partner ? 12 : 0, approaches: m.approaches.map((c, index) => ({ ...c,
      gold: c.gold + (independent ? 80 : 0),
      description: `${c.description} ${partner ? 'A rede concede +12 poder.' : independent ? 'O contrato direto acrescenta +80 gold.' : 'Defina primeiro seu compromisso.'}`,
      ending: `${event} ${independent ? person.resolution[1] : person.resolution[index]}`,
    })) };
  });
}
