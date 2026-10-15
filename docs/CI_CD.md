# CI/CD — estado real
Revisão: 15/10/2026

CI Pipeline é o workflow único para PRs e pushes em master/staging. Usa Node 22 e a versão de pnpm do packageManager. Ordem: instalação congelada → geração Prisma explícita → migrations e seed em PostgreSQL de teste → lint → types → testes unitários e integração com cobertura → build. Cobertura mínima do núcleo: 80% linhas/funções/statements e 75% branches. LCOV é enviado ao job Sonar.

SonarCloud exige SONAR_TOKEN e projeto externo configurado. Ausência de secret falha explicitamente; não equivale a gate aprovado. PR de fork sem secrets requer fluxo de revisão do mantenedor; nunca expor token a código não confiável. Exigir Validate e SonarCloud na proteção da branch é configuração externa a confirmar.

Removidos workflow redundante PR Check e automerge por prefixo de branch que contornava revisão. Deploys não estão provisionados; workflows manuais falham explicitamente, sem criar tags nem simular sucesso. Notion e staging não foram validados nesta mudança.
