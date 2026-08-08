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

### Fluxo de Trabalho

