# Notification Upon Account Deletion

| | |
|---|---|
| **ID** | US-033 |
| **Feature** | F-04 — Account Deletion |
| **Epic** | EP-004 — Automated Recovery Options Post Account Deletion |
| **Status** | Implemented |
| **Date** | 2026-07-02 |

## Background

Part of feature *Account Deletion*.

## Acceptance Criteria

### Story

- [x] AC-001: Given a user whose account deletion is confirmed, when the worker processes the queued record, then an email is dispatched to the user's registered address with the deletion date in the message body.
- [x] AC-002: Given a user whose account deletion is confirmed but has no email address, when confirmDeletion() is called, then no notification record is inserted into the outbox table.
- [x] AC-003: Given a queued notification record, when the email provider returns a failure, then the worker increments the retry count and keeps the record in 'queued' status until the retry ceiling is reached.
- [x] AC-004: Given a queued notification record, when the worker dispatches the email successfully, then the record's delivery_status transitions to 'sent'.
- [x] AC-005: Given a queued notification record, when the retry count reaches the configured maximum, then the record's delivery_status transitions to 'failed' and a structured error log is emitted.
- [x] AC-006: The notification email subject is 'Your account has been deleted' and the template ID is ACCOUNT_DELETION_NOTICE_EMAIL_TEMPLATE_ID.

### Epic

- [x] (none)

## Proposed Solution

### Functional Specification

## S-101

### Purpose

This specification defines how the User Management Service MUST notify users when their accounts are deleted, enhancing transparency and user communication.

### Scope

The specification covers the notification process associated with user account deletion within the User Management Service. It involves user notification generation and dispatch post-account deletion.

### Non-Goals

1. Implementing account deletion logic.
2. Notification content personalization.
3. Multi-language support for notifications.
4. Notification medium customization.
5. Deletion data auditing.
6. Integration with external notification services.
7. User authentication processes.
8. Account creation flows.
9. Non-deletion notification types.
10. Notification delivery confirmation tracking.

### Key Entities

- **UserAccount**: 
  - Attributes: 
    - userId (String)
    - email (String)
    - deletionDate (DateTime)
  - Relationships:
    - n/a

- **DeletionNotificationRecord** (transactional outbox): 
  - Attributes:
    - recordId (UUID)
    - userId (String)
    - recipientAddress (String)
    - deletionDate (DateTime)
    - dispatchTimestamp (DateTime)
    - deliveryStatus ('queued' | 'sent' | 'failed')
    - retryCount (Integer)
  - Related Entity:
    - UserAccount (no FK — user may be anonymized by the time the worker reads the row)

### Functional Requirements

- **FR-001**: User Management Service MUST send a notification to the user's registered email address upon account deletion.
- **FR-002**: User Management Service MUST include account deletion date in the notification message.
- **FR-003**: User Management Service SHOULD send notifications within a fixed time after account deletion.
- **FR-004**: User Management Service MUST NOT send notifications for accounts deleted if there’s no associated email.
- **FR-005**: User Management Service SHOULD log notification details for auditing purposes.
- **FR-006**: User Management Service MUST verify existence of an email address before attempting delivery.

### Assumptions Propagation

- **A-001**: Email is the sole method for notification delivery. (Affects FR-001, FR-004)
- **A-002**: Notifications must be logged for at least 90 days for audit purposes. (Affects FR-005)

### Success Criteria

- **SC-001**: Notification delivery success rate at least 95%.
- **SC-002**: Notification sent within 10 minutes of account deletion greater than 90%.
- **SC-003**: Logged notifications retained for at least 90 days equals true.

### Priority Levels

- **FR-001**: P1
- **FR-002**: P1
- **FR-003**: P2
- **FR-004**: P1
- **FR-005**: P3
- **FR-006**: P1

### Edge Cases

- **EC-001**: Given a user account marked for deletion without an email, when the deletion is processed, then no notification should be attempted.
- **EC-002**: Given a network failure when sending an email notification, when retrying the operation, then the notification should be re-queued and logged.

### Independent Testability

**Test Scenario**: 
- Preconditions: An account is marked for deletion and has an associated email.
- User Action: Deletion process is triggered.
- Observable Outcome: A notification email is dispatched to the user, logged, and the notification contains the correct deletion date/timestamp.

### Context

- **Service**: User Management Service
- **Story**: Notification Upon Account Deletion
- **Feature**: Account Deletion

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

### Contracts & Interfaces

No standalone REST endpoint is exposed for notification dispatch. Instead, the notification is triggered as a side-effect of the existing **POST /api/v1/users/deletion-requests/confirm** route (behind SessionValidationMiddleware). On successful OTP verification, `DefaultAccountDeletionService.confirmDeletion()` inserts a `queued` row into `account_deletion_notification_records` inside the same database transaction that anonymizes the user and marks the request confirmed.

#### Database Schema
- **Table**: `account_deletion_notification_records`
  - **Columns**:
    - `record_id` (TEXT, UUID, Primary Key)
    - `user_id` (TEXT, no FK — user may be anonymized)
    - `recipient_address` (TEXT, NOT NULL)
    - `deletion_date` (TEXT, ISO-8601 DateTime)
    - `dispatch_timestamp` (TEXT, ISO-8601 DateTime)
    - `delivery_status` (TEXT, CHECK IN ('queued', 'sent', 'failed'), default 'queued')
    - `retry_count` (INTEGER, default 0)
  - **Indexes**:
    - `idx_deletion_notification_status`: On `delivery_status` for polling queued records.

### Test Strategy

- **Test Case TC-001**: Worker `processQueuedRecords()` transitions a successfully dispatched record to 'sent'.
- **Test Case TC-002**: Worker increments `retry_count` when `sendTransactional` returns `{ success: false }` below the retry ceiling.
- **Test Case TC-003**: Worker transitions to 'failed' and emits `console.error` when `retry_count >= maxRetries`.
- **Test Case TC-004**: Worker treats a thrown exception the same as a failure result.
- **Test Case TC-005**: Integration test confirms the full flow — register, activate, login, request deletion, confirm with OTP — results in a queued notification record that the worker dispatches.
- **Test Case TC-006**: Integration test confirms session invalidation on deletion and that login with anonymized credentials fails.

### Implementation Approach

#### Core Logic Classes
- **Class**: `DefaultAccountDeletionService` (in `account-deletion.service.ts`)
  - **Method**: `confirmDeletion(userId, code)`
    - **Logic**:
      1. Verify OTP (existing logic).
      2. Capture the user's email BEFORE anonymizing.
      3. Within a `withTransaction` callback: anonymize user, mark request confirmed, invalidate sessions, **insert a queued notification record** with the captured email and deletion date.

- **Class**: `AccountDeletionNotificationWorker` (in `account-deletion-notification.worker.ts`)
  - **Method**: `processQueuedRecords()`
    - **Logic**:
      1. Query `account_deletion_notification_records` WHERE `delivery_status = 'queued'` ORDER BY `dispatch_timestamp ASC`.
      2. For each record, call `EmailDeliveryPort.sendTransactional()` with subject 'Your account has been deleted' and template vars `{ deletionDate: record.deletionDate.toISOString() }`.
      3. On success → `updateStatus(recordId, 'sent')`.
      4. On failure → `_handleFailure()`: if `retryCount < maxRetries` then `incrementRetryCount()`, else `updateStatus(recordId, 'failed')` + structured log.
  - **Method**: `start(intervalMs)`
    - Sets up a polling interval (default `appConfig.outboxPollIntervalMs = 30_000`ms).
  - **Method**: `stop()`
    - Clears the interval for clean shutdown.

#### Repository
- **Class**: `DeletionNotificationRecordRepository` (in `deletion-notification-record.repository.ts`)
  - `insert(userId, recipientAddress, deletionDate)` → inserts queued record.
  - `findByStatus(status)` → returns matching records ordered by dispatch_timestamp.
  - `updateStatus(recordId, status)` → transitions status.
  - `incrementRetryCount(recordId)` → atomic `retry_count = retry_count + 1`.

#### Inter-Service Calls and Async Patterns
- **Producer**: `DefaultAccountDeletionService.confirmDeletion()` inserts a queued record inside the same transaction as the anonymization writes.
- **Consumer**: `AccountDeletionNotificationWorker` polls the `account_deletion_notification_records` table (not a separate queue) and dispatches via `EmailDeliveryPort`.
- **Retry**:
  - Uses the same `appConfig.outboxMaxRetries` (default 1) and polling interval as `OutboxWorker` (F-01). No new tunables.

#### Architectural Decision Records (ADRs)

- **ADR-001: Email Notification Handling Using In-House Service**
  - **Context**: Need to dispatch user notifications via email upon account deletion.
  - **Decision**: Use an in-house `EmailService` (via `EmailDeliveryPort` / `SendGridEmailAdapter`) for sending notifications.
  - **Rationale**: Ensures control over data privacy and auditing; aligns with A-001.
  - **Alternative**: Third-party email service (rejected due to dependency and compliance risks).

- **ADR-002: Transactional Outbox for Post-Deletion Notifications**
  - **Context**: Notification dispatch must survive service restarts and must be atomic with account anonymization.
  - **Decision**: Use the `account_deletion_notification_records` table as a transactional outbox, polled by `AccountDeletionNotificationWorker`.
  - **Rationale**: Mirrors the existing `registration_email_records` / `OutboxWorker` pattern (F-01), avoids a separate queue infrastructure, and ensures the notification record commits atomically with the anonymization writes.
  - **Alternative**: Direct synchronous email send within `confirmDeletion()` (rejected: would block the HTTP response and fail silently on provider errors).

#### Simplicity Gate Assessment
- **Rating**: `appropriate`
  - Each data element and service function directly maps to at least one functional requirement (FR-001 to FR-006), ensuring no unnecessary complexity.

### Affected Services and API Changes

- **Affected Service**: User Management Service
- **Changes**:
  - No new HTTP endpoint.
  - `DefaultAccountDeletionService.confirmDeletion()` inserts a queued notification record as part of its transaction.
  - `AccountDeletionNotificationWorker` polls and dispatches.
  - Migration 008 creates the `account_deletion_notification_records` table.
  - `server.ts` wires up `DeletionNotificationRecordRepository` and the worker, starts it on boot, and stops it on shutdown.

## Affected Services

- **User Management Service (S-101)**: Adds `AccountDeletionNotificationWorker` polling and `DeletionNotificationRecordRepository` for the transactional outbox.

## API Changes

No new HTTP endpoint. Notification dispatch is an async side-effect of the existing `POST /api/v1/users/deletion-requests/confirm` route.

## Open Questions / Gaps

No gaps identified.
