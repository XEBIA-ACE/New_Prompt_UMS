# Notification Upon Account Deletion

| | |
|---|---|
| **ID** | US-033 |
| **Feature** | F-04 — Account Deletion |
| **Epic** | EP-004 — Automated Recovery Options Post Account Deletion |
| **Status** | Draft |
| **Date** | 2026-07-02 |

## Background

Part of feature *Account Deletion*.

## Acceptance Criteria

### Story

- [ ] (none)

### Epic

- [ ] (none)

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

- **Notification**: 
  - Attributes:
    - message (String)
    - timestamp (DateTime)
  - Related Entity:
    - UserAccount (1:1)

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

#### New Endpoint
- **POST /api/v1/notifications/account-deleted**
  - **Purpose**: To handle the dispatch of account deletion notifications.
  - **Request Parameters**: 
    - `userId` (String, REQUIRED): Identifier for the user whose account was deleted.
    - `email` (String, REQUIRED): Email address to send the notification to.
    - `deletionDate` (DateTime, REQUIRED): Timestamp of when the account was deleted.
  - **Response**:
    - **200 OK**: Notification dispatched successfully.
    - **400 Bad Request**: Validation error, such as missing email.
    - **500 Internal Server Error**: Unexpected error during processing.

#### Database Schema
- **Table**: `NotificationsLog`
  - **Columns**:
    - `logId` (UUID, Primary Key)
    - `userId` (String, Foreign Key on `UserAccount.userId`)
    - `timestamp` (DateTime, Index)
    - `status` (String)
  - **Indexes**:
    - `idx_timestamp`: On `timestamp` for retrieval within a date range.

### Test Strategy

- **Test Case TC-001**: Verify that the endpoint returns `200 OK` when valid data is provided, confirming FR-001 and FR-002.
- **Test Case TC-002**: Validate that a notification is not sent and an appropriate error is returned (`400 Bad Request`) when email is missing, confirming FR-004.
- **Test Case TC-003**: Confirm that notifications sent are logged into `NotificationsLog`, validating FR-005.
- **Test Case TC-004**: Ensure retry logic is operational on network failure per EC-002, logging failure with corresponding status in `NotificationsLog`.

### Implementation Approach

#### Core Logic Classes
- **Class**: `NotificationService`
  - **Method**: `sendAccountDeletedNotification(UserAccount userAccount)`
    - **Logic**:
      1. Verify email presence (FR-006).
      2. Construct notification message containing `deletionDate`.
      3. Use `EmailService.sendEmail()` to dispatch notification.
      4. Log success or failure to `NotificationsLog` (A-002).
      5. Returns a status indicating success, retry, or failure.

- **Class**: `EmailService`
  - **Method**: `sendEmail(String email, String message)`
    - **Logic**:
      1. Attempt to send the email.
      2. On failure, queue for retry using a background job processor compliant with EC-002.
  
#### Inter-Service Calls and Async Patterns
- **Producer**: NotificationService SHALL act as a producer by queuing failed notifications in `FailedEmailsQueue`.
- **Consumer**: A background job, named `EmailRetryWorker`, SHALL consume from `FailedEmailsQueue`, re-attempting email dispatch and updating `NotificationsLog` accordingly.

#### Architectural Decision Records (ADRs)

- **ADR-001: Email Notification Handling Using In-House Service**
  - **Context**: Need to dispatch user notifications via email upon account deletion.
  - **Decision**: Use an in-house `EmailService` for sending notifications.
  - **Rationale**: Ensures control over data privacy and auditing; aligns with A-001.
  - **Alternative**: Third-party email service (rejected due to dependency and compliance risks).

#### Simplicity Gate Assessment
- **Rating**: `appropriate`
  - Each data element and service function directly maps to at least one functional requirement (FR-001 to FR-006), ensuring no unnecessary complexity.

### Affected Services and API Changes

- **Affected Service**: User Management Service
- **Changes**:
  - Introduction of `/api/v1/notifications/account-deleted` endpoint.
  - Back-end modifications involving `NotificationsLog` table creation and notification queuing processes.

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._