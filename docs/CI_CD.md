# CI/CD — The Life

## Pipeline de CI (PR Check)

O pipeline é executado automaticamente em:
- Pull Requests para `master` ou `staging`

### Jobs

| Job | Descrição | Serviços |
|-----|-----------|----------|
| 🔍 Lint | ESLint em todo o código | - |
| 🏷️ TypeCheck | TypeScript type checking | - |
| 🧪 Test | Testes unitários e integração | PostgreSQL 16, Redis 7 |
| 🏗️ Build | Build de todos os apps | - |
| 📈 SonarCloud | Análise estática e Quality Gate | SonarCloud |

### SonarCloud e Quality Gate

O SonarCloud é obrigatório para Pull Requests e pushes em branches protegidas. O projeto usa `sonar-project.properties` na raiz como contrato de análise.

Métricas mínimas para código novo:

- 0 bugs novos.
- 0 vulnerabilidades novas.
- Quality Gate do SonarCloud em `PASSED`.
- Duplicação em código novo dentro do limite configurado no SonarCloud.
- Cobertura reportada para código novo quando houver testes com LCOV disponível.

Pré-requisitos no GitHub:

- Secret `SONAR_TOKEN` configurado no repositório.
- Projeto `PedroHCastelani_GameIdle` vinculado à organização `pedro-castelani` no SonarCloud.
- Branch protection exigindo o check `📈 SonarCloud` e o resumo do CI.

### Fluxo de Trabalho

