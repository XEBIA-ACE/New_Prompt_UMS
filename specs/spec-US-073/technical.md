## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Post-Registration Confirmation Email
**Service:** User Management Service (S-101)
**Feature:** Post-Registration Email Dispatch
**FRs Covered:** FR-001 through FR-014

---

## 1. Contracts & Interfaces

### 1.1 Data Model Changes

**Table: `activation_tokens`**
Columns: `token_id` (UUID PK), `user_id` (UUID FK → `users.user_id`, UNIQUE), `token_value` (VARCHAR 128, UNIQUE NOT NULL), `issued_at` (TIMESTAMPTZ NOT NULL), `expires_at` (TIMESTAMPTZ NOT NULL), `consumed` (BOOLEAN NOT NULL DEFAULT FALSE).
Indexes: UNIQUE on `token_value`; UNIQUE on `user_id`; composite index on (`user_id`, `consumed`) for fast lookup during dispatch guard checks.

**Table: `registration_email_records`**
Columns: `record_id` (UUID PK), `user_id` (UUID FK → `users.user_id`), `recipient_address` (VARCHAR 320 NOT NULL), `dispatch_timestamp` (TIMESTAMPTZ NOT NULL), `delivery_status` (ENUM: `queued`, `sent`, `failed` NOT NULL DEFAULT `queued'`), `retry_count` (SMALLINT NOT NULL DEFAULT 0), `activation_token_id` (UUID FK → `activation_tokens.token_id`).
Indexes: UNIQUE on `user_id` (enforces FR-010 — one record per registration event); index on `delivery_status` for worker polling.

No changes to the existing `users` table schema are required; `account_status` and `email_confirmed` columns are assumed present.

### 1.2 Internal Queue Contract

ADR-001 — **Use database-backed outbox table as the async dispatch queue.**
Context: FR-002 and A-003 require asynchronous dispatch without blocking the registration response. An external broker (e.g., RabbitMQ) adds an operational dependency.
Decision: Implement a transactional outbox pattern using the `registration_email_records` table itself. Rows inserted with `delivery_status = queued` act as the work queue.
Rationale: Guarantees at-least-once delivery within the same ACID transaction as account creation, eliminating dual-write failure modes.
Alternative considered: Dedicated message broker (RabbitMQ). Rejected because it introduces an additional infrastructure dependency disproportionate to the single queue use-case at this service's scale.

### 1.3 Admin Re-trigger Endpoint (FR-013)

`POST /api/v1/admin/users/{user_id}/resend-confirmation`
Auth: Internal service token (Bearer, admin scope). Validates that `account_status = pending` before proceeding. Returns HTTP 202 on acceptance, HTTP 409 if account is not in pending state, HTTP 404 if user does not exist.

### 1.4 Email Delivery Provider Interface

Interface `EmailDeliveryPort` (hexagonal adapter):
Method `sendTransactional(recipient: EmailRecipient, subject: String, bodyTemplate: String, templateVars: Map): DeliveryResult`.
`DeliveryResult` carries `providerMessageId`, `accepted: boolean`, and `errorCode`.
A concrete `SendGridEmailAdapter` implements `EmailDeliveryPort`. This isolation satisfies ADR-002.

ADR-002 — **Wrap email provider behind a port/adapter interface.**
Context: Provider lock-in risk; need to swap SendGrid for SES or SMTP without core logic changes.
Decision: Define `EmailDeliveryPort` interface; inject via constructor in `RegistrationEmailDispatcher`.
Alternative considered: Direct SendGrid SDK calls. Rejected because it couples core logic to a vendor SDK, complicating testing and future migration.

---

## 2. Test Strategy

### 2.1 Unit Tests — `RegistrationEmailService`

- **TC-001** (covers FR-001, FR-003): After `createUser()` commits, assert that `ActivationTokenRepository.create()` is called exactly once with a UUID token value and `expires_at = issued_at + 24h`.
- **TC-002** (covers FR-006): Assert that `expires_at` is exactly 24 hours after `issued_at` in the generated `ActivationToken` entity.
- **TC-003** (covers FR-007): Assert that `RegistrationEmailRecordRepository.insert()` is called with `delivery_status = queued` and `retry_count = 0` within the same transaction as token creation.
- **TC-004** (covers FR-010): Stub `RegistrationEmailRecordRepository.existsByUserId()` returning true; assert that `RegistrationEmailService.triggerFor(userId)` throws `DuplicateDispatchException` and does not insert a second record.
-