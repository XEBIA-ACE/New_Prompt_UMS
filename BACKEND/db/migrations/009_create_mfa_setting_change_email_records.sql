-- Migration 009: Create MFA setting-change email outbox records.
-- DEFAULT is the logical schema; like the existing outboxes, this table
-- lives in the application's main SQLite database.

CREATE TABLE IF NOT EXISTS mfa_setting_change_email_records (
  record_id           TEXT    PRIMARY KEY,
  user_id             TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_address   TEXT    NOT NULL,
  change_type         TEXT    NOT NULL,
  change_timestamp    TEXT    NOT NULL,
  dispatch_timestamp  TEXT    NOT NULL,
  delivery_status     TEXT    NOT NULL DEFAULT 'queued'
                         CHECK (delivery_status IN ('queued', 'sent', 'failed')),
  retry_count         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mfa_setting_change_email_status
  ON mfa_setting_change_email_records(delivery_status);
