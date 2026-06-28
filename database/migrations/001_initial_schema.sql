-- ============================================================
-- Routey66 AI — Schema inicial do Supabase
-- Execute este arquivo no SQL Editor do Supabase.
-- ============================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL UNIQUE,
  whatsapp_name TEXT,          -- nome do perfil WhatsApp (só para referência)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ------------------------------------------------------------
-- vehicles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  plate       TEXT NOT NULL,
  year        INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, plate)
);

CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);

-- ------------------------------------------------------------
-- services
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- appointments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id        UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  google_event_id   TEXT,
  appointment_date  TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'SCHEDULED'
                    CHECK (status IN ('SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED')),
  notes             TEXT,
  calendar_sync_error TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_customer_id   ON appointments(customer_id);
CREATE INDEX idx_appointments_vehicle_id    ON appointments(vehicle_id);
CREATE INDEX idx_appointments_service_id    ON appointments(service_id);
CREATE INDEX idx_appointments_date          ON appointments(appointment_date);
CREATE INDEX idx_appointments_status        ON appointments(status);

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'ACTIVE'
              CHECK (status IN ('ACTIVE', 'TRANSFERRED', 'FINISHED')),
  transfer_reason TEXT,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_status      ON conversations(status);

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL CHECK (sender IN ('customer', 'assistant', 'system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at      ON messages(created_at);

-- ------------------------------------------------------------
-- faq
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faq (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- business_settings
-- (apenas 1 linha — upsert pelo campo singleton)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton      BOOLEAN NOT NULL DEFAULT TRUE UNIQUE CHECK (singleton = TRUE),
  company_name   TEXT NOT NULL DEFAULT 'Route''y 66',
  address        TEXT NOT NULL DEFAULT 'Arujá - SP',
  phone          TEXT,
  opening_hours  JSONB NOT NULL DEFAULT '{
    "monday":    {"open": "08:00", "close": "18:00"},
    "tuesday":   {"open": "08:00", "close": "18:00"},
    "wednesday": {"open": "08:00", "close": "18:00"},
    "thursday":  {"open": "08:00", "close": "18:00"},
    "friday":    {"open": "08:00", "close": "18:00"},
    "saturday":  {"open": "08:00", "close": "12:00"},
    "sunday":    null
  }'::jsonb,
  welcome_message TEXT NOT NULL DEFAULT
    'Olá! 👋 Seja bem-vindo(a) à Route''y 66. Como posso ajudar?',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- updated_at trigger (reutilizável)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_faq_updated_at
  BEFORE UPDATE ON faq FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_business_settings_updated_at
  BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
