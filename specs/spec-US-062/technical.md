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