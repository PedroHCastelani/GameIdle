# The Life

MMORPG Idle de navegador com dualidade de facções, economia interdependente e progressão profunda.

## Setup Rápido

```bash
# Pré-requisitos: Node.js 22, pnpm 9, Docker

git clone https://github.com/PedroHCastelani/GameIdle.git
cd GameIdle
pnpm install
docker-compose up -d
pnpm --filter @thelife/api db:migrate
pnpm --filter @thelife/api db:seed
pnpm dev
```

Frontend: http://localhost:3000  
API: http://localhost:3001  
Redis Commander: http://localhost:8081

## Agentes Autônomos (Claude Code)

Este projeto é desenvolvido com agentes autônomos via Claude Code.
Cada agente tem um perfil em `.claude/agents/` com escopo e regras definidas.

**Regra obrigatória para todos os agentes:**
Leia `docs/Blueprint.md` e `TASKS.md` antes de qualquer ação.

| Agente | Arquivo | Escopo |
|---|---|---|
| Product Owner | `.claude/agents/po.md` | Backlog, Notion, TASKS.md |
| Tech Lead Produto | `.claude/agents/tl-produto.md` | Orquestração, revisão de PR |
| Tech Lead Infra | `.claude/agents/tl-infra.md` | Deploy, segurança, LGPD |
| Backend | `.claude/agents/backend.md` | API, motor de cálculo, jobs |
| Frontend | `.claude/agents/frontend.md` | Next.js, UI, WebSocket |
| Database | `.claude/agents/database.md` | Schema, migrations, seed |
| QA | `.claude/agents/qa.md` | Testes, casos de borda |
| DevOps | `.claude/agents/devops.md` | CI/CD, Docker, ambientes |
| Segurança | `.claude/agents/security.md` | OWASP, LGPD, auditoria |

## Documentação

Todos os documentos técnicos estão em `docs/`:

| Documento | Descrição |
|---|---|
| `Blueprint.md` | Mapa de dependências, fases e critério de go-live |
| `GDD_Completo.md` | Game Design Document completo |
| `Schema_Banco_de_Dados.md` | Schema Prisma com todas as tabelas |
| `Motor_de_Calculo.md` | Lógica de cálculo server-side em TypeScript |
| `Sistema_Economico.md` | Ciclo econômico, duas moedas, torneiras e ralos |
| `Seguranca_e_LGPD.md` | 4 camadas de segurança e conformidade LGPD |
| `Agentes_Autonomos.md` | Perfis e prompts dos agentes de operação |
| `Definition_of_Done.md` | Critérios de conclusão por tipo de task |

## Status do Projeto

**Fase atual:** Fase 0 — Fundação

Acompanhe o progresso em `TASKS.md` e no board Kanban no Notion.
