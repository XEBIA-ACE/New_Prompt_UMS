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