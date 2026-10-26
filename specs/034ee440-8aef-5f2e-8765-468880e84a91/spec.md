# Feature Specification: 034ee440-8aef-5f2e-8765-468880e84a91

## User Scenarios & Testing
- **034ee440-8aef-5f2e-8765-468880e84a91**: Given the otp_requests table has the attempt_count column (added by migration 009), when the repository method getAttemptCount(otpRequestId) is called, then it returns the current attempt_count value as an integer (0 or greater).
- **034ee440-8aef-5f2e-8765-468880e84a91**: Given an OTP request with attempt_count=2, when the repository method incrementAttemptCount(otpRequestId) is called, then attempt_count is incremented to 3 in the database and the method returns the new value (3).
- **034ee440-8aef-5f2e-8765-468880e84a91**: Given the otp_requests table has the verified column (added by migration 009), when the repository method getVerified(otpRequestId) is called, then it returns the current verified flag as a boolean (true or false).
- **034ee440-8aef-5f2e-8765-468880e84a91**: Given an OTP request with verified=false and verified_at=null, when the repository method setVerified(otpRequestId, timestamp) is called with a valid ISO 8601 timestamp, then verified is set to true and verified_at is set to the provided timestamp in the database.
- **034ee440-8aef-5f2e-8765-468880e84a91**: Given all repository methods operate on otp_requests, when any method is called with an otpRequestId that does not exist, then the method returns null or throws a consistent error (to be handled by the service layer).
- **034ee440-8aef-5f2e-8765-468880e84a91**: Given the repository methods use parameterized queries, when a method is called with user-supplied input (otpRequestId, timestamp), then the query is constructed using bound parameters (not string concatenation) to prevent SQL injection.

## Functional Requirements
- FR-S3-AC1: The repository SHALL expose a method getAttemptCount(otpRequestId) that, for an existing otp_requests row, returns the value of the attempt_count column as an integer greater than or equal to 0. This requirement is derived from S3-AC1 and assumes migration 009 has already added the attempt_count column.
- FR-S3-AC2: The repository SHALL expose a method incrementAttemptCount(otpRequestId) that, for an existing otp_requests row with attempt_count = N, performs a database update to set attempt_count = N + 1 and returns the new value as an integer. For example, if attempt_count=2 before the call, the method MUST persist and return 3. This requirement is derived from S3-AC2.
- FR-S3-AC3: The repository SHALL expose a method getVerified(otpRequestId) that, for an existing otp_requests row, returns the value of the verified column as a boolean (true or false). This requirement is derived from S3-AC3 and assumes migration 009 has already added the verified column.
- FR-S3-AC4: The repository SHALL expose a method setVerified(otpRequestId, timestamp) that, for an existing otp_requests row with verified = false and verified_at = null, performs a database update that sets verified = true and verified_at to the provided timestamp value, where timestamp is supplied in a valid ISO 8601 string representation. This requirement is derived from S3-AC4; behavior when verified is already true is not specified here and MUST be defined elsewhere if needed.
- FR-S3-AC5: For all repository methods introduced in this story (getAttemptCount, incrementAttemptCount, getVerified, setVerified), when invoked with an otpRequestId that does not correspond to any row in otp_requests, the method(s) MUST either (a) return null or (b) throw a consistently documented repository-level error type. The exact choice between null and error is not defined by S3-AC5 and MUST be decided and documented in the repository interface so that the service layer can handle it consistently.
- FR-S3-AC6: All repository methods introduced in this story that accept otpRequestId and/or timestamp as inputs MUST construct and execute SQL using parameterized queries (e.g. bound parameters/placeholders) rather than string concatenation, so that user-supplied values cannot alter the SQL structure (preventing SQL injection). This requirement is derived from S3-AC6 and applies to both read and write operations implemented for attempt_count and verified / verified_at.

## Success Criteria
- **S3-AC1**: Given the otp_requests table has the attempt_count column (added by migration 009), when the repository method getAttemptCount(otpRequestId) is called, then it returns the current attempt_count value as an integer (0 or greater).
- **S3-AC2**: Given an OTP request with attempt_count=2, when the repository method incrementAttemptCount(otpRequestId) is called, then attempt_count is incremented to 3 in the database and the method returns the new value (3).
- **S3-AC3**: Given the otp_requests table has the verified column (added by migration 009), when the repository method getVerified(otpRequestId) is called, then it returns the current verified flag as a boolean (true or false).
- **S3-AC4**: Given an OTP request with verified=false and verified_at=null, when the repository method setVerified(otpRequestId, timestamp) is called with a valid ISO 8601 timestamp, then verified is set to true and verified_at is set to the provided timestamp in the database.
- **S3-AC5**: Given all repository methods operate on otp_requests, when any method is called with an otpRequestId that does not exist, then the method returns null or throws a consistent error (to be handled by the service layer).
- **S3-AC6**: Given the repository methods use parameterized queries, when a method is called with user-supplied input (otpRequestId, timestamp), then the query is constructed using bound parameters (not string concatenation) to prevent SQL injection.
- **IMPACT**: Add unit and integration tests around OtpController call paths (via createOtpRouter) once repository methods for attempt_count and verified are implemented, particularly for lockout and verification flows.

## Provenance
- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:0312b180ef0119a638a46c8761ddfb16bfd2dceee476cc1581ee00abddb8257b`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Deterministic grounding reference**: `ae246fe2f5b81296`