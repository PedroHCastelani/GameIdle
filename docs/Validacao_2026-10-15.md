# Validação do incremento — 15/10/2026

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
