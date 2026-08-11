## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

### Contracts & Interfaces

#### API Endpoints

1. **POST /api/v1/users/request-deletion**
   - **Description**: Initiates account deletion and sends a verification token via email.
   - **Request Payload**: 
     - `userId`: UUID of the user requesting deletion
   - **Response Codes**:
     - `202 Accepted`: Verification token sent
     - `400 Bad Request`: Invalid `userId`
     - `404 Not Found`: `userId` does not exist

2. **POST /api/v1/users/verify-deletion**
   - **Description**: Verifies the deletion request using the token.
   - **Request Payload**:
     - `token`: Verification token received in email
   - **Response Codes**:
     - `200 OK`: Token verified, account deletion in progress
     - `400 Bad Request`: Invalid or malformed token
     - `404 Not Found`: Token does not exist
     - `410 Gone`: Token expired

#### Data Schema

1. **VerificationToken Table**
   - `token`: VARCHAR(36) PRIMARY KEY
   - `userId`: UUID FOREIGN KEY REFERENCES UserAccount(id)
   - `expiresAt`: DATETIME
   - **Indexes**:
     - `idx_userId_token`: Composite index on `userId`, `token`

### Test Strategy

1. **Test Case: Initiate Account Deletion Request**
   - **Test**: POST /api/v1/users/request-deletion
   - **Validations**:
     - Confirm `202 Accepted` on valid `userId`
     - Confirm entry in `VerificationToken` table

2. **Test Case: Verify Deletion with Token**
   - **Test**: POST /api/v1/users/verify-deletion
   - **Validations**:
     - Confirm `200 OK` with valid token
     - Confirm account status change in `UserAccount`

3. **Test Case: Attempt Verification with Invalid Token**
   - **Test**: POST /api/v1/users/verify-deletion
   - **Validations**:
     - Confirm `404 Not Found` for unknown token
     - Confirm `410 Gone` if token expired

### Implementation Approach

#### Core Implementation Logic

- **Class**: `DeletionRequestHandler`
  - **Method**: `initiateDeletion(userId: UUID)`
    - Generates a `VerificationToken`
    - Inserts `VerificationToken` into the database
    - Sends an email with the token to `UserAccount.email`

- **Class**: `TokenVerificationHandler`
  - **Method**: `verifyToken(token: String)`
    - Validates token against `VerificationToken` table
    - Checks for token expiry
    - Deletes the user account upon successful verification
    
#### Inter-service Calls

- For sending emails, an internal service call to the `EmailNotificationService` SHALL be made using a RESTful POST method with the token.

#### Testing Approach

- Unit tests SHALL be written for `DeletionRequestHandler` and `TokenVerificationHandler`.
- Integration tests SHALL cover the complete deletion workflow from token generation to account removal.
- Security tests SHALL ensure that tokens cannot be forged or reused.

### Architectural Decision Records (ADRs)

- **ADR-001**: Use of `VerificationToken` pattern for deletion verification
  - **Context**: Securely validate user consent for account deletion
  - **Decision**: Implement `VerificationToken` with expiration
  - **Rationale**: Provides security, tracks consent, limits token misuse
  - **Alternative**: Use OTP, rejected for complexity and user inconvenience

### Simplicity Gate Assessment

- **Rating**: appropriate
  - Each technical element maps clearly to one or more functional requirements without excess complexity.

### Affected Services and API Changes

- **User Management Service**
  - New API endpoints for initiating and verifying deletion requests.
  - Affects data model with `VerificationToken` schema updates.

### Context

- The accounts MUST remain secure and only be deleted post-verification to ensure compliance with expected user consent protocols.