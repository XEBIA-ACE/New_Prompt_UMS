## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Authentication Service
## User Management Service (S-101) · Auth Module

---

## 1. Contracts & Interfaces

### 1.1 API Contracts

All endpoints are served under the existing service base. The API Gateway routes inbound REST calls; the service MUST NOT be reachable directly by clients.

**POST /api/v1/auth/login**
Accepts: `email` (string, required), `password` (string, required).
Success: HTTP 200, body contains `session_token` (opaque string) and `expires_at` (ISO-8601 datetime).
Failures: HTTP 401 for invalid credentials; HTTP 403 for inactive or locked account; HTTP 422 for malformed input.

**POST /api/v1/auth/logout**
Accepts: `Authorization: Bearer <session_token>` header.
Success: HTTP 204.
Failures: HTTP 401 for missing or already-revoked token.

**POST /api/v1/auth/password-recovery**
Accepts: `email` (string, required).
Success: HTTP 202 regardless of whether the email is registered (FR-013).
Failures: HTTP 422 for malformed input.

**POST /api/v1/auth/password-reset**
Accepts: `recovery_token` (string, required), `new_password` (string, required).
Success: HTTP 200.
Failures: HTTP 400 for expired or consumed token; HTTP 422 for password failing complexity rules.

**GET /health**
Success: HTTP 200, body contains `status: "ok"` and `db_reachable: boolean`.

### 1.2 Data Schema Contracts

The `users` table MUST contain columns: `id` (UUID PK), `email` (VARCHAR 255, unique index), `password_hash` (VARCHAR 255), `status` (ENUM: active, inactive, locked), `failed_login_count` (SMALLINT DEFAULT 0), `last_login_at` (TIMESTAMPTZ nullable).

The `sessions` table MUST contain columns: `id` (UUID PK), `user_id` (UUID FK → users.id), `token` (VARCHAR 512, unique index), `issued_at` (TIMESTAMPTZ), `expires_at` (TIMESTAMPTZ), `revoked` (BOOLEAN DEFAULT false). A composite index on `(token, revoked)` SHALL be created to support O(1) token lookups during logout and validation.

The `password_recovery_requests` table MUST contain columns: `id` (UUID PK), `user_id` (UUID FK → users.id), `token` (VARCHAR 512, unique index), `requested_at` (TIMESTAMPTZ), `expires_at` (TIMESTAMPTZ), `consumed` (BOOLEAN DEFAULT false).

---

## 2. Test Strategy

Tests are organized by layer. Each test case references the FR it validates.

### 2.1 Unit Tests — `AuthService` class

`AuthServiceTest::testLoginSuccessIssuesSessionToken` validates FR-001, FR-002, FR-004, FR-005, FR-006, FR-009. Mocks `UserRepository` returning an active user; asserts `SessionRepository.save()` is called with a non-null token and that `user.last_login_at` is updated.

`AuthServiceTest::testLoginFailsForUnknownEmail` validates FR-002. Asserts HTTP 401 equivalent exception is raised without touching password comparison.

`AuthServiceTest::testLoginFailsForInactiveAccount` validates FR-003. Supplies a user with status `inactive`; asserts `AccountStatusException` is thrown before password comparison.

`AuthServiceTest::testLoginIncrementsFailedCountOnBadPassword` validates FR-007. Supplies correct email, wrong password; asserts `UserRepository.incrementFailedLoginCount()` is called.

`AuthServiceTest::testAccountLockedAfterFiveConsecutiveFailures` validates FR-008. Simulates `failed_login_count` at 4; asserts that after one more failure `UserRepository.lockAccount()` is called and subsequent login raises `AccountLockedException`.

`AuthServiceTest::testPasswordComplexityRejectedOnReset` validates FR-017. Supplies `new_password = "abc"`; asserts `PasswordComplexityException` is raised before any DB write.

`AuthServiceTest::testRecoveryTokenConsumedAfterReset` validates FR-015, FR-016. Supplies valid unexpired token; asserts `PasswordRecoveryRequestRepository.markConsumed()` is called.

`AuthServiceTest::testAllSessionsInvalidatedOnPasswordReset` validates FR-018. Asserts `SessionRepository.revokeAllForUser(userId)` is called immediately after a successful reset.

### 2.2 Integration Tests — HTTP Layer

`AuthControllerIntegration