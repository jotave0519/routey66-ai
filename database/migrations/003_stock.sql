-- ============================================================
-- Migration 003 — Estoque + campos extras em customers/vehicles
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ------------------------------------------------------------
-- Novos campos em customers (opcionais, retrocompatíveis)
-- ------------------------------------------------------------
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cpf   TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;

-- ------------------------------------------------------------
-- Novos campos em vehicles (opcionais, retrocompatíveis)
-- ------------------------------------------------------------
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color    TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage  INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS notes    TEXT;

-- ------------------------------------------------------------
-- stock_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  category     TEXT,
  sku          TEXT,
  quantity     NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  unit         TEXT NOT NULL DEFAULT 'unidade',
  cost_price   NUMERIC,
  sale_price   NUMERIC,
  supplier     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_name     ON stock_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);

-- ------------------------------------------------------------
-- stock_movements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity      NUMERIC NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);
