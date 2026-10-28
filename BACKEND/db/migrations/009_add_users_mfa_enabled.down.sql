-- =============================================================================
-- Rollback for migration 009: drop the users.mfa_enabled column.
-- Requires SQLite >= 3.35. After running, also delete the
-- '009_add_users_mfa_enabled.sql' row from schema_migrations.
-- =============================================================================

ALTER TABLE users DROP COLUMN mfa_enabled;
