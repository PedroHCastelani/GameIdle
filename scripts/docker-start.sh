#!/bin/bash
# ============================================================
# DOCKER START — The Life
# Inicia todos os serviços Docker
# ============================================================

set -e

echo "🐳 Iniciando serviços Docker do The Life..."
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Inicie o Docker Desktop."
  exit 1
fi

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "⚠️  Arquivo .env não encontrado. Execute o script-local.sh primeiro."
  exit 1
fi

# Subir containers
echo "📦 Subindo containers..."
docker-compose up -d

# Aguardar health checks
echo ""
echo "⏳ Aguardando serviços ficarem saudáveis..."
sleep 5

# Executar testes
echo ""
bash scripts/docker-test.sh
