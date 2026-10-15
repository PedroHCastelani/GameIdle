# Ocorrências e decisões por profissão — R-006 a R-008

## Personagens e acontecimentos — R-008

| Profissão | Personagem | Encontro | Acontecimento seguinte |
|---|---|---|---|
| Policial | Helena, representante dos comerciantes | A assembleia da feira | A noite do mercado |
| Ladrão | Íris, intermediária da galeria | O acordo de Íris | O leilão das máscaras |
| Médico | Rosa, agente comunitária | O conselho de Rosa | O abrigo da tempestade |

Os dois episódios exigem nível 5. Concluir a abordagem inicial de qualquer uma das duas continuidades libera o encontro; o convite reconhece qual trabalho anterior foi feito. Firmar qualquer compromisso no encontro libera o acontecimento seguinte. Parceria mobiliza a rede do personagem e soma +12 de poder às duas abordagens desse acontecimento. Autonomia retira esse apoio, muda a reação e o relato, e acrescenta 80 gold ao contrato direto. Esses efeitos aparecem antes da confirmação e são calculados novamente pelo servidor dentro da transação.

O encontro exige poder 85 e paga 160 gold/380 EXP. No acontecimento, escuta/planejamento exige 105 e paga 180 gold/480 EXP; execução exige 120 e paga 300 gold/300 EXP. Os valores de gold recebem o adicional quando há autonomia. Os custos de stamina e intervalo continuam iguais aos demais encontros.

A relação usa o último compromisso bem-sucedido, ordenado por endedAt e id. Repetir uma escolha antiga altera a relação atual sem conceder outro ponto de especialização. Falhar ou reenviar o requestId antigo não altera a relação. A escolha vale para novas tentativas do acontecimento até ser substituída; o bônus não é consumível. O desfecho resolvido é gravado na tentativa, portanto mudar a relação não reescreve o diário. O histórico de outro personagem não interfere.

O seed acrescenta seis IDs estáveis sem migration. O estado narrativo é derivado das tentativas persistidas, com character, event e storyBonus na resposta. Não é um simulador de mundo global: os episódios são repetíveis, o vínculo é local ao personagem do jogador e não há facções ou finais irreversíveis.

Testes cobrem os compromissos nas três profissões, desbloqueio por ambos os caminhos anteriores, mudanças de diálogo/evento/poder/recompensa, falha sem alterar vínculo, reenvio e concorrência, histórico imutável e isolamento entre personagens. Um cenário confirma que o apoio de +12 muda uma falha em sucesso real.

## Ocorrências iniciais

Disponível na aba **Ocorrências**, a partir do nível 2. São 21 situações e 42 abordagens: nove ocorrências iniciais, seis continuidades e seis episódios com personagens recorrentes. Permanecem disponíveis após o final da campanha.

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

74 testes aprovados (54 API e 20 UI/cliente), lint e types. Integração em PostgreSQL executa todas as 18 abordagens, confere valores exatos, história, repetição, concorrência, falha, nível, propriedade, profissão e stamina. UI valida escolha explícita, comparação de recompensas, aviso de falha, bloqueios, contagem regressiva e repetição após perda de resposta.

Playtest pela interface na conta fictícia Doutora Aurora, sem modificar saldo/relógio: Conduzir a prevenção acrescentou exatamente 40 gold e 140 EXP, stamina de 10 para 9 e bloqueio imediato de 60 segundos. O personagem já havia concluído a campanha, preservada em 3/3.
Após o intervalo real, Assumir a unidade móvel acrescentou exatamente 120 gold e 60 EXP, stamina de 9 para 8. Recarregar a página preservou ambas as decisões no diário e a campanha em 3/3; a produção idle continuou independente.

## Consequências na progressão — R-007

Cada par ocorrência/abordagem concluído com sucesso concede um ponto de especialização uma única vez. Cada ponto adiciona +3 de poder somente às abordagens da mesma área; o poder da campanha e as taxas idle não mudam. Falhas, reenvios e repetições não concedem pontos. Repetir ainda rende gold/EXP e custa stamina. Com o conteúdo atual, cada área permite sete pontos (+21 poder), incluindo os episódios R-008.

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

## Playtest R-008 — 2026-10-15

Teste pela interface em localhost:3100, com Doutora Aurora (Médico), sem alterar stamina, relógio ou progresso por API/SQL. Foram respeitados os intervalos reais de 60 segundos.

- O histórico do acompanhamento das famílias mudou o convite de Rosa; o abrigo estava bloqueado até concluir o encontro.
- Construir parceria liberou o abrigo, mudou a relação para Parceria ativa e acrescentou +12 de poder. A abordagem cuidadosa concluiu com voluntários e registros das famílias: +180 gold e +480 EXP.
- Voltar ao encontro e escolher autonomia mudou a fala e retirou o apoio. A abordagem de execução mostrou poder 507 e pagou exatamente +380 gold e +300 EXP, incluindo o adicional de 80 gold. Stamina passou de 2 para 1.
- Após recarregar, a autonomia permaneceu ativa; o diário conservou tanto o desfecho anterior com voluntários quanto o novo com a equipe atuando sozinha. O progresso idle foi coletado normalmente no retorno.
- As quatro decisões novas elevaram as especializações de 3/2 para 5/4 pontos. Não houve bloqueio de navegação ou perda de histórico no percurso testado.

As três profissões, mudanças repetidas de compromisso, falhas, isolamento entre jogadores e reenvios concorrentes foram cobertos por testes automatizados. O playtest manual desta rodada concentrou-se no Médico. Lint, typecheck e 74 testes passaram (54 API + 20 web). O balanceamento de longo prazo continua provisório.
