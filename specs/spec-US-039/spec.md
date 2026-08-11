# Implement User Authentication Flow

| | |
|---|---|
| **ID** | US-039 |
| **Feature** | F-03 — User Login |
| **Epic** | EP-002 — Develop Secure Authentication Logic |
| **Status** | Draft |
| **Date** | 2026-07-02 |

## Background

Part of feature *User Login*.

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

This specification defines the authentication flow for the User Management Service, enabling registered users to prove their identity and obtain a secure session. It exists to ensure consistent, secure, and auditable login behavior across all consuming clients.

---

### Scope

This specification covers credential-based login, session token issuance, logout, and the full password recovery and reset flow within the User Management Service. It applies to interactions between end users, the API Gateway (acting as the inbound traffic router and token validator), and the User Management Service itself.

---

### Non-Goals

- New user registration and account activation are out of scope.
- OTP issuance and verification flows are out of scope (covered separately).
- Authorization and role-based access control decisions are out of scope.
- API Gateway rate-limiting configuration is out of scope.
- Multi-factor authentication beyond password-based login is out of scope.
- Social or federated identity provider login is out of scope.
- User profile management after login is out of scope.

---

### Key Entities

**User**
- identifier: unique user identity token (data type: opaque identifier)
- email\_address: string
- credential\_hash: string (stored representation of password; never exposed)
- account\_status: enumeration (pending, active, suspended, deleted)
- failed\_login\_count: integer
- lockout\_until: datetime or null
- last\_login\_at: datetime or null

**Session**
- session\_token: opaque string
- issued\_at: datetime
- expires\_at: datetime
- user\_identifier: references User (cardinality: many Sessions to one User)
- revoked: boolean

**Password Recovery Request**
- recovery\_token: opaque string
- requested\_at: datetime
- expires\_at: datetime
- consumed: boolean
- user\_identifier: references User (cardinality: many Requests to one User)

---

### Functional Requirements

FR-001: The User Management Service SHALL accept a login request containing an email address and a plaintext password submitted by a client.

FR-002: The User Management Service SHALL verify that the submitted email address corresponds to an existing, active user account before proceeding with credential validation.

FR-003: The User Management Service SHALL reject login attempts for accounts whose status is not active, returning a descriptive rejection indicating the account is not eligible to authenticate.

FR-004: The User Management Service SHALL validate the submitted password against the stored credential representation without exposing the stored value in any response or log.

FR-005: The User Management Service SHALL issue a time-bounded session token to the client upon successful credential validation.

FR-006: The User Management Service SHALL record the timestamp of each successful login against the user's record.

FR-007: The User Management Service SHALL increment a failed login counter on the user's record each time credential validation fails.

FR-008: The User Management Service SHALL lock a user account temporarily after a consecutive failed login threshold is exceeded, preventing further login attempts until the lockout period expires.

[NEEDS CLARIFICATION: What is the exact failed-attempt threshold and lockout duration?] (Assumed: 5 consecutive failures trigger a 15-minute lockout.)

FR-009: The User Management Service SHALL reset the failed login counter to zero upon a successful login.

FR-010: The User Management Service SHALL accept a logout request carrying a valid session token and immediately revoke that session, rendering it unusable for future authenticated operations.

FR-011: The User Management Service SHALL reject any request presenting a revoked or expired session token, returning a rejection that indicates the session is no longer valid.

FR-012: The User Management Service SHALL accept a password recovery request containing a registered email address and, when the address matches an active account, dispatch a time-limited recovery token to that address via the notification integration point.

FR-013: The User Management Service MUST NOT reveal whether a submitted email address exists in the system when responding to a password recovery request, in order to prevent user enumeration.

FR-014: The User Management Service SHALL accept a password reset request containing a valid, unexpired, and unconsumed recovery token together with a new password.

FR-015: The User Management Service SHALL mark a recovery token as consumed immediately after a successful password reset, preventing its reuse.

FR-016: The User Management Service SHALL reject a password reset request that presents an expired or already-consumed recovery token.

FR-017: The User Management Service SHALL enforce a minimum complexity policy on newly submitted passwords during the reset flow, rejecting passwords that do not meet the policy.

[NEEDS CLARIFICATION: What are the exact password complexity rules (minimum length, character classes)?] (Assumed: Minimum 8 characters, at least one uppercase letter, one digit, and one special character.)

FR-018: The User Management Service SHALL expose a health check capability that allows infrastructure monitoring to confirm the service is operational without requiring authentication.

FR-019: The User Management Service SHOULD propagate authentication events (login success, login failure, account lockout, password reset) to an audit or event integration point for downstream consumption.

---

### Assumptions

A-001 (affects FR-002, FR-003): All users attempting to log in have previously completed the registration and account activation flow

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Authentication Flow
**Service**: User Management Service (S-101)
**Spec Version**: 1.0
**FRs Covered**: FR-001 through FR-019

---

## 1. Contracts & Interfaces

### 1.1 Data Model

**Table: `users`** (existing; columns added)

`failed_login_count INTEGER NOT NULL DEFAULT 0`, `lockout_until TIMESTAMPTZ NULL`, `last_login_at TIMESTAMPTZ NULL`. Index: `idx_users_email` on `email_address` (unique). `account_status` MUST be an enum type `user_account_status` with values `pending`, `active`, `suspended`, `deleted`.

**Table: `sessions`** (new)

`session_token VARCHAR(128) PRIMARY KEY`, `user_id UUID NOT NULL REFERENCES users(id)`, `issued_at TIMESTAMPTZ NOT NULL`, `expires_at TIMESTAMPTZ NOT NULL`, `revoked BOOLEAN NOT NULL DEFAULT FALSE`. Indexes: `idx_sessions_user_id` on `user_id`; `idx_sessions_expires_at` on `expires_at` for TTL sweep jobs.

**Table: `password_recovery_requests`** (new)

`recovery_token VARCHAR(128) PRIMARY KEY`, `user_id UUID NOT NULL REFERENCES users(id)`, `requested_at TIMESTAMPTZ NOT NULL`, `expires_at TIMESTAMPTZ NOT NULL`, `consumed BOOLEAN NOT NULL DEFAULT FALSE`. Index: `idx_prr_user_id` on `user_id`.

### 1.2 API Contracts

All endpoints reside under the existing service base. Request and response bodies are `application/json`.

**POST /api/v1/auth/login** — Accepts `email_address` (string) and `password` (string). Returns `200` with `session_token` and `expires_at` on success. Returns `401` for invalid credentials or inactive account. Returns `423` when the account is locked.

**POST /api/v1/auth/logout** — Requires `Authorization: Bearer <session_token>` header. Returns `204` on successful revocation. Returns `401` if the token is expired or already revoked.

**POST /api/v1/auth/password-recovery** — Accepts `email_address`. Always returns `202` regardless of whether the address is found (satisfying FR-013).

**POST /api/v1/auth/password-reset** — Accepts `recovery_token` and `new_password`. Returns `200` on success. Returns `400` for complexity violations. Returns `410` for expired or consumed tokens.

**GET /health** — Returns `200` with `{"status":"ok"}`. No authentication required (FR-018).

---

## 2. Test Strategy

Tests SHALL be written before implementation and organized by contract boundary.

**Unit tests** in `AuthServiceTest`:
- `testLogin_success` — validates FR-001, FR-005, FR-006, FR-009: asserts `session_token` returned, `last_login_at` updated, `failed_login_count` reset to zero.
- `testLogin_inactiveAccount` — validates FR-002, FR-003: mock user with `account_status=suspended`; assert `401` response.
- `testLogin_badPassword_incrementsCounter` — validates FR-007: assert `failed_login_count` incremented after each failure.
- `testLogin_lockoutTriggered` — validates FR-008: simulate 5 consecutive failures; assert `lockout_until` set to `NOW() + 15 minutes` and sixth attempt returns `423`.
- `testLogout_revokesSession` — validates FR-010: assert `revoked=true` in `sessions` row and subsequent use returns `401`.
- `testSessionValidation_expiredToken` — validates FR-011: assert `401` returned for token past `expires_at`.
- `testPasswordRecovery_alwaysReturns202` — validates FR-013: call with unknown email; assert `202` with no user-enumeration signal.
- `testPasswordRecovery_dispatchesNotification` — validates FR-012: mock `NotificationGateway`; assert `sendRecoveryEmail` invoked for active user.
- `testPasswordReset_success` — validates FR-014, FR-015: assert `consumed=true` after reset, new credential hash stored.
- `testPasswordReset_expiredToken` — validates FR-016: assert `410` returned.
- `testPasswordReset_complexityViolation` — validates FR-017: submit password `"simple"`; assert `400` with policy error.
- `testHealthCheck_noAuth` — validates FR-018: assert `200` without `Authorization` header.

**Integration tests** in `AuthFlowIntegrationTest` SHALL exercise the full HTTP stack against a test database instance, covering the login-to

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._