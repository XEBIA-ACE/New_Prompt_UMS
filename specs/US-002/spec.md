# Feature Specification: US-002

## User Scenarios & Testing
- **US-002**: Given a password reset link is issued, when the link is not used within 15 minutes, then the link expires.
- **US-002**: Given an expired link, when a user tries to use it, then they are informed that the link has expired.

## Functional Requirements
- FR-001: Given a password reset link is issued, when the link is not used within 15 minutes, then the link expires.
- FR-002: Given an expired link, when a user tries to use it, then they are informed that the link has expired.

## Success Criteria
- **US-002-ac-1**: Given a password reset link is issued, when the link is not used within 15 minutes, then the link expires.
- **US-002-ac-2**: Given an expired link, when a user tries to use it, then they are informed that the link has expired.
- **IMPACT**: Verify acceptance criterion: Given a password reset link is issued, when the link is not used within 15 minutes, then the link expires.
- **IMPACT**: Verify acceptance criterion: Given an expired link, when a user tries to use it, then they are informed that the link has expired.

## Provenance
- **Policy Version**: `ace-spec-format/v1`
- **Accepted Impact Hash**: `sha256:d411288dee81d3763675fbc96b89d21e5d28d7ffde8a74ce4772b84dad33c05c`
- **Accepted Impact Revision**: `1`
- **Repository Base Sha**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Determinism Ref**: `ae246fe2f5b81296`