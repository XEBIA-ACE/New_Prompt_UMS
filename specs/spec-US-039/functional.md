## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

### Purpose

This specification defines the authentication flow for the User Management Service, enabling registered users to prove their identity and obtain a secure session. It exists to ensure consistent, secure, and auditable login behavior across all consuming clients.

---

### Scope

This specification covers credential-based login, session token issuance, logout, and the full password recovery and reset flow within the User Management Service. It applies to interactions between end users, the API Gateway (acting as the inbound traffic router and token validator), and the User Management Service itself.

---

### Non-Goals

- New user registration and account activation are out of scope.
- OTP issuance and verification flows are out of scope (covered separately).
- Authorization and role-based access control decisions are out of scope.
- API Gateway rate-limiting configuration is out of scope.
- Multi-factor authentication beyond password-based login is out of scope.
- Social or federated identity provider login is out of scope.
- User profile management after login is out of scope.

---

### Key Entities

**User**
- identifier: unique user identity token (data type: opaque identifier)
- email\_address: string
- credential\_hash: string (stored representation of password; never exposed)
- account\_status: enumeration (pending, active, suspended, deleted)
- failed\_login\_count: integer
- lockout\_until: datetime or null
- last\_login\_at: datetime or null

**Session**
- session\_token: opaque string
- issued\_at: datetime
- expires\_at: datetime
- user\_identifier: references User (cardinality: many Sessions to one User)
- revoked: boolean

**Password Recovery Request**
- recovery\_token: opaque string
- requested\_at: datetime
- expires\_at: datetime
- consumed: boolean
- user\_identifier: references User (cardinality: many Requests to one User)

---

### Functional Requirements

FR-001: The User Management Service SHALL accept a login request containing an email address and a plaintext password submitted by a client.

FR-002: The User Management Service SHALL verify that the submitted email address corresponds to an existing, active user account before proceeding with credential validation.

FR-003: The User Management Service SHALL reject login attempts for accounts whose status is not active, returning a descriptive rejection indicating the account is not eligible to authenticate.

FR-004: The User Management Service SHALL validate the submitted password against the stored credential representation without exposing the stored value in any response or log.

FR-005: The User Management Service SHALL issue a time-bounded session token to the client upon successful credential validation.

FR-006: The User Management Service SHALL record the timestamp of each successful login against the user's record.

FR-007: The User Management Service SHALL increment a failed login counter on the user's record each time credential validation fails.

FR-008: The User Management Service SHALL lock a user account temporarily after a consecutive failed login threshold is exceeded, preventing further login attempts until the lockout period expires.

[NEEDS CLARIFICATION: What is the exact failed-attempt threshold and lockout duration?] (Assumed: 5 consecutive failures trigger a 15-minute lockout.)

FR-009: The User Management Service SHALL reset the failed login counter to zero upon a successful login.

FR-010: The User Management Service SHALL accept a logout request carrying a valid session token and immediately revoke that session, rendering it unusable for future authenticated operations.

FR-011: The User Management Service SHALL reject any request presenting a revoked or expired session token, returning a rejection that indicates the session is no longer valid.

FR-012: The User Management Service SHALL accept a password recovery request containing a registered email address and, when the address matches an active account, dispatch a time-limited recovery token to that address via the notification integration point.

FR-013: The User Management Service MUST NOT reveal whether a submitted email address exists in the system when responding to a password recovery request, in order to prevent user enumeration.

FR-014: The User Management Service SHALL accept a password reset request containing a valid, unexpired, and unconsumed recovery token together with a new password.

FR-015: The User Management Service SHALL mark a recovery token as consumed immediately after a successful password reset, preventing its reuse.

FR-016: The User Management Service SHALL reject a password reset request that presents an expired or already-consumed recovery token.

FR-017: The User Management Service SHALL enforce a minimum complexity policy on newly submitted passwords during the reset flow, rejecting passwords that do not meet the policy.

[NEEDS CLARIFICATION: What are the exact password complexity rules (minimum length, character classes)?] (Assumed: Minimum 8 characters, at least one uppercase letter, one digit, and one special character.)

FR-018: The User Management Service SHALL expose a health check capability that allows infrastructure monitoring to confirm the service is operational without requiring authentication.

FR-019: The User Management Service SHOULD propagate authentication events (login success, login failure, account lockout, password reset) to an audit or event integration point for downstream consumption.

---

### Assumptions

A-001 (affects FR-002, FR-003): All users attempting to log in have previously completed the registration and account activation flow