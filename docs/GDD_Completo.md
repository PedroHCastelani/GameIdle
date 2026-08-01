# 🎮 THE LIFE — Game Design Document Completo
**Versão:** 0.5  
**Data:** Julho 2026  
**Status:** Em definição ativa

---

## ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Contas, Slots e Personagens](#2-contas-slots-e-personagens)
3. [Profissões e Composição de Conta](#3-profissões-e-composição-de-conta)
4. [Sistema de Alinhamento do Médico](#4-sistema-de-alinhamento-do-médico)
5. [Atributos e Skills](#5-atributos-e-skills)
6. [Árvore de Talentos](#6-árvore-de-talentos)
7. [Sistema de Stamina](#7-sistema-de-stamina)
8. [Missões](#8-missões)
9. [Sistema de Party](#9-sistema-de-party)
10. [Atendimento Particular — Médico](#10-atendimento-particular--médico)
11. [Sistema de Buffs Médicos](#11-sistema-de-buffs-médicos)
12. [PvP e Sistema de Vingança](#12-pvp-e-sistema-de-vingança)
13. [Sistema Hunted — Top 5](#13-sistema-hunted--top-5)
14. [Sistema de Prisão](#14-sistema-de-prisão)
15. [Morte e Punições](#15-morte-e-punições)
16. [Economia e Duas Moedas](#16-economia-e-duas-moedas)
17. [Sistema Bancário](#17-sistema-bancário)
18. [Sistema de Guild](#18-sistema-de-guild)
19. [Segurança, LGPD e Sessão Única](#19-segurança-lgpd-e-sessão-única)
20. [Alinhamento Fluido — Fase 2](#20-alinhamento-fluido--fase-2)
21. [Território e Guerra — Fase 2](#21-território-e-guerra--fase-2)
22. [Direção Visual](#22-direção-visual)
23. [Roadmap](#23-roadmap)
24. [Decisões Pendentes](#24-decisões-pendentes)

---

## 1. VISÃO GERAL

### Conceito
The Life é um MMORPG idle de navegador inspirado na dualidade de GTA e na profundidade de Tibia e The Crims. O jogador escolhe um lado — Lei ou Crime — e constrói até 3 personagens dentro dessa mesma influência, progredindo através de missões automáticas, gestão de skills, talentos, party e uma economia interdependente.

### Referências
| Referência | O que absorver |
|---|---|
| GTA (clássico) | Ambientação urbana top-down, dualidade bem vs mal |
| World of Warcraft | Facções exclusivas — personagens da conta pertencem ao mesmo lado |
| The Crims | Progressão por crime, punição severa, mercado de itens |
| Tibia | PvP livre, perda de EXP, retrocesso de nível, skills sem cap |
| Runescape | Skills treináveis independentes do nível principal |

### Pilares
- **Segurança em primeiro lugar** — CPF único, sessão única, LGPD integral
- **Idle genuíno** — progresso acontece offline com cap de tempo por tipo de conta
- **Facções exclusivas** — conta pertence a um lado; personagens são todos da mesma influência
- **Reputação independente** — cada personagem é uma identidade anônima para outros players
- **Interdependência econômica** — Lei, Crime e Médico precisam uns dos outros
- **Duas moedas** — Gold (interna) e Créditos (premium, adquirida com dinheiro real)
- **Free-to-Play justo** — todo conteúdo acessível; premium compra conveniência

### Core Loop
```
Entrar → Coletar progresso offline → Selecionar personagem ativo →
Decisões (missão, skill, talento, party, banco) →
Sair e deixar personagens agindo → [IDLE] → Voltar e coletar
```

---

## 2. CONTAS, SLOTS E PERSONAGENS

### Registro e Verificação
- Cada conta requer **um CPF válido e único** — verificado via API de validação
- Um CPF não pode estar vinculado a mais de uma conta ativa
- Sessão única: login em novo dispositivo encerra automaticamente a sessão anterior
- Verificação de e-mail obrigatória antes de jogar
- Captcha no registro (Cloudflare Turnstile) para bloquear criação em massa

### Slots de Personagem
Toda conta começa com **1 slot** ativo. Os dois slots adicionais precisam ser desbloqueados:

| Slot | Disponibilidade | Custo |
|---|---|---|
| Slot 1 | Gratuito no registro | — |
| Slot 2 | Comprado com Gold ou Créditos | Gold: valor muito alto (definir pós-calibragem) / Créditos: valor acessível |
| Slot 3 | Comprado com Gold ou Créditos | Gold: valor extremamente alto / Créditos: valor moderado |

O valor em Gold deve ser alto o suficiente para representar um investimento real de semanas de jogo, mas não impossível para um jogador dedicado free.

### Sessão de Personagem
O jogador acessa um personagem por vez. Pode trocar entre os personagens da conta livremente, mas apenas um está "ativo" por sessão — recebendo progresso de missão em tempo real na tela. Os outros continuam progredindo no idle normalmente.

### Reputação Independente
Cada personagem é uma identidade completamente separada para outros players. Não há mecânica no jogo que permita a outros players saberem que dois personagens pertencem à mesma conta. A `userId` nunca é exposta em nenhuma consulta pública.

---

## 3. PROFISSÕES E COMPOSIÇÃO DE CONTA

### Facções — O Lado da Conta

Ao criar o **primeiro personagem**, o jogador define o lado da conta. Essa escolha é permanente e define quais profissões os personagens subsequentes podem ter.

```
Lado da conta = profissão do primeiro personagem criado
  → Policial: conta do lado da Lei
  → Ladrão:   conta do lado do Crime
  → Médico:   conta neutra (casos especiais abaixo)
```

### Composições Permitidas por Conta

| Primeiro personagem | Composições permitidas nos 3 slots |
|---|---|
| **Policial** | (Policial, Policial, Policial) |
| | (Policial, Policial, Médico) |
| | (Policial, Médico, —) |
| **Ladrão** | (Ladrão, Ladrão, Ladrão) |
| | (Ladrão, Ladrão, Médico) |
| | (Ladrão, Médico, —) |
| **Médico** | (Médico, Médico, Médico) |
| | (Médico, —, —) |

**Regras:**
- Policial e Ladrão nunca coexistem na mesma conta
- Médico pode existir em qualquer conta como suporte do lado escolhido
- Se o primeiro personagem for Médico, a conta é neutra — os demais também precisam ser Médico
- Máximo de 1 Médico por conta em contas de Lei ou Crime

### As Três Profissões

#### 🚔 Policial
Profissão do lado da Lei. Ganha gold via salários, apreensões e recompensas.

**Progressão:**
```
Nível 1–5:    Blitz de rotina
Nível 6–15:   Coordenar blitz
Nível 16–30:  Investigação
Nível 31–50:  Operação de captura (missão com stages)
Nível 51–80:  BOPE/SWAT
Nível 81+:    Delegado — pode aceitar ou recusar propina de presos
```
**Atributos primários:** Autoridade, Força, Investigação, Precisão
**Skills:** Interrogatório, Tiro, Direção, Liderança, Investigação Forense, Defesa Pessoal

#### 🔫 Ladrão
Profissão do lado do Crime. Ganha gold via roubos e mercado negro.

**Progressão:**
```
Nível 1–5:    Furto simples
Nível 6–15:   Assalto a pedestre
Nível 16–30:  Assalto a estabelecimento
Nível 31–50:  Assalto planejado (missão com stages)
Nível 51–80:  Organização criminosa
Nível 81+:    Chefe do crime
```
**Atributos primários:** Furtividade, Agilidade, Carisma, Planejamento
**Skills:** Arrombamento, Fuga, Disfarce, Negociação no Crime, Vigilância

#### 🏥 Médico
Profissão neutra com escolha de alinhamento. Curandeiro indispensável do ecossistema.

**Progressão:**
```
Nível 1–5:    Pronto-socorro (idle, atende NPCs)
Nível 6–15:   Clínico geral
Nível 16–30:  Especialista
Nível 31–50:  Cirurgião
Nível 51–80:  Médico de campo
Nível 81+:    Dono de hospital
```
**Atributos primários:** Inteligência, Precisão, Empatia, Carisma
**Skills:** Cirurgia, Primeiros Socorros, Farmacologia, Diagnóstico, Medicina de Campo

---

## 4. SISTEMA DE ALINHAMENTO DO MÉDICO

### Três Alinhamentos

| | Médico do Mal | Médico do Bem | Médico Neutro |
|---|---|---|---|
| **Recompensa financeira** | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Ganho de skill** | ★★★☆☆ | ★★★★★ | ★★★★☆ |
| **Penalidade por morte** | Alta (+20%) | Baixa (-40%) | Base |
| **Visibilidade para o bem** | Alta | — | Baixa |
| **Pode ser atacado pelo bem** | Sim | Não | Não |
| **Pode ser atacado pelo mal** | Não | Sim | Não |
| **Desconto em consulta (paciente do mal)** | Sim (20%) | Não | Não |
| **Buff extra a paciente do mal** | Sim | Não | Não |

### Mudança de Alinhamento — Punição Pesada

```
custo_base = nível² × 1.000 gold
custo_total = custo_base + (50% do patrimônio total)
patrimônio = goldHand + goldBank + valor estimado dos itens equipados

Premium: 30% de desconto no custo total
Cooldown pós-mudança: 30 dias (Premium: 20 dias)
Período de adaptação: 48h (Premium: 24h)
  → Durante adaptação: alinhamento antigo ainda visível, vulnerável a ambos os lados

Se NÃO tiver gold suficiente:
  Free:    volta ao nível 1, gold zerado, mantém itens
  Premium: volta ao nível 10, gold zerado, mantém itens
```

---

## 5. ATRIBUTOS E SKILLS

### Atributos (sobem com nível)
A cada nível: pontos automáticos por profissão + pontos livres para o jogador distribuir.

| Atributo | Policial | Ladrão | Médico | Efeito |
|---|---|---|---|---|
| Força | Alto | Médio | Baixo | Dano físico, resistência |
| Agilidade | Médio | Alto | Baixo | Fuga, crítico |
| Inteligência | Médio | Médio | Alto | Eficiência de skill e buff |
| Autoridade | Alto | Baixo | Baixo | Operações, liderança |
| Furtividade | Baixo | Alto | Médio | Evasão, detecção |
| Carisma | Médio | Alto | Alto | Negociação, preço de serviços |
| Precisão | Alto | Médio | Alto | Acerto, qualidade cirúrgica |
| Investigação | Alto | Baixo | Médio | Rastrear alvos |

### Skills (sem cap — retorno decrescente)
Sobem pelo uso em missões e por treino dedicado online ou idle.

```
Treino Online:        100% da taxa base
Treino Offline free:  70% da taxa base
Treino Offline premium: 85% da taxa base

Curva: Skill 1–10 (minutos) → 10–50 (horas) → 50–100 (dias) → 100+ (semanas, retorno decrescente)
```

---

## 6. ÁRVORE DE TALENTOS

Pontos de talento a cada 10 níveis. Reverter talento tem custo alto em Gold ou Créditos.

### Exemplo — Policial
```
LINHA COMBATE
[Tiro Preciso +10%] → [Tiro Rápido +15% vel.] → [Atirador de Elite +25% crítico]

LINHA INVESTIGAÇÃO
[Farejador: acha pistas] → [Detetive: revela localização] → [Perfil Criminal: prevê ação]

LINHA LIDERANÇA
[Coordenador +10% EXP party] → [Comandante +20%] → [Herói da Lei: Top 5 com bônus defesa]
```

### Exemplo — Ladrão
```
LINHA FURTIVIDADE
[Passos Suaves -10% detecção] → [Sombra -25%] → [Fantasma: imune a rastreio 2h/dia]

LINHA LUCRO
[Negociante +15% roubos] → [Atravessador: ponto de venda fixo] → [Cartel: % passivo de vendas]

LINHA VIOLÊNCIA
[Intimidação: alvo não reage 20%] → [Executador +30% dano] → [Assassino de Aluguel: contratos]
```

### Exemplo — Médico (incluindo talentos de buff)
```
LINHA EFICIÊNCIA
[Diagnóstico Rápido: cura 20% mais rápida] → [Triagem: 2 pacientes simultâneos] → [Milagre: 5% cura instantânea]

LINHA ESPECIALIZAÇÃO
[Traumatologista: -30% penalidade morte do paciente] → [Cirurgião de Guerra: recupera item 15%] → [Lenda: reverte retrocesso 5%]

LINHA BUFFS (desbloqueiam slots e melhoram progressão)
[+1 Slot de Buff (Tier Comum)]
  → [Melhoria Acelerada: +0,05% por nível na progressão automática de buff]
  → [Progressão Dupla: 2 buffs recebem progressão automática por nível]
     → [+1 Slot de Buff (Tier Incomum)]
           → [Progressão Tripla: 3 buffs recebem progressão por nível]

LINHA ALINHAMENTO (exclusiva — um ou outro)
[Código de Ética: +50% skill, imunidade a ataque]
OU
[Medicina das Sombras: +80% financeiro, invisível para o bem]
```

---

## 7. SISTEMA DE STAMINA

Stamina governa missões de stage, ataques PvP organizados e ativação de atendimento médico.
Missões idle comuns **não consomem stamina**.

### Limites e Regeneração

| | Free | Premium |
|---|---|---|
| Stamina máxima | 10/dia | 20/dia |
| Regeneração | 1 a cada 2,4h | 1 a cada 1,2h |

### Custo por Ação
- Missão de stage (qualquer dificuldade): **1 stamina por tentativa**
- Ataque organizado PvP: 1 stamina
- Ativar atendimento médico: 1 stamina
- Aceitar contrato de assassinato: 1 stamina

### Item de Regeneração — Estimulante
- Restaura 2 stamina instantaneamente
- Comprado com Gold (preço = 500 × nível do personagem) ou Créditos (5 Créditos fixo)
- Limite diário: 3 compras (Free) / 6 compras (Premium)

---

## 8. MISSÕES

### 8.1 Missões Idle (sem stamina)
Executadas continuamente offline. O jogador seleciona antes de sair e o personagem repete até nova instrução.

**Cap offline:**
- Free: 12 horas acumuladas
- Premium: 24 horas acumuladas

### 8.2 Missões com Stages

Estruturadas em waves automáticas com boss final. O jogador assiste à progressão — não há clique entre stages. Custa **1 stamina por tentativa**, independente da dificuldade.

#### Estrutura
```
Stage 1 (wave) → Stage 2 (wave) → Stage 3 (wave) → Stage Boss
```

#### Inimigos
Cada stage apresenta 3–4 tipos de inimigos com fraquezas e resistências, selecionados proporcionalmente ao poder do personagem ou party.

#### Modos de Dificuldade
| Modo | Stamina | Recompensa | Penalidade de falha |
|---|---|---|---|
| Fácil | 1 | ×1.0 | Perde stamina |
| Intermediário | 1 | ×1.5 | Stamina + 5% gold em mãos |
| Difícil | 1 | ×2.5 | Stamina + 10% gold + durabilidade |
| Muito Difícil | 1 | ×4.0 | Stamina + 15% gold + chance de perda de item |

#### Execução em Sequência (Enfileiramento)
O jogador pode enfileirar múltiplas execuções da mesma missão de stage:
- **Free:** até 3 execuções em sequência
- **Premium:** até 10 execuções em sequência

Cada execução consome 1 stamina. Se ficar sem stamina no meio da fila, as execuções restantes são canceladas automaticamente.

### 8.3 Tipos de Missão por Profissão

**Policial:**
- Rotina (idle) — blitz, patrulha
- Investigação (idle com intervenção ocasional)
- Operação (stages com boss) — consome stamina

**Ladrão:**
- Crime simples (idle)
- Assalto (chance de encontro PvP em missão idle)
- Planejado (stages com boss) — consome stamina
- Contrato de assassinato — consome stamina

**Médico:**
- Plantão (idle — atende NPCs)
- Atendimento Particular (ver seção 10) — consome stamina
- Missão de campo (acompanha party)

### 8.4 Encontro em Missão (PvP automático)
Quando policial e ladrão fazem missão na mesma área, o servidor pode calcular um encontro:

```
Policial: Investigação + Autoridade + Força + equipamento + party
Ladrão:   Furtividade + Agilidade + Planejamento + equipamento + party

Diferença > 15: vitória total
Diferença 5–14: vitória parcial (perdedor foge, perde recursos)
Diferença < 5:  empate
```

---

## 9. SISTEMA DE PARTY

### Composição e Liderança

**Party entre players:**
- Máximo 3 membros
- Quem **envia o convite** é o líder
- Líder escolhe a missão; demais aceitam ou recusam
- Bônus: +30% EXP e recursos para todos

**Party solo (personagens da mesma conta):**
- O **primeiro personagem criado** na conta é sempre o líder da party solo
- Líder escolhe a missão; os demais personagens da conta entram automaticamente sem precisar aceitar
- Composição de party é livre — o jogador decide quais personagens participam e quais ficam solo

**Exemplos de composição livre:**
```
Conta com Policial(1), Policial(2), Médico:
  → Party: Policial(1) + Médico. Policial(2) solo.
  → Party: Policial(1) + Policial(2). Médico solo.
  → Party: todos os três juntos.
  → Todos solos, cada um em sua missão.
```

### Bônus por Composição

| Composição | Bônus |
|---|---|
| 3 players reais diferentes | +30% EXP e recursos |
| 2 players reais + 1 personagem da mesma conta | +20% EXP e recursos |
| 1 player real + 1 personagem da mesma conta | +10% EXP e recursos |
| Solo com personagem da mesma conta | Nenhum bônus — apenas poder combinado |

**Regra:** máximo 1 Médico por party em qualquer composição.

---

## 10. ATENDIMENTO PARTICULAR — MÉDICO

### Ativação
O médico entra em modo Atendimento Particular (consome 1 stamina). Fica bloqueado de outras missões enquanto ativo. Define:
- Valor da consulta (gold fixo + % opcional do patrimônio do paciente)
- Duração disponível (30min a 4h)

### Listagem Pública
Tela acessível a qualquer player:

```
┌──────────────────────────────────────────────────────────┐
│ MÉDICOS DISPONÍVEIS                    [⭐ Meus Favoritos]│
├──────────┬─────────┬────────────────────┬────────────────┤
│  Médico  │  Nível  │  Buffs disponíveis │     Preço      │
├──────────┼─────────┼────────────────────┼────────────────┤
│  ????    │   47    │ +8% HP Max, Regen  │  2.500 gold    │
│  ????    │   63    │ +12 FOR, +Regen    │  5.000 gold    │
│  ????    │   31    │ +5% HP Max         │    800 gold    │
└──────────┴─────────┴────────────────────┴────────────────┘
```

- Nome **sempre oculto** — qualquer alinhamento pode atender anonimamente
- Lista de Favoritos: revela o nome apenas para o player que favoritou, após pelo menos 1 consulta
- Busca por: nível, tipo de buff, faixa de preço

### Bônus de Alinhamento Correspondente
Se médico do mal atende paciente do lado do mal:
- 20% de desconto automático no valor
- Buff extra aleatório adicional (tier determinado pela skill do médico)
- O bônus não é exibido na listagem — revelado só após o atendimento

### Cooldown do Paciente
O cooldown de recontratação é **sempre maior que a duração máxima do buff recebido**, impedindo reposição contínua. Valores exatos definidos na calibragem de balanceamento.

---

## 11. SISTEMA DE BUFFS MÉDICOS

### Slots de Buff
O médico começa com **1 slot de buff** desbloqueado por padrão (gratuito, sem custo de talento).
Slots adicionais são desbloqueados via **Árvore de Talentos — Linha de Buffs**.

| Slot | Como desbloquear | Tier mínimo inicial |
|---|---|---|
| 1 | Gratuito (começa com ele) | Comum |
| 2 | Talento: +1 Slot de Buff | Comum |
| 3 | Talento: +1 Slot de Buff (Incomum) | Incomum |

### Aquisição de Buffs
O médico recebe buffs ao subir de nível. A progressão é baseada em limiares de nível que definem qual tier de buff pode ser obtido e evoluído:

```
Nível 1–19:   pode ter até 1 buff Comum
Nível 20–29:  pode ter até 1 Incomum + 1 Comum
Nível 30–39:  pode ter até 1 Raro + 1 Incomum + 1 Comum
              (ou 2 Incomuns + 1 Comum)
Nível 40–49:  pode ter até 1 Raro + 2 Incomuns + 1 Comum
              (requer Slot 3 desbloqueado)
Nível 50+:    pode ter até 1 Épico + composições variadas
```

A cada nível, o sistema tenta **melhorar automaticamente** os buffs existentes:
- 0,1% de chance por nível de melhorar um buff (dentro do range do tier atual)
- Prioridade para buffs de tier menor — Comum melhora antes de Incomum
- Quando um buff atinge o valor máximo do tier e o nível mínimo do próximo tier é atingido: chance de evolução de tier

**Talentos que afetam a progressão:**
- "Melhoria Acelerada": aumenta a chance por nível de 0,1% para 0,15%
- "Progressão Dupla": 2 buffs recebem a tentativa de melhoria por nível (em vez de 1)
- "Progressão Tripla": 3 buffs recebem a tentativa por nível

### Tiers e Ranges de Valor

| Tier | HP Max % | Nível mínimo para ter |
|---|---|---|
| Comum | +3% a +5% | 1 |
| Incomum | +6% a +10% | 20 |
| Raro | +11% a +18% | 30 |
| Épico | +19% a +30% | 50 |

### Tipos de Buff Disponíveis
- % HP Máximo
- Regeneração de HP por hora
- +X em atributo específico
- Redução de penalidade de morte
- +% Gold nas próximas N missões
- +% EXP nas próximas N missões
- Redução de stamina na próxima missão de stage
- Escudo contra perda de item na próxima morte

### Scrolls (Moeda Premium)

**Scroll de Rerolar:**
- Substitui o valor atual de um buff por um novo valor aleatório do mesmo tier (20% de chance de subir de tier)
- Limite: 2 scrolls de qualquer tipo por dia por personagem

**Scroll de Amplificação:**
- Aumenta o valor do buff dentro do range do tier atual
- Se já no máximo do tier: 15% de chance de subir para o próximo tier
- Limite: compartilhado com o de rerolar (2/dia total)

---

## 12. PvP E SISTEMA DE VINGANÇA

### Proteção de Novatos
Contas com menos de 7 dias não podem ser alvo de ataque PvP iniciado. Podem atacar e defender livremente.

### Ataque Organizado
Condições para atacar um player específico:
1. Alvo em missão ativa
2. Dentro de janela de vingança ativa, OU alvo no Top 5 Hunted
3. Custo: 1 stamina

### Sistema de Vingança
```
Janela: 72 horas após o evento que gerou o direito
Tentativas: 1 (independente do resultado)
Sem cascata: vingança bem-sucedida não gera novo direito para o outro lado
Novo evento independente: abre nova janela de 72h
```

---

## 13. SISTEMA HUNTED — TOP 5

Ranking semanal dos 5 players mais efetivos por profissão:
- **Top 5 Policial:** capturas, EXP em operações
- **Top 5 Ladrão:** valores roubados, crimes concluídos

**Bônus de estar no Top 5:** +15% em todos os resultados de missão

**Risco:** qualquer player pode atacá-los sem precisar de vínculo de vingança

**Personagem preso não sai do Top 5** — mas fica imune a ataques enquanto detido (ver seção 14).

### Resolução de Ataque a Hunted — D&D Adaptado
```
Atacante: Investigação + Inteligência + talentos
Alvo:     Furtividade + Agilidade + talentos

Investigação > Furtividade + 10: confronto confirmado
Investigação > Furtividade:      alvo recebe alerta — pode fugir
Investigação ≤ Furtividade:      falha — alvo é notificado da tentativa
```

---

## 14. SISTEMA DE PRISÃO

### Quando um Personagem é Preso
- **Ladrão:** capturado por policial em missão ou operação
- **Policial corrupto:** descoberto com corrupção acima do limiar (Fase 2)
- **Médico do mal:** descoberto pelo lado do bem (probabilidade proporcional à visibilidade acumulada)

### Estado de Prisão
Enquanto preso, o personagem:
- Está **completamente bloqueado** — nenhuma missão, nenhum progresso de skill, nenhuma ação
- **Não pode sofrer ataques** — imunidade total a PvP, mesmo que esteja no Top 5 Hunted
- **Não acumula progresso offline** — o tempo de prisão é tempo perdido
- Pode ser visto por outros players como "Detido" na sua ficha pública (sem revelar a conta)

### Duração da Pena
```
tempo_base_horas = (nível_do_personagem × gravidade_do_crime) / 10

Gravidade:
  Crime leve (furto simples, primeira vez):          1
  Crime moderado (assalto, reincidente):             2
  Crime grave (assalto a banco, organização):        3
  Crime gravíssimo (assassinato, chefe do crime):    5

Exemplo:
  Ladrão nível 40 + assalto a banco (grav. 3):
  tempo = (40 × 3) / 10 = 12 horas de prisão

Premium: -20% no tempo de prisão
```

### Saída Antecipada por Propina

O preso pode tentar pagar propina para um **Delegado** (Policial nível 81+) para ser liberado antes do prazo.

#### Configuração do Delegado
O Delegado define antecipadamente se **aceita ou recusa propina**. Essa configuração é visível para o sistema mas não para o preso antes da tentativa.

#### Fluxo da Propina
```
1. Preso seleciona "Tentar pagar propina"
2. Sistema verifica se há Delegados disponíveis
3. Sistema seleciona um Delegado aleatório (ou o preso pode escolher da lista de Delegados ativos)
4. O valor da propina é calculado:
     propina = pena_restante_em_horas × nível × 1.000 gold (valor muito alto)
5. O gold é descontado do preso imediatamente (bloqueado em escrow)

6. Delegado ACEITA propina:
   → Preso é liberado imediatamente
   → Delegado recebe 5% do valor (restante some como ralo)
   → Influência do Delegado para o mal sobe
   → Outros policiais têm chance de descobrir (proporcional à corrupção acumulada do Delegado)
   → Debuff de Furtividade aplicado ao preso liberado (ver abaixo)

7. Delegado RECUSA propina (ou não há Delegados disponíveis):
   → Gold do escrow é perdido permanentemente (ralo total)
   → Tempo de prisão do preso aumenta em +50% do valor original
   → Preso recebe notificação: "Tentativa de propina recusada"
```

#### Debuff de Furtividade pós-liberação por propina
```
Duração: proporcional ao tempo de pena original
  pena < 6h:   debuff dura 2h  — Furtividade -30%
  pena 6–12h:  debuff dura 6h  — Furtividade -40%
  pena 12–24h: debuff dura 12h — Furtividade -50%
  pena > 24h:  debuff dura 24h — Furtividade -60%

Efeito: personagem é facilmente detectado em missões e encontros PvP
  → Qualquer policial encontra o preso liberado com rolagem muito menor
  → Se cometer crime dentro do prazo do debuff: +25% no próximo tempo de prisão
```

### Redução de Pena por Bom Comportamento
Mesmo sem pagar propina, o tempo pode ser reduzido marginalmente:
- Missões de "bom comportamento" NÃO estão disponíveis — o personagem está completamente bloqueado
- A única forma de redução ativa é via propina
- A pena corre em tempo real (offline também conta)

---

## 15. MORTE E PUNIÇÕES

### Penalidades Base
```
Nível 1–10:   -2% EXP e gold em mãos | sem retrocesso de nível
Nível 11–30:  -5% EXP e gold | pode retroceder nível
Nível 31–60:  -8% EXP e gold | retrocede nível | durabilidade de item reduzida
Nível 61–100: -10% EXP e gold | 5% chance de perder item equipado
Nível 100+:   -12% EXP e gold | 10% chance de perda de item equipado
```

Item perdido em PvP vai para o inventário do vencedor.

### Modificadores
| Situação | Modificador |
|---|---|
| Policial morto em serviço | -30% penalidade de EXP |
| Médico do bem morto | -40% em tudo |
| Médico do mal morto | +20% em tudo |
| Criminoso capturado → preso | gold apreendido vai para policial |
| Primeira morte do dia | -50% em tudo |

---

## 16. ECONOMIA E DUAS MOEDAS

### Gold (moeda interna)
- Obtida em missões, PvP, serviços médicos, vendas no mercado
- Circula entre jogadores via mercado, PvP, consultas, contratos
- Parcialmente perdida na morte e em taxas

### Créditos (moeda premium)
- Obtida com dinheiro real via gateway de pagamento
- Pode ser **vendida por outros players por gold** no mercado de créditos — o preço flutua livremente
- Nunca convertível em gold pelo sistema, apenas por transação entre players
- Usada para: scrolls, estimulantes, cosméticos, slots de personagem, vantagens premium

### Ciclo Econômico
```
[TORNEIRAS] Missões idle NPC, salário policial, seguro médico NPC
     ↓
[CIRCULAÇÃO] PvP, mercado, consultas médicas, contratos, propinas
     ↓
[RALOS] Morte, taxas de mercado, hospital NPC, banco, guild,
        propina recusada, mudança de alinhamento, slots de personagem
```

---

## 17. SISTEMA BANCÁRIO

### Banco Físico
Personagem vai até a agência (missão de deslocamento). Durante o percurso, chance de encontro PvP.
- Taxa de depósito: 0,5% some permanentemente
- Gold no banco nunca é perdido na morte

### Banco via Interface (menu)
Disponível sem deslocamento — conveniente mas caro.
- Taxa de depósito: 3%
- Taxa de saque: 1%

### Vantagem Premium no Banco
A definir em momento posterior. Candidatos em análise:
- Taxa reduzida no banco via interface
- Limite maior de saldo bancário
- Proteção de gold contra apreensão

---

## 18. SISTEMA DE GUILD

### Criação
- Nível mínimo do fundador: a definir após calibragem
- Custo em Gold: a definir após calibragem econômica
- Tag obrigatória: 3–4 letras únicas

### Progressão de Rank

| Rank | Nome | Membros | Bônus | Custo |
|---|---|---|---|---|
| 1 | Beco | 10 | — | — |
| 2 | Facção | 20 | +2% EXP | Gold + itens Incomuns |
| 3 | Organização | 35 | +5% EXP, +2% recursos | Gold + itens Raros |
| 4 | Império | 50 | +8% EXP, +5% recursos | Gold + itens Épicos |
| 5 | Lenda | 75 | +12% EXP, +8%, título | Gold + itens Lendários |

### Arsenal da Guild
Itens doados por membros ficam disponíveis para empréstimo com aprovação do líder. Item perdido na morte durante empréstimo retorna ao arsenal com durabilidade reduzida.

### Guild Mista de Alinhamento
Policiais e Ladrões **não podem estar na mesma guild**. Médicos podem estar em qualquer guild.

---

## 19. SEGURANÇA, LGPD E SESSÃO ÚNICA

### Dados Coletados e Base Legal (LGPD)

| Dado | Finalidade | Base Legal | Retenção |
|---|---|---|---|
| E-mail | Autenticação, recuperação | Legítimo interesse / Contrato | Enquanto conta ativa + 90 dias |
| CPF (hash) | Unicidade de conta, prevenção de fraude | Legítimo interesse | Enquanto conta ativa + 5 anos |
| IP de login | Segurança, anti-fraude | Legítimo interesse | 90 dias |
| User-agent | Segurança | Legítimo interesse | 90 dias |
| Progresso de jogo | Funcionalidade do serviço | Contrato | Enquanto conta ativa |
| Logs econômicos | Auditoria e integridade | Obrigação legal | 5 anos (imutável) |

**O CPF nunca é armazenado em texto plano** — apenas seu hash SHA-256 com salt é guardado, suficiente para verificar unicidade sem possibilidade de reverter ao número original.

### Direitos do Titular (LGPD Art. 18)
- **Acesso:** `GET /api/account/my-data` — JSON com todos os dados do titular
- **Correção:** e-mail pode ser alterado via fluxo verificado
- **Exclusão:** deleta dados pessoais, anonimiza logs econômicos (preserva integridade da auditoria)
- **Portabilidade:** export em JSON estruturado
- **Revogação de consentimento:** encerra conta e agenda exclusão em 30 dias

### Sessão Única por Conta
Ao fazer login em qualquer dispositivo, **todos os tokens de sessão anteriores são invalidados imediatamente**. O dispositivo anterior recebe uma notificação de encerramento de sessão via WebSocket antes de ser desconectado.

```typescript
async function loginAndInvalidatePreviousSessions(userId: string) {
  // Buscar todas as sessões ativas
  const existingSessions = await db.session.findMany({ where: { userId } });

  // Notificar dispositivos conectados via WebSocket antes de invalidar
  for (const session of existingSessions) {
    await redis.publish(`session:${session.id}:terminate`,
      JSON.stringify({ reason: 'NEW_LOGIN', message: 'Sessão encerrada — novo login detectado' })
    );
  }

  // Invalidar todas as sessões existentes
  await db.session.deleteMany({ where: { userId } });
  await redis.del(existingSessions.map(s => `session:${s.id}`));

  // Criar nova sessão
  return createNewSession(userId);
}
```

### Verificação de CPF
- API de validação de CPF na Receita Federal (via BrasilAPI ou similar)
- CPF verificado na criação da conta e nunca reutilizado
- CPF banido (conta banida) não pode criar nova conta

### Proteção de Dados Sensíveis
- Senhas: bcrypt com cost 12+
- CPF: SHA-256 com salt único por conta
- HTTPS obrigatório em todos os endpoints
- Headers de segurança: HSTS, CSP, X-Frame-Options, Referrer-Policy
- Dados de pagamento: nunca armazenados — processados diretamente pelo gateway (PCI-DSS)

---

## 20. ALINHAMENTO FLUIDO — FASE 2

*Documentado agora para garantir suporte na arquitetura; implementado na Fase 2.*

### Policial Corrupto
- Aceita propina, vaza informação, ignora crimes
- Barra de corrupção oculta que sobe a cada ato corrupto
- Se descoberto: processo julgado por **NPC Juiz** com RNG proporcional à corrupção acumulada
- Punições possíveis: prisão (cumpre a mesma mecânica da seção 14), confisco de %, perda de nível de cargo

### Ladrão Delator
- Entrega informação de outro ladrão à polícia em troca de proteção temporária
- Reputação no crime despenca — outros ladrões podem atacá-lo livremente
- Proteção policial temporária + redução da pena ativa (se preso)

---

## 21. TERRITÓRIO E GUERRA — FASE 2

*Arquitetado agora, implementado na Fase 2.*

Mapa dividido em regiões disputadas por guilds. Controle garante bônus passivos e % das transações da região. Guerra semanal em horário fixo.

---

## 22. DIREÇÃO VISUAL

### Estilo: GTA Clássico Top-Down
Perspectiva top-down, pixel art urbano, mapa de cidade com ruas, quarteirões, edifícios e estabelecimentos. Sprites de personagem expressivos em 32×32.

### Ferramentas de IA para Geração de Assets

| Ferramenta | Uso | Observação |
|---|---|---|
| Midjourney | Concept art e referências | Melhor qualidade para direção visual inicial |
| Leonardo.ai | Sprites pixel art consistentes | Modelos treinados em pixel art |
| Kling AI | Animações a partir de sprites | Gera frames de animação |
| Aseprite | Refinamento e animação final | Software padrão para pixel art |
| Stable Diffusion + ControlNet | Geração em batch de variações | Mais flexível, requer setup local |

**Fluxo recomendado:**
```
1. Definir estilo base com Midjourney (3–5 referências aprovadas)
2. Gerar sprites base com Leonardo.ai usando as referências como guia
3. Refinar e animar no Aseprite (~20–30% do esforço de criar do zero)
4. Claude gera descrições detalhadas de cada asset para alimentar os prompts
```

---

## 23. ROADMAP

### Fase 0 — Fundação (2–3 semanas)
- [ ] Monorepo (Next.js + Fastify + Prisma)
- [ ] Docker local (PostgreSQL + Redis)
- [ ] Auth com CPF único, sessão única e proteção de novatos (7 dias)
- [ ] Schema de banco completo
- [ ] Sistema de duas moedas

### Fase 1 — MVP Core (6–8 semanas)
- [ ] Slots de personagem com compra por Gold e Créditos
- [ ] Composição de conta por facção
- [ ] Atributos, skills (sem cap) e treino idle
- [ ] Missões idle (cap 12h/24h)
- [ ] Sistema de stamina com enfileiramento de stages
- [ ] Missões de stage com 4 dificuldades
- [ ] Sistema de prisão com propina e Delegado
- [ ] Debuff de furtividade pós-propina
- [ ] Morte, penalidades e retrocesso de nível
- [ ] Alinhamento do médico e punição de mudança
- [ ] Buffs médicos com slots e progressão automática
- [ ] Atendimento Particular com listagem anônima
- [ ] Scrolls de buff (moeda premium)
- [ ] Mercado de itens e de Créditos
- [ ] Sistema bancário (físico + interface)
- [ ] UI responsiva estilo GTA top-down

### Fase 1.5 — Social e PvP (3–4 semanas)
- [ ] Lista de amigos e convites
- [ ] Party livre (players e personagens da conta)
- [ ] Encontro em missão (PvP automático)
- [ ] Ataque organizado com stamina
- [ ] Sistema de vingança (72h, 1 tentativa)
- [ ] Guild básica (rank 1–2)
- [ ] Top 5 Hunted com sistema D&D

### Fase 2 — Profundidade (ongoing)
- [ ] Árvore de talentos completa
- [ ] Missões nível 31–80+
- [ ] Guild rank 3–5 + arsenal
- [ ] Alinhamento fluido (policial corrupto, delator, NPC Juiz)
- [ ] Território e guerra semanal
- [ ] Gateway de pagamento (após POC e CNPJ)

---

## 24. DECISÕES PENDENTES

### Alta Prioridade

**D-001: Valores de custo dos slots de personagem**
Depende de calibragem da curva de progressão. O valor em Gold deve ser alto mas alcançável — requer simulação após Fase 1 funcional.

**D-002: Vantagem premium no banco**
Candidatos: taxa reduzida na interface, limite maior de saldo, proteção de gold contra apreensão.

**D-003: Nível mínimo e custo de criação de guild**
Depende de calibragem econômica pós-Fase 1.

### Média Prioridade

**D-004: Gateway de pagamento**
Pendente de POC e CNPJ. Candidatos: Stripe + Mercado Pago.

**D-005: Valores de calibragem econômica**
Custo de missões NPC, preço base de stimulante por nível, taxas de propina — todos dependem de simulação.

**D-006: Duração dos buffs médicos e cooldown de recontratação**
Cooldown deve ser sempre maior que a duração máxima do buff. Valores exatos na calibragem.

**D-007: Serviço de validação de CPF**
BrasilAPI (gratuita, sem garantia de SLA) ou serviço pago com SLA (Serpro, DataValid). Impacta custo operacional e confiabilidade do registro.
