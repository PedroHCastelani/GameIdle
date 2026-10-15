# Motor de cálculo — contrato
Revisão: 15/10/2026. Regras completas são design alvo, não código executável. O código vigente do incremento fica em apps/api/src/modules/game/.

## Incremento local
Tempo vem do servidor. O início e a última coleta da missão delimitam o intervalo. Free limita 12h e premium 24h. Processar somente ciclos completos e preservar o restante menor que um ciclo. Se o intervalo exceder o cap, descartar o excedente. Requisições concorrentes usam lock do personagem dentro da mesma transação que credita gold/EXP, grava MissionLog/EconomyLog e avança o cursor. Sem ciclos não há mutação econômica. Presos não progridem. Trocar de missão liquida a anterior na mesma transação antes de definir o novo cursor.

Gold por ciclo = piso da média entre goldMin e goldMax. EXP por ciclo = expBase. Curva provisória: EXP acumulada >= 100 × nível² permite o próximo nível. Não aplicar retrocesso nessa operação. Skills, equipamento, buffs, guild, PvP e drops não estão incluídos. Respostas serializam BigInt como string.

## Contrato futuro consolidado
- Stamina: 10/20 de teto; 1 por 2,4h/1,2h. Preservar frações do relógio.
- Party: 3 contas = 30%; 3 personagens de 2 contas = 20%; 2 contas/2 personagens = 10%; mesma conta = 0%.
- PvP: resolver em especificação própria antes da implementação; não usar o exemplo antigo que eliminava empate e ignorava proteções.
- Propina: débito, escrow, decisão, pena, pagamento e auditoria numa transação; recusa acrescenta 50% da pena original. Registrar ausência de delegado sem FK fictícia. Definir estado pendente antes de criar job que o consulte.
- Buffs: faixa comum de HP 3–5%; incomum a partir do nível 20. Chance de evolução de 0,1% por nível ainda requer simulação e decisão de balanceamento.
- Aleatoriedade futura: seed estável e resultados persistidos; retries não permitem reroll.
- Sessões: serializar login/refresh/logout por conta, validar sessão no banco em toda rota autenticada. Notificação é secundária e não garante exclusão mútua.

Os exemplos antigos foram retirados porque contrariavam o GDD e não garantiam atomicidade. Não considerar este documento evidência de entrega dos sistemas futuros.
