-- =============================================================================
-- Migration 009: Create mfa_change_notification_records table
-- =============================================================================
-- Transactional outbox record for MFA change notification emails. Shaped like
-- registration_email_records (003) and account_deletion_notification_records
-- (008). Purely additive: no existing table or row is altered.
--
-- Rollback: DROP TABLE IF EXISTS mfa_change_notification_records;
--           DELETE FROM schema_migrations
--             WHERE filename = '009_create_mfa_change_notification_records.sql';

CREATE TABLE IF NOT EXISTS mfa_change_notification_records (
  record_id           TEXT    PRIMARY KEY,
  user_id             TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_address   TEXT    NOT NULL,
  mfa_old_state       TEXT    NOT NULL CHECK (mfa_old_state IN ('enabled', 'disabled')),
  mfa_new_state       TEXT    NOT NULL CHECK (mfa_new_state IN ('enabled', 'disabled')),
  change_timestamp    TEXT    NOT NULL,
  dispatch_timestamp  TEXT    NOT NULL,
  delivery_status     TEXT    NOT NULL DEFAULT 'queued'
                         CHECK (delivery_status IN ('queued', 'sent', 'failed')),
  retry_count         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mfa_change_notification_status
  ON mfa_change_notification_records(delivery_status);
CREATE INDEX IF NOT EXISTS idx_mfa_change_notification_user
  ON mfa_change_notification_records(user_id);
