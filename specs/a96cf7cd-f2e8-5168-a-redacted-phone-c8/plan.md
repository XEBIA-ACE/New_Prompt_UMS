# Implementation Plan: a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8

## Technical Context
- 86da275298e43b88
- sha256:1f93ac99f7585f0b2a92160027e8d8a6ec8401b47e8d71b7c162d2bc75467a59
- Implement only against accepted impact revision 3 (sha256:1f93ac99f7585f0b2a92160027e8d8a6ec8401b47e8d71b7c162d2bc75467a59)
- Resolve or explicitly accept implementation-readiness item: Candidate verification found the selected focus object implausible for this requirement: The requirement concerns defining OTP error types, constants, and configurations, which are unrelated to the 'Accordion' Typescript function that deals with UI components.
- Resolve or explicitly accept implementation-readiness item: No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
- Resolve or explicitly accept implementation-readiness item: No-match classification: Initial classification (net-new capability) has a noted caveat: The requirement involves adding foundational elements like error handling and brute-force protection, which are common in systems dealing with security. This raises some doubt about their non-existence without specific evidence, even though the specific described terms are missing.
- Resolve or explicitly accept implementation-readiness item: No-match consistency check raised a caveat about this classification: The requirement involves adding foundational elements like error handling and brute-force protection, which are common in systems dealing with security. This raises some doubt about their non-existence without specific evidence, even though the specific described terms are missing.
- Resolve or explicitly accept implementation-readiness item: Requirement detail is incomplete (see evidence_gaps); no conflicting existing implementation was found
- Resolve or explicitly accept implementation-readiness item: Searched 3 term(s) derived from this requirement (OTP_LOCKED, ACCOUNT_STATE_INVALID, OTP_MAX_ATTEMPTS) against Cast; none resolved to an existing code object.
- Resolve or explicitly accept implementation-readiness item: Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?

## Contract Changes
- No material API, event, or data contract change is evidenced.

## Security and Quality
- Preserve the security controls evidenced by 86da275298e43b88
- Verify the changed user flow against the stated accessibility criteria

## Verification Plan
- **ac-1**: Given the OTP error types module, when OTP_LOCKED is defined, then it maps to HTTP status 409 Conflict with error_code='OTP_LOCKED' and a descriptive message indicating the OTP has been locked due to too many failed attempts.
- **ac-2**: Given the OTP error types module, when ACCOUNT_STATE_INVALID is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='ACCOUNT_STATE_INVALID' and a descriptive message indicating the account is locked or deleted.
- **ac-3**: Given the OTP error types module, when MISSING_REQUIRED_FIELD is defined, then it maps to HTTP status 400 Bad Request with error_code='MISSING_REQUIRED_FIELD' and a descriptive message indicating a required field is missing.
- **ac-4**: Given the OTP error types module, when OTP_EXPIRED is defined, then it maps to HTTP status 410 Gone with error_code='OTP_EXPIRED' and a descriptive message indicating the OTP has expired.
- **ac-5**: Given the OTP error types module, when INVALID_PASSCODE is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='INVALID_PASSCODE' and a descriptive message indicating the passcode is incorrect.
- **ac-6**: Given the OTP error types module, when OTP_NOT_FOUND is defined, then it maps to HTTP status 404 Not Found with error_code='OTP_NOT_FOUND' and a descriptive message indicating no pending OTP exists for the user.
- **ac-7**: Given the OTP configuration module, when OTP_MAX_ATTEMPTS is defined, then it is exported as a constant with a default value of 5 and can be overridden via environment variable or configuration file.
- **ac-8**: Given the OTP error types and configuration modules, when imported by the OTP service and endpoint controller, then all six error codes and OTP_MAX_ATTEMPTS are accessible without runtime errors.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types module, when OTP_LOCKED is defined, then it maps to HTTP status 409 Conflict with error_code='OTP_LOCKED' and a descriptive message indicating the OTP has been locked due to too many failed attempts.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types module, when ACCOUNT_STATE_INVALID is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='ACCOUNT_STATE_INVALID' and a descriptive message indicating the account is locked or deleted.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types module, when MISSING_REQUIRED_FIELD is defined, then it maps to HTTP status 400 Bad Request with error_code='MISSING_REQUIRED_FIELD' and a descriptive message indicating a required field is missing.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types module, when OTP_EXPIRED is defined, then it maps to HTTP status 410 Gone with error_code='OTP_EXPIRED' and a descriptive message indicating the OTP has expired.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types module, when INVALID_PASSCODE is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='INVALID_PASSCODE' and a descriptive message indicating the passcode is incorrect.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types module, when OTP_NOT_FOUND is defined, then it maps to HTTP status 404 Not Found with error_code='OTP_NOT_FOUND' and a descriptive message indicating no pending OTP exists for the user.
- **IMPACT**: Verify acceptance criterion: Given the OTP configuration module, when OTP_MAX_ATTEMPTS is defined, then it is exported as a constant with a default value of 5 and can be overridden via environment variable or configuration file.
- **IMPACT**: Verify acceptance criterion: Given the OTP error types and configuration modules, when imported by the OTP service and endpoint controller, then all six error codes and OTP_MAX_ATTEMPTS are accessible without runtime errors.