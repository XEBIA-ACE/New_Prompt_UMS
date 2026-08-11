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