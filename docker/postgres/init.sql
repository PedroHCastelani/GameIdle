-- ============================================================
-- Script de inicialização do PostgreSQL
-- The Life — Desenvolvimento local
-- ============================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criação de schema para organização
CREATE SCHEMA IF NOT EXISTS app;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE the_life TO thelife;
GRANT ALL PRIVILEGES ON SCHEMA app TO thelife;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Banco the_life inicializado com sucesso!';
    RAISE NOTICE '📦 Extensões: uuid-ossp, pgcrypto';
    RAISE NOTICE '📁 Schema: app';
END $$;
