# Feature Specification: 33ed04fe-9173-58a5-8117-8bebd609b9e2

## User Scenarios & Testing
- **S4-AC1**: Given the OTP error types are defined, when INVALID_PASSCODE is thrown, then the HTTP response status is 422 and error_code field contains 'INVALID_PASSCODE'.
- **S4-AC2**: Given the OTP error types are defined, when OTP_LOCKED is thrown, then the HTTP response status is 409 and error_code field contains 'OTP_LOCKED'.
- **S4-AC3**: Given the OTP error types are defined, when ACCOUNT_STATE_INVALID is thrown, then the HTTP response status is 422 and error_code field contains 'ACCOUNT_STATE_INVALID'.
- **S4-AC4**: Given an OTP error is thrown, when the error is serialized in the HTTP response, then both outcome and error_code fields are present in the response body.
- **S4-AC5**: Given the error handling is updated, when any OTP error is caught by middleware or controller, then the response includes the correct HTTP status code and error_code without requiring additional mapping logic in the controller.

## Functional Requirements
- FR-S4-001 (S4-AC1): The system SHALL define an OTP error type representing an invalid passcode, identified by the error_code value 'INVALID_PASSCODE'. When this INVALID_PASSCODE error type is thrown and propagated to the HTTP layer, the centralized error handling mechanism SHALL produce an HTTP response with status code 422 and an error body whose error_code field equals 'INVALID_PASSCODE'.
- FR-S4-002 (S4-AC2): The system SHALL define an OTP error type representing a locked OTP, identified by the error_code value 'OTP_LOCKED'. When this OTP_LOCKED error type is thrown and propagated to the HTTP layer, the centralized error handling mechanism SHALL produce an HTTP response with status code 409 and an error body whose error_code field equals 'OTP_LOCKED'.
- FR-S4-003 (S4-AC3): The system SHALL define an OTP error type representing an invalid account state, identified by the error_code value 'ACCOUNT_STATE_INVALID'. When this ACCOUNT_STATE_INVALID error type is thrown and propagated to the HTTP layer, the centralized error handling mechanism SHALL produce an HTTP response with status code 422 and an error body whose error_code field equals 'ACCOUNT_STATE_INVALID'.
- FR-S4-004 (S4-AC4): The centralized error serialization logic for all OTP-specific errors (including at minimum INVALID_PASSCODE, OTP_LOCKED, and ACCOUNT_STATE_INVALID) SHALL always include both an outcome field and an error_code field in the HTTP response body; the precise value of the outcome field (for example, 'error') is not constrained by this requirement but MUST be present whenever an OTP error is serialized.
- FR-S4-005 (S4-AC5): The error-handling middleware or equivalent centralized mechanism SHALL map each OTP error type to its corresponding HTTP status code and error_code value so that controllers and route handlers can surface OTP errors by throwing or propagating them without adding per-controller mapping logic (for example, no switch or if-else blocks in controllers to translate INVALID_PASSCODE, OTP_LOCKED, or ACCOUNT_STATE_INVALID into status codes or error_code strings).

## Success Criteria
- **S4-AC1**: Given the OTP error types are defined, when INVALID_PASSCODE is thrown, then the HTTP response status is 422 and error_code field contains 'INVALID_PASSCODE'.
- **S4-AC2**: Given the OTP error types are defined, when OTP_LOCKED is thrown, then the HTTP response status is 409 and error_code field contains 'OTP_LOCKED'.
- **S4-AC3**: Given the OTP error types are defined, when ACCOUNT_STATE_INVALID is thrown, then the HTTP response status is 422 and error_code field contains 'ACCOUNT_STATE_INVALID'.
- **S4-AC4**: Given an OTP error is thrown, when the error is serialized in the HTTP response, then both outcome and error_code fields are present in the response body.
- **S4-AC5**: Given the error handling is updated, when any OTP error is caught by middleware or controller, then the response includes the correct HTTP status code and error_code without requiring additional mapping logic in the controller.
- **IMPACT**: Regression tests should exercise the 6 transactions flowing through verifyOtp, but specific test artifacts are not visible in CAST.

## Provenance
- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:f45f2141851fd37c49ac9ee9a2a706e81ca44bcb07ee8a48d7599f516205343f`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Deterministic grounding reference**: `ae246fe2f5b81296`
- **Evidence refs**: `eecb4bae-b3aa-5b03-95f8-94a1707fe361:S4-AC1:grounding:d14708a702fa`, `eecb4bae-b3aa-5b03-95f8-94a1707fe361:S4-AC2:grounding:d14708a702fa`, `eecb4bae-b3aa-5b03-95f8-94a1707fe361:S4-AC3:grounding:d14708a702fa`, `eecb4bae-b3aa-5b03-95f8-94a1707fe361:S4-AC4:grounding:d14708a702fa`, `eecb4bae-b3aa-5b03-95f8-94a1707fe361:S4-AC5:grounding:d14708a702fa`, `ae246fe2f5b81296`, `component:AccountDeletedScreen_fragment_2`, `component:IdentityVerificationCardProps`, `component:IdentityVerificationCard_fragment_1`, `component:Promise`, `component:verifyOtp`, `component:	{main_sources}	/New_Prompt_UMS-develop/BACKEND/src/services/otp.service.ts`, `sha256:f45f2141851fd37c49ac9ee9a2a706e81ca44bcb07ee8a48d7599f516205343f`