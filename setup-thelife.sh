#!/bin/bash
# ============================================================
# SETUP — The Life
# Extrai o repositório e faz push para o GitHub
#
# Uso:
#   chmod +x setup-thelife.sh
#   ./setup-thelife.sh
# ============================================================

set -e

REPO_URL="https://github.com/PedroHCastelani/GameIdle.git"
ARCHIVE="thelife-repo.tar.gz"
DIR="thelife-repo"

echo ""
echo "  ╔═══════════════════════════════╗"
echo "  ║   The Life — Setup do Repo    ║"
echo "  ╚═══════════════════════════════╝"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$ARCHIVE" ]; then
  echo "ERRO: Arquivo '$ARCHIVE' não encontrado."
  echo "Certifique-se de que o arquivo está na mesma pasta deste script."
  exit 1
fi

# Extrair
echo "→ Extraindo $ARCHIVE..."
tar -xzf "$ARCHIVE"

# Entrar na pasta
cd "$DIR"
echo "→ Pasta: $(pwd)"

# Inicializar git
echo "→ Inicializando repositório git..."
git init
git remote add origin "$REPO_URL"

# Configurar branch
git checkout -b master 2>/dev/null || git checkout master

# Verificar se há commits remotos (README existente)
echo "→ Verificando repositório remoto..."
if git ls-remote --exit-code origin master 2>/dev/null; then
  echo "→ Branch master encontrada no remoto. Fazendo merge..."
  git fetch origin master
  git merge origin/master --allow-unrelated-histories --no-edit 2>/dev/null || true
fi

# Adicionar todos os arquivos
echo "→ Adicionando arquivos..."
git add .

# Commit
echo "→ Criando commit inicial..."
git commit -m "feat: estrutura completa do projeto — Fase 0

- CLAUDE.md: regras globais e mapa de agentes autônomos
- TASKS.md: 64 tasks mapeadas em 3 fases
- docs/: 9 documentos técnicos (GDD, Blueprint, Schema, etc.)
- .claude/agents/: 9 perfis de agentes para Claude Code
- docker-compose.yml: PostgreSQL 16 + Redis 7 + PgBouncer
- .github/workflows/: CI/CD (PR check, staging, release)
- .env.example: variáveis de ambiente documentadas
- package.json + turbo.json: monorepo Turborepo + pnpm"

# Push
echo "→ Enviando para o GitHub..."
git push -u origin master

echo ""
echo "  ✅ Concluído!"
echo ""
echo "  Repositório: $REPO_URL"
echo "  Branch: master"
echo ""
echo "  Próximo passo: abrir o repositório com Claude Code"
echo "  e iniciar pela task T-001 (monorepo configurado)"
echo ""
