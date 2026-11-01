# Implementation Plan: e5412983-c492-5a04-a943-0f2cae579173

## Technical Context
- Accepted impact analysis (sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0)
- unresolved reference (requirement:acceptance-criteria)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0)
- Resolve or explicitly accept the following implementation-readiness items:
  - ACCOUNT_STATE_INVALID and OTP_LOCKED will be used by later stories to change behaviour (responses, lockout flows), but this story itself is limited to defining constants.
  - Are there minimum and maximum allowed values for OTP_MAX_ATTEMPTS to prevent misconfiguration that weakens security (e.g., 0, 1, or extremely high values)?
  - Are there non-HTTP consumers (e.g., message-based or internal RPC services) that will rely on these new constants and need coordination for rollout?
  - Do logging, monitoring, or audit pipelines need to treat the new error codes specially (e.g., for security alerts) once behaviour stories are implemented?
  - Existing code that imports the OTP config or error definitions modules will not break because the change is strictly additive and does not modify pre-existing exports.
  - How should client-facing APIs and UIs map OTP_LOCKED and ACCOUNT_STATE_INVALID into user-visible messages while avoiding account enumeration risks?
  - Is OTP_MAX_ATTEMPTS intended to be global for the application, or can it vary per tenant, environment, or OTP use-case?
  - Is there any backward-compatibility concern with existing clients that currently interpret a 404 for locked/deleted accounts, once behaviour changes are implemented in later stories?
  - No code-level evidence is available to confirm the current structure of the OTP config or error definitions modules or how environment configuration is read.
  - No codebase evidence was available (grounding provider is None); every impact listed is inferred from the requirement text, not measured.
  - No codebase evidence: the project's grounding provider is None, so this impact analysis was inferred by the model from the requirement text alone
  - No database schema or persistent data format changes are required to support OTP_MAX_ATTEMPTS, OTP_LOCKED, or ACCOUNT_STATE_INVALID in this story.
  - No runtime metrics or logs are available to validate current OTP attempt handling or account state error responses.
  - OTP_MAX_ATTEMPTS being defaulted to 5 is a product/security decision already agreed and not to be debated within this story.
  - Should invalid or missing environment override values for OTP_MAX_ATTEMPTS cause a startup failure, a warning with fallback to default, or silent fallback?
  - Should there be explicit documentation updates (runbooks, API docs) in the same story, or will those be handled separately?
  - Switching from a 404 response to ACCOUNT_STATE_INVALID for locked or deleted accounts will be implemented in a separate story and is out of scope here, despite being mentioned in the description.
  - The OTP config module currently exists and already exposes other OTP-related configuration values, and adding OTP_MAX_ATTEMPTS is consistent with its existing patterns.
  - The OTP error definitions module already exists and exposes other error codes in a similar shape (e.g., objects with a code property).
  - The environment variable name and validation rules for overriding OTP_MAX_ATTEMPTS will be clarified at implementation time, as they are not specified in the requirement.
  - The same OTP_MAX_ATTEMPTS value is intended to apply across all OTP verification flows rather than being per-tenant or per-channel, unless later requirements specify otherwise.
  - The system supports environment-based configuration overrides and has a standard way to read and parse integer values from the environment.
  - There is no documentation provided on existing security policies for OTP lockout thresholds or account state error handling, so alignment is assumed rather than verified.
  - What are the precise semantics of ACCOUNT_STATE_INVALID in terms of account lifecycle states (locked, suspended, soft-deleted, hard-deleted), and will a single code cover all of these?
  - What exact environment variable name should be used to override OTP_MAX_ATTEMPTS, and where should this be documented?
  - Which existing components implement each acceptance criterion?

## Contract Changes
- (inferred) OTP-related HTTP or RPC endpoints may later use OTP_MAX_ATTEMPTS and the new error codes to standardize lockout and invalid-account responses 
  - Method: (inferred) Likely affects OTP verification and account status operations across one or more HTTP methods (e.g., POST for verification), but no specific method is known from the requirement.
  - Contract change required: yes (grounded API impact identified).
- (inferred) Future security or audit events related to OTP lockout or invalid account state may reference OTP_LOCKED and ACCOUNT_STATE_INVALID codes for consistency.
  - Contract change required: yes (grounded event-contract impact identified).
- (inferred) Introduction of OTP_MAX_ATTEMPTS implies there is or will be a persisted or in-memory attempt_count associated with OTPs or accounts, but this story does not change schemas or storage formats.
  - Contract change required: yes (grounded data-contract impact identified).
- (inferred) ACCOUNT_STATE_INVALID suggests existing representations of account state (e.g., active/locked/deleted) already exist; this change only adds an error code that will later map to those states.
  - Contract change required: yes (grounded data-contract impact identified).

## Security and Quality
- S2-AC1: Ensure the default OTP_MAX_ATTEMPTS value (5) is chosen and documented as a security-reasonable brute-force threshold and that it is not accidentally reduced in non-production environments without review.
- S2-AC2: Treat the environment override for OTP_MAX_ATTEMPTS as a security-sensitive configuration, validating it is a sane positive integer and documenting operational guidance for setting it to avoid weakening brute-force protection.
- S2-AC3: Document how OTP_LOCKED should be used by downstream logic to enforce lockout consistently once implemented, aligning with security policies on account/OTP lockouts.
- S2-AC4: Document how ACCOUNT_STATE_INVALID should be used instead of generic 404s so that client-visible behaviour does not leak unnecessary account existence details while still handling locked/deleted states appropriately.
- S2-AC5: When modifying the OTP config module, confirm no existing security-related configuration values are changed in meaning or defaults, avoiding regressions in OTP security posture.
- S2-AC6: When modifying the OTP error definitions module, confirm no existing security-relevant error codes or mappings are altered, preventing accidental changes to how errors are surfaced or logged.

## Verification Plan
- **S2-AC1**: Given the OTP config module is imported, when OTP_MAX_ATTEMPTS is read, then it returns the integer 5 when no override environment variable is set.
- **S2-AC2**: Given an environment variable is set to a valid integer override for OTP_MAX_ATTEMPTS, when the OTP config module is imported, then OTP_MAX_ATTEMPTS reflects the overridden value rather than the default 5.
- **S2-AC3**: Given the OTP error definitions module is imported, when OTP_LOCKED is accessed, then it exposes a code property whose string value is exactly 'OTP_LOCKED'.
- **S2-AC4**: Given the OTP error definitions module is imported, when ACCOUNT_STATE_INVALID is accessed, then it exposes a code property whose string value is exactly 'ACCOUNT_STATE_INVALID'.
- **S2-AC5**: Given the OTP config module is modified, when all pre-existing exports are inspected, then every export that existed before this story is still present and unchanged.
- **S2-AC6**: Given the OTP error definitions module is modified, when all pre-existing exports are inspected, then every export that existed before this story is still present and unchanged.
- **IMPACT**: S2-AC1: Add or update automated tests to assert that importing the OTP config module exposes OTP_MAX_ATTEMPTS with a default integer value of 5 when no environment override is present.
- **IMPACT**: S2-AC2: Add or update automated tests to verify that setting a valid integer environment override for OTP_MAX_ATTEMPTS results in the exported constant reflecting the overridden value and that type conversion behaves as expected.
- **IMPACT**: S2-AC3: Add or update automated tests to confirm that importing the OTP error definitions module exposes OTP_LOCKED with a code property exactly equal to 'OTP_LOCKED'.
- **IMPACT**: S2-AC4: Add or update automated tests to confirm that importing the OTP error definitions module exposes ACCOUNT_STATE_INVALID with a code property exactly equal to 'ACCOUNT_STATE_INVALID'.
- **IMPACT**: S2-AC5: Add or update regression tests (e.g., snapshot or explicit key checks) to ensure all pre-existing exports from the OTP config module remain present and unchanged after adding OTP_MAX_ATTEMPTS.
- **IMPACT**: S2-AC6: Add or update regression tests to ensure all pre-existing exports from the OTP error definitions module remain present and unchanged after adding OTP_LOCKED and ACCOUNT_STATE_INVALID.

## Provenance
- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`