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