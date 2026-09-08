-- =============================================================================
-- Migration 009: Add resend_count to otp_requests
-- =============================================================================
-- US-009 / S-101 — OTP Re-request (FR-011).
-- Tracks how many times an OTP session has been re-requested so the caller
-- receives the current resend_count in the response.

ALTER TABLE otp_requests ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
