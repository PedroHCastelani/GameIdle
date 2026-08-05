#!/bin/bash
# ============================================================
# TESTE DE CONECTIVIDADE — DOCKER
# The Life — Validação dos serviços
# ============================================================

set -e

echo "🔍 Testando conectividade dos serviços Docker..."
echo ""

# ============================================================
# 1. VERIFICAR SE DOCKER ESTÁ RODANDO
# ============================================================
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Inicie o Docker Desktop."
  exit 1
fi
echo "✅ Docker está rodando"

# ============================================================
# 2. VERIFICAR SE CONTAINERS ESTÃO UP
# ============================================================
echo ""
echo "📦 Verificando containers..."

POSTGRES_STATUS=$(docker inspect --format='{{.State.Health.Status}}' the-life-postgres 2>/dev/null || echo "not_found")
REDIS_STATUS=$(docker inspect --format='{{.State.Health.Status}}' the-life-redis 2>/dev/null || echo "not_found")
PGBOUNCER_STATUS=$(docker inspect --format='{{.State.Health.Status}}' the-life-pgbouncer 2>/dev/null || echo "not_found")

if [ "$POSTGRES_STATUS" != "healthy" ]; then
  echo "❌ PostgreSQL não está saudável (status: $POSTGRES_STATUS)"
  exit 1
fi
echo "✅ PostgreSQL: healthy"

if [ "$REDIS_STATUS" != "healthy" ]; then
  echo "❌ Redis não está saudável (status: $REDIS_STATUS)"
  exit 1
fi
echo "✅ Redis: healthy"

if [ "$PGBOUNCER_STATUS" != "healthy" ]; then
  echo "❌ PgBouncer não está saudável (status: $PGBOUNCER_STATUS)"
  exit 1
fi
echo "✅ PgBouncer: healthy"

# ============================================================
# 3. TESTAR CONEXÃO POSTGRESQL
# ============================================================
echo ""
echo "🗄️  Testando conexão PostgreSQL..."

if docker exec the-life-postgres pg_isready -U thelife -d the_life > /dev/null 2>&1; then
  echo "✅ PostgreSQL aceitando conexões"
else
  echo "❌ PostgreSQL não está aceitando conexões"
  exit 1
fi

# ============================================================
# 4. TESTAR CONEXÃO REDIS
# ============================================================
echo ""
echo "📮 Testando conexão Redis..."

if docker exec the-life-redis redis-cli ping | grep -q "PONG"; then
  echo "✅ Redis respondendo PONG"
else
  echo "❌ Redis não está respondendo"
  exit 1
fi

# ============================================================
# 5. TESTAR CONEXÃO PGBOUNCER
# ============================================================
echo ""
echo "🔀 Testando conexão PgBouncer..."

if docker exec the-life-pgbouncer pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo "✅ PgBouncer aceitando conexões"
else
  echo "❌ PgBouncer não está aceitando conexões"
  exit 1
fi

# ============================================================
# 6. RESUMO
# ============================================================
echo ""
echo "=========================================="
echo "✅ TODOS OS TESTES PASSARAM!"
echo "=========================================="
echo ""
echo "📊 Status dos serviços:"
echo "   - PostgreSQL: localhost:5432 (healthy)"
echo "   - Redis: localhost:6379 (healthy)"
echo "   - PgBouncer: localhost:6432 (healthy)"
echo ""
echo "🔗 URLs de conexão:"
echo "   - DATABASE_URL=postgresql://thelife:thelife_dev_2026@localhost:6432/the_life"
echo "   - REDIS_URL=redis://localhost:6379"
echo ""
echo "🛑 Para parar os serviços:"
echo "   docker-compose down"
echo ""
echo "🗑️  Para parar e remover dados:"
echo "   docker-compose down -v"
