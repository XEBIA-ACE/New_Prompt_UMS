# Implementation Plan: 33ed04fe-9173-58a5-8117-8bebd609b9e2

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- unresolved reference (component:AccountDeletedScreen_fragment_2)
- unresolved reference (component:IdentityVerificationCardProps)
- unresolved reference (component:IdentityVerificationCard_fragment_1)
- unresolved reference (component:Promise)
- unresolved reference (component:verifyOtp)
- unresolved reference (component:	{main_sources}	/New_Prompt_UMS-develop/BACKEND/src/services/otp.service.ts)
- Accepted impact analysis (sha256:f45f2141851fd37c49ac9ee9a2a706e81ca44bcb07ee8a48d7599f516205343f)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:f45f2141851fd37c49ac9ee9a2a706e81ca44bcb07ee8a48d7599f516205343f)
- Resolve or explicitly accept the following implementation-readiness items:
  - CAST MCP did not return intra-object details for verifyOtp, so internal error mapping logic, thrown error types, and response serialization are unknown.
  - No additional callers or database objects are involved beyond those measured by CAST for verifyOtp.
  - No-match classification (all acceptance criteria unmapped): Initial classification (net-new capability) has a noted caveat: OTP error typing and HTTP error contracts are common in authentication services, and the absence of any broader search for generic error or exception handling around OTP leaves some room for doubt that nothing similar exists under different names.
  - Requirement traceability incomplete for S4-AC1, S4-AC2, S4-AC3, S4-AC4, S4-AC5
  - What HTTP controller or middleware methods call verifyOtp (1001) in the runtime stack beyond the two measured direct callers?
  - Where are INVALID_PASSCODE, OTP_LOCKED, and ACCOUNT_STATE_INVALID error types declared and how do they integrate with existing error-handling middleware?

## Contract Changes
- VerifyOtpRequest (unknown) — change required
- VerifyOtpSuccessResponse (unknown) — change required
- verifyOtp interacts with 3 measured database objects: VerifyOtpRequest, VerifyOtpSuccessResponse, verifyOtp. — change required

## Security and Quality
- Changes to OTP error handling must preserve correct authentication and lockout semantics, but CAST facts do not reveal current error-type or status-code mappings.
- Preserve the availability, reliability, and observability constraints grounded by ae246fe2f5b81296

## Verification Plan
- **S4-AC1**: Given the OTP error types are defined, when INVALID_PASSCODE is thrown, then the HTTP response status is 422 and error_code field contains 'INVALID_PASSCODE'.
- **S4-AC2**: Given the OTP error types are defined, when OTP_LOCKED is thrown, then the HTTP response status is 409 and error_code field contains 'OTP_LOCKED'.
- **S4-AC3**: Given the OTP error types are defined, when ACCOUNT_STATE_INVALID is thrown, then the HTTP response status is 422 and error_code field contains 'ACCOUNT_STATE_INVALID'.
- **S4-AC4**: Given an OTP error is thrown, when the error is serialized in the HTTP response, then both outcome and error_code fields are present in the response body.
- **S4-AC5**: Given the error handling is updated, when any OTP error is caught by middleware or controller, then the response includes the correct HTTP status code and error_code without requiring additional mapping logic in the controller.
- **IMPACT**: Regression tests should exercise the 6 transactions flowing through verifyOtp, but specific test artifacts are not visible in CAST.