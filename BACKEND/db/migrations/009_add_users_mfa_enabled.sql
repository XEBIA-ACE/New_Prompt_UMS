-- =============================================================================
-- Migration 009: Add MFA setting flag to users
-- Story effa3c4f-4382-54b5-beb0-fad608d1cb94 — FR-S1-001 (S1-AC1), FR-S1-002 (S1-AC2)
--
-- Stored as INTEGER 0/1 (SQLite has no BOOLEAN type), matching the
-- domain model's `UserEntity.mfaEnabled: boolean`. NOT NULL DEFAULT 0 means
-- every pre-existing row is backfilled as MFA disabled and no row can ever
-- hold a NULL MFA value.
--
-- Rollback: 009_add_users_mfa_enabled.down.sql (not part of the forward
-- migration list; apply manually).
-- =============================================================================

ALTER TABLE users
  ADD COLUMN mfa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (mfa_enabled IN (0, 1));
