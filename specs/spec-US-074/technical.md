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