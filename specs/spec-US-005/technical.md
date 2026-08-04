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