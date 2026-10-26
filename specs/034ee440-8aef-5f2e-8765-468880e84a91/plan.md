# Implementation Plan: 034ee440-8aef-5f2e-8765-468880e84a91

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- unresolved reference (component:OtpController)
- unresolved reference (component:createOtpRouter)
- unresolved reference (component:
§{main_sources}
/New_Prompt_UMS-develop/BACKEND/src/controllers/otp.controller.ts)
- Accepted impact analysis (sha256:0312b180ef0119a638a46c8761ddfb16bfd2dceee476cc1581ee00abddb8257b)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:0312b180ef0119a638a46c8761ddfb16bfd2dceee476cc1581ee00abddb8257b)
- Resolve or explicitly accept the following implementation-readiness items:
  - Candidate verification could not confidently judge the selected focus object for this requirement
  - Candidate verification was uncertain about the selected focus object: The requirement concerns enhancing the OTP repository layer to support attempt and verification queries, while the selected object is an OtpController Typescript class, which may or may not be directly involved with repository logic. None of the listed alternatives (various OTP-related error classes and a UI input group) are clearly a better semantic match to repository enhancements based solely on their names and types.
  - No SQL queries or ORM calls related to attempt_count or verified are visible for OtpController.
  - No repository or DAO objects associated with otp_requests are present in the CAST facts for this focus object.
  - No-match classification (all acceptance criteria unmapped): Initial classification (net-new capability) has a noted caveat: The requirement concerns fairly standard repository CRUD-style extensions around OTP attempts and verification, which many systems might already implement under different naming, so the absence of just these few searched terms is not conclusive. However, without evidence of specific alternate names or patterns in this codebase, I cannot point to a concrete missed search gap.
  - OtpController (2958) is the primary orchestration point for OTP operations exposed via createOtpRouter (2438), but repository responsibilities are not yet modeled in the CAST snapshot.
  - Requirement traceability incomplete for S3-AC1, S3-AC2, S3-AC3, S3-AC4, S3-AC5, S3-AC6
  - What is the canonical error/null contract for missing otpRequestId at the repository boundary?
  - Where is OtpRepository defined, and how will OtpController connect to it?

## Contract Changes
- change required
- No database tables or views are currently accessed by OtpController in CAST facts; otp_requests is not yet wired here. — change required

## Security and Quality
- Future repository methods must use parameterized queries for otpRequestId and timestamp to satisfy S3-AC6, but current CAST data for OtpController shows no SQL usage to evaluate.
- Preserve the availability, reliability, and observability constraints grounded by ae246fe2f5b81296

## Verification Plan
- **S3-AC1**: Given the otp_requests table has the attempt_count column (added by migration 009), when the repository method getAttemptCount(otpRequestId) is called, then it returns the current attempt_count value as an integer (0 or greater).
- **S3-AC2**: Given an OTP request with attempt_count=2, when the repository method incrementAttemptCount(otpRequestId) is called, then attempt_count is incremented to 3 in the database and the method returns the new value (3).
- **S3-AC3**: Given the otp_requests table has the verified column (added by migration 009), when the repository method getVerified(otpRequestId) is called, then it returns the current verified flag as a boolean (true or false).
- **S3-AC4**: Given an OTP request with verified=false and verified_at=null, when the repository method setVerified(otpRequestId, timestamp) is called with a valid ISO 8601 timestamp, then verified is set to true and verified_at is set to the provided timestamp in the database.
- **S3-AC5**: Given all repository methods operate on otp_requests, when any method is called with an otpRequestId that does not exist, then the method returns null or throws a consistent error (to be handled by the service layer).
- **S3-AC6**: Given the repository methods use parameterized queries, when a method is called with user-supplied input (otpRequestId, timestamp), then the query is constructed using bound parameters (not string concatenation) to prevent SQL injection.
- **IMPACT**: Add unit and integration tests around OtpController call paths (via createOtpRouter) once repository methods for attempt_count and verified are implemented, particularly for lockout and verification flows.