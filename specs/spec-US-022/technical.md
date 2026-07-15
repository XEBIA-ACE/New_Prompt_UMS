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