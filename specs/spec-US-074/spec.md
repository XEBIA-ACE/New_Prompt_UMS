# Activate Account via Confirmation Link

| | |
|---|---|
| **ID** | US-074 |
| **Feature** | F-01 — User Registration |
| **Epic** | EP-004 — Integrate Email Confirmation for Account Activation |
| **Status** | Draft |
| **Date** | 2026-07-02 |

## Background

Part of feature *User Registration*.

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

This specification defines the behavior of the User Management Service when a newly registered user activates their account by following a confirmation link. It ensures that account activation is secure, time-bounded, and idempotent.

---

### Scope

This specification covers the account activation capability of the User Management Service (S-101), specifically the validation and processing of an activation token submitted by a user after registration. It encompasses token verification, account state transitions, and error feedback.

---

### Non-Goals

- Initial user registration and confirmation email dispatch are out of scope.
- Authentication (login) flows following successful activation are out of scope.
- Password creation or reset during activation is out of scope.
- Resending the confirmation link is out of scope.
- Multi-factor or OTP verification during activation is out of scope.
- Administrative account activation by internal operators is out of scope.

---

### Key Entities

**User Account**
- identifier: unique identity value
- email address: text
- account status: enumeration (pending, active, suspended)
- registration timestamp: datetime

**Activation Token**
- token value: opaque string
- associated user identifier: reference to User Account (many-to-one)
- expiry timestamp: datetime
- consumed status: boolean
- issued timestamp: datetime

Relationship: one User Account has at most one outstanding Activation Token at any given time.

---

### Functional Requirements

FR-001: User Management Service SHALL accept an activation request containing a token value submitted by an end user.

FR-002: User Management Service SHALL validate that the submitted token value exists in the system.

FR-003: User Management Service SHALL reject activation when the submitted token does not correspond to any issued token. [P2]

FR-004: User Management Service SHALL verify that the activation token has not passed its expiry timestamp at the moment of the request.

FR-005: User Management Service SHALL reject activation when the token's expiry timestamp has elapsed. [P2]

FR-006: User Management Service SHALL verify that the activation token has not already been consumed.

FR-007: User Management Service SHALL reject activation when the token has already been consumed. [P2]

FR-008: User Management Service SHALL verify that the associated User Account is in the pending state before proceeding.

FR-009: User Management Service SHALL reject activation when the associated User Account is not in the pending state. [P2]

FR-010: User Management Service SHALL transition the User Account status from pending to active upon successful validation of all token conditions.

FR-011: User Management Service SHALL mark the activation token as consumed immediately after a successful account activation.

FR-012: User Management Service SHALL return a confirmation to the requesting client indicating that the account has been successfully activated. [P1]

FR-013: User Management Service SHALL NOT allow a consumed or expired token to activate any account under any circumstances.

FR-014: User Management Service SHOULD notify the user via their registered email address that their account has been successfully activated. [P3]

FR-015: User Management Service SHALL record the timestamp at which the account was activated.

---

### Assumptions

A-001: A confirmation email containing the activation link was dispatched to the user during registration. Affects: FR-001, FR-002.
*(Assumed: the email delivery mechanism is handled by a separate notification service and is not the responsibility of this story.)*

A-002: The activation token is embedded within the confirmation link as a single opaque value. Affects: FR-001, FR-002. [NEEDS CLARIFICATION: Is the token passed as a query parameter, a path segment, or a request body field?] (Assumed: the token is a single opaque value submitted as part of the activation request payload.)

A-003: Token expiry duration is a configurable system policy. Affects: FR-004, FR-005. (Assumed: default expiry is 24 hours from issuance.)

A-004: Each user may have at most one valid activation token outstanding at any time. Affects: FR-006, FR-007, FR-013.

---

### Success Criteria

SC-001: Account status equals active after a valid, unexpired, unconsumed token is submitted.

SC-002: Activation token consumed status equals true immediately after a successful activation event.

SC-003: Activation rejection rate for expired tokens equals 100% when the request timestamp is greater than the token expiry timestamp.

SC-004: Activation timestamp recorded at least once per successful activation event.

---

### Edge Cases

EC-001 — Unknown Token
Given a user submits an activation request,
When the submitted token value does not match any token in the system,
Then the system SHALL reject the request and inform the client that the token is unrecognized.

EC-002 — Expired Token
Given a registered user's activation token has passed its expiry timestamp,
When the user submits that token for activation,
Then the system SHALL reject the request and inform the client that the token has expired.

EC-003 — Already Consumed Token
Given a user has previously activated their account successfully,
When the same token is submitted a second time,
Then the system SHALL reject the request and inform the client that

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Account Activation
**Service**: User Management Service (S-101)
**Feature**: Token-Based Account Activation
**Spec Ref**: FR-001 through FR-015

---

## 1. Contracts & Interfaces

### 1.1 API Contract

**Endpoint**: `POST /api/v1/users/activate`
Routed through the existing API Gateway (Nginx/Kong). No JWT is required; this is a pre-authentication operation.

**Request**: Content-Type `application/json`. The request body SHALL contain a single field `token` (string, non-empty, max 512 characters). This satisfies A-002 by treating the token as a body field rather than a path or query parameter.

[NEEDS CLARIFICATION: Is the activation link in the confirmation email expected to trigger a browser GET that the frontend then converts to a POST, or does the backend directly handle a GET with the token as a query parameter?] (Assumed: the frontend extracts the token from the link and issues a POST to this endpoint.)

**Response Codes**:
- `200 OK` — Account successfully activated (FR-012). Response body SHALL include a `message` field and the `userId`.
- `400 Bad Request` — Token field absent or malformed.
- `404 Not Found` — Token does not exist in the system (FR-003, EC-001).
- `410 Gone` — Token is expired (FR-005, EC-002) or already consumed (FR-007, EC-003).
- `409 Conflict` — Associated account is not in `pending` state (FR-009).
- `500 Internal Server Error` — Unhandled persistence or downstream failure.

Error responses SHALL include a machine-readable `errorCode` field (e.g., `TOKEN_NOT_FOUND`, `TOKEN_EXPIRED`, `TOKEN_CONSUMED`, `ACCOUNT_NOT_PENDING`) and a human-readable `message`.

### 1.2 Data Model Changes

**Table: `users`** (existing)
- ADD COLUMN `activated_at` TIMESTAMP WITH TIME ZONE NULL — records activation timestamp (FR-015).
- ADD COLUMN `status` ENUM(`pending`, `active`, `suspended`) NOT NULL DEFAULT `pending` — MAY already exist; confirmed required here.
- Index: existing primary key on `id` is sufficient.

**Table: `activation_tokens`** (new)
- `id` UUID PRIMARY KEY
- `token_value` VARCHAR(512) NOT NULL — opaque string; MUST be indexed uniquely.
- `user_id` UUID NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
- `issued_at` TIMESTAMP WITH TIME ZONE NOT NULL
- `expires_at` TIMESTAMP WITH TIME ZONE NOT NULL — default 24 hours from `issued_at` (A-003)
- `consumed` BOOLEAN NOT NULL DEFAULT FALSE
- `consumed_at` TIMESTAMP WITH TIME ZONE NULL

Indexes:
- `UNIQUE INDEX idx_activation_tokens_token_value ON activation_tokens(token_value)` — supports O(1) lookup for FR-002.
- `INDEX idx_activation_tokens_user_id ON activation_tokens(user_id)` — supports constraint enforcement per A-004.

---

## 2. Test Strategy

Tests SHALL be written before implementation is merged. Each test group references the contract properties it validates.

**Unit Tests — `ActivationServiceTest`**

- `givenValidToken_whenActivate_thenUserStatusBecomesActive` — validates FR-010, SC-001. Stubs `ActivationTokenRepository.findByTokenValue` and `UserRepository.save`. Asserts `user.status == ACTIVE`.
- `givenValidToken_whenActivate_thenTokenMarkedConsumed` — validates FR-011, SC-002. Asserts `token.consumed == true` and `token.consumed_at` is non-null after `ActivationTokenRepository.save`.
- `givenValidToken_whenActivate_thenActivatedAtRecorded` — validates FR-015, SC-004. Asserts `user.activated_at` is non-null and approximately equal to `Instant.now()`.
- `givenUnknownToken_whenActivate_thenThrowsTokenNotFoundException` — validates FR-003, EC-001.
- `givenExpiredToken_whenActivate_thenThrowsTokenExpiredException` — validates FR-005, EC-002, SC-003. Sets `expires_at` to `now() minus 1 second`.
- `givenConsumedToken_whenActivate_thenThrowsTokenConsumedException` — validates FR-007, EC-003, FR-013.
- `givenNonPendingUser_whenActivate_thenThrowsAccountNotPendingException` — validates FR-009. Tests both `active` and `suspended` states.

**Integration Tests — `

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._