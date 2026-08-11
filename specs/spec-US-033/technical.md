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