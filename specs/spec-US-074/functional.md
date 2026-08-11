## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

### Purpose

This specification defines the behavior of the User Management Service when a newly registered user activates their account by following a confirmation link. It ensures that account activation is secure, time-bounded, and idempotent.

---

### Scope

This specification covers the account activation capability of the User Management Service (S-101), specifically the validation and processing of an activation token submitted by a user after registration. It encompasses token verification, account state transitions, and error feedback.

---

### Non-Goals

- Initial user registration and confirmation email dispatch are out of scope.
- Authentication (login) flows following successful activation are out of scope.
- Password creation or reset during activation is out of scope.
- Resending the confirmation link is out of scope.
- Multi-factor or OTP verification during activation is out of scope.
- Administrative account activation by internal operators is out of scope.

---

### Key Entities

**User Account**
- identifier: unique identity value
- email address: text
- account status: enumeration (pending, active, suspended)
- registration timestamp: datetime

**Activation Token**
- token value: opaque string
- associated user identifier: reference to User Account (many-to-one)
- expiry timestamp: datetime
- consumed status: boolean
- issued timestamp: datetime

Relationship: one User Account has at most one outstanding Activation Token at any given time.

---

### Functional Requirements

FR-001: User Management Service SHALL accept an activation request containing a token value submitted by an end user.

FR-002: User Management Service SHALL validate that the submitted token value exists in the system.

FR-003: User Management Service SHALL reject activation when the submitted token does not correspond to any issued token. [P2]

FR-004: User Management Service SHALL verify that the activation token has not passed its expiry timestamp at the moment of the request.

FR-005: User Management Service SHALL reject activation when the token's expiry timestamp has elapsed. [P2]

FR-006: User Management Service SHALL verify that the activation token has not already been consumed.

FR-007: User Management Service SHALL reject activation when the token has already been consumed. [P2]

FR-008: User Management Service SHALL verify that the associated User Account is in the pending state before proceeding.

FR-009: User Management Service SHALL reject activation when the associated User Account is not in the pending state. [P2]

FR-010: User Management Service SHALL transition the User Account status from pending to active upon successful validation of all token conditions.

FR-011: User Management Service SHALL mark the activation token as consumed immediately after a successful account activation.

FR-012: User Management Service SHALL return a confirmation to the requesting client indicating that the account has been successfully activated. [P1]

FR-013: User Management Service SHALL NOT allow a consumed or expired token to activate any account under any circumstances.

FR-014: User Management Service SHOULD notify the user via their registered email address that their account has been successfully activated. [P3]

FR-015: User Management Service SHALL record the timestamp at which the account was activated.

---

### Assumptions

A-001: A confirmation email containing the activation link was dispatched to the user during registration. Affects: FR-001, FR-002.
*(Assumed: the email delivery mechanism is handled by a separate notification service and is not the responsibility of this story.)*

A-002: The activation token is embedded within the confirmation link as a single opaque value. Affects: FR-001, FR-002. [NEEDS CLARIFICATION: Is the token passed as a query parameter, a path segment, or a request body field?] (Assumed: the token is a single opaque value submitted as part of the activation request payload.)

A-003: Token expiry duration is a configurable system policy. Affects: FR-004, FR-005. (Assumed: default expiry is 24 hours from issuance.)

A-004: Each user may have at most one valid activation token outstanding at any time. Affects: FR-006, FR-007, FR-013.

---

### Success Criteria

SC-001: Account status equals active after a valid, unexpired, unconsumed token is submitted.

SC-002: Activation token consumed status equals true immediately after a successful activation event.

SC-003: Activation rejection rate for expired tokens equals 100% when the request timestamp is greater than the token expiry timestamp.

SC-004: Activation timestamp recorded at least once per successful activation event.

---

### Edge Cases

EC-001 — Unknown Token
Given a user submits an activation request,
When the submitted token value does not match any token in the system,
Then the system SHALL reject the request and inform the client that the token is unrecognized.

EC-002 — Expired Token
Given a registered user's activation token has passed its expiry timestamp,
When the user submits that token for activation,
Then the system SHALL reject the request and inform the client that the token has expired.

EC-003 — Already Consumed Token
Given a user has previously activated their account successfully,
When the same token is submitted a second time,
Then the system SHALL reject the request and inform the client that