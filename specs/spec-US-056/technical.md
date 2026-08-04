## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

### Contracts & Interfaces

1. **API Contract**: Registration Endpoint
   - **Method**: `POST`
   - **Path**: `/api/v1/user/register`
   - **Request Body Schema**:
     - `username`: string, required, max length 20
     - `password`: string, required, min length 8, must contain letters, numbers, symbols
     - `email`: string, required, valid email format
     - `phone`: string, required, format "+CountryCode-Number"
   - **Response Codes**:
     - `201 Created`: Registration successful
     - `400 Bad Request`: Input validation failed
     - `409 Conflict`: Username/email already exists
     - `500 Internal Server Error`: Server-side failure

2. **Database Schema**:
   - **Table**: `Users`
     - `userId`: UUID, Primary Key
     - `username`: VARCHAR(20), Unique Index
     - `passwordHash`: VARCHAR(64)
     - `email`: VARCHAR(255), Unique Index
     - `phone`: VARCHAR(15)
   - **Indexes**:
     - `username_index` on `username`
     - `email_index` on `email`

### Test Strategy

1. **Unit Tests**:
   - Validate `username` length and uniqueness.
   - Validate `password` complexity and length.
   - Validate `email` format and uniqueness.
   - Validate `phone` format.

2. **Integration Tests**:
   - Scenario: New user registration with valid inputs. Expected: `201 Created`.
   - Scenario: Registration with existing username/email. Expected: `409 Conflict`.
   - Scenario: Invalid email format. Expected: `400 Bad Request`.

3. **Edge Case Tests**:
   - Long username rejection (FR-001 validation).
   - Weak password rejection (FR-003 validation).
   - Invalid phone format (FR-005 validation).

### Implementation Approach

1. **Core Implementation**:
   - **Class**: `UserController`
     - **Method**: `registerUser(Request req)`
       - Validate inputs using `ValidatorService`.
       - Hash password using `PasswordHasherService`.
       - Persist user data using `UserRepository`.

   - **Class**: `ValidatorService`
     - **Method**: `validateUsername(String username)`
       - Check alphanumeric and uniqueness.
     - **Method**: `validatePassword(String password)`
       - Check length and complexity requirements.
     - **Method**: `validateEmail(String email)`
       - Validate format and check uniqueness.
     - **Method**: `validatePhone(String phone)`
       - Validate against `"+CountryCode-Number"` pattern.

2. **Inter-Service Calls**:
   - **OTP Generation & Validation**:
     - **Endpoint**: POST `/api/v1/user/otp/send`
     - **Endpoint**: POST `/api/v1/user/otp/verify`

3. **Async Patterns**:
   - Consider using message queues for event publishing when a user registers successfully to trigger downstream processes like welcome emails.

### ADR-001: User Registration Data Validation

**Context**: Consistent data validation methods are critical due to security and integrity concerns.

**Decision**: Use centralized `ValidatorService` to manage input validation logic.

**Rationale**: Centralization simplifies testing and future modifications.

**Alternative Considered**: Validate inline in `UserController` and rejected due to code duplication and maintenance issues.

### Affected Services and API Changes

- **User Management Service**: Addition of `/api/v1/user/register` endpoint.
- **Authentication Service**: Unchanged but referenced for OTP integration.

### Simplicity Gate Assessment

- **Appropriate**: Each FR is directly addressed by one or more technical components. The architecture uses current service patterns to map directly to functional requirements without unnecessary abstractions.

### Context Recap

- **Service**: User Management Service
- **Existing Endpoints**: 7
- **Functional Requirements Supported**: FR-001 to FR-010