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