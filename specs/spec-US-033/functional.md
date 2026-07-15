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