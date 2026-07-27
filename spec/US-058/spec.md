# Implement Social Media Login

| | |
|---|---|
| **ID** | US-058 |
| **Feature** | F-01 — User Registration |
| **Epic** | EP-001 — Design User Registration Interface |
| **Status** | Draft |
| **Date** | 2026-07-27 |

## Background

Part of feature *User Registration*.

## Acceptance Criteria

### Story

- [ ] Given the registration form, When I select Google login, Then I can log in using my Google account.
- [ ] Given the registration form, When I select Facebook login, Then I can log in using my Facebook account.
- [ ] Given a successful social media login, When I access my profile, Then my social media data is correctly linked to my platform account.

### Epic

- [ ] Given a new user, when they access the registration page, then they should be able to see options for email and social media login.
- [ ] Given a user filling out the registration form, when they enter a weak password, then they should see a password strength indicator warning.
- [ ] Given a user on any device, when they access the registration page, then the page should be responsive and accessible.
- [ ] Given an unregistered user, when they complete the registration form and submit it, then they should receive a confirmation email.

## Proposed Solution

### Functional Specification

## S-101

### Purpose
This specification aims to define how the User Management Service will implement social media login to support user registration through Google and Facebook accounts, enhancing user experience with quick access.

### Scope
This specification covers the integration of social media login functionality within the User Management Service, specifically Google and Facebook authentication methods.

### Non-Goals
1. Implementation details of social media authentication protocols.
2. Storage of social media passwords.
3. Design and layout of the user interface.
4. Data handling post-login verification.
5. Support for social media platforms other than Google and Facebook.
6. Detailed error message design.
7. User profile management after initial login.
8. Performance optimizations.
9. Security protocol details.
10. Error logging mechanisms.

### Key Entities
- **SocialMediaAccount**: { providerName: String, providerId: String, userEmail: String }
  - Related Entity: PlatformUser (1:1)
- **PlatformUser**: { userID: String, linkedSocialMedia: Optional<SocialMediaAccount>, registrationDate: DateTime }
  - Related Entity: SocialMediaAccount (1:1)

### Functional Requirements

- **FR-001**: User Management Service MUST support logging in with a Google account, allowing users to select this option from the registration form.
- **FR-002**: User Management Service MUST support logging in with a Facebook account, allowing users to select this option from the registration form.
- **FR-003**: User Management Service MUST verify the authenticity of the social media account with the respective provider.
- **FR-004**: User Management Service MUST, upon successful authentication, create or update the user's platform account to link with their social media account.
- **FR-005**: User Management Service MUST reject login if social media authentication fails due to an invalid or expired token.
- **FR-006**: User Management Service SHOULD validate that the email associated with the social media account is unique within the platform.
- **FR-007**: User Management Service SHALL NOT store social media login credentials.
- **FR-008**: User Management Service MUST handle any provider-specific error responses gracefully, providing user-friendly feedback.

### Assumptions Propagation
- **A-001**: Users will have existing accounts with Google or Facebook. (Affects: FR-001, FR-002, FR-003)
- **A-002**: Social media providers will reliably return authentication tokens. (Affects: FR-003, FR-005)
- **A-003**: Unique emails from social media will act as user identifiers. (Affects: FR-004, FR-006)

### Success Criteria
- **SC-001**: At least 90% of users should log in via social media without encountering errors.
- **SC-002**: User linking process should complete in less than 5 seconds in 95% of cases.

### Priority Levels
1. **P1**: FR-001, FR-002, FR-004 (Core user goal)
2. **P2**: FR-003, FR-005, FR-006, FR-008 (Error handling and validation)
3. **P3**: (None)

### Edge Cases
- **EC-001**: Given an expired token, When a user attempts to log in via social media, Then the system should provide a message stating the session expired, prompting re-authentication.
- **EC-002**: Given a conflict with a pre-existing email, When linking a social media account, Then the system should prompt the user to resolve the conflict.

### Independent Testability
Preconditions: The user has a Google or Facebook account.
Action: The user selects social media login on the registration form.
Outcome: The user is logged in and linked to their social media account.

### Technical Design

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

## Affected Services

- `S-101`

## API Changes

| Service | Endpoint | Method | Change |
|---------|----------|--------|--------|
| `S-101` | `/api/v1/users/login/social` | POST | new |
| `S-101` | `/api/v1/users/register` | POST | modify |

## Open Questions / Gaps

_No gaps identified._