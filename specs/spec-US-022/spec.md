# Add Account Deletion Option in User Settings

| | |
|---|---|
| **ID** | US-022 |
| **Feature** | F-04 — Account Deletion |
| **Epic** | EP-001 — User-Initiated Account Deletion Workflow |
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

The specification exists to define the functional changes necessary to add an account deletion option in user settings, supporting user autonomy in account management within the User Management Service.

### Scope

This specification covers the implementation of a new feature allowing users of the User Management Service to delete their accounts, including necessary data inputs, outputs, and handling of edge cases.

### Non-Goals

1. Implementing data archival processes.
2. Providing account recovery features post-deletion.
3. Altering authentication or authorization flows unrelated to account deletion.
4. Modifying any user notification mechanisms.
5. Introducing multilingual support for user interfaces.

### Key Entities

- **User**: An individual account holder in the system.
  - **Attributes**: user_id (string), email (string), account_status (string)
- **Deletion Request**: Represents the action of a user requesting an account deletion.
  - **Attributes**: request_id (string), user_id (string), request_timestamp (datetime), status (string)

### Functional Requirements

- FR-001: User Management Service MUST provide an option for users to request account deletion from user settings.
- FR-002: User Management Service MUST validate the user requesting deletion is authenticated.
- FR-003: User Management Service MUST confirm account deletion request through a user consent step.
- FR-004: User Management Service MUST remove user data after confirmation, retaining information necessary for audit compliance.
- FR-005: User Management Service MUST log the deletion request and its outcome for audit purposes.
- FR-006: User Management Service SHALL notify the user once their account deletion is completed.
- FR-007: User Management Service SHOULD provide users with an option to cancel a pending deletion request before it is finalized.
- FR-008: User Management Service MUST handle edge cases such as deletion of active or pending accounts appropriately.

### Assumptions Propagation

- A-001: Users initiate deletion only via authenticated sessions. (Affects FR-002)
- A-002: Deletion is irreversible once confirmed by the user. (Affects FR-004, FR-006)
- No other assumptions identified.

### Success Criteria

- SC-001: At least 95% of users are able to initiate account deletions without encountering errors.
- SC-002: The system deletes 100% of account data within 24 hours post-confirmation.
- SC-003: Audit log entries for deletions are generated with a success rate of 100%.

### Priority Levels

- P1: FR-001, FR-002, FR-004
- P2: FR-003, FR-005, FR-007
- P3: FR-006, FR-008

### Edge Cases

- EC-001: Given an authenticated user, when they request account deletion while having active subscriptions, then the system must prompt the user to cancel subscriptions first.
- EC-002: Given a user has a pending deletion request, when they login again, then the system must allow them to cancel the request.
- EC-003: Given a user with pending legal matters, when they request account deletion, then the system must reject the request.

### Independent Testability

Preconditions: 
1. User is authenticated.
2. User has access to account settings.
3. User consents to deletion warnings.

User Action: User submits an account deletion request.

Outcome: Account is flagged for deletion, and user receives a confirmation email.

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

### Technical Design Specification for Account Deletion Feature

#### Contracts & Interfaces

1. **API Changes**

   - **Endpoint Addition**: 
     - **POST /api/v1/users/{userId}/delete**
       - Description: Allows a user to request account deletion.
       - Request:
         - Headers: Authorization (Bearer token)
         - Params: `userId` (Path Parameter)
         - Body:
           - `confirmation` (boolean): Indicates user consent for deletion.
       - Responses:
         - 200 OK: Request successful, account deletion initiated.
         - 400 Bad Request: Missing or invalid request parameters.
         - 403 Forbidden: User not authenticated.
         - 409 Conflict: Cannot delete due to active subscriptions or pending legal matters.
         - 500 Internal Server Error: Unexpected server issue.

   - **DELETE /api/v1/users/{userId}**
     - Description: Finalizes the account deletion process.
     - Internal Call only (Secured by internal service authentication).
     - Responses:
       - 204 No Content: Account deleted successfully.
       - 404 Not Found: User not found.

2. **Data Model Changes**

   - **Table: `users`**
     - New Column: `deletion_requested` (boolean, default false)
     - Index: `(user_id, deletion_requested)`

   - **Table: `deletion_requests`**
     - Columns:
       - `request_id` (VARCHAR, Primary Key)
       - `user_id` (VARCHAR, Foreign Key referencing `users.user_id`)
       - `request_timestamp` (TIMESTAMP)
       - `status` (VARCHAR, e.g., 'PENDING', 'CANCELLED', 'COMPLETED')

3. **Inter-service Communication**

   - Use of event-driven architecture to notify the audit service.
     - Event: `AccountDeletionInitiated`
     - Topic: `user_management.account_deletion`

#### Test Strategy

1. **API Contract Tests**

   - **POST /api/v1/users/{userId}/delete**
     - Test valid account deletion request and assert 200 OK.
     - Test without authorization and assert 403 Forbidden.
     - Test deletion request with pending legal matters and assert 409 Conflict.

2. **Data Model Tests**

   - Verify `deletion_requested` column updates to true upon deletion endpoint hit.
   - Confirm new entries in `deletion_requests` table are created correctly.

3. **Integration Tests**

   - Simulate full deletion flow: request deletion, check audit log for event, finalize deletion.
   - Test for rollback on failure conditions (e.g., network failures during internal DELETE call).

#### Implementation Approach

1. **Core Implementation Logic**

   - **Class: `AccountDeletionService`**
     - **Method: `requestDeletion(String userId, boolean confirmation)`**
       - Confirm authentication (leveraging user session).
       - Validate business rules: user consent, check for edge cases (active subscriptions, legal matters).
       - Log request in `deletion_requests` table and set `deletion_requested` flag.

     - **Method: `finalizeDeletion(String userId)`**
       - Upon successful validation and request confirmation from async system processing:
       - Proceed with removing user data except necessary audit traces (following A-002).

2. **Asynchronous Processing**

   - Use an event queue (e.g., Apache Kafka) to manage state changes from PENDING to COMPLETED.
   - **Listener: `AccountDeletionListener`**
     - Consumes `AccountDeletionInitiated` events and triggers `finalizeDeletion`.

#### Architectural Decision Records (ADRs)

- **ADR-001: RESTful API Design**
  - Context: Needs user-initiated account deletion.
  - Decision: Extend REST API with secure DELETE operation.
  - Rationale: Aligns with existing REST structure, industry best practice.
  - Alternative: Direct database triggers, rejected due to lack of control on transaction management.

- **ADR-002: Event-Driven Deletion Notification**
  - Context: Audit trail required for deletion.
  - Decision: Use asynchronous messaging.
  - Rationale: Decouples deletion logic from audit logging, scales independently.
  - Alternative: Synchronous calls, potential latency issues identified.

### Simplicity Gate Assessment

- **Appropriate**: All technical elements serve identified functional requirements—data model changes, API/endpoint, inter-service calls align with FR-001 to FR-008.

### Affected Services and API Changes

- **User Management Service**: API extended for account deletion flow.
- **Audit Service**: Adds a dependency for consuming `AccountDeletionInitiated` events.

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._