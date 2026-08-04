# Enable OTP Re-request

| | |
|---|---|
| **ID** | US-009 |
| **Feature** | F-02 — OTP Verification |
| **Epic** | EP-002 — OTP Validation Logic |
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

### Purpose

This specification defines the behavior of the User Management Service when a user requests a new One-Time Password (OTP) after one has already been issued. It exists to ensure users who did not receive or whose OTP has expired can recover the verification flow without re-registering.

---

### Scope

This specification covers the OTP re-request capability within the User Management Service, including eligibility validation, rate limiting, OTP invalidation, new OTP generation and delivery, and response behavior. It applies to any flow in which a valid OTP session exists and the user requests a replacement code.

---

### Non-Goals

- Initial OTP issuance during registration or login flows
- OTP verification logic and outcomes
- Password recovery or reset flows
- Account deletion flows
- Authentication token issuance
- User profile management
- Delivery channel selection or preference management
- Administrative override of OTP state

---

### Key Entities

**OTP Request**
- Identifier: unique token (text)
- Recipient reference: user identity handle (text)
- Delivery address: contact destination (text)
- Code: one-time secret value (text)
- Status: current lifecycle state — pending, verified, expired, invalidated (text)
- Issued at: timestamp of creation (datetime)
- Expires at: timestamp of expiry (datetime)
- Attempt count: number of verification attempts made (integer)
- Resend count: number of re-requests made for the same session (integer)

Relationships:
- OTP Request belongs to exactly one User Account (many-to-one)
- User Account may have at most one active OTP Request at any given time

**User Account**
- Identifier: unique system identity (text)
- Activation status: whether the account has been verified (boolean)
- Registration timestamp: when the account was created (datetime)

---

### Functional Requirements

FR-001: User Management Service SHALL accept a re-request for a new OTP only when a prior OTP session exists for the identified user. [P1]

FR-002: User Management Service SHALL invalidate the previously issued OTP before generating a replacement, ensuring only one active OTP exists per user at any time. [P1]

FR-003: User Management Service SHALL generate a new OTP with a freshly calculated expiry period upon a valid re-request. [P1]

FR-004: User Management Service SHALL deliver the newly generated OTP to the same delivery address used in the original OTP session. [P1]

FR-005: User Management Service SHALL reject a re-request if the user's account has already been activated. [P2]

FR-006: User Management Service SHALL reject a re-request if no prior OTP session exists for the identified user. [P2]

FR-007: User Management Service SHALL enforce a maximum number of OTP re-requests per user within a defined time window and MUST reject requests that exceed this limit. [P2]

[NEEDS CLARIFICATION: What is the maximum number of OTP re-requests permitted per user per time window, and what is the duration of that window?] (Assumed: 3 re-requests per 10-minute window.)

FR-008: User Management Service SHALL return a confirmation to the caller indicating that a new OTP has been dispatched, without revealing the OTP value itself. [P1]

FR-009: User Management Service SHALL return a rejection response describing why the re-request was denied when eligibility conditions are not met, without disclosing sensitive account state beyond what is necessary. [P2]

FR-010: User Management Service SHOULD notify the downstream notification service to deliver the new OTP through the appropriate channel without exposing the delivery mechanism details to the caller. [P1]

FR-011: User Management Service SHALL record each re-request event, incrementing the resend count on the OTP session record. [P2]

FR-012: User Management Service MUST NOT allow a re-request to reset or clear prior failed verification attempt counts accumulated on the original OTP session. [P2]

[NEEDS CLARIFICATION: Should failed verification attempt counts carry over to the new OTP, or should the new OTP begin with a fresh attempt count?] (Assumed: attempt count resets to zero on a new OTP issuance, but resend count carries forward.)

---

### Assumptions

**A-001**: A user identity handle (such as an email address or phone number) is sufficient to locate an existing OTP session without requiring authentication. Affects: FR-001, FR-002, FR-006.

**A-002**: The delivery address for the re-requested OTP is always the same as that used in the original OTP session; the user cannot change it during re-request. Affects: FR-004.

**A-003**: The OTP expiry duration for re-issued codes is identical to that of originally issued codes. Affects: FR-003.

**A-004**: Rate limiting applies per user identity, not per delivery address or IP address. Affects: FR-007.

---

### Edge Cases

**EC-001**
Given a user has an active OTP session and has already reached

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification: OTP Re-Request Flow
**Service**: User Management Service (S-101)
**Feature**: OTP Resend (`POST /api/v1/otp/resend`)
**Functional Spec Coverage**: FR-001 through FR-012

---

## 1. Contracts & Interfaces

### 1.1 API Contract

**Endpoint**: `POST /api/v1/otp/resend`
**Auth**: None (unauthenticated; identity resolved via body handle per A-001)

**Request body fields**: `identity_handle` (string, required) — the user's email address or phone number.

**Success response**: HTTP 200. Body contains `message` (string, non-revealing confirmation) and `resend_count` (integer). The OTP value SHALL NOT appear in the response (FR-008).

**Rejection responses**:
- HTTP 404 when no prior OTP session exists (FR-006).
- HTTP 409 when the account is already activated (FR-005).
- HTTP 429 when the rate limit is exceeded (FR-007). Response MUST include a `retry_after_seconds` field.
- HTTP 422 for malformed input.

Error bodies SHALL include an `error_code` (machine-readable string) and `message` (human-readable). They MUST NOT expose raw account flags or OTP codes (FR-009).

### 1.2 Data Model Changes

**Table `otp_requests`** (existing): Add column `resend_count` (INTEGER NOT NULL DEFAULT 0). This column is incremented on each successful re-request (FR-011). The `attempt_count` column already exists and SHALL NOT be reset when a new OTP row is created (FR-012); the new row begins with `attempt_count = 0` per the stated assumption, but `resend_count` carries the prior session's value plus one.

**Table `otp_resend_rate_limits`** (new): Columns — `user_account_id` (TEXT, PK), `window_start` (TIMESTAMPTZ NOT NULL), `request_count` (INTEGER NOT NULL DEFAULT 0). Index on `user_account_id`. This table tracks the rolling 10-minute window per A-004.

No changes to the `user_accounts` table are required.

---

## 2. Test Strategy

All tests reference the contracts defined in Section 1.

| Test ID | Scenario | Contract Property Validated | FR |
|---|---|---|---|
| T-001 | Valid re-request returns HTTP 200 and increments `resend_count` | Success response shape; `resend_count` | FR-001, FR-003, FR-008, FR-011 |
| T-002 | No prior OTP session returns HTTP 404 | 404 contract; `error_code` present | FR-006 |
| T-003 | Already-activated account returns HTTP 409 | 409 contract; no sensitive data leaked | FR-005, FR-009 |
| T-004 | Fourth re-request within 10 minutes returns HTTP 429 with `retry_after_seconds` | 429 contract field presence | FR-007 |
| T-005 | Prior OTP row status set to `invalidated` after re-request | DB state; only one active OTP exists | FR-002 |
| T-006 | New OTP row has `expires_at` = now + configured TTL | `expires_at` freshness | FR-003 |
| T-007 | New OTP row uses same `delivery_address` as prior row | `delivery_address` equality | FR-004 |
| T-008 | New OTP row has `attempt_count = 0`; `resend_count` = prior + 1 | Column values | FR-011, FR-012 |
| T-009 | Notification service publish called once with correct payload | Inter-service call count and shape | FR-010 |
| T-010 | OTP value absent from all response bodies and logs | Response body inspection; log scrubbing | FR-008 |

Unit tests SHALL use an in-memory repository stub. Integration tests SHALL use a real PostgreSQL instance via Testcontainers. T-009 SHALL use a mock message broker.

---

## 3. Implementation Approach

### 3.1 Core Classes and Methods

**`OtpResendController`** (`POST /api/v1/otp/resend`): Parses and validates the request body, delegates to `OtpResendService`, maps domain exceptions to HTTP responses.

**`OtpResendService.resend(identityHandle: String): ResendResult`**:
1. Calls `UserAccountRepository.findByIdentityHandle(handle)` — throws `UserNotFoundException` if absent (→ HTTP 404).
2. Checks `userAccount.activationStatus` — throws `AccountAlread

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._