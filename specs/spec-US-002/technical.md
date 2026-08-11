## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification
**Story**: US-002 – Deliver OTP via SMS
**Service**: User Management Service (S-101)
**Version**: 1.0

---

## 1. Contracts & Interfaces

### 1.1 Data Model Changes

**Table: `otp_requests`**

The service SHALL introduce a new table `otp_requests` with the following columns:

- `id` — UUID, primary key, generated server-side
- `user_id` — VARCHAR(128), non-null, foreign key referencing `users.id`
- `phone_number` — VARCHAR(32), non-null, stores the recipient number at time of generation
- `code_hash` — VARCHAR(256), non-null, stores a BCrypt or HMAC-SHA256 hash of the plaintext OTP (never the plaintext itself, satisfying FR-011)
- `status` — ENUM(`pending`, `delivered`, `failed`), non-null, default `pending`
- `created_at` — TIMESTAMPTZ, non-null, set at insert time
- `expires_at` — TIMESTAMPTZ, non-null, set to `created_at + 10 minutes`
- `invalidated_at` — TIMESTAMPTZ, nullable, set when FR-009 supersession occurs
- `attempt_sequence` — SMALLINT, non-null, monotonically incremented per user per window

**Indexes:**

- Unique partial index on `(user_id, invalidated_at IS NULL)` enforcing at most one active OTP per user (FR-003, FR-009)
- Index on `(user_id, created_at)` supporting rate-limit window queries (FR-008)
- Index on `expires_at` supporting expiry sweeps

**Table: `users` (existing, altered)**

No schema changes required. The service reads `account_status` and `phone_number` from the existing `users` table.

**Table: `otp_rate_limit_counters`**

[NEEDS CLARIFICATION: Is a Redis-based counter acceptable, or must rate-limit state be durable in PostgreSQL?] (Assumed: Redis is available as a shared cache in S-101's infrastructure.)

The service SHALL maintain rate-limit state in Redis using key pattern `otp:rl:{user_id}` as a counter with a 15-minute sliding TTL, satisfying FR-008.

---

### 1.2 API Contract

**POST /api/v1/otp/send** (existing path, new implementation)

- Request body: `user_id` (string, required)
- Success response: HTTP 202, body contains `{ "request_id": "<uuid>", "status": "accepted" }`
- Rate-limit exceeded: HTTP 429
- User not active: HTTP 403
- User not found: HTTP 202 with `status: "accepted"` (FR-012 — no enumeration)
- Provider dispatch failure: HTTP 202 with `status: "dispatch_failed"` (FR-013)
- The plaintext OTP code SHALL NOT appear in any response field (FR-011)

**POST /api/v1/otp/resend** (existing path, new implementation)

- Identical request/response contract to `/send` (FR-010)

---

## 2. Test Strategy

Tests SHALL be written before implementation merges are accepted. The following test cases are required:

**Unit Tests — `OtpService`**

- `test_generates_six_digit_numeric_code` — validates FR-002; asserts generated code matches `^\d{6}$`
- `test_code_stored_as_hash_not_plaintext` — validates FR-011; asserts `otp_requests.code_hash` does not equal the raw code
- `test_expiry_set_to_ten_minutes` — validates FR-004; asserts `expires_at - created_at == 600s`
- `test_previous_otp_invalidated_on_new_generation` — validates FR-009; asserts prior row's `invalidated_at` is non-null after a second send
- `test_inactive_user_raises_forbidden` — validates FR-007
- `test_suspended_user_raises_forbidden` — validates FR-007
- `test_unknown_user_returns_accepted` — validates FR-012; asserts HTTP 202 with no error disclosure

**Unit Tests — `RateLimitGuard`**

- `test_fifth_attempt_within_window_is_accepted` — validates FR-008 boundary
- `test_sixth_attempt_within_window_is_rejected` — validates FR-008; asserts HTTP 429
- `test_counter_resets_after_window_expiry` — validates FR-008 rolling window behavior

**Unit Tests — `SmsDispatchAdapter`**

- `test_delivery_status_recorded_on_provider_success