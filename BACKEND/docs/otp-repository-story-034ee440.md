Story: 034ee440-8aef-5f2e-8765-468880e84a91
Specification bundle: 678a3371-bf20-45f5-a274-a9a424e37de7
Accepted impact revision 1: sha256:0312b180ef0119a638a46c8761ddfb16bfd2dceee476cc1581ee00abddb8257b
Grounding snapshot: ae246fe2f5b81296

Implementation assumptions and gaps:
- FR-S3-AC1 through FR-S3-AC6 are implemented in the existing OtpRequestRepository.
  S3-AC1 through S3-AC6 tests use real SQLite and reference the full story AC ids.
- FR-S3-AC5 / S3-AC5: all four methods return null for missing rows, including writes.
  The service maps null to OtpNotFoundError; OtpController retains HTTP 404 OTP_NOT_FOUND.
- IMPACT: the existing constructor injection is router -> controller -> service -> repository.
  Direct repository injection into the controller would duplicate the existing service boundary;
  persistence stays in the service. New methods are synchronous because better-sqlite3
  transactions must not span awaits. Existing asynchronous repository methods remain unchanged.
- No verification lockout threshold exists in this checkout or specification. Failed code
  submissions increment attempt_count; no new lockout policy is introduced. Router tests
  exercise the existing send/resend rate-limit denial and verification flows.
- FR-S3-AC4 / S3-AC4 does not define repeated verification writes: retain the first timestamp.
  setVerified returns true for an existing row. Callers supply valid ISO timestamps;
  the repository binds timestamp text without normalization or validation.
- Migration 009 was absent despite the specified prerequisite. Added only the three required
  columns and registered the migration in production and test loaders. No new dependencies
  or configuration are required. Apply with the existing npm run db:migrate before deployment.
- Rollback: deploy the prior application version and leave the additive columns in place;
  old queries remain compatible. No destructive schema rollback is needed. The integration
  failure-trigger test checks transactional rollback of verification when activation fails.

Validation: repository acceptance tests and router tests require no Redis server (the router
suite uses a fake Redis counter). The pre-existing OTP integration suite requires live Redis.
