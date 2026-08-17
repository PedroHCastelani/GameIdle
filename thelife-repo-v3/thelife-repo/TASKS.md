# TASKS.md — The Life
**Última atualização:** 2026-07-21  
**Regra:** Todo agente atualiza este arquivo antes de iniciar e ao concluir qualquer task.  
**Formato de data:** YYYY-MM-DD HH:MM

---

## ⚠️ LEIA ANTES DE QUALQUER AÇÃO

```
1. Verifique se a task que você vai iniciar tem todas as dependências com status DONE
2. Verifique se algum arquivo que você vai tocar está na coluna "Arquivos em uso"
3. Se houver conflito: reporte ao Tech Lead e aguarde. Não inicie.
4. Ao iniciar: mova a task para Em Progresso e liste os arquivos que serão modificados
5. Ao concluir: mova para Aguardando Review com número do PR
```

---

## 🔴 Bloqueado

| ID | Título | Agente | Motivo | Depende de | Desde |
|---|---|---|---|---|---|
| T-019 | Slots de personagem — compra | DEV-BACKEND | Aguarda D-001: custo em Gold indefinido | T-018, D-001 | — |
| T-035 | Banco — backend | DEV-BACKEND | Aguarda D-003: vantagem premium indefinida | T-018, D-003 | — |
| T-058 | Guild básica | DEV-BACKEND | Aguarda D-002: nível mínimo e custo indefinidos | T-050, D-002 | — |

---

## 🟡 Backlog — Fase 0

| ID | Título | Agente | Estimativa | Depende de |
|---|---|---|---|---|
| T-001 | Monorepo configurado | DEV-DEVOPS | M | — |
| T-002 | Docker local (PostgreSQL + Redis + PgBouncer) | DEV-DEVOPS | M | T-001 |
| T-003 | Schema inicial — todas as tabelas | DEV-DATABASE | G | T-002 |
| T-004 | CI/CD — GitHub Actions | DEV-DEVOPS | M | T-001 |
| T-005 | Seed de dados (áreas, missões, inimigos, buffs) | DEV-DATABASE | M | T-003 |
| T-006 | TASKS.md criado na raiz do repositório | DEV-PO | P | T-001 |
| T-007 | Notion — workspace e board Kanban | DEV-PO | M | D-009 |

---

## 🟡 Backlog — Fase 1

| ID | Título | Agente | Estimativa | Depende de |
|---|---|---|---|---|
| T-010 | Auth completo (CPF, login, refresh, LGPD) | DEV-BACKEND | G | T-003, D-007 |
| T-011 | AG-07 Session Guardian | DEV-BACKEND | M | T-010 |
| T-012 | Criação de personagem + validação de facção | DEV-BACKEND | M | T-010 |
| T-013 | UI — Auth e criação de personagem | DEV-FRONTEND | G | T-010, T-012 |
| T-014 | Missão idle — motor de cálculo backend | DEV-BACKEND | G | T-012 |
| T-015 | AG-01 Idle Calculator integrado ao login | DEV-BACKEND | M | T-014 |
| T-016 | Inventário (drop, identificação, visualização) | DEV-BACKEND | M | T-014 |
| T-017 | UI — Missão e inventário | DEV-FRONTEND | G | T-014, T-016 |
| T-018 | Duas moedas — estrutura Gold e Créditos | DEV-BACKEND | M | T-012 |
| T-020 | Sistema de morte e penalidades | DEV-BACKEND | M | T-014 |
| T-021 | Stamina — backend (limites, regen, Estimulante) | DEV-BACKEND | M | T-012 |
| T-022 | Missões de stage (waves + boss + dificuldade + fila) | DEV-BACKEND | G | T-014, T-021 |
| T-023 | UI — Stage e dificuldade | DEV-FRONTEND | G | T-022 |
| T-024 | Sistema de prisão completo | DEV-BACKEND | G | T-020 |
| T-025 | AG-02 Prison Warden | DEV-BACKEND | M | T-024 |
| T-026 | UI — Prisão e propina | DEV-FRONTEND | M | T-024 |
| T-027 | Médico — alinhamento e mudança | DEV-BACKEND | M | T-018 |
| T-028 | Médico — buffs, slots, tiers, scrolls | DEV-BACKEND | G | T-027 |
| T-029 | Atendimento Particular | DEV-BACKEND | G | T-028, D-006 |
| T-030 | UI — Médico e atendimento | DEV-FRONTEND | G | T-027, T-029 |
| T-031 | Mercado de itens | DEV-BACKEND | M | T-016, T-018 |
| T-032 | Mercado de Créditos | DEV-BACKEND | M | T-018 |
| T-033 | AG-05 Market Cleaner | DEV-BACKEND | M | T-031, T-032 |
| T-034 | UI — Mercados | DEV-FRONTEND | G | T-031, T-032 |
| T-036 | UI — Banco | DEV-FRONTEND | M | T-035 |
| T-037 | AG-03 Economy Monitor | DEV-BACKEND | G | T-031, T-033, D-008 |
| T-038 | AG-08 Anomaly Detector | DEV-BACKEND | M | T-037 |
| T-039 | QA — Fase 1 completa | DEV-QA | XG | T-010–T-038 |
| T-040 | Segurança — revisão Fase 1 | DEV-SEGURANÇA | G | T-039 |

---

## 🟡 Backlog — Fase 1.5

| ID | Título | Agente | Estimativa | Depende de |
|---|---|---|---|---|
| T-050 | Lista de amigos | DEV-BACKEND | M | T-010 |
| T-051 | Party entre players | DEV-BACKEND | M | T-050 |
| T-052 | Party solo (personagens da conta) | DEV-BACKEND | M | T-012 |
| T-053 | UI — Party | DEV-FRONTEND | G | T-051, T-052 |
| T-054 | Encontro em missão (PvP automático D&D) | DEV-BACKEND | M | T-014 |
| T-055 | Ataque organizado | DEV-BACKEND | M | T-054 |
| T-056 | Sistema de vingança (72h, 1 tentativa) | DEV-BACKEND | M | T-055 |
| T-057 | UI — PvP e vingança | DEV-FRONTEND | M | T-054, T-056 |
| T-059 | Chat (global, party, guild) | DEV-BACKEND | G | T-051, T-058 |
| T-060 | AG-10 Content Moderator | DEV-BACKEND | M | T-059 |
| T-061 | Top 5 Hunted + D&D de detecção | DEV-BACKEND | M | T-055 |
| T-062 | AG-04 Hunted Ranker | DEV-BACKEND | M | T-061 |
| T-063 | UI — Guild, chat e hunted | DEV-FRONTEND | G | T-058, T-059, T-061 |
| T-064 | QA — Fase 1.5 | DEV-QA | G | T-050–T-063 |

---

## 🟠 Em Progresso

| ID | Título | Agente | Arquivos em uso | Iniciado em |
|---|---|---|---|---|
| — | — | — | — | — |

*(Nenhuma task em progresso — projeto não iniciado)*

---

## 🔵 Aguardando Review

| ID | Título | Agente | PR | Arquivos modificados | Concluído em |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

---

## ✅ Concluído

| ID | Título | Agente | PR | Arquivos modificados | Data |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

---

## ❌ Falhou / Reaberto

| ID | Título | Agente | Motivo da falha | Reaberto em |
|---|---|---|---|---|
| — | — | — | — | — |

---

## 📋 Decisões Pendentes (bloqueiam tasks)

| # | Decisão | Bloqueia | Status | Responsável |
|---|---|---|---|---|
| D-001 | Custo dos slots de personagem em Gold | T-019 | Aberta | PO |
| D-002 | Nível mínimo e custo de criação de guild | T-058 | Aberta | PO |
| D-003 | Vantagem premium no banco | T-035 | Aberta | PO |
| D-004 | Gateway de pagamento (Stripe / MercadoPago) | Nível 11 | Aberta | PO + jurídico |
| D-005 | Valores de calibragem econômica | T-037 | Aberta — pós Fase 1 | PO |
| D-006 | Duração dos buffs médicos e cooldown | T-029 | Aberta | PO |
| D-007 | Serviço de validação de CPF (BrasilAPI ou Serpro) | T-010 | Aberta | PO |
| D-008 | Canal de alertas da equipe (Discord, Slack, outro) | T-037, T-038 | Aberta | PO |
| D-009 | Workspace Notion (URL, permissões, estrutura) | T-007 | Aberta | PO |

---

## 📏 Legenda de Estimativas

| Tamanho | Tempo estimado |
|---|---|
| P (Pequeno) | < 4 horas |
| M (Médio) | 4–8 horas (1 dia) |
| G (Grande) | 1–3 dias |
| XG (Extra Grande) | > 3 dias |

---

## 📌 Regras de uso deste arquivo

1. **Nunca deletar linhas** — tasks concluídas vão para a seção Concluído, não são removidas
2. **Atualizar antes de iniciar** — mover para Em Progresso e listar arquivos em uso
3. **Atualizar ao concluir** — mover para Aguardando Review com número do PR
4. **Conflito de arquivo** — se o arquivo que você precisa tocar está em "Arquivos em uso", PARE e reporte ao Tech Lead
5. **Bloqueio** — se uma dependência não está Done, mova para Bloqueado com o motivo
6. **PO sincroniza com Notion** — toda mudança de status neste arquivo é refletida no board Kanban pelo DEV-PO

---

## 🟡 Backlog — Assets Visuais (pré-requisito: D-010, D-011, D-012 resolvidas)

| ID | Título | Agente | Estimativa | Depende de |
|---|---|---|---|---|
| T-080 | Definição de ferramentas e pipeline de asset | DEV-ASSET-LEAD | G | D-010 |
| T-081 | Paleta oficial e ASSET_GUIDELINES.md | DEV-ASSET-LEAD | G | T-080, D-011, D-012 |
| T-082 | Estrutura de pastas de assets | DEV-ASSET-LEAD | P | T-081 |
| T-083 | Sprites base — Policial (4 direções, idle) | DEV-ASSET-CHAR | G | T-081 |
| T-084 | Sprites base — Ladrão (4 direções, idle) | DEV-ASSET-CHAR | G | T-081 |
| T-085 | Sprites base — Médico (3 alinhamentos, 4 direções, idle) | DEV-ASSET-CHAR | G | T-081 |
| T-086 | Sprites — NPCs civis (variações) | DEV-ASSET-CHAR | G | T-081 |
| T-087 | Sprites — Veículos (policial, civil, ambulância) | DEV-ASSET-CHAR | M | T-081 |
| T-088 | Tilesets — Ruas e calçadas | DEV-ASSET-ENV | G | T-081 |
| T-089 | Tilesets — Edifícios exteriores (delegacia, hospital, banco, beco) | DEV-ASSET-ENV | G | T-081 |
| T-090 | Tilesets — Interiores | DEV-ASSET-ENV | G | T-081 |
| T-091 | Tilesets — Props urbanos | DEV-ASSET-ENV | M | T-081 |
| T-092 | Animações — Personagens (walk, run, action por profissão) | DEV-ASSET-ANIM | XG | T-083, T-084, T-085 |
| T-093 | Animações — Efeitos visuais (hit, heal, arrest, levelup, etc.) | DEV-ASSET-ANIM | G | T-081 |
| T-094 | Animações — UI (loading, stamina, notificação) | DEV-ASSET-ANIM | M | T-081 |

---

## 📋 Decisões Pendentes — atualizado

| # | Decisão | Bloqueia | Status | Responsável |
|---|---|---|---|---|
| D-001 | Custo dos slots de personagem em Gold | T-019 | Aberta | PO |
| D-002 | Nível mínimo e custo de criação de guild | T-058 | Aberta | PO |
| D-003 | Vantagem premium no banco | T-035 | Aberta | PO |
| D-004 | Gateway de pagamento | Nível 11 | Aberta | PO + jurídico |
| D-005 | Valores de calibragem econômica | T-037 | Aberta — pós Fase 1 | PO |
| D-006 | Duração dos buffs médicos e cooldown | T-029 | Aberta | PO |
| D-007 | Serviço de validação de CPF | T-010 | ✅ BrasilAPI (gratuita) | PO |
| D-008 | Canal de alertas da equipe | T-037, T-038 | Aberta | PO |
| D-009 | Workspace Notion | T-007 | ✅ Claude integrado ao Notion | PO |
| D-010 | Ferramentas de geração de assets (pixel art) | T-080 e toda produção de asset | Aberta | DEV-ASSET-LEAD |
| D-011 | Paleta oficial de cores dos assets (máx 32 cores) | T-081 e toda produção de asset | Aberta | DEV-ASSET-LEAD |
| D-012 | Tamanho base de sprite (16×16 ou 32×32) | T-081+ | Aberta | DEV-ASSET-LEAD |
| D-013 | Efeitos sonoros — escopo e ferramentas (fase futura) | Nenhuma task atual | Aberta | PO |
