# Estado do projeto — 15/10/2026

## Fonte de verdade

`TASKS.md` contém IDs, status e evidências de entrega. O GDD define as regras de produto; o Blueprint define a ordem de implementação. Exemplos históricos não são código pronto. Em conflito, registrar a decisão e atualizar os documentos envolvidos antes de implementar.

## Ponto de partida verificado

Master d3384b1: monorepo, Docker, 47 modelos Prisma, migration inicial, seed, rotas de exemplo/saúde e página inicial. Não havia autenticação, missões executáveis ou interface jogável. O único teste era uma asserção constante. CI falhava na geração/importação do Prisma Client; build e Sonar eram pulados. Deploys eram placeholders. Não há comprovação de aprovação, staging ou sincronização do Notion.

## Incremento inicial R-003 (histórico)

Ordem: reconciliar documentos → corrigir CI/testes → conta e sessão → personagem único → missão idle → coleta persistente e idempotente → UI integrada.

Este incremento não equivale à conclusão integral de T-010 a T-018. Não habilita lançamento público: e-mail transacional, verificação de identidade, recuperação de senha, direitos do titular, WebSocket, inventário, pagamentos, arte e revisão externa continuam pendentes. O servidor deve recusar habilitar o protótipo em produção. O protótipo não coleta CPF: usa uma identidade sintética interna incompatível com cadastro público. Contas de teste devem ser descartadas antes de lançamento.

## Decisões consolidadas

- D-002 é custo/nível de guild; D-003 é vantagem premium do banco.
- CPF: validação matemática não prova titularidade. BrasilAPI não é considerada integração validada; D-007 reaberta até prova de endpoint/contrato e finalidade. Para unicidade futura, usar identificador determinístico HMAC-SHA-256 com chave secreta fora do banco e normalização, com estratégia de rotação; salt aleatório por cadastro não resolve busca de duplicados.
- Credenciais do protótipo: scrypt com salt aleatório para senha; JWT curto em memória; refresh aleatório em cookie HttpOnly com hash no banco, rotação e sessão única serializada por conta. Operações com cookie exigem Origin permitido.
- Party: três contas = 30%; três personagens de duas contas = 20%; dois personagens de duas contas = 10%; uma conta = 0%.
- Stamina: free 1/2,4h, teto 10; premium 1/1,2h, teto 20. Preservar frações de tempo.
- Propina recusada: acréscimo de 50% da pena original. Débito, resultado e logs numa transação; sem delegado não inventar referência de personagem.
- Buffs comuns de HP: 3–5%; incomuns exigem nível 20. Probabilidade de melhoria de 0,1% por nível permanece hipótese de design, não balanceamento validado.
- Idle do protótipo: ciclos completos, limites 12h/24h, relógio do servidor, gold médio determinístico do intervalo da missão, EXP base, curva provisória `100 × nível²` de EXP acumulada para o próximo nível. Em R-003, skills, bônus, RNG e drops ficaram fora. R-005 acrescenta prática, poder por equipamento e drops determinísticos conforme MVP_Local.md.
- Créditos e premium não são vendidos nem ativados pela interface do protótipo. Vantagens competitivas do GDD precisam de revisão antes de monetização.

## Critérios de aceite do incremento

Cadastro/login, rejeição de credenciais inválidas, sessão anterior inválida após novo login, rotação de refresh, logout, criação de um personagem, missão compatível com profissão/nível, coleta somente pelo dono. Coletas concorrentes não duplicam gold/EXP/logs; consultas frequentes preservam ciclos parciais; período acima do cap é descartado; troca de missão liquida a anterior atomicamente. Personagem preso não recebe progresso.

Validação: testes reais via Fastify e PostgreSQL, lint, types, build e CI. Não declarar Sonar, revisão humana, staging ou Notion aprovados sem evidência externa.

Entrega proposta no [PR #6](https://github.com/PedroHCastelani/GameIdle/pull/6). O segredo SONAR_TOKEN foi configurado e usado com sucesso em 15/10/2026. O primeiro gate com cobertura apontou 74,8%; após R-004, Validate e SonarCloud passaram no commit 49e3380 com 96,5% de cobertura no código novo. Evidências e limites em [Validação do incremento](Validacao_2026-10-15.md). Revisão e merge continuam pendentes.

R-004 acrescenta confirmação de e-mail e recuperação de senha, com códigos de uso único, expiração, reenvio limitado e revogação de sessões. Inclui painel integrado, migration aditiva account_tokens e entrega exclusiva numa caixa local de arquivos. São 39 testes (30 API e 9 UI/cliente HTTP). Ainda faltam provedor real/fila de envio, verificação obrigatória antes de jogar publicamente, identidade/antifraude e direitos do titular. T-010 integral permanece aberta.

## Estado atual — R-005: MVP local jogável

Escopo explicitamente escolhido: MVP local completo e teste como jogador, sem publicação online. Implementados três caminhos com missões próprias, progressão por nível/prática, compra/equipamento/venda, drops de suprimentos e campanha de três operações com stamina e recompensa única. A migration local_campaign é aditiva. Dados antigos e missões anteriores são preservados.

O loop completo foi jogado como Médica pela interface; as três profissões têm cobertura de integração. São 51 testes (38 API, 13 UI/cliente). Validate e SonarCloud passaram em 2748538, cobertura nova 97,2%. Detalhes e limitações em [MVP_Local.md](MVP_Local.md), [Playtest_MVP_2026-10-15.md](Playtest_MVP_2026-10-15.md) e [Validacao_2026-10-15.md](Validacao_2026-10-15.md). A Fase 1 integral, publicação, revisão e merge não estão concluídos.

## R-006 — expansão de decisões

Nove ocorrências repetíveis, com 18 abordagens temáticas e consequências em poder necessário, gold/EXP e relato persistido. Aba Ocorrências com comparação, confirmação de custo e intervalo de 60 segundos; Diário registra decisões. Seed aditivo, sem migration ou reinício do progresso. 63 testes aprovados. Escopo e evidências em [Ocorrencias_Profissoes.md](Ocorrencias_Profissoes.md). A resolução continua determinística; não há simulação permanente de consequências na cidade.

## R-007 — consequências persistentes

Seis especializações temáticas e seis missões de continuidade. Decisões bem-sucedidas inéditas dão pontos, bônus de poder por área e acesso às próximas missões. 69 testes (50 API e 19 UI), incluindo ambos os caminhos das três profissões e bônus alterando resultado. Detalhes em [Ocorrencias_Profissoes.md](Ocorrencias_Profissoes.md).
