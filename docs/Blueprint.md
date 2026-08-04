# 🏗️ Blueprint de Execução — The Life
**Versão:** 2.0  
**Data:** Julho 2026

---

## O que é este documento

O Blueprint é o documento que governa a execução do projeto. Todo agente autônomo — de desenvolvimento ou de operação — **lê este documento antes de iniciar qualquer task**. Ele define a ordem de construção, as dependências entre componentes, os critérios de "pronto" por fase e os protocolos de falha.

O GDD governa o design. O Blueprint governa a execução.

---

## Regra de Leitura Obrigatória

```
TODO AGENTE, ANTES DE QUALQUER TASK:

1. Leia este Blueprint do início ao fim
2. Localize a task no Mapa de Dependências — confirme em qual nível ela está
3. Verifique no TASKS.md se todas as dependências desse nível estão com status DONE
   → Se não estiverem: marque sua task como BLOQUEADO no TASKS.md e reporte ao Tech Lead
   → Se estiverem: prossiga
4. Verifique no TASKS.md se algum arquivo que você vai tocar está marcado como "em uso"
   → Se estiver: aguarde ou coordene com o Tech Lead antes de iniciar
5. Registre no TASKS.md: seu agente, status IN_PROGRESS, arquivos que serão modificados
6. Ao concluir: atualize TASKS.md e Notion antes de considerar a task finalizada

Não há exceções para esta regra.
```

---

## Princípios de Execução

1. **Segurança antes de funcionalidade** — auth e LGPD são Fase 0, não ajuste posterior
2. **Banco de dados é contrato** — mudanças de schema passam por migration versionada, nunca ALTER manual em produção
3. **Nada vai para produção sem staging** — toda feature fica pelo menos 24h em staging
4. **Decisão pendente = trabalho bloqueado** — não avançar em cima de suposição
5. **DoD é lei** — task só está pronta quando todos os itens do Definition of Done estão marcados
6. **Um arquivo, um agente por vez** — dois agentes nunca modificam o mesmo arquivo simultaneamente
7. **Sem lógica de jogo no cliente** — todo cálculo de resultado acontece no servidor

---

## Mapa de Dependências

```
NÍVEL 0 — FUNDAÇÃO (pré-requisito de tudo)
├── Monorepo configurado (Next.js + Fastify + Prisma + Turborepo + pnpm)
├── Docker local (PostgreSQL 16 + Redis 7 + PgBouncer)
├── CI/CD básico (GitHub Actions: lint + typecheck + test + build)
├── Schema de banco completo (todas as tabelas do Schema_Banco_de_Dados.md)
├── TASKS.md criado na raiz do repositório
└── Notion workspace configurado com board Kanban

NÍVEL 1 — AUTENTICAÇÃO E CONTA (depende do Nível 0)
├── Registro com CPF único (validação de dígitos + hash SHA-256 + salt)
├── Login com JWT (15min) + refresh token rotation (30 dias, cookie HttpOnly)
├── Sessão única — invalidação forçada ao novo login (AG-07)
├── Proteção de novatos (7 dias sem PvP — campo pvpProtected)
├── Verificação de e-mail (token + endpoint de confirmação)
└── Endpoints LGPD (export, correção, solicitação de exclusão)

NÍVEL 2 — PERSONAGEM BASE (depende do Nível 1)
├── Criação de personagem com profissão
├── Validação de composição de conta por facção (mesmo lado, máx 1 médico)
├── Sistema de atributos (distribuição automática + pontos livres por nível)
├── Skills sem cap (estrutura de treino online e idle)
└── Slots de personagem (slot 1 gratuito, slots 2 e 3 compráveis com Gold ou Créditos)

NÍVEL 3 — MISSÕES IDLE (depende do Nível 2)
├── Motor de cálculo idle server-side (seed determinístico, cap 12h/24h)
├── Cálculo de progresso ao reconectar (AG-01 integrado ao login)
├── Drop de itens com sistema de drop rate dinâmico
├── Progressão de skills via uso em missões
└── Inventário (visualização, identificação, descarte)

NÍVEL 4 — ECONOMIA BASE (depende do Nível 3)
├── Sistema de duas moedas (Gold e Créditos — estrutura, sem gateway ainda)
├── Mercado de itens (listagem, compra, taxa, expiração — AG-05)
├── Mercado de Créditos (player → Gold, taxa 5%)
├── Sistema bancário (físico com risco de PvP + interface com taxa maior)
└── Log econômico imutável (economy_logs — sem DELETE ou UPDATE)

NÍVEL 5 — COMBATE E PUNIÇÕES (depende do Nível 3)
├── Sistema de stamina (limites free/premium, regeneração on-demand — AG-06)
├── Item de stamina Estimulante (compra com Gold ou Créditos, limite diário)
├── Missões com stages (waves + boss + 4 dificuldades + enfileiramento 3/10)
├── Encontro em missão (PvP automático com rolagem D&D)
├── Sistema de morte e penalidades (por faixa de nível, primeira morte do dia)
├── Retrocesso de nível (EXP insuficiente após penalidade)
└── Sistema de prisão completo:
    ├── Cálculo de pena (nível × gravidade / 10)
    ├── Bloqueio total do personagem (AG-02)
    ├── Imunidade a ataques durante prisão
    ├── Propina: delegado aceita (5% + debuff furtividade) ou recusa (gold perdido + tempo+)
    └── Debuff de furtividade pós-propina (proporcional à pena)

NÍVEL 6 — MÉDICO (depende do Nível 4 e 5)
├── Alinhamento do médico (bem / mal / neutro — escolha na criação)
├── Mudança de alinhamento com punição pesada (nível² × 1000 + 50% patrimônio)
├── Penalidade de reset de nível se sem gold (nível 1 free / nível 10 premium)
├── Período de adaptação pós-mudança (48h free / 24h premium)
├── Sistema de buffs médicos:
│   ├── Slot 1 gratuito (Comum), slots extras via talentos
│   ├── Progressão automática por nível (0,1% de chance)
│   ├── Upgrade de tier automático ao atingir máximo + nível mínimo
│   └── Scrolls de rerolar e amplificar (Créditos, limite 2/dia)
└── Atendimento Particular:
    ├── Listagem anônima (nome oculto, nível e buffs visíveis)
    ├── Lista de favoritos (nome revelado após 1 consulta)
    ├── Cooldown do paciente maior que duração do buff
    └── Bônus de alinhamento correspondente (mal × mal: 20% desconto + buff extra)

NÍVEL 7 — SOCIAL (depende do Nível 2)
├── Lista de amigos (convite, aceite, bloqueio)
├── Party entre players (convite, aceite, liderança = quem convidou)
├── Party solo (personagens da conta, liderança = primeiro criado, sem aceite)
├── Bônus de party por composição (30% / 20% / 10% / 0%)
└── Chat (global, party, guild — com AG-10 moderando)

NÍVEL 8 — GUILD (depende do Nível 7)
├── Criação de guild (tag, lado — Lei/Crime/Neutro, sem mescla policial+ladrão)
├── Hierarquia de papéis (Fundador, Líder, Oficial, Membro, Recruta)
├── Progressão de rank 1–5 (contribuições em Gold e itens — AG-03 monitora)
└── Arsenal de guild (doação, empréstimo, retorno com durabilidade reduzida)

NÍVEL 9 — PvP AVANÇADO E HUNTED (depende do Nível 5 e 7)
├── Sistema de vingança (72h, 1 tentativa, sem cascata)
├── Ataque organizado (condições: alvo em missão + janela de vingança ou Top 5)
├── Top 5 Hunted por profissão com D&D de detecção (AG-04)
└── Contrato de assassinato (ladrão nível 81+ com talento)

NÍVEL 10 — AGENTES DE OPERAÇÃO (depende de todos os anteriores)
├── AG-01 Idle Calculator (integrado ao login — Nível 3)
├── AG-02 Prison Warden (cron 5min — Nível 5)
├── AG-03 Economy Monitor (cron 1h — Nível 4)
├── AG-04 Hunted Ranker (cron 1h — Nível 9)
├── AG-05 Market Cleaner (cron 1h — Nível 4)
├── AG-07 Session Guardian (integrado ao auth — Nível 1)
├── AG-08 Anomaly Detector (cron 1h — Nível 10)
└── AG-10 Content Moderator (integrado ao chat — Nível 7)

NÍVEL 11 — MONETIZAÇÃO (depende do Nível 4 + CNPJ ativo)
├── Gateway de pagamento (Stripe + Mercado Pago)
├── Webhook de pagamento com validação HMAC
├── Fluxo de compra de Créditos
└── Assinatura premium mensal

NÍVEL 11 — MONETIZAÇÃO (depende do Nível 4 + CNPJ ativo)
├── Gateway de pagamento (Stripe + Mercado Pago)
├── Webhook de pagamento com validação HMAC
├── Fluxo de compra de Créditos
└── Assinatura premium mensal

NÍVEL 12 — ASSETS VISUAIS (paralelo à Fase 1 — não bloqueia código)
├── D-010 resolvida: ferramentas de geração definidas pelo DEV-ASSET-LEAD
├── D-011 resolvida: paleta oficial aprovada
├── D-012 resolvida: tamanho base de sprite definido
├── ASSET_GUIDELINES.md criado e aprovado (T-081)
├── Sprites base dos 3 personagens jogáveis (T-083, T-084, T-085)
├── Sprites de NPCs e veículos (T-086, T-087)
├── Tilesets de ruas, edifícios e interiores (T-088, T-089, T-090)
├── Props urbanos (T-091)
├── Animações de personagens e efeitos (T-092, T-093)
└── Animações de UI (T-094)

  Agentes responsáveis: DEV-ASSET-LEAD, DEV-ASSET-CHAR, DEV-ASSET-ENV, DEV-ASSET-ANIM
  Nota: produção de assets corre em paralelo ao desenvolvimento de código.
  Assets não bloqueiam a Fase 0 ou Fase 1, mas devem estar prontos antes do go-live.
  Som (D-013) é fase posterior ao visual estabilizado.

FASE 2 — CONTEÚDO AVANÇADO (após MVP estabilizado em produção)
├── Árvore de talentos completa
├── Missões nível 31–80+
├── Alinhamento fluido (policial corrupto, delator, NPC Juiz)
├── Território e guerra semanal de guild
├── Guild rank 3–5 + arsenal avançado
└── AG-09 Partition Manager
```

---

## Fases de Entrega

### FASE 0 — Fundação
**Duração estimada:** 2–3 semanas  
**Agentes:** DEV-TL-INFRA, DEV-DEVOPS, DEV-DATABASE, DEV-PO

| ID | Entrega | Agente | Critério de Pronto |
|---|---|---|---|
| T-001 | Monorepo configurado | DEV-DEVOPS | `pnpm dev` sobe frontend e backend sem erro |
| T-002 | Docker local | DEV-DEVOPS | `docker-compose up` sobe PostgreSQL, Redis e PgBouncer sem erro |
| T-003 | Schema inicial | DEV-DATABASE | `prisma migrate dev` cria todas as tabelas sem erro; down migration testada |
| T-004 | CI/CD | DEV-DEVOPS | PR bloqueado se lint, typecheck ou build falhar |
| T-005 | Seed de dados | DEV-DATABASE | Áreas, missões, inimigos e buffs médicos básicos no banco local |
| T-006 | TASKS.md criado | DEV-PO | Arquivo na raiz do repositório com estrutura definida |
| T-007 | Notion configurado | DEV-PO | Board Kanban ativo com colunas e labels; T-001 a T-006 criados como cards |

**Critério de avanço para Fase 1:** todas as 7 entregas com critérios atendidos + revisão do schema aprovada pelo DEV-TL-INFRA.

---

### FASE 1 — MVP Core
**Duração estimada:** 8–10 semanas  
**Meta:** jogo jogável do início ao fim em modo solo, com economia funcional

| ID | Entrega | Agente | Critério de Pronto | Depende de |
|---|---|---|---|---|
| T-010 | Auth completo | DEV-BACKEND | Registro (CPF único), login, refresh, sessão única, LGPD endpoints — com testes | T-003 |
| T-011 | AG-07 Session Guardian | DEV-BACKEND | Novo login invalida sessão anterior; notificação WebSocket funciona | T-010 |
| T-012 | Criação de personagem | DEV-BACKEND | Validação de facção, atributos iniciais, slot 1 funcional | T-010 |
| T-013 | UI — Auth e personagem | DEV-FRONTEND | Telas de registro, login e criação de personagem em mobile e desktop | T-010, T-012 |
| T-014 | Missão idle — backend | DEV-BACKEND | Cálculo offline correto, cap funcionando, seed determinístico | T-012 |
| T-015 | AG-01 Idle Calculator | DEV-BACKEND | Integrado ao login; delta negativo rejeitado; flag EXCESSIVE_DELTA funcionando | T-014 |
| T-016 | Inventário | DEV-BACKEND | Drop de itens, identificação, visualização | T-014 |
| T-017 | UI — Missão e inventário | DEV-FRONTEND | HUD com missão em andamento, inventário responsivo | T-014, T-016 |
| T-018 | Duas moedas — estrutura | DEV-BACKEND | Gold e Créditos no banco, saldo visível, sem gateway | T-012 |
| T-019 | Slots de personagem | DEV-BACKEND | Slot 2 e 3 compráveis com Gold ou Créditos | T-018 |
| T-020 | Sistema de morte | DEV-BACKEND | Penalidades por faixa de nível, retrocesso de nível, primeira morte do dia | T-014 |
| T-021 | Stamina — backend | DEV-BACKEND | Limites free/premium, regeneração on-demand, Estimulante | T-012 |
| T-022 | Missões de stage | DEV-BACKEND | Waves + boss + 4 dificuldades + enfileiramento 3/10 | T-014, T-021 |
| T-023 | UI — Stage | DEV-FRONTEND | Visualização de stages, seleção de dificuldade, fila de execuções | T-022 |
| T-024 | Sistema de prisão | DEV-BACKEND | Pena calculada, bloqueio total, propina com delegado, debuff de furtividade | T-020 |
| T-025 | AG-02 Prison Warden | DEV-BACKEND | Job a cada 5min liberando presos; bribe pendente não libera | T-024 |
| T-026 | UI — Prisão e propina | DEV-FRONTEND | Tela de status de prisão, listagem de delegados, fluxo de propina | T-024 |
| T-027 | Médico — alinhamento | DEV-BACKEND | 3 estados, mudança com punição, período de adaptação | T-018 |
| T-028 | Médico — buffs | DEV-BACKEND | Slots, tiers, progressão por nível, scrolls | T-027 |
| T-029 | Atendimento Particular | DEV-BACKEND | Listagem anônima, cooldown, favoritos, bônus de alinhamento | T-028 |
| T-030 | UI — Médico | DEV-FRONTEND | Tela de atendimento, listagem de médicos, buffs ativos | T-027, T-029 |
| T-031 | Mercado de itens | DEV-BACKEND | Listagem, compra em transação atômica, taxa, expiração | T-016, T-018 |
| T-032 | Mercado de Créditos | DEV-BACKEND | Listagem, compra, taxa 5%, devolução em expiração | T-018 |
| T-033 | AG-05 Market Cleaner | DEV-BACKEND | Job a cada hora expirando listings e devolvendo créditos | T-031, T-032 |
| T-034 | UI — Mercados | DEV-FRONTEND | Telas de mercado de itens e créditos com filtros e busca | T-031, T-032 |
| T-035 | Banco — backend | DEV-BACKEND | Banco físico (PvP no percurso) + interface (taxa maior) | T-018 |
| T-036 | UI — Banco | DEV-FRONTEND | Tela de banco com saldo, depósito, saque e taxa visível | T-035 |
| T-037 | AG-03 Economy Monitor | DEV-BACKEND | Drop rates ajustados automaticamente; anomalias alertam equipe | T-031, T-033 |
| T-038 | AG-08 Anomaly Detector | DEV-BACKEND | 6 tipos de flag funcionando; webhook de alerta configurado | T-037 |
| T-039 | QA — Fase 1 completa | DEV-QA | Todos os fluxos críticos testados; cobertura ≥ 80%; sem regressões | T-010–T-038 |
| T-040 | Segurança — Fase 1 | DEV-SEGURANÇA | OWASP Top 10 checado; pnpm audit limpo; penetration test básico | T-039 |

**Critério de avanço para Fase 1.5:** jogador cria conta, escolhe personagem, faz missão idle, morre, é preso, paga propina, usa médico e opera no mercado. Sem bugs críticos por 5 dias em staging. Ratio torneira/ralo entre 0.90 e 1.10.

---

### FASE 1.5 — Social e PvP
**Duração estimada:** 3–4 semanas

| ID | Entrega | Agente | Critério de Pronto | Depende de |
|---|---|---|---|---|
| T-050 | Lista de amigos | DEV-BACKEND | Convite, aceite, bloqueio; sem expor userId | T-010 |
| T-051 | Party entre players | DEV-BACKEND | Convite, aceite, liderança, bônus por composição | T-050 |
| T-052 | Party solo | DEV-BACKEND | Personagens da conta, liderança automática, sem bônus solo puro | T-012 |
| T-053 | UI — Party | DEV-FRONTEND | Formação de party, status dos membros, missão compartilhada | T-051, T-052 |
| T-054 | Encontro em missão | DEV-BACKEND | PvP automático com rolagem D&D; resultado log em pvp_logs | T-014 |
| T-055 | Ataque organizado | DEV-BACKEND | Condições, custo de stamina, resolução | T-054 |
| T-056 | Vingança | DEV-BACKEND | Janela 72h, 1 tentativa, sem cascata; expiração automática | T-055 |
| T-057 | UI — PvP e vingança | DEV-FRONTEND | Notificações de encontro, tela de direito de vingança | T-054, T-056 |
| T-058 | Guild básica | DEV-BACKEND | Criação, hierarquia, rank 1–2, contribuições | T-050 |
| T-059 | Chat | DEV-BACKEND | Global, party, guild; AG-10 Content Moderator integrado | T-051, T-058 |
| T-060 | AG-10 Content Moderator | DEV-BACKEND | ALLOW/FILTER/BLOCK funcionando; flagUser registrado | T-059 |
| T-061 | Top 5 Hunted | DEV-BACKEND | Ranking semanal, D&D de detecção, imunidade de presos | T-055 |
| T-062 | AG-04 Hunted Ranker | DEV-BACKEND | Cron a cada hora; Redis atualizado; notificações de entrada/saída | T-061 |
| T-063 | UI — Guild, chat e hunted | DEV-FRONTEND | Telas de guild, chat integrado e ranking Top 5 | T-058, T-059, T-061 |
| T-064 | QA — Fase 1.5 | DEV-QA | PvP sem exploits; economia estável; cobertura ≥ 80% | T-050–T-063 |

**Critério de avanço para Fase 2:** sem exploits conhecidos de PvP, economia estável por 2 semanas, ratio torneira/ralo entre 0.90 e 1.10, monetização (Nível 11) funcional se CNPJ disponível.

---

### ASSETS VISUAIS — Nível 12 (paralelo à Fase 1 e 1.5)
**Duração estimada:** contínua, começa após D-010/D-011/D-012 resolvidas

| ID | Entrega | Agente | Critério de Pronto | Depende de |
|---|---|---|---|---|
| T-080 | Definição de ferramentas e pipeline | DEV-ASSET-LEAD | ASSET_GUIDELINES.md criado com ferramentas, paleta e tamanho aprovados | D-010, D-011, D-012 |
| T-081 | Paleta oficial + estrutura de pastas | DEV-ASSET-LEAD | palette.png exportado, pastas criadas em apps/web/public/assets/ | T-080 |
| T-082 | Estrutura de pastas de assets | DEV-ASSET-LEAD | Todas as pastas criadas conforme ASSET_GUIDELINES.md | T-081 |
| T-083 | Sprites base — Policial | DEV-ASSET-CHAR | 4 direções, idle, PNG com alpha, aprovado pelo LEAD | T-081 |
| T-084 | Sprites base — Ladrão | DEV-ASSET-CHAR | 4 direções, idle, PNG com alpha, aprovado pelo LEAD | T-081 |
| T-085 | Sprites base — Médico (3 alinhamentos) | DEV-ASSET-CHAR | 4 direções × 3 alinhamentos, aprovado pelo LEAD | T-081 |
| T-086 | Sprites — NPCs civis | DEV-ASSET-CHAR | Mínimo 4 variações, aprovado pelo LEAD | T-081 |
| T-087 | Sprites — Veículos | DEV-ASSET-CHAR | Policial, civil, ambulância — aprovados pelo LEAD | T-081 |
| T-088 | Tilesets — Ruas e calçadas | DEV-ASSET-ENV | Modulares, sem costuras, mín 2 variações por tile | T-081 |
| T-089 | Tilesets — Edifícios exteriores | DEV-ASSET-ENV | Delegacia, hospital, banco, beco — aprovados pelo LEAD | T-081 |
| T-090 | Tilesets — Interiores | DEV-ASSET-ENV | Delegacia, hospital, banco — aprovados pelo LEAD | T-081 |
| T-091 | Tilesets — Props urbanos | DEV-ASSET-ENV | Postes, lixeiras, carros estacionados — aprovados | T-081 |
| T-092 | Animações — Personagens | DEV-ASSET-ANIM | walk, run, action por profissão + JSON metadados | T-083, T-084, T-085 |
| T-093 | Animações — Efeitos visuais | DEV-ASSET-ANIM | hit, heal, arrest, levelup, money, prison, buff + JSON | T-081 |
| T-094 | Animações — UI | DEV-ASSET-ANIM | loading, stamina regen, notificação + JSON | T-081 |

---

### FASE 2 — Profundidade
**Duração:** contínua, sprints de 2 semanas

Prioridade de implementação:
1. Árvore de talentos completa
2. Missões nível 31–80
3. Guild rank 3–5 + arsenal
4. Alinhamento fluido (policial corrupto, delator, NPC Juiz)
5. Território e guerra semanal
6. AG-09 Partition Manager

---

## Papéis e Responsabilidades

| Papel | Faz | Não faz |
|---|---|---|
| DEV-PO | Gerencia backlog, escreve cards, mantém Notion e TASKS.md | Escreve código, aprova PRs |
| DEV-TL-PRODUTO | Distribui tasks de produto, revisa PRs, valida DoD | Define requisitos de negócio, acessa produção diretamente |
| DEV-TL-INFRA | Distribui tasks de infra, revisa PRs de infra, valida DoD de infra | Define requisitos de negócio, aprova features de gameplay |
| DEV-BACKEND | Implementa API, motor de cálculo, agentes de operação | Implementa lógica de jogo no frontend, acessa produção |
| DEV-FRONTEND | Implementa UI, stores, cliente WebSocket | Implementa lógica de negócio, acessa banco diretamente |
| DEV-DATABASE | Schema, migrations, índices, otimização | Modifica schema sem migration, aprova features |
| DEV-QA | Testa, reporta bugs, valida DoD | Corrige bugs (reporta ao agente correto) |
| DEV-DEVOPS | CI/CD, ambientes, deploy | Aprova features, modifica schema de jogo |
| DEV-SEGURANÇA | Revisão de segurança, LGPD, penetration test | Aprova features de gameplay, acesso a dados de usuário em produção |

---

## Protocolo de Falha

```
NÍVEL 1 — Bug sem impacto em dados ou segurança
  Ação: card [BUG] no Notion, prioridade Normal, corrigir no próximo sprint
  Decisão: DEV-QA cria card, DEV-TL-PRODUTO prioriza
  Prazo: próximo sprint

NÍVEL 2 — Bug com impacto em dados de jogo (gold errado, EXP errada, pena incorreta)
  Ação: feature flag off se possível, investigação prioritária
  Decisão: DEV-TL-PRODUTO + DEV-BACKEND
  Prazo: diagnóstico em 24h, correção em 48h

NÍVEL 3 — Bug de segurança (bypass de auth, vazamento de token, rate limit inexistente)
  Ação: rollback imediato do deploy, feature flag off, investigação urgente
  Decisão: DEV-TL-INFRA + DEV-SEGURANÇA
  Prazo: diagnóstico em 2h, plano de correção em 24h, fix em 72h

NÍVEL 4 — Brecha de LGPD (CPF exposto, dados pessoais vazados)
  Ação: rollback imediato, isolar o dado exposto, notificar ANPD em até 72h
  Decisão: DEV-TL-INFRA + assessoria jurídica
  Prazo: comunicado à ANPD obrigatório em até 72h do conhecimento do incidente
```

### Rollback

**Código:** deploy da tag anterior — processo de < 5 minutos via CI/CD  
**Schema:** executar down migration da versão afetada — testada previamente em staging  
**Hotfix:** branch a partir da tag em produção (não da main), merge em main depois

---

## Ambientes

| Ambiente | Propósito | Deploy | Quem acessa |
|---|---|---|---|
| Local | Desenvolvimento | `pnpm dev` manual | Devs |
| Staging | Integração, validação de fases | Automático (push na branch `staging`) | Dev + TLs + PO |
| Produção | Jogadores reais | Manual (aprovação do TL-INFRA + tag obrigatória) | Apenas TL-INFRA + DEVOPS |

**Regra:** nenhuma feature vai para produção sem 24h de staging sem incidentes.

---

## Critério de Go-Live (Lançamento Público)

Todos os itens abaixo precisam estar ✅ antes de abrir para jogadores:

**Segurança e LGPD:**
- [ ] Penetration test sem vulnerabilidades críticas ou altas abertas
- [ ] CPF nunca aparece em logs (validado pelo DEV-SEGURANÇA)
- [ ] Sessão única funcionando em todos os cenários de login
- [ ] Política de privacidade publicada (linguagem simples, LGPD compliant)
- [ ] Termos de uso publicados
- [ ] DPO designado (ou terceirizado)
- [ ] Endpoints LGPD funcionando (export, correção, exclusão)
- [ ] Backups automáticos configurados e restore testado

**Funcionalidade:**
- [ ] Fase 1 completa sem bug crítico por 5 dias em staging
- [ ] Todos os agentes de operação rodando sem erro por 48h consecutivas em staging
- [ ] Ratio torneira/ralo entre 0.90 e 1.10 em staging por 5 dias

**Infraestrutura:**
- [ ] Cloudflare configurado (DDoS, WAF, Turnstile no registro)
- [ ] PgBouncer configurado e testado sob carga
- [ ] Redis com persistência (AOF)
- [ ] SSL válido com renovação automática
- [ ] Todos os alertas de monitoramento configurados e testados
- [ ] Runbooks de incidente escritos para os cenários mais prováveis

**Assets Visuais:**
- [ ] Todos os sprites base aprovados (personagens, NPCs, veículos)
- [ ] Tilesets suficientes para as áreas da Fase 1 renderizarem
- [ ] Animações de walk, idle e action dos 3 personagens jogáveis
- [ ] Efeitos visuais críticos: hit, heal, arrest, levelup
- [ ] ASSET_GUIDELINES.md publicado em docs/

**Monetização (se ativa no lançamento):**
- [ ] CNPJ ativo
- [ ] Gateway de pagamento com webhook HMAC validado
- [ ] Nenhum dado de cartão tocando o servidor

---

## Decisões Pendentes que Bloqueiam Desenvolvimento

| # | Decisão | Bloqueia | Responsável |
|---|---|---|---|
| D-001 | Custo dos slots de personagem em Gold | T-019 | PO — pós-calibragem econômica |
| D-002 | Nível mínimo e custo de criação de guild | T-058 | PO — pós-calibragem |
| D-003 | Vantagem premium no banco | T-035 | PO |
| D-004 | Gateway de pagamento (Stripe / MercadoPago) | Nível 11 | PO + jurídico (CNPJ) |
| D-005 | Valores de calibragem econômica (taxas, preços de missão por nível) | T-037 | PO — pós-Fase 1 funcional |
| D-006 | Duração dos buffs médicos e cooldown de recontratação | T-029 | PO — pós-calibragem |
| D-007 | Serviço de validação de CPF (BrasilAPI grátis ou Serpro pago) | T-010 | PO — impacta custo operacional |
| D-008 | Canal de alertas da equipe (Discord, Slack ou outro) | T-037, T-038 | PO — antes da Fase 1 |
| D-009 | Workspace Notion (URL, permissões, estrutura de database) | T-007 | PO — antes da Fase 0 |

---

## Stack Tecnológica Consolidada

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js (App Router) | 15.x |
| Estilização | Tailwind CSS | 4.x |
| State management | Zustand | 5.x |
| WebSocket client | Socket.io-client | 4.x |
| Backend | Fastify | 5.x |
| WebSocket server | Socket.io | 4.x |
| ORM | Prisma | 6.x |
| Validação de schema | Zod | 3.x |
| Queue / Jobs | BullMQ | 5.x |
| Banco principal | PostgreSQL | 16.x |
| Cache / Pub-Sub | Redis | 7.x |
| Connection pooling | PgBouncer | 1.22+ |
| Monorepo | Turborepo + pnpm workspaces | latest |
| Containers | Docker + Docker Compose | latest |
| CDN / Segurança | Cloudflare | — |
| Object storage | Cloudflare R2 | — |
| Deploy inicial | Railway ou Fly.io | — |
| Linguagem | TypeScript | 5.x |
| Runtime | Node.js LTS | 22.x |
| Agentes autônomos | Claude Code | — |
| Gestão de tasks | Notion + TASKS.md | — |

## Regras de Processo

### RP-01 — Sincronização de Sprint (Repositório + Notion)

Ao final de **cada sprint**, o agente condutor DEVE gerar DOIS artefatos:

1. **Script de commit** (`script-commit.sh` na raiz) — script shell com todos os comandos git para subir as alterações, com mensagem estruturada contendo:
   - Tasks concluídas, em progresso e bloqueadas
   - Arquivos modificados
   - Decisões resolvidas e abertas
   - Status do TASKS.md
   - Próximo passo

2. **Prompt para IA do Notion** (`scripts/template/template-notion.md`) — documento markdown extremamente detalhado para a IA de integração com o Notion executar:

    **Regra:** O prompt do Notion deve ser tão detalhado que a IA não precise fazer nenhuma suposição — cada ação deve estar explicitamente descrita com coluna de destino e texto exato.

   - Mover cards entre colunas do Kanban
   - Atualizar status de cada task
   - Criar novos cards se necessário
   - Registrar decisões tomadas
   - Linkar PRs e documentação

**Configuração de versionamento:**
- `script-commit.sh` → **NÃO versionado** (adicionado ao `.gitignore`)
- `scripts/template/template-notion.md` → **Versionado** (template reutilizável)

**Fluxo:**
