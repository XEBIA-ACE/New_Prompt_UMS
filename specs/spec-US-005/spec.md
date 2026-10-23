# Verify OTP on User Entry

| | |
|---|---|
| **ID** | US-005 |
| **Feature** | F-02 — OTP Verification |
| **Epic** | EP-001 — OTP Generation and Delivery |
| **Status** | Draft |
| **Date** | 2026-07-02 |

## Background

Part of feature *OTP Verification*.

## Acceptance Criteria

### Story

- [ ] (none)

### Epic

- [ ] (none)

## Proposed Solution

### Functional Specification

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

**Functional Specification**
**Story**: US-005 – Verify OTP on User Entry
**Service**: User Management Service (S-101)
**Feature**: OTP Verification

---

### Purpose

This specification defines the behavior of the User Management Service when a user submits a one-time passcode (OTP) for verification. It ensures that only users who present a valid, unexpired, and correctly matched OTP are granted verified status.

---

### Scope

This specification covers the OTP verification capability within the User Management Service, including input validation, OTP matching logic, attempt tracking, expiry enforcement, and downstream state transitions triggered by successful verification. It does not cover OTP generation, delivery, or resend flows.

---

### Non-Goals

- OTP generation and initial dispatch to the user
- OTP resend or refresh workflows
- Password recovery or reset flows
- User registration or account creation
- Authentication token issuance beyond confirming verified status
- Rate limiting or throttling policy configuration
- Notification delivery mechanisms (e.g., SMS, email infrastructure)
- Audit logging implementation details
- Session management post-verification

---

### Key Entities

**OTP Record**
- identifier: unique reference
- associated_user: reference to User (cardinality: many OTP Records to one User)
- passcode_value: masked credential string
- issued_at: timestamp
- expires_at: timestamp
- status: enumeration (pending, verified, expired, invalidated)
- attempt_count: integer

**User**
- identifier: unique reference
- account_status: enumeration (unverified, active, locked, deleted)
- Related to OTP Record (one User to many OTP Records)

**Verification Result**
- outcome: enumeration (success, failure, expired, locked)
- verified_at: timestamp (populated on success)
- Related to OTP Record (one Verification Result to one OTP Record)

---

### Assumptions

**A-001**: A user must have a previously issued, non-consumed OTP record in a pending state before verification can succeed. *(Affects: FR-001, FR-003, FR-006)*

**A-002**: The OTP has a finite validity window established at issuance time; this specification assumes that window is enforced at the moment of verification. *(Affects: FR-004, FR-005)*

**A-003**: A maximum number of consecutive failed verification attempts is defined by system policy; this specification assumes that threshold exists and is enforced. *(Affects: FR-007, FR-008)*

**A-004**: Successful OTP verification may transition the user's account to an active or verified state, depending on the context (e.g., registration activation vs. step-up authentication). [NEEDS CLARIFICATION: Does OTP verification always activate the account, or does it serve multiple contextual purposes (e.g., login step-up, password recovery confirmation)?] (Assumed: OTP verification in this story primarily serves account activation after registration.)

---

### Functional Requirements

**FR-001 [P1]**: User Management Service SHALL accept a verification request containing a user identity reference and a submitted passcode value.

**FR-002 [P1]**: User Management Service SHALL reject a verification request that is missing either the user identity reference or the submitted passcode value, and SHALL inform the requester that required fields are absent.

**FR-003 [P1]**: User Management Service SHALL locate the most recent pending OTP record associated with the provided user identity reference before proceeding with any comparison.

**FR-004 [P1]**: User Management Service SHALL compare the submitted passcode value against the stored passcode value using a secure, timing-safe comparison method.

**FR-005 [P1]**: User Management Service SHALL reject verification and return an expiry failure outcome when the current time exceeds the OTP record's expiry timestamp, regardless of passcode correctness.

**FR-006 [P1]**: User Management Service SHALL reject verification with a not-found failure outcome when no pending OTP record exists for the provided user identity reference.

**FR-007 [P2]**: User Management Service SHALL increment the attempt count on the OTP record each time a verification request is received and the passcode value does not match.

**FR-008 [P2]**: User Management Service SHALL invalidate the OTP record and lock further verification attempts when the attempt count reaches the system-defined maximum threshold.

**FR-009 [P2]**: User Management Service SHALL reject verification with a locked outcome when the OTP record has been invalidated due to excessive failed attempts.

**FR-010 [P1]**: User Management Service SHALL mark the OTP record status as verified and record the verification timestamp upon a successful passcode match within the validity window.

**FR-011 [P1]**: User Management Service SHALL transition the associated user's account status to active upon successful OTP verification, provided the account is currently in an unverified state.

**FR-012 [P2]**: User Management Service SHALL reject verification with an account-state failure outcome when the associated user's account is in a locked or deleted state, even if

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification
**Story**: US-005 – Verify OTP on User Entry
**Service**: User Management Service (S-101)
**Version**: 1.0

---

## 1. Contracts & Interfaces

### 1.1 API Contract

**Endpoint**: `POST /api/v1/otp/verify`
**Request Content-Type**: `application/json`

Request body fields: `user_id` (string, required UUID), `passcode` (string, required, 4–8 digits). Both fields MUST be present; absence of either SHALL yield HTTP 400 with error code `MISSING_REQUIRED_FIELD` (covers FR-001, FR-002).

Response codes and bodies:

- **200 OK** — `outcome: "success"`, `verified_at: ISO-8601 timestamp` (FR-010, FR-011)
- **400 Bad Request** — `outcome: "failure"`, `error_code: "MISSING_REQUIRED_FIELD"` (FR-002)
- **404 Not Found** — `outcome: "failure"`, `error_code: "OTP_NOT_FOUND"` (FR-006)
- **409 Conflict** — `outcome: "locked"`, `error_code: "OTP_LOCKED"` (FR-009)
- **410 Gone** — `outcome: "expired"`, `error_code: "OTP_EXPIRED"` (FR-005)
- **422 Unprocessable Entity** — `outcome: "failure"`, `error_code: "INVALID_PASSCODE"` (FR-007)
- **422 Unprocessable Entity** — `outcome: "failure"`, `error_code: "ACCOUNT_STATE_INVALID"` (FR-012)

[NEEDS CLARIFICATION: FR-012 was truncated in the functional spec. It is assumed that a locked or deleted user account SHALL yield HTTP 422 with error code `ACCOUNT_STATE_INVALID` regardless of OTP validity.]

### 1.2 Data Model

**Table: `otp_records`** (existing; columns added or confirmed)

- `id` UUID PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES `users(id)`
- `passcode_hash` VARCHAR(255) NOT NULL — stores HMAC-SHA256 digest, not plaintext
- `issued_at` TIMESTAMPTZ NOT NULL
- `expires_at` TIMESTAMPTZ NOT NULL
- `status` VARCHAR(20) NOT NULL DEFAULT `'pending'` — CHECK IN (`pending`, `verified`, `expired`, `invalidated`)
- `attempt_count` SMALLINT NOT NULL DEFAULT 0
- `verified_at` TIMESTAMPTZ NULL

Index: `idx_otp_records_user_id_status` on (`user_id`, `status`) WHERE `status = 'pending'` — supports FR-003 lookup efficiently.

**Table: `users`** (existing; no new columns required)

- `account_status` VARCHAR(20) NOT NULL — CHECK IN (`unverified`, `active`, `locked`, `deleted`) — used by FR-011, FR-012.

### 1.3 System Policy Constants

`OTP_MAX_ATTEMPTS` SHALL be read from environment variable `OTP_MAX_ATTEMPTS` (default: 5). This value drives FR-007 and FR-008.

---

## 2. Test Strategy

Tests are organized by contract property. All tests MUST run against an isolated test database with seeded fixtures.

**Unit Tests — `OtpVerificationServiceTest`**

- `test_missing_user_id_returns_400` — validates contract §1.1 HTTP 400 / FR-002
- `test_missing_passcode_returns_400` — validates contract §1.1 HTTP 400 / FR-002
- `test_no_pending_otp_returns_404` — validates contract §1.1 HTTP 404 / FR-006
- `test_expired_otp_returns_410_regardless_of_passcode` — seeds an OTP with `expires_at` in the past; validates contract §1.1 HTTP 410 / FR-005; MUST pass both correct and incorrect passcode variants
- `test_locked_otp_returns_409` — seeds OTP with `status = 'invalidated'`; validates FR-009
- `test_wrong_passcode_increments_attempt_count` — asserts `attempt_count` increments by 1 in DB; validates FR-007
- `test_attempt_count_at_max_invalidates_otp` — seeds OTP with `attempt_count = OTP_MAX_ATTEMPTS - 1`; submits wrong passcode; asserts `status = 'invalidated'`; validates FR-008
- `test_correct_passcode_marks_verified_and_activates_user` —

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._