-- =============================================================================
-- Migration 009: Add attempt_count to otp_requests
-- =============================================================================
-- Tracks the number of failed verification attempts for this OTP record.
-- Drives FR-007 (increment on wrong passcode) and FR-008 (invalidate at max).

ALTER TABLE otp_requests ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
