# Feature Specification: a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8

## User Scenarios & Testing
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types module, when OTP_LOCKED is defined, then it maps to HTTP status 409 Conflict with error_code='OTP_LOCKED' and a descriptive message indicating the OTP has been locked due to too many failed attempts.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types module, when ACCOUNT_STATE_INVALID is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='ACCOUNT_STATE_INVALID' and a descriptive message indicating the account is locked or deleted.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types module, when MISSING_REQUIRED_FIELD is defined, then it maps to HTTP status 400 Bad Request with error_code='MISSING_REQUIRED_FIELD' and a descriptive message indicating a required field is missing.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types module, when OTP_EXPIRED is defined, then it maps to HTTP status 410 Gone with error_code='OTP_EXPIRED' and a descriptive message indicating the OTP has expired.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types module, when INVALID_PASSCODE is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='INVALID_PASSCODE' and a descriptive message indicating the passcode is incorrect.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types module, when OTP_NOT_FOUND is defined, then it maps to HTTP status 404 Not Found with error_code='OTP_NOT_FOUND' and a descriptive message indicating no pending OTP exists for the user.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP configuration module, when OTP_MAX_ATTEMPTS is defined, then it is exported as a constant with a default value of 5 and can be overridden via environment variable or configuration file.
- **a96cf7cd-f2e8-5168-a[REDACTED-PHONE]c8**: Given the OTP error types and configuration modules, when imported by the OTP service and endpoint controller, then all six error codes and OTP_MAX_ATTEMPTS are accessible without runtime errors.

## Functional Requirements
- FR-001: Given the OTP error types module, when OTP_LOCKED is defined, then it maps to HTTP status 409 Conflict with error_code='OTP_LOCKED' and a descriptive message indicating the OTP has been locked due to too many failed attempts.
- FR-002: Given the OTP error types module, when ACCOUNT_STATE_INVALID is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='ACCOUNT_STATE_INVALID' and a descriptive message indicating the account is locked or deleted.
- FR-003: Given the OTP error types module, when MISSING_REQUIRED_FIELD is defined, then it maps to HTTP status 400 Bad Request with error_code='MISSING_REQUIRED_FIELD' and a descriptive message indicating a required field is missing.
- FR-004: Given the OTP error types module, when OTP_EXPIRED is defined, then it maps to HTTP status 410 Gone with error_code='OTP_EXPIRED' and a descriptive message indicating the OTP has expired.
- FR-005: Given the OTP error types module, when INVALID_PASSCODE is defined, then it maps to HTTP status 422 Unprocessable Entity with error_code='INVALID_PASSCODE' and a descriptive message indicating the passcode is incorrect.
- FR-006: Given the OTP error types module, when OTP_NOT_FOUND is defined, then it maps to HTTP status 404 Not Found with error_code='OTP_NOT_FOUND' and a descriptive message indicating no pending OTP exists for the user.
- FR-007: Given the OTP configuration module, when OTP_MAX_ATTEMPTS is defined, then it is exported as a constant with a default value of 5 and can be overridden via environment variable or configuration file.
- FR-008: Given the OTP error types and configuration modules, when imported by the OTP service and endpoint controller, then all six error codes and OTP_MAX_ATTEMPTS are accessible without runtime errors.

## Success Criteria
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

## Provenance
- **Policy Version**: `ace-spec-format/v1`
- **Accepted Impact Hash**: `sha256:1f93ac99f7585f0b2a92160027e8d8a6ec8401b47e8d71b7c162d2bc75467a59`
- **Accepted Impact Revision**: `3`
- **Repository Base Sha**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Determinism Ref**: `86da275298e43b88`