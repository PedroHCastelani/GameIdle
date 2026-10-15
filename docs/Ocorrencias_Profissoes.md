# Ocorrências e decisões por profissão — R-006 e R-007

Disponível na aba **Ocorrências**, a partir do nível 2. São quinze situações, com duas abordagens cada: nove ocorrências iniciais e seis continuidades. Permanecem disponíveis após o final da campanha.

| Profissão | Nível 2 | Nível 3 | Nível 4 |
|---|---|---|---|
| Policial | Alarme na feira | Estação em alerta | Manifesto adulterado |
| Ladrão | A galeria fechada | Entrega pelos telhados | Convite para o leilão |
| Médico | Mutirão na praça | Apagão na clínica | Bairro alagado |

Cada abordagem tem descrição, poder necessário, recompensa e desfecho próprios. Nas nove ocorrências iniciais, a primeira prioriza EXP e exige menos poder; a segunda prioriza gold e exige mais poder. Por exemplo, ouvir testemunhas rende 40 gold/140 EXP e exige poder 22; rastrear a carga rende 120 gold/60 EXP e exige poder 32. No nível 3, os pares são 70/210 (poder 34) e 180/100 (poder 46); no nível 4, 100/300 (poder 48) e 260/150 (poder 64).

## Regras e persistência

- Selecionar uma abordagem não a executa: confirmar mostra explicitamente o custo de 1 stamina. Falha também custa 1 stamina, não concede recompensas e tem aviso antecipado quando o poder é insuficiente.
- Há intervalo global de 60 segundos por personagem entre tentativas de ocorrências, incluindo falhas. Campanha e idle permanecem disponíveis.
- Profissão, nível, propriedade, liberdade, stamina, poder, valores e relógio são validados no servidor. Uma transação com bloqueio do personagem serializa gastos, recompensa e histórico.
- O mesmo requestId repete o resultado sem novo gasto. Reutilizar o identificador para outra ocorrência/abordagem é rejeitado. Requisições diferentes concorrentes respeitam o intervalo.
- Diário mostra as cinco operações mais recentes, incluindo a abordagem e seu desfecho. Todos os registros permanecem no banco. Resultados antigos de campanha continuam legíveis.
- Não altera os capítulos concluídos, a missão idle ativa, os equipamentos nem o esquema do banco. O seed adiciona definições STAGE com prefixo mvp_encounter_. Execute `pnpm db:seed` ao atualizar.
- API: POST `/api/characters/:id/encounter`, autenticado, corpo estrito `{encounterId, choiceId, requestId}`. GET `/api/game` fornece as ocorrências da profissão e o intervalo restante.

## Limites de design

A escolha muda recompensas, especialização e acesso às continuidades; não altera permanentemente a cidade, a facção nem o final da campanha. As profissões possuem situações, etapas e decisões temáticas distintas, mas compartilham a resolução determinística por poder. Os dois caminhos podem ser desenvolvidos. Exclusividade de facções, consequências negativas permanentes e balanceamento de longo prazo permanecem futuros.

## Validação

69 testes aprovados (50 API e 19 UI/cliente), lint e types. Integração em PostgreSQL executa todas as 18 abordagens, confere valores exatos, história, repetição, concorrência, falha, nível, propriedade, profissão e stamina. UI valida escolha explícita, comparação de recompensas, aviso de falha, bloqueios, contagem regressiva e repetição após perda de resposta.

Playtest pela interface na conta fictícia Doutora Aurora, sem modificar saldo/relógio: Conduzir a prevenção acrescentou exatamente 40 gold e 140 EXP, stamina de 10 para 9 e bloqueio imediato de 60 segundos. O personagem já havia concluído a campanha, preservada em 3/3.
Após o intervalo real, Assumir a unidade móvel acrescentou exatamente 120 gold e 60 EXP, stamina de 9 para 8. Recarregar a página preservou ambas as decisões no diário e a campanha em 3/3; a produção idle continuou independente.

## Consequências na progressão — R-007

Cada par ocorrência/abordagem concluído com sucesso concede um ponto de especialização uma única vez. Cada ponto adiciona +3 de poder somente às abordagens da mesma área; o poder da campanha e as taxas idle não mudam. Falhas, reenvios e repetições não concedem pontos. Repetir ainda rende gold/EXP e custa stamina. Com o conteúdo atual, cada área permite cinco pontos (+15 poder).

| Profissão | Especialização e continuidade A | Especialização e continuidade B |
|---|---|---|
| Policial | Investigação → A rede de testemunhas | Operações → A rota dos depósitos |
| Ladrão | Informação → Os nomes do catálogo | Aquisição → A encomenda do colecionador |
| Médico | Cuidado comunitário → O retorno das famílias | Resposta emergencial → A rede de plantões |

A primeira/segunda escolha da ocorrência de nível 2 libera, respectivamente, a continuidade A/B. Ambas exigem nível 4. A abordagem inicial exige um ponto na área e poder 60, rendendo 140 gold/260 EXP; a avançada exige dois pontos e poder 80, rendendo 240 gold/360 EXP. Concluir a inicial é uma forma de obter o segundo ponto; outras decisões inéditas da mesma especialização também contam. Todos os requisitos são cumulativos e validados na transação antes de qualquer gasto.

O painel mostra especialização, bônus aplicado, primeiro sucesso/repetição e motivo de bloqueio antes da confirmação. O servidor deriva a progressão de todos os StageAttempts bem-sucedidos com decisão válida, e não apenas dos cinco itens do Diário. Escolhas históricas de R-006 contam retroativamente, sem pagar recompensas novamente. Não há migration: o seed acrescenta seis definições estáveis. Não apagar o histórico de tentativas, pois ele é a fonte dessa progressão.

GET /api/game inclui specializations e, em cada abordagem, expertise, bonus, effectivePower, completed, unlocks e lockReason. O POST continua aceitando somente identificadores; o cliente não escolhe pontos nem bônus.

Os testes percorrem os dois caminhos nas três profissões, bloqueios antes das escolhas, desbloqueio da abordagem avançada, falha sem progressão, persistência além dos cinco registros visíveis, repetição, concorrência e bônus efetivo (poder base 58 + bônus 3 vence exigência 60).

### Playtest R-007 — 2026-10-15

Na interface local, Doutora Aurora entrou com um ponto em Cuidado comunitário proveniente do histórico. O retorno das famílias estava disponível, mas Expandir o programa para o bairro exigia dois pontos, mesmo com nível 45. Criar o acompanhamento local rendeu exatamente 140 gold/260 EXP, consumiu uma stamina (7 → 6), elevou a especialização a dois pontos (+6 poder) e liberou a abordagem avançada. O intervalo de 60 segundos impediu a confirmação imediata.

Após o intervalo real, a expansão rendeu 240 gold/360 EXP, consumiu uma stamina (6 → 5) e elevou a especialização a três pontos (+9 poder). Recarregar preservou os pontos, ambas as escolhas concluídas, os desbloqueios e a campanha em 3/3. A coleta automática de produção offline no reload continuou independente. Não foram alterados saldo, relógio ou stamina para esse teste. Os demais caminhos foram exercitados pelos testes automatizados de integração.
