-- =============================================================================
-- Migration 009: US-004 View and Edit User Profile Details
--   * editable profile attributes + optimistic-locking version on `users`
--   * append-only profile audit log (access + modification history)
--   * transactional outbox for the `user.profile.updated` domain event
-- =============================================================================

ALTER TABLE users ADD COLUMN display_name       TEXT    NULL;
ALTER TABLE users ADD COLUMN phone_number       TEXT    NULL;
ALTER TABLE users ADD COLUMN profile_version    INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN profile_updated_at TEXT    NULL;

CREATE TABLE user_profile_audit_log (
  id               TEXT    PRIMARY KEY,
  user_id          TEXT    NOT NULL REFERENCES users(id),
  action           TEXT    NOT NULL CHECK (action IN ('profile.viewed', 'profile.updated')),
  changed_fields   TEXT    NULL,   -- JSON array of field names (values are not stored)
  profile_version  INTEGER NOT NULL,
  occurred_at      TEXT    NOT NULL
);

CREATE INDEX idx_user_profile_audit_log_user_id ON user_profile_audit_log(user_id, occurred_at);

CREATE TABLE domain_event_outbox (
  id            TEXT PRIMARY KEY,
  topic         TEXT NOT NULL,
  aggregate_id  TEXT NOT NULL,
  payload       TEXT NOT NULL,     -- JSON
  created_at    TEXT NOT NULL,
  published_at  TEXT NULL
);

CREATE INDEX idx_domain_event_outbox_unpublished ON domain_event_outbox(published_at, created_at);
