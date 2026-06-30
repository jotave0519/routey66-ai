-- Migration 002: conversation timeout support
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS timeout_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timeout_warned BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: only active rows with a pending timeout (the worker's hot path)
CREATE INDEX IF NOT EXISTS idx_conversations_timeout
  ON conversations (timeout_at)
  WHERE timeout_at IS NOT NULL AND status = 'ACTIVE';
