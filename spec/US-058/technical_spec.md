## S-101

# Technical Design Specification for Social Media Login in User Management Service

## Contracts & Interfaces

### API Contracts
- **POST /api/v1/users/login/social**:
  - **Request Body**:
    - `provider`: Enum<String> { "Google", "Facebook" }
    - `accessToken`: String
  - **Responses**:
    - **200 OK**: User successfully authenticated and linked.
    - **400 Bad Request**: Invalid request parameters.
    - **401 Unauthorized**: Authentication with provider failed.
    - **409 Conflict**: Email conflict exists.
    - **500 Internal Server Error**: Unexpected failures.

### Data Models
- **SocialMediaAccount Table**:
  - `id`: UUID [Primary Key]
  - `providerName`: String [Indexed]
  - `providerId`: String
  - `userEmail`: String [Unique]
  - `platformUserId`: UUID [Foreign Key, referenced PlatformUser.id]
  
- **PlatformUser Table**:
  - `id`: UUID [Primary Key]
  - `linkedSocialMedia`: UUID [Nullable, Foreign Key, referenced SocialMediaAccount.id]
  - `registrationDate`: DateTime

## Test Strategy

### Test Cases
1. **Login with Valid Google Token**:
   - Validate successful login via POST `/api/v1/users/login/social` with `provider=Google`.
   - Check status 200 and PlatformUser link update.

2. **Expired Token Handling**:
   - Simulate expired token for POST `/api/v1/users/login/social`.
   - Expect status 401 and error message validation.

3. **Email Conflict Resolution**:
   - Attempt link with a pre-existing email for POST `/api/v1/users/login/social`.
   - Verify status 409 and appropriate conflict messaging.
  
4. **Graceful Error Handling**:
   - Induce provider-specific errors; validate response complies with FR-008.

## Implementation Approach

### Core Implementation Logic

#### Class Design
- **SocialLoginController**: 
  - Method: `handleSocialLogin(Request req)`: Manages social login requests and routes them to the appropriate service.
  
- **SocialAuthService**:
  - Method: `verifyAndAuthenticate(String provider, String accessToken)`: Handles token verification and user authentication processes.
  - Method: `linkSocialAccount(PlatformUser user, SocialMediaAccount account)`: Updates PlatformUser with SocialMediaAccount linkage or resolves email conflicts.

#### External API Integration
- Implement OAuth 2.0 token verification for Google and Facebook in `SocialAuthService`.
- Use asynchronous REST call integrations using Node.js `await` syntax for enhanced performance responsiveness.

### Inter-service Calls and Async Patterns
- **Async Token Verification**: Token verification SHALL be performed asynchronously to optimize processing latency using Promise-based asynchronous patterns available in Node.js.

### Deployment and Monitoring
- Ensure that service deployment model includes additional middleware for OAuth 2.0 data verification logging.
- Integrate with existing system monitoring to track login success rate and token verification latency.

## Architectural Decision Records (ADRs)

### ADR-001: Use of External Social Media SDKs
- **Context**: Verification of social media tokens requires interaction with external identity providers.
- **Decision**: Utilize Google and Facebook SDK libraries to facilitate OAuth 2.0 authentication.
- **Rationale**: Provides straightforward compliance with external service security requirements.
- **Alternatives**:
  - Build custom logic: Rejected due to complexity and evolving protocol requirements.

## Simplicity Gate Assessment
- **Rate**: appropriate
  - Every technical element designed specifically serves one or more functional requirement(s).
  
## Affected Services and API Changes
- **Service Affected**: User Management Service
- **API Change**: Addition of `POST /api/v1/users/login/social` endpoint for handling social media authentication.