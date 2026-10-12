# Implementation Plan: 560cb07c-55f3-542f-a90f-918fd47e5379

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- Accepted impact analysis (sha256:3b3385227c91c4c2addb31d837aa79860bc63f71d02dcba8a15d1b33cd25d52e)
- Implement only against accepted impact revision 2 (sha256:3b3385227c91c4c2addb31d837aa79860bc63f71d02dcba8a15d1b33cd25d52e)
- Resolve or explicitly accept implementation-readiness item: Candidate verification flagged a possibly better-matching alternative that was not selected: OtpExpiredError (2976) -- review before accepting.
- Resolve or explicitly accept implementation-readiness item: Candidate verification found the selected focus object implausible for this requirement: The requirement focuses on defining new OTP error types and response contracts for OTP verification failures, specifying codes like 409 OTP_LOCKED, 422 ACCOUNT_STATE_INVALID, and others. The selected object 'OtpDispatchFailedError' relates to dispatch failures, not to the defined OTP verification errors or response structures.
- Resolve or explicitly accept implementation-readiness item: No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
- Resolve or explicitly accept implementation-readiness item: No-match classification: The requirement involves defining and implementing new OTP error codes and a response contract, which are likely not existing features in the current codebase. The search term 'OtpDispatchFailedError' is specific and not directly tied to the new codes described, suggesting these capabilities are yet to be developed.
- Resolve or explicitly accept implementation-readiness item: Searched 1 term(s) derived from this requirement (OtpDispatchFailedError) against Cast; none resolved to an existing code object.
- Resolve or explicitly accept implementation-readiness item: Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?

## Contract Changes
- No material API, event, or data contract change is evidenced.

## Security and Quality
- Preserve the security controls evidenced by ae246fe2f5b81296
- Preserve the availability, reliability, and observability constraints grounded by ae246fe2f5b81296

## Verification Plan
- **S3-AC1**: Given the OTP error handling module is defined, when an OTP verification request is missing the user_id or passcode field, then the endpoint returns HTTP 400 with response body containing outcome='failure' and error_code='MISSING_REQUIRED_FIELD'.
- **S3-AC2**: Given the OTP error handling module is defined, when an OTP verification request has a passcode that is not a 4-8 digit string, then the endpoint returns HTTP 400 with response body containing outcome='failure' and error_code='MISSING_REQUIRED_FIELD'.
- **S3-AC3**: Given the OTP error handling module is defined, when an OTP verification request provides an incorrect passcode, then the endpoint returns HTTP 422 with response body containing outcome='failure' and error_code='INVALID_PASSCODE'.
- **S3-AC4**: Given the OTP error handling module is defined, when an OTP has been locked due to exceeding OTP_MAX_ATTEMPTS, then the endpoint returns HTTP 409 with response body containing outcome='failure' and error_code='OTP_LOCKED'.
- **S3-AC5**: Given the OTP error handling module is defined, when an OTP verification request is made for a user account that is locked or deleted, then the endpoint returns HTTP 422 with response body containing outcome='failure' and error_code='ACCOUNT_STATE_INVALID'.
- **S3-AC6**: Given the OTP error handling module is defined, when an OTP verification succeeds, then the endpoint returns HTTP 200 with response body containing outcome='success' and error_code field is absent or null.
- **S3-AC7**: Given the OTP error handling module is defined, when any OTP verification response is generated, then the response body includes both outcome and error_code fields with string values, and no other error response format is used.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when an OTP verification request is missing the user_id or passcode field, then the endpoint returns HTTP 400 with response body containing outcome='failure' and error_code='MISSING_REQUIRED_FIELD'.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when an OTP verification request has a passcode that is not a 4-8 digit string, then the endpoint returns HTTP 400 with response body containing outcome='failure' and error_code='MISSING_REQUIRED_FIELD'.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when an OTP verification request provides an incorrect passcode, then the endpoint returns HTTP 422 with response body containing outcome='failure' and error_code='INVALID_PASSCODE'.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when an OTP has been locked due to exceeding OTP_MAX_ATTEMPTS, then the endpoint returns HTTP 409 with response body containing outcome='failure' and error_code='OTP_LOCKED'.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when an OTP verification request is made for a user account that is locked or deleted, then the endpoint returns HTTP 422 with response body containing outcome='failure' and error_code='ACCOUNT_STATE_INVALID'.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when an OTP verification succeeds, then the endpoint returns HTTP 200 with response body containing outcome='success' and error_code field is absent or null.
- **IMPACT**: Verify acceptance criterion: Given the OTP error handling module is defined, when any OTP verification response is generated, then the response body includes both outcome and error_code fields with string values, and no other error response format is used.