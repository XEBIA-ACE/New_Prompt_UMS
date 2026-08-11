# Send Confirmation Email on Registration Completion

| | |
|---|---|
| **ID** | US-061 |
| **Feature** | F-01 — User Registration |
| **Epic** | EP-001 — Design User Registration Interface |
| **Status** | Draft |
| **Date** | 2026-07-02 |

## Background

Part of feature *User Registration*.

## Acceptance Criteria

### Story

- [ ] Given a successful registration, When it completes, Then a confirmation email is sent to the user.
- [ ] Given the confirmation email, When it is received, Then it contains relevant registration details and a verification link if applicable.
- [ ] Given the registration system, When a confirmation email is sent, Then this action is reliable and logged for auditing.

### Epic

- [ ] Given a new user, when they access the registration page, then they should be able to see options for email and social media login.
- [ ] Given a user filling out the registration form, when they enter a weak password, then they should see a password strength indicator warning.
- [ ] Given a user on any device, when they access the registration page, then the page should be responsive and accessible.
- [ ] Given an unregistered user, when they complete the registration form and submit it, then they should receive a confirmation email.

## Proposed Solution

### Functional Specification

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

### Purpose

This specification defines functional requirements for sending a confirmation email after user registration, providing proof of registration and facilitating account verification as part of the User Management Service.

### Scope

This specification applies to successful completions of the user registration capability within the User Management Service and details responsibilities for user notification, auditing, and external communication with email delivery.

### Non-Goals

1. Handling of failed or incomplete user registrations
2. Password reset or forgotten password flows
3. Delivery status tracking after the SMTP Service accepts email
4. User interface for registration
5. Rate limiting or anti-abuse measures for registration
6. SMS or other out-of-band notification channels
7. Email content localization or customization beyond registration details
8. Management of SMTP Service credentials
9. Resending confirmation emails on user request
10. Changes to inbound email processing

### Key Entities

- User
    - user_id: UUID
    - email: string
    - registration_status: enum
    - created_at: datetime

- ConfirmationEmail
    - user_id: UUID (references User)
    - email_sent_at: datetime
    - verification_link: string (nullable)
    - delivery_status: enum

- AuditLogEntry
    - entry_id: UUID
    - user_id: UUID (references User)
    - action: string
    - timestamp: datetime
    - details: string

### Functional Requirements

FR-001: User Management Service SHALL send a confirmation email to the user's registered email address upon successful registration completion. (P1)

FR-002: User Management Service SHALL include pertinent registration details in the confirmation email, such as the user's email address and account creation timestamp. (P1)

FR-003: User Management Service SHALL include a verification link in the confirmation email if the user's account requires verification. (P1) [NEEDS CLARIFICATION: Under what conditions is account verification required?] (Assumed: All new accounts require email verification)

FR-004: User Management Service SHALL ensure each confirmation email send action is reliably logged as an AuditLogEntry. (P2)

FR-005: User Management Service MUST NOT send a confirmation email when registration fails or is incomplete. (P2)

FR-006: User Management Service SHALL treat registration as incomplete if required registration fields are missing, and SHALL NOT trigger confirmation email in such cases. (P2)

FR-007: User Management Service SHOULD attempt to retry email delivery up to a defined number of times if initial sending fails, and SHALL persist failure status if retries are exhausted. (P2) [NEEDS CLARIFICATION: What is the allowed retry count and interval?] (Assumed: 3 retries, 2 minutes interval)

FR-008: User Management Service SHALL record the delivery status (success or failure) associated with each attempted confirmation email. (P2)

FR-009: User Management Service SHALL integrate with the SMTP Service to transmit outbound confirmation emails. (P1)

FR-010: User Management Service SHOULD notify administrators if persistent email delivery failures occur for registration confirmations. (P3)

### Assumptions Propagation

A-001: All new accounts require email verification. (FR-003)

A-002: Confirmation emails are sent only for successful, complete registrations. (FR-001, FR-005, FR-006)

A-003: Maximum retry count for email delivery is 3, with 2-minute intervals. (FR-007)

### Success Criteria

SC-001: Percentage of registrations resulting in a confirmation email send action logged as successful equals at least 99%.

SC-002: Confirmation email contains the user's email address and account creation timestamp in 100% of sent cases.

SC-003: If account verification is required, confirmation email includes a distinct verification link in 100% of such cases.

### Priority Levels

- P1: FR-001, FR-002, FR-003, FR-009
- P2: FR-004, FR-005, FR-006, FR-007, FR-008
- P3: FR-010

### Edge Cases

EC-001: Given a new registration with a malformed email address, When the confirmation email send attempt occurs, Then the system SHALL NOT send the email and SHALL log a delivery failure. (FR-001, FR-007, FR-008)

EC-002: Given a loss of connectivity to SMTP Service during send attempt, When retry count is exhausted, Then the system SHALL record a persistent failure status and SHOULD notify an administrator. (FR-007, FR-008, FR-010)

EC-003: Given a registration with missing mandatory attributes, When processing completes, Then the system SHALL NOT send a confirmation email or create an AuditLogEntry for email delivery. (FR-005, FR-006)

EC-004: Given the completed registration and confirmation email is sent, When SMTP Service returns an immediate permanent failure, Then no further retries SHALL be attempted. (FR-007)

EC-005: Given user registration completes and email is sent but user reports non-delivery, When no permanent failure is logged, Then administrators MAY manually trigger investigation or resend outside system scope. (FR-004, FR-008)

### Independent Testability

Minimum test scenario: Preconditions — 1) User completes the registration form with valid data; 2) Registration is deemed successful; 3) SMTP Service is available. User action — Register account. Observable outcome — User receives a confirmation email containing their registration details and a verification link.

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

## 1. Contracts & Interfaces

### 1.1 API Contracts

No new externally-facing REST endpoints are introduced. User registration confirmation email behavior SHALL be integrated into POST `/api/v1/users/register`.  
- Request: Unchanged.  
- Response: Unchanged (registration success/failure), but internal post-processing triggers confirmation email send logic.

#### Internal SMTP Service Interface
- Method: `sendConfirmationEmail(to: string, subject: string, body: string) ⇒ SendResult`
- SendResult: `{ success: boolean, errorMessage?: string, permanentFailure: boolean }`

### 1.2 Data Schemas

#### Table: confirmation_emails

| Column              | Type      | Constraints                  | Description                                  |
|---------------------|-----------|------------------------------|----------------------------------------------|
| confirmation_id     | UUID      | PK, generated                | Unique record identifier                     |
| user_id             | UUID      | FK -> users.user_id          | Registered user's ID                         |
| email_sent_at       | TIMESTAMP |                              | UTC timestamp of last send attempt           |
| verification_link   | TEXT      | nullable                     | Account verification URL                     |
| delivery_status     | VARCHAR   | NOT NULL                     | Enum: 'pending', 'success', 'permanent_failure', 'temporary_failure' |
| retry_count         | INT       | DEFAULT 0                    | Number of send attempts                      |
| last_error_msg      | TEXT      | nullable                     | Last send failure message, if any            |

**Indexes**:  
- IDX_confirmation_emails_user_id (user_id)  
- IDX_confirmation_emails_status (delivery_status)

#### Enum: confirmation_email_delivery_status

- 'pending'
- 'success'
- 'permanent_failure'
- 'temporary_failure'

#### AuditLogEntry (existing)
- Table: audit_log_entries
- No schema changes; usages SHALL include new audit log types (`'REGISTRATION_CONFIRMATION_EMAIL_SENT'`, `'REGISTRATION_CONFIRMATION_EMAIL_FAILED'`).

---

## 2. Test Strategy

### 2.1 Core Positive Path

**Test T-001**: Registration triggers confirmation email  
- Setup: User registers with valid data  
- Action: POST `/api/v1/users/register`  
- Assert:  
  - New entry in confirmation_emails with status 'success'  
  - Email body contains email, creation timestamp, verification link  
  - AuditLogEntry with action 'REGISTRATION_CONFIRMATION_EMAIL_SENT' created

### 2.2 Missing Required Field

**Test T-002**: Registration with missing email  
- Setup: User registers without email  
- Action: POST `/api/v1/users/register`  
- Assert:  
  - No confirmation_emails created  
  - No AuditLogEntry for confirmation email

### 2.3 Malformed Email

**Test T-003**: Registration with malformed email  
- Setup: User registers with invalid email  
- Assert:  
  - confirmation_emails entry with 'permanent_failure', error message present  
  - AuditLogEntry with 'REGISTRATION_CONFIRMATION_EMAIL_FAILED'

### 2.4 SMTP Temporary Failure, Retry

**Test T-004**: SMTP down, recovers after 2 attempts  
- Simulate SMTP temp failure -> success  
- Assert:  
  - retry_count is 2  
  - delivery_status transitions to 'success'

### 2.5 SMTP Permanent Failure

**Test T-005**: SMTP permanent failure  
- Simulate permanent SMTP error  
- Assert:  
  - delivery_status is 'permanent_failure', retries = 1  
  - Admin notification triggered  

### 2.6 Incomplete Registration, No Side Effects

**Test T-006**: Incomplete registration (missing fields)  
- Assert:  
  - No confirmation_emails, no audit created

---

## 3. Implementation Approach

### 3.1 Core Logic

- Upon successful completion of `UserRegistrationService.registerUser(RegisterUserRequest request)`:
    - Validate all required fields (incl. email format).
    - If valid:
        - Generate verification link: `VerificationService.generateLink(UUID userId)`
        - Create `ConfirmationEmail` entity: `new ConfirmationEmail(...)`
        - Queue email send task to `ConfirmationEmailSender.send(for userId)`
    - If registration incomplete or invalid, exit; no email logic executed.

#### Confirmation Email Sender

- Class: `ConfirmationEmailSender`
    - Method: `send(UUID userId)`
        - If `retry_count < 3` AND not permanent failure:
            - Compose email body (using email + creation time + verification link).
            - Call `SMTPClient.sendConfirmationEmail(...)`
            - If send succeeds:
                - Set `delivery_status = 'success'`, record `email_sent_at`
                - Create AuditLogEntry (action: 'REGISTRATION_CONFIRMATION_EMAIL_SENT')
            - If send fails (temporary):
                - Increment `retry_count`, schedule retry in 2 minutes (using background job/cron/task queue)
                - Set `delivery_status = 'temporary_failure'`
            - If permanent failure:
                - Set `delivery_status = 'permanent_failure'`
                - AuditLogEntry (action: 'REGISTRATION_CONFIRMATION_EMAIL_FAILED')
                - Trigger AdminNotificationService.notifyPersistentFailure(userId, errorMsg)
        - Retries persist state after each attempt

### 3.2 Inter-service Call Pattern

- SMTP calls are synchronous; retry/offload via job scheduler (e.g. Sidekiq/RQ/retryable background jobs).
- On permanent failure, `AdminNotificationService.notifyPersistentFailure` is invoked (can be async).

### 3.3 Data Cons

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._