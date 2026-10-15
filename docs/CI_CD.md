# CI/CD — estado real
Revisão: 15/10/2026

CI Pipeline é o workflow único para PRs e pushes em master/staging. Usa Node 22 e a versão de pnpm do packageManager. Ordem: instalação congelada → geração Prisma explícita → migrations e seed em PostgreSQL de teste → lint → types → testes unitários e integração com cobertura → build. Cobertura mínima do núcleo: 80% linhas/funções/statements e 75% branches. LCOV é enviado ao job Sonar.

SonarCloud exige SONAR_TOKEN e projeto externo configurado. Ausência de secret falha explicitamente; não equivale a gate aprovado. PR de fork sem secrets requer fluxo de revisão do mantenedor; nunca expor token a código não confiável. Exigir Validate e SonarCloud na proteção da branch é configuração externa a confirmar.

Removidos workflow redundante PR Check e automerge por prefixo de branch que contornava revisão. Deploys não estão provisionados; workflows manuais falham explicitamente, sem criar tags nem simular sucesso. Notion e staging não foram validados nesta mudança.

## Configuração Sonar e cobertura (R-004)
Em 15/10/2026, SONAR_TOKEN foi configurado pelo mantenedor e a execução via Actions conseguiu autenticar e importar a análise. O primeiro gate com cobertura real apontou 74,8%, abaixo dos 80% exigidos. Esse resultado substitui a aprovação anterior sem cobertura da análise automática.

R-004 adiciona testes de interface e cliente HTTP, amplia a instrumentação API para servidor/rotas e publica ambos os LCOV no mesmo artifact preservando apps/api e apps/web. O limite do gate não foi reduzido. A análise automática deve ficar desligada quando a análise via CI estiver ativa. O segredo é mantido exclusivamente em GitHub Actions Secrets; nunca em código ou documentação.

Resultado confirmado em 49e3380: Validate e SonarCloud aprovados; 96,5% de cobertura no código novo. Execução e limites registrados em Validacao_2026-10-15.md. Checks futuros devem ser observados para o respectivo commit.
