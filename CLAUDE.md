# The Life — CLAUDE.md
> Lido automaticamente pelo Claude Code em toda sessão. Regras globais que se aplicam a TODOS os agentes.

---

## Identidade do Projeto

**Nome:** The Life
**Tipo:** MMORPG Idle de navegador
**Repositório:** https://github.com/PedroHCastelani/GameIdle (branch: master)
**Notion:** Workspace configurado com Kanban, Decisões Pendentes e documentação

---

## REGRA OBRIGATÓRIA — Executar antes de qualquer ação

Todo agente, em toda sessão, antes de escrever qualquer código:

1. Leia `docs/Blueprint.md`
2. Leia `TASKS.md` na raiz
3. Identifique a task que deve executar
4. Confirme que todas as dependências estão com status DONE no TASKS.md
   - Se não estiverem: marque a task como BLOQUEADO e pare
5. Confirme que nenhum arquivo que você vai tocar está em "Arquivos em uso" por outro agente
   - Se estiver: reporte ao Tech Lead e pare
6. Atualize TASKS.md: status = IN_PROGRESS, liste os arquivos que serão modificados
7. Ao concluir: atualize TASKS.md e abra PR

Não há exceção para esta regra.

---

## Estrutura do Repositório

```
/
├── CLAUDE.md                    ← este arquivo (lido por todos)
├── TASKS.md                     ← status de todas as tasks (sempre atualizar)
├── README.md
├── docs/                        ← documentação técnica
│   ├── Blueprint.md
│   ├── GDD_Completo.md
│   ├── Schema_Banco_de_Dados.md
│   ├── Motor_de_Calculo.md
│   ├── Sistema_Economico.md
│   ├── Seguranca_e_LGPD.md
│   ├── Agentes_Autonomos.md
│   └── Definition_of_Done.md
├── .claude/agents/              ← perfis de cada agente
├── apps/web/                    ← Next.js frontend
├── apps/api/                    ← Fastify backend
└── packages/                   ← shared-types, game-engine
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + Tailwind CSS 4 + Zustand |
| Backend | Fastify 5 + Socket.io 4 + BullMQ 5 |
| ORM | Prisma 6 + Zod 3 |
| Banco | PostgreSQL 16 + Redis 7 + PgBouncer |
| Monorepo | Turborepo + pnpm workspaces |
| Runtime | Node.js 22 LTS + TypeScript 5 |

---

## Regras Globais de Código

1. Zero lógica de jogo no frontend — cliente apenas renderiza
2. Toda rota de API precisa de: validação Zod + middleware JWT + rate limiting
3. Transação atômica (db.$transaction) sempre que múltiplas tabelas são afetadas
4. Todo movimento de gold/créditos gera INSERT em economy_logs
5. CPF nunca em texto plano, nunca em logs
6. Secrets nunca em código — apenas em variáveis de ambiente
7. Token de acesso nunca em localStorage — apenas em memória (Zustand)
8. Toda migration tem down migration testada
9. economy_logs é imutável — apenas INSERT e SELECT, nunca UPDATE ou DELETE

---

## Definition of Done (resumo)

- [ ] Código implementa exatamente o critério de aceite do card no Notion
- [ ] pnpm lint, typecheck e test passam sem erros novos
- [ ] Nenhum secret ou dado sensível em logs
- [ ] TASKS.md atualizado com status DONE e arquivos modificados
- [ ] Card no Notion atualizado com PR linkado
- [ ] Tech Lead aprovou o PR

Documento completo: docs/Definition_of_Done.md

---

## Agentes Disponíveis (.claude/agents/)

| Arquivo | Agente | Escopo |
|---|---|---|
| po.md | DEV-PO | Backlog, Notion, TASKS.md |
| tl-produto.md | DEV-TL-PRODUTO | Orquestração de produto, revisão de PR |
| tl-infra.md | DEV-TL-INFRA | Orquestração de infra, deploy, segurança |
| backend.md | DEV-BACKEND | API Fastify, motor de cálculo, agentes BullMQ |
| frontend.md | DEV-FRONTEND | Next.js, UI, WebSocket client |
| database.md | DEV-DATABASE | Schema Prisma, migrations, índices |
| qa.md | DEV-QA | Testes, cobertura, casos de borda |
| devops.md | DEV-DEVOPS | CI/CD, Docker, ambientes, deploy |
| security.md | DEV-SEGURANÇA | OWASP, LGPD, auditoria |
