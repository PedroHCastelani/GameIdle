# Validação do incremento — 15/10/2026

## Atualização R-004 — evidência mais recente

- [Execução 38683932738](https://github.com/PedroHCastelani/GameIdle/actions/runs/38683932738), commit `49e3380`: **Validate, SonarCloud e SonarCloud Code Analysis aprovados**. Cobertura do código novo **96,5%**, duplicação **0,0%**, zero security hotspots reportados. O gate passou; há 21 apontamentos não bloqueantes, portanto não se declara ausência de dívida técnica.
- SONAR_TOKEN configurado pelo mantenedor, autenticação e envio da análise bem-sucedidos. A primeira reexecução revelou cobertura de 74,8%; os testes e relatórios foram ampliados sem baixar o gate.
- **39 testes**: 30 API e 9 UI/cliente HTTP. Migration aditiva `20261015050000_account_tokens` aplicada nos bancos local e de integração. Lint, types e build aprovados.
- Cobertura local API ampliada a `src/**/*.ts` (exceto bootstrap `src/index.ts`): 81,05% linhas, 92,44% branches, 95,45% funções. Inclui arquivos antigos de exemplo não usados e não cobertos. UI/cliente HTTP: 100% linhas, 94,52% branches, 93,02% funções; layout estático não instrumentado. Esses percentuais têm denominadores diferentes do código novo no SonarCloud.
- Casos verificados: confirmação de e-mail, cooldown, expiração, troca de código, separação de finalidade, consumo concorrente, recuperação de senha, revogação de JWT/refresh/códigos, conta desconhecida/banida, Origin, payload inválido e rollback em falha de entrega. UI testa cadastro/personagem/missão/coleta, restauração, erros e novos formulários.
- No navegador, a conta fictícia `preview@example.test` solicitou uma mensagem local, consumiu o código e exibiu e-mail confirmado. Recuperação validada por testes API/UI; nenhuma mensagem foi enviada externamente.
- Limites: caixa local de arquivos, sem provedor real, fila/outbox ou gate obrigatório de e-mail para jogar. Cadastro público, revisão humana, staging, Notion e merge permanecem pendentes.

As seções abaixo preservam o histórico do primeiro incremento R-001–R-003 e de suas execuções anteriores; não substituem a atualização R-004 acima.

## Escopo
Branch codex/foundation-playable-slice. Protótipo local fechado, não liberação pública. Banco de integração descartável gameidle_test e banco de demonstração separado gameidle_preview. Nenhum dado real de CPF/pagamento.

## Evidências locais
- 25 testes passaram (14 unitários/servidor e 11 de integração). Núcleo API: 98,56% linhas/statements, 100% funções e 90,97% branches.
- Migration inicial aplicada em bancos limpos; seed executado e cliente Prisma gerado explicitamente.
- Lint e typecheck passam. Build de API e Next.js verificado.
- Suite cobre motor, senhas/tokens, rotas, persistência real, coletas concorrentes, sessão única, refresh concorrente, ownership, cap, campos extras, personagem único, troca de missão e indisponibilidade do Redis.
- Interface conferida no navegador: cadastro fictício, personagem Policial, missão Patrulha Escolar, coleta de um ciclo resultando em 135 gold / 15 EXP a partir de 100 / 0.
- Tela conferida em 375×812 e 1280×900; sem transbordamento horizontal observado em mobile. Sem erros no console na coleta verificada.
- Estados sem ciclo completo e restauração de sessão após reload conferidos. Valores são calculados no servidor.

## Limites da evidência
Cobertura reportada refere-se a src/modules e src/lib da API, não a todo o repositório ou UI. Interface validada manualmente; não há suite automatizada de componentes/browser. SonarCloud, aprovação de revisão, branch protection, Notion e staging são evidências externas ainda não presumidas.

Avisos de ferramentas: configuração de seed package.json do Prisma 6 é depreciada para uma futura migração à versão 7; plugin Next.js não detectado na configuração customizada de ESLint. Os checks atuais passam, sem alegação de auditoria completa de dependências.

No Windows, pare o servidor antes de regenerar Prisma: a DLL do engine fica em uso. Não há mudança estrutural de schema, apenas comentários contratuais; não foi criada migration cosmética.

## Evidência remota e revisão

- [PR #6](https://github.com/PedroHCastelani/GameIdle/pull/6), aberto como draft para revisão.
- No commit `74ac801`, [Validate passou no GitHub Actions](https://github.com/PedroHCastelani/GameIdle/actions/runs/38680476802): instalação limpa, geração do Prisma, migration, seed, lint, types, cobertura e build.
- O check independente **SonarCloud Code Analysis** passou nesse commit após os ajustes de confiabilidade da UI e fixação das actions de terceiros por SHA.
- O job **SonarCloud** da pipeline continua falhando porque o segredo `SONAR_TOKEN` está ausente. A análise automática aprovada não comprova importação do LCOV pelo job. Configurar o segredo no GitHub, confirmar o modo de análise no SonarCloud e executar novamente antes do merge. Não foi reduzido ou ignorado esse requisito.
- Após os ajustes, a prévia restaurou a sessão e recuperou mais sete ciclos: personagem no nível 2, 380 gold e 120 EXP. Lint, types e build locais passaram novamente.
- Este registro é um snapshot das execuções vinculadas; alterações posteriores exigem observar os checks do novo commit.
