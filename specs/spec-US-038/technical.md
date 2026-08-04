## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Session Management Setup
**Service**: User Management Service (S-101)
**Feature**: US-038 Session Lifecycle Management
**Spec Version**: 1.0

---

## 1. Contracts & Interfaces

### 1.1 Data Model

**Table: `sessions`**

Column `session_id` is a `UUID PRIMARY KEY` generated server-side using a cryptographically secure random source (satisfies FR-009). Column `user_id` is a `UUID NOT NULL` foreign key referencing `users(user_id)`. Column `token_hash` is `VARCHAR(64) NOT NULL` storing the SHA-256 hex digest of the raw session token returned to the client; the raw token is never persisted (satisfies FR-008, FR-009). Column `created_at` is `TIMESTAMPTZ NOT NULL DEFAULT now()`. Column `expires_at` is `TIMESTAMPTZ NOT NULL` set at creation time from the configurable duration (satisfies FR-003, FR-010). Column `invalidated` is `BOOLEAN NOT NULL DEFAULT FALSE` (satisfies FR-005, FR-006). Column `invalidated_at` is `TIMESTAMPTZ NULL`.

Indexes: `idx_sessions_user_id` on `(user_id)` for suspension-triggered bulk invalidation (EC-003). `idx_sessions_token_hash` on `(token_hash)` for O(1) lookup on every authenticated request (FR-004, FR-006). `idx_sessions_expires_at` on `(expires_at)` WHERE `invalidated = FALSE` for scheduled cleanup.

**Table: `users`** (existing) — no schema change required. The `account_status` column of type `ENUM('active','inactive','suspended')` is already assumed present per FR-007 and A-001.

### 1.2 API Contracts

**POST /api/v1/auth/login** (existing endpoint, behavior extended)
- Request body: `email` (string), `password` (string).
- On success: HTTP 200. Response body includes `token` (opaque 256-bit hex string, the raw session token) and `expires_at` (ISO-8601 timestamp).
- On invalid credentials: HTTP 401, error code `AUTH_INVALID_CREDENTIALS` (EC-004).
- On non-active account: HTTP 403, error code `AUTH_ACCOUNT_NOT_ACTIVE` (FR-007).
- On session persistence failure: HTTP 500, error code `SESSION_CREATION_FAILED` (EC-006).

**POST /api/v1/auth/logout** (existing endpoint, behavior extended)
- Request header: `Authorization: Bearer <token>`.
- On success: HTTP 200, body confirms logout.
- On already-invalidated or expired token: HTTP 200, body confirms logout (EC-005, idempotent).
- On missing token: HTTP 401.

**Session validation** is exposed internally via `SessionService.validateSession(rawToken: String): SessionValidationResult`. This is not a public HTTP endpoint; it is called by other handlers within S-101 before processing any authenticated request (A-003).

---

## 2. Test Strategy

Tests are organized in three layers. Each test references the contract property it validates.

**Unit Tests — `SessionServiceTest`**

- `createSession_returnsRawToken_andPersistsHash`: Calls `SessionService.createSession(userId)`, asserts the returned token hashes to the stored `token_hash`. Validates FR-008, FR-009.
- `createSession_setsExpiresAt_fromConfig`: Asserts `expires_at = created_at + SESSION_EXPIRY_SECONDS`. Validates FR-003, FR-010.
- `validateSession_expiredSession_throwsSessionExpiredException`: Inserts a session with `expires_at` in the past, calls `validateSession`. Validates FR-004, EC-001.
- `validateSession_invalidatedSession_throwsSessionInvalidatedException`: Inserts a session with `invalidated = TRUE`, calls `validateSession`. Validates FR-006.
- `invalidateSession_setsInvalidatedTrue_andTimestamp`: Calls `SessionService.invalidateSession(rawToken)`, asserts DB state. Validates FR-005, EC-002.
- `invalidateSession_alreadyInvalidated_noException`: Validates idempotency. Validates EC-005.
- `invalidateAllSessionsForUser_marksAllRows`: Calls `SessionService.invalidateAllForUser(userId)`, asserts all user rows updated. Validates EC-003.

**Integration Tests — `AuthControllerIntegrationTest`**

- `login_validCredentials_activeUser_returns200WithToken`: Full stack through `AuthController → AuthService → SessionService → sessions table`. Validates FR-001, FR-002, FR-008.
- `login_suspendedUser