-- =============================================================================
-- Migration 009: Add phone column to users table
-- =============================================================================
-- Phone number stored in "+CountryCode-Number" format (e.g. "+1-5551234567").
-- VARCHAR(15) covers the maximum length of an international number
-- (E.164: +[1-9]<country code><subscriber number>, max 15 digits total).

ALTER TABLE users ADD COLUMN phone TEXT NULL;
