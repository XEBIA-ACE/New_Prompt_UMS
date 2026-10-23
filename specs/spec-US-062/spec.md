# Email Format Validation

| | |
|---|---|
| **ID** | US-062 |
| **Feature** | F-01 — User Registration |
| **Epic** | EP-002 — Implement Data Validation for Registration |
| **Status** | Draft |
| **Date** | 2026-07-02 |

## Background

Part of feature *User Registration*.

## Acceptance Criteria

### Story

- [ ] (none)

### Epic

- [ ] (none)

## Proposed Solution

### Functional Specification

## S-101

### Purpose

This specification defines the functional requirements for the User Management Service to perform email format validation during user registration, ensuring valid email inputs to maintain data integrity and successful user account creation.

### Scope

This specification exclusively covers the email format validation capability within the User Management Service during the user registration process. This entails checking the structure of an email input against a predefined format standard to guarantee it meets acceptable criteria.

### Non-Goals

1. Validate email domains.
2. Authenticate email servers.
3. Detect disposable email addresses.
4. Validate emails in other service contexts.
5. Handle email delivery.
6. Manage user account verification.
7. Interact with external validation services.
8. Perform email security checks.
9. Validate email content.
10. Validate emails in already registered accounts.

### Key Entities

- **EmailAddress**  
  - Attributes:  
    - `address` (string)
  - Relationships:  
    - Linked to `User` (1:1)

- **User**  
  - Attributes:  
    - `email` (EmailAddress)

### Functional Requirements

- **FR-001**: The User Management Service MUST validate that the email address provided during registration conforms to a standard format (e.g., local@domain).
- **FR-002**: The system MUST reject email addresses that do not meet the format standard with an appropriate error message.
- **FR-003**: The system SHOULD log validation results for monitoring and debugging purposes.
  
### Assumptions Propagation

- **A-001**: Email validation will only check for format compliance, not email domain validity.  
  - Cross-reference: FR-001, FR-002

### Success Criteria

- **SC-001**: The percentage of email registration attempts blocked for invalid format errors SHALL be at most 5%.
- **SC-002**: The validation error rate for valid emails SHALL be less than 1%.

### Priority Levels

- **P1**: FR-001 
- **P2**: FR-002, FR-003 

### Edge Cases

- **EC-001**:  
  - Given: A user provides an email without "@" symbol  
  - When: The email is submitted for registration  
  - Then: The system SHALL reject the email with a "missing @ symbol" error

- **EC-002**:  
  - Given: A user provides an email with invalid characters (e.g., spaces)  
  - When: The email is submitted for registration  
  - Then: The system SHALL reject the email with an "invalid character" error

### Independent Testability

To test the email format validation, the following minimal scenario must be executed:

- Preconditions:
  1. User registration interface is accessible.
  2. Email entry field is available.
  3. Guidelines for valid email format are provided.
- User Action: Enter an email address and submit the registration form.
- Observable Outcome: The system either accepts the registration or provides an error message indicating format violations.

### Context

- **Service**: User Management Service
- **Story**: Email Format Validation
- **Feature**: User Registration

### Technical Design

## S-101

```
Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.
```

### Contracts & Interfaces

**API Endpoint**  
- **Path**: `POST /api/v1/user/register`  
- **Request Payload**:  
  - `email` (string): Email address to be validated  
  - Other user details [NEEDS CLARIFICATION: What other user details are required for registration?] (Assumed: generic user details such as username and password are also part of registration)  
- **Response**:  
  - **200 OK**: Registration successful  
  - **400 Bad Request**: Invalid email format  
  - **Error Payload**:  
    - `code` (string): Error code  
    - `message` (string): Description of the error (e.g., "Invalid email format: missing @ symbol")

**Data Model**  
- **EmailAddress Table**:
  - `address` VARCHAR(255)
  - **Indexes**:  
    - `idx_email_address` UNIQUE(email)

- **User Table**:  
  - `email` VARCHAR(255) REFERENCES EmailAddress(address)

### Test Strategy

1. **Test Case 1**: Valid Email Format  
   - **Objective**: Validate that a correct email format is accepted by the system.  
   - **Input**: `email = "test@example.com"`  
   - **Expected Output**: Registration is successful (`200 OK`).

2. **Test Case 2**: Missing @ Symbol  
   - **Objective**: Ensure that emails without "@" are rejected.  
   - **Input**: `email = "testexample.com"`  
   - **Expected Output**: Error with message "Invalid email format: missing @ symbol" (`400 Bad Request`).

3. **Test Case 3**: Invalid Characters  
   - **Objective**: Test rejection for emails containing spaces or other illegal characters.  
   - **Input**: `email = "test@ example.com"`  
   - **Expected Output**: Error with message "Invalid email format: invalid character" (`400 Bad Request`).
   
Each test SHALL validate API response properties including status codes and error messages.

### Implementation Approach

1. **Email Validation Logic**:
   - Implement `EmailValidator` class in Node.js.
   - Method `validateFormat(email: string): boolean` SHALL utilize regular expression such as `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/` to verify valid email formats.
   - Method SHALL throw `ValidationError` with specific message based on error type.

2. **Controller Changes**:
   - Modify `UserController` class to include pre-validation in the `registerUser` method.
   - Invocation of `EmailValidator.validateFormat` MUST occur prior to database operations.

3. **Inter-Service Communication**:
   - Not applicable, as this change is isolated within User Management Service.

4. **Logging**:
   - Implement logging in the `UserController.registerUser` method using integrated logging library to record success or failure of email validation for monitoring.

### Architectural Decision Records (ADRs)

- **ADR-001**: Use RegExp for Email Validation  
  - **Context**: Email format validation is required during user registration.  
  - **Decision**: Use regular expressions in `EmailValidator` for email format validation.  
  - **Rationale**: Regular expressions provide a robust method to match patterns efficiently.  
  - **Alternative**: Implement a sequence of string operations; rejected due to complexity and inefficiency in pattern matching.

### Simplicity Gate Assessment

- **Assessment**: Appropriate  
  - Each technical design element directly maps to one or more functional requirements (e.g., RegExp validation to FR-001).
  - No over-engineered components; maintains simplicity by employing RegExp without unnecessary inter-service calls or external service dependencies.

### Affected Services and API Changes

- **Affected Service**: User Management Service
- **API Changes**:
  - Updated email validation logic in existing registration endpoint (`POST /api/v1/user/register`).

This specification provides detailed architectural, implementation, and testing guidance for adding email format validation to the User Management Service's registration process, ensuring compliance with the given functional requirements and adaptation of best practices.

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._