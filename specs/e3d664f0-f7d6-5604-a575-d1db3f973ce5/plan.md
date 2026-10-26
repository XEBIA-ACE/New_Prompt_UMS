# Implementation Plan: e3d664f0-f7d6-5604-a575-d1db3f973ce5

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- Accepted impact analysis (sha256:fc2da6ed54e6d588480aed5cd18a99704e8247f6bb8528cd42ebc8ab64853ca5)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:fc2da6ed54e6d588480aed5cd18a99704e8247f6bb8528cd42ebc8ab64853ca5)
- Resolve or explicitly accept the following implementation-readiness items:
  - Candidate verification flagged a possibly better-matching alternative that was not selected: otp_requests (397) -- review before accepting.
  - Candidate verification found the selected focus object implausible for this requirement: The requirement is about adding OTP attempt tracking and verification columns to the otp_requests database table, whereas the selected object Accordion (Typescript Function) is a UI component unrelated to database migrations or OTP logic. The otp_requests ANSI Table candidate is a clearly better semantic match to a schema-change requirement.
  - No backend services or repositories referencing OTP_MAX_ATTEMPTS in the measured facts.
  - No otp_requests table or related migration objects in CAST coverage.
  - No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
  - No-match classification: Initial classification (net-new capability) has a noted caveat: OTP attempt tracking and verification flags are common features and might exist under different table or column names, so the lack of matches on just otp_requests, otp migration, and OTP_MAX_ATTEMPTS is not conclusive that nothing similar exists.
  - No-match consistency check raised a caveat about this classification: OTP attempt tracking and verification flags are common features and might exist under different table or column names, so the lack of matches on just otp_requests, otp migration, and OTP_MAX_ATTEMPTS is not conclusive that nothing similar exists.
  - Requirement detail is incomplete (see evidence_gaps); no conflicting existing implementation was found
  - Searched 3 term(s) derived from this requirement (otp_requests, otp migration, OTP_MAX_ATTEMPTS) against Cast; none resolved to an existing code object.
  - Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?

## Contract Changes
- No material API, event, or data contract change is evidenced.

## Security and Quality
- Validate credential and personal-data handling against the Jira requirement
- Validate credential and personal-data handling against the story's acceptance criteria
- Preserve the availability, reliability, and observability constraints grounded by ae246fe2f5b81296

## Verification Plan
- **S1-AC1**: Given the project's migration tooling is configured and working, when migration 009 is created in the migrations directory with the naming convention used by the project, then the migration file is syntactically valid and follows the project's migration structure (up() and down() functions or equivalent).
- **S1-AC2**: Given migration 009 is defined, when the up() function is executed on a fresh SQLite database with the otp_requests table schema, then the attempt_count column is added with type integer, default value 0, and NOT NULL constraint, and the verified column is added with type boolean, default value false, and NOT NULL constraint.
- **S1-AC3**: Given migration 009 has been applied to a fresh database, when the down() function is executed, then both attempt_count and verified columns are removed and the otp_requests table returns to its pre-migration state.
- **S1-AC4**: Given a copy of the current production database with existing otp_requests records, when migration 009 is applied, then all existing OTP request records retain their data (user_id, code, expires_at, created_at, etc.), the new attempt_count column defaults to 0 for all existing records, and the new verified column defaults to false for all existing records.
- **S1-AC5**: Given migration 009 has been applied to a production database copy, when the down() function is executed, then the migration is reversed without data loss and the table schema matches the pre-migration state.
- **S1-AC6**: Given migration 009 is defined, when the migration is executed twice in sequence on the same database (idempotency test), then the second execution does not raise an error and the schema remains unchanged.
- **IMPACT**: Verify acceptance criterion: Given the project's migration tooling is configured and working, when migration 009 is created in the migrations directory with the naming convention used by the project, then the migration file is syntactically valid and follows the project's migration structure (up() and down() functions or equivalent).
- **IMPACT**: Verify acceptance criterion: Given migration 009 is defined, when the up() function is executed on a fresh SQLite database with the otp_requests table schema, then the attempt_count column is added with type integer, default value 0, and NOT NULL constraint, and the verified column is added with type boolean, default value false, and NOT NULL constraint.
- **IMPACT**: Verify acceptance criterion: Given migration 009 has been applied to a fresh database, when the down() function is executed, then both attempt_count and verified columns are removed and the otp_requests table returns to its pre-migration state.
- **IMPACT**: Verify acceptance criterion: Given a copy of the current production database with existing otp_requests records, when migration 009 is applied, then all existing OTP request records retain their data (user_id, code, expires_at, created_at, etc.), the new attempt_count column defaults to 0 for all existing records, and the new verified column defaults to false for all existing records.
- **IMPACT**: Verify acceptance criterion: Given migration 009 has been applied to a production database copy, when the down() function is executed, then the migration is reversed without data loss and the table schema matches the pre-migration state.
- **IMPACT**: Verify acceptance criterion: Given migration 009 is defined, when the migration is executed twice in sequence on the same database (idempotency test), then the second execution does not raise an error and the schema remains unchanged.