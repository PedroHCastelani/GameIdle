import type { Profession, Prisma } from '@prisma/client';

export type Approach = { id: string; name: string; description: string; power: number; gold: number; exp: number; ending: string; minExpertise?: number };
export type Encounter = { id: string; name: string; description: string; level: number; stages: string[]; approaches: Approach[]; track?: number; requires?: { encounterId: string; choiceId: string } };
export const encounterCooldown = 60000;

export const encounters: Record<Profession, Encounter[]> = {
  POLICE: [
    { id: 'police_market', name: 'Alarme na feira', description: 'Uma banca foi arrombada. A multidão aponta caminhos diferentes para o suspeito.', level: 2, stages: ['Ouvir a feira', 'Verificar a pista', 'Encerrar a ocorrência'], approaches: [
      { id: 'witnesses', name: 'Ouvir as testemunhas', description: 'Investigue com calma: menor exigência e mais experiência.', power: 22, gold: 40, exp: 140, ending: 'Os relatos revelaram um engano. Os bens foram devolvidos sem uma prisão injusta.' },
      { id: 'trail', name: 'Seguir o rastro da carga', description: 'Recupere a mercadoria: mais gold, menos experiência e maior exigência.', power: 32, gold: 120, exp: 60, ending: 'A carga foi localizada no depósito e voltou aos comerciantes.' },
    ] },
    { id: 'police_station', name: 'Estação em alerta', description: 'Uma mala abandonada interrompeu o fluxo de passageiros. É preciso decidir como conduzir a busca.', level: 3, stages: ['Organizar a estação', 'Verificar a mala', 'Liberar a plataforma'], approaches: [
      { id: 'isolate', name: 'Isolar e investigar', description: 'Priorize a investigação: mais experiência, menor recompensa em gold.', power: 34, gold: 70, exp: 210, ending: 'A área foi isolada e o dono da mala foi encontrado. A estação reabriu com segurança.' },
      { id: 'coordinate', name: 'Coordenar buscas simultâneas', description: 'Exige mais poder; o trabalho coordenado rende mais gold.', power: 46, gold: 180, exp: 100, ending: 'A equipe localizou o dono e reorganizou os acessos antes do horário de pico.' },
    ] },
    { id: 'police_port', name: 'Manifesto adulterado', description: 'Dois contêineres usam a mesma documentação. Há uma janela curta antes da saída do navio.', level: 4, stages: ['Comparar registros', 'Inspecionar o cais', 'Registrar as provas'], approaches: [
      { id: 'audit', name: 'Auditar os registros', description: 'Siga a documentação para ganhar mais experiência.', power: 48, gold: 100, exp: 300, ending: 'A auditoria conectou as cargas a uma rede de documentos falsos. As provas foram preservadas.' },
      { id: 'intercept', name: 'Interceptar a carga no cais', description: 'Operação mais exigente, com recompensa maior em gold.', power: 64, gold: 260, exp: 150, ending: 'A carga irregular foi retida no cais antes do embarque.' },
    ] },
  ],
  THIEF: [
    { id: 'thief_gallery', name: 'A galeria fechada', description: 'Um colecionador deixou duas oportunidades: documentos valiosos ou uma peça de exposição.', level: 2, stages: ['Observar a galeria', 'Escolher o alvo', 'Sair sem alarde'], approaches: [
      { id: 'documents', name: 'Copiar o catálogo', description: 'Aprenda rotas e contatos: mais experiência, menos gold.', power: 22, gold: 40, exp: 140, ending: 'O catálogo revelou novos contatos. Sua reputação de observador cresceu.' },
      { id: 'display', name: 'Buscar a peça de exposição', description: 'O alvo mais protegido paga mais gold e exige mais poder.', power: 32, gold: 120, exp: 60, ending: 'A peça chegou ao comprador combinado. O pagamento encerrou o serviço.' },
    ] },
    { id: 'thief_rooftops', name: 'Entrega pelos telhados', description: 'Um pacote precisa cruzar o bairro. Você pode estudar o caminho ou aceitar uma rota mais exigente.', level: 3, stages: ['Ler o trajeto', 'Cruzar o bairro', 'Entregar o pacote'], approaches: [
      { id: 'scout', name: 'Mapear uma rota discreta', description: 'Mais experiência por explorar os caminhos, menos gold.', power: 34, gold: 70, exp: 210, ending: 'A entrega revelou uma rede de passagens que agora você conhece.' },
      { id: 'express', name: 'Aceitar a entrega expressa', description: 'O contratante paga mais pela rota exigente.', power: 46, gold: 180, exp: 100, ending: 'O pacote chegou dentro da janela combinada. O contratante pagou o bônus.' },
    ] },
    { id: 'thief_auction', name: 'Convite para o leilão', description: 'Uma reunião clandestina concentra informação e objetos raros. Você só pode escolher um foco.', level: 4, stages: ['Entrar no evento', 'Aproveitar a oportunidade', 'Deixar o leilão'], approaches: [
      { id: 'contacts', name: 'Trocar informações', description: 'Use o encontro para aprender: mais experiência.', power: 48, gold: 100, exp: 300, ending: 'Você saiu com informações úteis e novos nomes no seu caderno.' },
      { id: 'lot', name: 'Recuperar o lote encomendado', description: 'Maior exigência de poder em troca de mais gold.', power: 64, gold: 260, exp: 150, ending: 'O lote encomendado foi entregue e sua parte do pagamento chegou.' },
    ] },
  ],
  DOCTOR: [
    { id: 'doctor_square', name: 'Mutirão na praça', description: 'A equipe precisa dividir o trabalho entre prevenção e a unidade móvel de atendimento.', level: 2, stages: ['Organizar a equipe', 'Atender a comunidade', 'Concluir o plantão'], approaches: [
      { id: 'prevention', name: 'Conduzir a prevenção', description: 'Mais experiência pelo acompanhamento; menor exigência e menos gold.', power: 22, gold: 40, exp: 140, ending: 'O mutirão orientou as famílias e organizou o acompanhamento na clínica.' },
      { id: 'mobile', name: 'Assumir a unidade móvel', description: 'Plantão de maior exigência com remuneração maior.', power: 32, gold: 120, exp: 60, ending: 'A unidade móvel atendeu a fila prevista e concluiu o plantão.' },
    ] },
    { id: 'doctor_blackout', name: 'Apagão na clínica', description: 'O gerador falhou. Uma equipe de apoio aguarda sua decisão sobre como reorganizar o atendimento.', level: 3, stages: ['Avaliar os recursos', 'Coordenar o atendimento', 'Restabelecer o serviço'], approaches: [
      { id: 'transfer', name: 'Coordenar transferências', description: 'Aprenda com a rede de apoio: mais experiência e menos gold.', power: 34, gold: 70, exp: 210, ending: 'As transferências foram coordenadas e o atendimento continuou na unidade de apoio.' },
      { id: 'backup', name: 'Organizar o plantão de contingência', description: 'A liderança do plantão exige mais poder e rende mais gold.', power: 46, gold: 180, exp: 100, ending: 'A equipe manteve o plantão de contingência até a energia voltar.' },
    ] },
    { id: 'doctor_flood', name: 'Bairro alagado', description: 'O posto de apoio e a equipe de resgate pedem um responsável para a próxima escala.', level: 4, stages: ['Preparar o apoio', 'Atender os moradores', 'Concluir os encaminhamentos'], approaches: [
      { id: 'shelter', name: 'Organizar o posto de apoio', description: 'Mais experiência coordenando os encaminhamentos.', power: 48, gold: 100, exp: 300, ending: 'O posto organizou os atendimentos e os encaminhamentos das famílias.' },
      { id: 'rescue', name: 'Liderar a equipe de resgate', description: 'A escala exige mais poder e tem remuneração maior.', power: 64, gold: 260, exp: 150, ending: 'A equipe de resgate concluiu a escala e retornou ao posto de apoio.' },
    ] },
  ],
};

export function encounterDecision(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return null;
  const first = value[0];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return null;
  if (typeof first.choiceId !== 'string' || typeof first.choiceName !== 'string' || typeof first.ending !== 'string') return null;
  return { id: first.choiceId, name: first.choiceName, ending: first.ending };
}
