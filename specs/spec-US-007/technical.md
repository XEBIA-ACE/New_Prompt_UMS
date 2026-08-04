## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification: Send OTP

**Story ID**: US-007
**Service**: User Management Service (S-101)
**Tech Spec Version**: 1.0

---

## 1. Contracts & Interfaces

### 1.1 API Contract

**Endpoint**: POST /api/v1/otp/send
**Auth**: None required (pre-authentication context per A-001)

**Request body fields**: identity (string, required), purpose (string, required; enumerated values: identity_verification, login_confirmation)

**Response contracts**:
- 202 Accepted — OTP dispatched successfully; body contains a correlation_id (opaque string) for client reference
- 400 Bad Request — identity missing, malformed, or unrecognized (covers FR-002)
- 403 Forbidden — account status is suspended or inactive (covers FR-004)
- 429 Too Many Requests — rate window exceeded (covers FR-011); response MUST include a Retry-After header
- 503 Service Unavailable — notification service dispatch failure (covers FR-008)

The response body SHALL NOT echo the passcode or any derivative under any response code.

### 1.2 Data Model

**Table**: otp_records

Columns: id (UUID, PK), user_id (UUID, FK → users.id, NOT NULL), recipient_identity (VARCHAR 320, NOT NULL), passcode_hash (VARCHAR 255, NOT NULL), purpose (ENUM otp_purpose: identity_verification, login_confirmation, NOT NULL), status (ENUM otp_status: pending, consumed, expired, NOT NULL, DEFAULT pending), created_at (TIMESTAMPTZ NOT NULL DEFAULT now()), expires_at (TIMESTAMPTZ NOT NULL), dispatch_outcome (VARCHAR 64, NULLABLE — stores notification service correlation ID or error code), rate_window_count (not stored here; see otp_send_attempts below).

Indexes: UNIQUE INDEX uix_otp_active_user_purpose ON otp_records(user_id, purpose) WHERE status = 'pending' — enforces FR-010 at the database layer. INDEX ix_otp_expires_at ON otp_records(expires_at) — supports background expiry sweeps.

**Table**: otp_send_attempts

Columns: id (UUID, PK), identity_hash (VARCHAR 255, NOT NULL — SHA-256 of recipient_identity), attempted_at (TIMESTAMPTZ NOT NULL DEFAULT now()).

Index: INDEX ix_osa_identity_attempted ON otp_send_attempts(identity_hash, attempted_at) — supports FR-011 rolling-window query.

[NEEDS CLARIFICATION: What is the maximum send attempt count and rolling window duration for FR-011?] (Assumed: 5 attempts per identity within a 10-minute rolling window.)

**Enum types** (Postgres): CREATE TYPE otp_purpose AS ENUM ('identity_verification', 'login_confirmation'); CREATE TYPE otp_status AS ENUM ('pending', 'consumed', 'expired').

---

## 2. Test Strategy

Tests SHALL be written before implementation is merged. Each test case references the contract properties it validates.

**Unit tests — OtpService**

- UT-001: generatePasscode() returns a six-digit numeric string with uniform distribution (validates FR-005, A-003). Uses 10,000 iterations asserting range [000000–999999] and no bias toward boundary values.
- UT-002: buildOtpRecord() sets expires_at to created_at + configured TTL seconds (validates FR-006). Mocks clock via ClockProvider interface.
- UT-003: invalidatePreviousOtp() issues an UPDATE setting status = 'expired' on any existing pending record for the same user_id + purpose before insert (validates FR-010).
- UT-004: checkRateLimit() returns RateLimitExceededException when otp_send_attempts count within window ≥ threshold (validates FR-011).
- UT-005: resolveUser() throws UnknownIdentityException for an identity not present in users table (validates FR-002, FR-003).
- UT-006: resolveUser() throws IneligibleAccountException when account_status is suspended or inactive (validates FR-004).

**Integration tests — OtpController**

- IT-001: POST /api/v1/otp/send with valid active identity returns 202 and persists otp_records row with status = 'pending' (validates FR-001, FR-009).
- IT-002: POST /api/v1/otp/send with unknown identity returns 400 (validates FR-002).
- IT-003: POST /api/v1/otp/send for suspended account returns 403 (validates FR-004).
- IT-004: POST /api/v1/otp/send when NotificationServiceClient throws NotificationDispatchException returns 503 and does NOT persist an otp_records