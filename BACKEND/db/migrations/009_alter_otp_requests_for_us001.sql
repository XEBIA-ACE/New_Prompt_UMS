-- =============================================================================
-- Migration 009: Align otp_requests with US-001 spec
-- =============================================================================
-- Adds purpose column, switches status enum to ACTIVE/EXPIRED/CONSUMED,
-- and replaces the per-user unique index with a per-user+purpose index.
--
-- Requirements: US-001 FR-002, FR-004, FR-007

-- Drop the old per-user unique index (cannot coexist with the new composite
-- unique partial index).
DROP INDEX IF EXISTS uidx_otp_requests_active_per_user;

-- Add the purpose context column (FR-002).
ALTER TABLE otp_requests ADD COLUMN purpose TEXT NOT NULL DEFAULT 'ACTIVATION'
  CHECK (purpose IN ('ACTIVATION', 'LOGIN', 'PASSWORD_RECOVERY'));

-- Recreate the table with the new schema so the status CHECK constraint
-- matches the US-001 spec (ACTIVE / EXPIRED / CONSUMED) and we can add the
-- new unique partial index on (user_id, purpose).
CREATE TABLE otp_requests_new (
  id               TEXT    PRIMARY KEY,
  user_id          TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address    TEXT    NOT NULL,
  code_hash        TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'EXPIRED', 'CONSUMED')),
  purpose          TEXT    NOT NULL
                     CHECK (purpose IN ('ACTIVATION', 'LOGIN', 'PASSWORD_RECOVERY')),
  created_at       TEXT    NOT NULL,
  expires_at       TEXT    NOT NULL,
  invalidated_at   TEXT    NULL,
  attempt_sequence INTEGER NOT NULL
);

CREATE UNIQUE INDEX uidx_otp_requests_active_per_user_purpose
  ON otp_requests(user_id, purpose)
  WHERE status = 'ACTIVE';

-- Migrate existing data: map old statuses to new ones.
INSERT INTO otp_requests_new
  (id, user_id, email_address, code_hash, status, purpose, created_at,
   expires_at, invalidated_at, attempt_sequence)
SELECT
  id,
  user_id,
  email_address,
  code_hash,
  CASE
    WHEN invalidated_at IS NOT NULL THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END,
  'ACTIVATION',
  created_at,
  expires_at,
  invalidated_at,
  attempt_sequence
FROM otp_requests;

DROP TABLE otp_requests;

ALTER TABLE otp_requests_new RENAME TO otp_requests;

-- Rate-limit and lookup window queries.
CREATE INDEX idx_otp_requests_user_created ON otp_requests(user_id, created_at);

-- Expiry cleanup sweeps.
CREATE INDEX idx_otp_requests_expires_at ON otp_requests(expires_at);
