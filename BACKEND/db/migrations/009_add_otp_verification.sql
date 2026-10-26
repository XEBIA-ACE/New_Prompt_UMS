-- S3-AC1–S3-AC4 prerequisite missing from this checkout.
ALTER TABLE otp_requests ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0);
ALTER TABLE otp_requests ADD COLUMN verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1));
ALTER TABLE otp_requests ADD COLUMN verified_at TEXT NULL;
