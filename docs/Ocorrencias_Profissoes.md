# Ocorrências e decisões por profissão — R-006

Disponível na aba **Ocorrências**, a partir do nível 2. São nove situações, com duas abordagens cada. Permanecem disponíveis após o final da campanha.

| Profissão | Nível 2 | Nível 3 | Nível 4 |
|---|---|---|---|
| Policial | Alarme na feira | Estação em alerta | Manifesto adulterado |
| Ladrão | A galeria fechada | Entrega pelos telhados | Convite para o leilão |
| Médico | Mutirão na praça | Apagão na clínica | Bairro alagado |

Cada abordagem tem descrição, poder necessário, recompensa e desfecho próprios. A primeira prioriza EXP e exige menos poder; a segunda prioriza gold e exige mais poder. Por exemplo, ouvir testemunhas rende 40 gold/140 EXP e exige poder 22; rastrear a carga rende 120 gold/60 EXP e exige poder 32. No nível 3, os pares são 70/210 (poder 34) e 180/100 (poder 46); no nível 4, 100/300 (poder 48) e 260/150 (poder 64).

## Regras e persistência

- Selecionar uma abordagem não a executa: confirmar mostra explicitamente o custo de 1 stamina. Falha também custa 1 stamina, não concede recompensas e tem aviso antecipado quando o poder é insuficiente.
- Há intervalo global de 60 segundos por personagem entre tentativas de ocorrências, incluindo falhas. Campanha e idle permanecem disponíveis.
- Profissão, nível, propriedade, liberdade, stamina, poder, valores e relógio são validados no servidor. Uma transação com bloqueio do personagem serializa gastos, recompensa e histórico.
- O mesmo requestId repete o resultado sem novo gasto. Reutilizar o identificador para outra ocorrência/abordagem é rejeitado. Requisições diferentes concorrentes respeitam o intervalo.
- Diário mostra as cinco operações mais recentes, incluindo a abordagem e seu desfecho. Todos os registros permanecem no banco. Resultados antigos de campanha continuam legíveis.
- Não altera os capítulos concluídos, a missão idle ativa, os equipamentos nem o esquema do banco. O seed adiciona definições STAGE com prefixo mvp_encounter_. Execute `pnpm db:seed` ao atualizar.
- API: POST `/api/characters/:id/encounter`, autenticado, corpo estrito `{encounterId, choiceId, requestId}`. GET `/api/game` fornece as ocorrências da profissão e o intervalo restante.

## Limites de design

A escolha muda o foco econômico e o relato persistido; não altera permanentemente a cidade, a facção nem o final da campanha. As profissões possuem situações, etapas e decisões temáticas distintas, mas compartilham a resolução determinística por poder. Balanceamento de longo prazo e árvores narrativas permanecem futuros.

## Validação

63 testes aprovados (45 API e 18 UI/cliente), lint e types. Integração em PostgreSQL executa todas as 18 abordagens, confere valores exatos, história, repetição, concorrência, falha, nível, propriedade, profissão e stamina. UI valida escolha explícita, comparação de recompensas, aviso de falha, bloqueios, contagem regressiva e repetição após perda de resposta.

Playtest pela interface na conta fictícia Doutora Aurora, sem modificar saldo/relógio: Conduzir a prevenção acrescentou exatamente 40 gold e 140 EXP, stamina de 10 para 9 e bloqueio imediato de 60 segundos. O personagem já havia concluído a campanha, preservada em 3/3.
Após o intervalo real, Assumir a unidade móvel acrescentou exatamente 120 gold e 60 EXP, stamina de 9 para 8. Recarregar a página preservou ambas as decisões no diário e a campanha em 3/3; a produção idle continuou independente.
