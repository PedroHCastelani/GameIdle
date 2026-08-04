# 📋 RELATÓRIO DE SPRINT — THE LIFE

**Sprint:** [NÚMERO]
**Período:** [DATA INÍCIO] a [DATA FIM]
**Agente condutor:** [NOME DO AGENTE]
**Branch:** [NOME DA BRANCH]
**Repositório:** [URL DO REPO]

---

## ⚠️ INSTRUÇÕES PARA A IA DO NOTION

Você é a IA responsável por manter o Notion do projeto The Life atualizado.
Abaixo está TUDO o que aconteceu nesta sprint. Sua tarefa é:

1. **Atualizar o board Kanban** — mover cards entre colunas conforme o status abaixo
2. **Atualizar cada card** — adicionar PR linkado, data de conclusão, notas
3. **Criar novos cards** para tarefas que surgiram ou decisões pendentes
4. **Registrar decisões** na database de Decisões Pendentes
5. **NÃO invente nada** — use exatamente as informações abaixo

---

## 📊 RESUMO DA SPRINT

| Métrica | Valor |
|---|---|
| Total de tasks trabalhadas | [N] |
| Tasks concluídas (DONE) | [N] |
| Tasks em progresso | [N] |
| Tasks bloqueadas | [N] |
| PRs abertos | [N] |
| Decisões resolvidas | [N] |
| Decisões ainda abertas | [N] |

---

## ✅ TASKS CONCLUÍDAS — Mover para coluna "DONE"

### T-[XXX]: [TÍTULO COMPLETO]

- **Agente:** [NOME]
- **PR:** [NÚMERO DO PR] — [LINK DO PR]
- **Arquivos modificados:**
  - `[caminho/arquivo]` — [descrição do que mudou]
  - `[caminho/arquivo]` — [descrição do que mudou]
- **Data de conclusão:** [YYYY-MM-DD]
- **Notas técnicas:**
  - [Nota relevante 1]
  - [Nota relevante 2]
- **Ação no Notion:** Mover card T-[XXX] para coluna **Done**. Adicionar PR #[N] no campo "PR". Atualizar campo "Data de conclusão". Copiar notas técnicas para o campo "Notas" do card.

---
[REPETIR PARA CADA TASK CONCLUÍDA]
---

## 🔄 TASKS EM PROGRESSO — Manter em "In Progress"

### T-[XXX]: [TÍTULO COMPLETO]

- **Agente:** [NOME]
- **Progresso atual:** [descrição clara de onde parou — ex: "Estrutura de rotas criada, aguardando implementação do service"]
- **Arquivos em uso:**
  - `[caminho/arquivo]`
- **Previsão de conclusão:** [data ou "próxima sprint"]
- **Ação no Notion:** Atualizar campo "Progresso" do card T-[XXX] com o texto acima. Manter na coluna **In Progress**.

---
[REPETIR PARA CADA TASK EM PROGRESSO]
---

## 🚫 TASKS BLOQUEADAS — Mover para coluna "Bloqueado"

### T-[XXX]: [TÍTULO COMPLETO]

- **Agente:** [NOME]
- **Motivo do bloqueio:** [descrição clara]
- **Depende de:** T-[YYY] ou D-[ZZZ]
- **Desde:** [YYYY-MM-DD]
- **Ação no Notion:** Mover card T-[XXX] para coluna **Bloqueado**. Preencher campo "Motivo do bloqueio" com o texto acima. Adicionar label "Bloqueado".

---
[REPETIR PARA CADA TASK BLOQUEADA]
---

## 📋 DECISÕES — Atualizar database de Decisões

### ✅ Decisões RESOLVIDAS nesta sprint

| ID | Descrição | Decisão tomada | Impacto |
|---|---|---|---|
| D-[XXX] | [Descriçao] | [O que foi decidido] | Destrava T-[YYY] |

- **Ação no Notion:** Mover decisão D-[XXX] para **Resolvida**. Preencher campo "Decisão" com o texto acima. Atualizar campo "Data de resolução".

### 🔴 Decisões que CONTINUAM ABERTAS

| ID | Descrição | Bloqueia | Status atual |
|---|---|---|---|
| D-[XXX] | [Descriçao] | T-[YYY] | [Por que ainda está aberta] |

- **Ação no Notion:** Manter status "Aberta". Atualizar campo "Última revisão" com a data de hoje. Adicionar nota: "Revisada na Sprint [N] — sem avanço".

### 🆕 NOVAS decisões identificadas

| ID | Descrição | Bloqueia | Contexto |
|---|---|---|---|
| D-[XXX] | [Descriçao] | T-[YYY] | [Por que surgiu] |

- **Ação no Notion:** CRIAR novo item na database de Decisões Pendentes com os dados acima. Status: "Aberta". Responsável: [PO ou quem deve decidir].

---

## 🆕 NOVOS CARDS A CRIAR

### Card 1: [TIPO] Título

- **ID sugerido:** T-[XXX]
- **Tipo:** [BACKEND / FRONTEND / DATABASE / DEVOPS / SEGURANÇA / QA / ASSET]
- **Descrição:** [Contexto e motivação — por que isso importa]
- **Critérios de aceite:**
  1. [Critério checável 1]
  2. [Critério checável 2]
  3. [Critério checável 3]
- **Dependências:** T-[XXX], T-[YYY]
- **Agente responsável:** [NOME DO AGENTE]
- **Estimativa:** [P / M / G / XG]
- **Fase:** [0 / 1 / 1.5 / 2 / Assets]
- **Ação no Notion:** Criar card na coluna **Backlog** com todos os campos acima preenchidos.

---
[REPETIR SE HOUVER MAIS CARDS NOVOS]
---

## 📝 ATUALIZAÇÕES DE DOCUMENTAÇÃO

Os seguintes arquivos de documentação foram modificados nesta sprint:

| Arquivo | O que mudou | Relevância para o Notion |
|---|---|---|
| `[caminho/arquivo]` | [Descrição da mudança] | [Qual card/documento do Notion isso afeta] |

- **Ação no Notion:** Atualizar links de documentação nos cards afetados. Se houver nova documentação, linkar nos cards relevantes.

---

## 🎯 PRÓXIMOS PASSOS (próxima sprint)

1. [Descrição clara do próximo passo 1 — com ID de task se já existir]
2. [Descrição clara do próximo passo 2]
3. [Descrição clara do próximo passo 3]

- **Ação no Notion:** Adicionar como comentário no card da Sprint atual ou criar card de "Planejamento Sprint [N+1]".

---

## 📎 LINKS

- **Branch:** [URL da branch]
- **PR principal:** [URL do PR principal da sprint]
- **Diff completo:** [URL do compare no GitHub]
- **TASKS.md atualizado:** [URL do arquivo no repositório]

---

**Fim do relatório.** Não há mais ações além das listadas acima.
Cada ação está explicitamente descrita com o texto exato e a coluna/campo de destino.
