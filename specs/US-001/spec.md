# Feature Specification: US-001

## User Scenarios & Testing
- **US-001**: Given the user has MFA enabled and entered the correct password, when the login attempt is made, then a one-time code is sent to the user's email without creating a session.
- **US-001**: Given the user enters the wrong or expired one-time code, when attempting to verify, then the login is refused and no session is created.

## Functional Requirements
- FR-001: Given the user has MFA enabled and entered the correct password, the system must send a one-time code to the user's email without creating a session.
- FR-002: Given the user enters the wrong one-time code or a code that has expired, the system must refuse the login and ensure no session is created.

## Success Criteria
- **US-001-ac-1**: Given the user has MFA enabled and entered the correct password, when the login attempt is made, then a one-time code is sent to the user's email without creating a session.
- **US-001-ac-2**: Given the user enters the wrong or expired one-time code, when attempting to verify, then the login is refused and no session is created.
- **IMPACT**: Verify acceptance criterion: Given the user has MFA enabled and entered the correct password, when the login attempt is made, then a one-time code is sent to the user's email without creating a session.
- **IMPACT**: Verify acceptance criterion: Given the user enters the wrong or expired one-time code, when attempting to verify, then the login is refused and no session is created.

## Provenance
- **Policy Version**: `ace-spec-format/v1`
- **Accepted Impact Hash**: `sha256:f8f4127a5be09b10b7305770eba8bbdff239405c1f616e2d02ddd635e47c8c13`
- **Accepted Impact Revision**: `1`
- **Repository Base Sha**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Determinism Ref**: `ae246fe2f5b81296`