# The Life

MMORPG idle de navegador em desenvolvimento. Esta branch entrega um **protótipo local fechado**: conta de teste, sessão única, três profissões, missões idle, inventário/equipamentos e campanha solo de três capítulos com progresso persistente. Sem CPF real, pagamento, deploy público ou promessa de conformidade. Estado e limites: [docs/Estado_do_Projeto.md](docs/Estado_do_Projeto.md).

## Executar localmente

Requer Node 22.14+ e Docker. pnpm 10.12.1 é fixado no packageManager.

1. Copie .env.example para .env na raiz.
2. Gere uma chave aleatória de desenvolvimento e preencha JWT_SECRET (mínimo 32 caracteres):

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
pnpm install --frozen-lockfile
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Interface: http://localhost:3000 · API: http://localhost:3333 · Liveness: /api/health/light · Disponibilidade DB/Redis: /api/ready.

Scripts Prisma carregam .env da raiz; variáveis já definidas no ambiente prevalecem. DATABASE_URL e DIRECT_URL precisam ser configuradas. Com PgBouncer, DIRECT_URL deve continuar apontando diretamente PostgreSQL. Não use contas reais. O modo LOCAL_PROTOTYPE=true recusa NODE_ENV=production e host de API fora de loopback. Não publique esta prévia.

Crie uma conta com e-mail fictício, escolha a profissão e inicie uma missão. Após um ciclo, colete gold/EXP. Recarregar a página recupera a sessão e coleta o intervalo pendente. Sair da conta não interrompe a missão. Cada conta tem somente um personagem nesta versão.

## Validação

```sh
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Para a suite de integração, configure DATABASE_URL e DIRECT_URL para um banco **descartável com nome terminado em _test**, aplique migration/seed e execute com RUN_DB_TESTS=true:

```sh
pnpm --filter @the-life/api test:coverage
```

No PowerShell, use $env:RUN_DB_TESTS='true'. Sem essa variável, pnpm test executa somente testes unitários/servidor e informa integração pulada. CI sempre exige integração. Testes adicionam registros fictícios no banco de teste; não executam limpeza destrutiva. Nunca aponte a suite a dados reais. Cobertura do núcleo é medida separadamente da interface e não significa cobertura de todo o produto.

## API do incremento

| Método | Endpoint | Comportamento |
|---|---|---|
| POST | /api/auth/register | E-mail/senha fictícios, cookie refresh e accessToken |
| POST | /api/auth/login | Invalida sessões anteriores |
| POST | /api/auth/refresh | Rotaciona refresh (cookie; Origin obrigatório) |
| POST | /api/auth/logout | Encerra sessão atual |
| GET | /api/game | Personagem e missões disponíveis do dono |
| POST | /api/characters | name e profession: POLICE, THIEF ou DOCTOR |
| POST | /api/characters/:id/mission | missionId; liquida missão anterior |
| POST | /api/characters/:id/claim | Corpo vazio; coleta intervalo no servidor |

Rotas de jogo exigem Authorization: Bearer. Rotas de auth exigem Origin igual a WEB_ORIGIN. Gold/EXP são strings decimais no JSON; nunca números do cliente. Sessões usam banco como fonte de verdade. Nenhuma notificação WebSocket está incluída.

## Documentação e acompanhamento

[Tarefas](TASKS.md) · [Blueprint](docs/Blueprint.md) · [GDD](docs/GDD_Completo.md) · [Motor](docs/Motor_de_Calculo.md) · [Banco](docs/Schema_Banco_de_Dados.md) · [Segurança](docs/Seguranca_e_LGPD.md) · [CI](docs/CI_CD.md).

Documentos originais substituídos foram preservados em docs/archive/2026-08, marcados como históricos e não normativos. Produção visual final, talentos completos, economia entre jogadores, PvP e monetização permanecem planejados. Inventário e prática de carreira têm implementação simplificada local. Notion e gates externos só são considerados aprovados mediante evidência.
## Confirmação e recuperação na prévia local

O painel **Segurança da conta** permite solicitar confirmação de e-mail e redefinir senha. Após solicitar uma mensagem, abra o JSON mais recente destinado ao seu e-mail fictício na pasta `.local-mail/` da raiz do repositório e copie o campo `code` para o formulário correspondente. Essa pasta é local, ignorada pelo Git e não é servida pela API. Nenhum e-mail é enviado pela internet.

Confirmação expira em 24 horas; recuperação em 30 minutos. Aguarde 60 segundos para reenviar. Reenvio substitui o código anterior. Após redefinir a senha, entre novamente: as sessões anteriores são encerradas. Execute `pnpm db:migrate` antes de iniciar esta versão para criar `account_tokens`.

Rotas adicionais: `GET /api/auth/account`, `POST /api/auth/email/request`, `POST /api/auth/email/confirm` (`code`), `POST /api/auth/password/request` (`email`) e `POST /api/auth/password/reset` (`code`, `password`). Confirmação solicitada exige login; todos os POST exigem o Origin configurado. Verificação de e-mail ainda não impede o acesso ao jogo local. Provedor real e liberação pública permanecem pendentes.

Teste a interface com `pnpm --filter @the-life/web test:coverage`. O CI publica cobertura de API e interface para o SonarCloud.

## Jogar o MVP local

Após migration e seed, escolha uma das três profissões. Inicie a primeira missão marcada CAMPANHA, colete ciclos de 10 segundos e compre/equipe a ferramenta e o colete nas abas Loja e Inventário. O painel Jornada mostra o próximo nível/poder necessário. Complete uma operação, equipe sua recompensa e avance para as missões liberadas. Termine os três capítulos para ver o desfecho da profissão. Missões EXTRA preservam o conteúdo antigo e rendem apenas gold/EXP.

As operações custam 1 stamina; poder insuficiente causa falha, informada antes de confirmar. Equipamentos e prática aumentam o poder. Suprimentos recebidos a cada cinco ciclos podem ser vendidos. Recarregar recupera a sessão e o progresso; a conclusão permanece salva.

Rotas autenticadas adicionais: POST `/api/characters/:id/buy` (`templateId`), `/item` (`itemId`, `action`: equip/unequip/sell) e `/challenge` (`chapter`, `requestId` UUID). O servidor valida propriedade, saldo, nível e repetição. GET `/api/game` inclui campanha, inventário, loja, histórico e missões bloqueadas.

[Escopo do MVP](docs/MVP_Local.md) · [Teste como jogador](docs/Playtest_MVP_2026-10-15.md).
