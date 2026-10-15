# Banco de dados — contrato executável
Revisão: 15/10/2026

A fonte única é [schema.prisma](../apps/api/prisma/schema.prisma), com 47 modelos. Não manter uma segunda cópia editável do schema neste documento. A modelagem inicial está preservada em archive/2026-08/Schema_Banco_de_Dados.md como histórico não normativo.

Migration inicial: apps/api/prisma/migrations/20260810000000_init/migration.sql. O incremento não muda tabelas/colunas; usa User, Session, Character, MissionDefinition, UserPremium, MissionLog e EconomyLog existentes. Não há down migration inicial validada; não declarar esse requisito concluído. Reverter o protótipo é reverter código/configuração, sem apagar registros.

DATABASE_URL aponta a conexão de aplicação; DIRECT_URL aponta diretamente PostgreSQL para migrations. Ambiente local pode usar a mesma URL para ambos. A migration usa colunas camelCase entre aspas; não copiar índices snake_case do documento histórico. Índices de expiração devem indexar a coluna e filtrar now() na consulta, não em predicado de índice parcial.

No protótipo, cpfHash recebe prototype:UUID e cpfSalt recebe NOT_A_CPF. Não são hashes de CPF. Nenhum CPF é coletado. Session.refreshToken guarda SHA-256 de token aleatório, nunca o token original. O nome legado é mantido para evitar uma migration cosmética; o contrato é documentado aqui.

Coletas travam a linha do personagem com FOR UPDATE. Login/refresh/criação travam a conta. Saldo, cursor de coleta e logs são atualizados na mesma transação. BigInt é serializado como string. Saldo inicial de 100 gold usa MISSION_REWARD com metadata.reason=PROTOTYPE_STARTING_BALANCE; relatórios futuros devem separar esse evento de recompensa de missão.

SecurityLog, AccountFlag, estados de propina pendente, emissão de créditos e anonimização/exclusão permanecem pendentes. Criar tabelas não implementa os sistemas relacionados. Testes usam banco descartável com sufixo _test, sem truncar nem apagar bancos existentes.
