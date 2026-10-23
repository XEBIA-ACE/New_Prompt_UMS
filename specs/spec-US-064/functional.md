## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

### Purpose

This specification defines the behavior of the User Management Service when validating username uniqueness during user registration. It ensures that no two users may hold the same username within the system.

---

### Scope

This specification covers the username uniqueness validation capability of the User Management Service (S-101) as it applies to the user registration flow. It addresses input validation, conflict detection, and the feedback provided to the caller when a username collision is detected.

---

### Non-Goals

- Password validation or strength enforcement
- Email address uniqueness validation
- Username format or character-set policy enforcement beyond uniqueness
- Account activation or post-registration workflows
- Username reservation or administrative blocking of specific usernames
- Uniqueness validation during profile update or username change flows

---

### Key Entities

**User**
- username (text): The user-chosen identifier to be validated for uniqueness
- email (text): The user's email address
- account_status (enumeration): The lifecycle state of the account (e.g., pending, active, deactivated)
- registration_timestamp (datetime): When the registration request was received

Relationships:
- User is related to Account Status with cardinality one-to-one
- User is related to Registration Request with cardinality one-to-one

**Registration Request**
- requested_username (text): The username submitted by the caller during registration
- submission_timestamp (datetime): When the request was received by the service

---

### Functional Requirements

FR-001: User Management Service SHALL reject any registration request that does not include a username value.

FR-002: User Management Service SHALL treat username comparison as case-insensitive when evaluating uniqueness, so that "Alice" and "alice" are considered the same username.

FR-003: User Management Service SHALL check the submitted username against all existing user records regardless of those users' account status (pending, active, or deactivated).

FR-004: User Management Service MUST NOT allow a new user record to be created when the submitted username matches an existing username in the system.

FR-005: User Management Service SHALL return a descriptive conflict notification to the caller when a username is already in use, clearly indicating that the username is unavailable.

FR-006: User Management Service SHOULD perform username uniqueness validation before any other registration processing steps that create persistent state, to avoid partial record creation.

FR-007: User Management Service MAY suggest that the caller choose an alternative username in the conflict response, but is not required to generate alternative suggestions automatically.

FR-008: User Management Service SHALL complete the uniqueness check atomically relative to concurrent registration requests, such that two simultaneous requests with identical usernames result in at most one successful registration.

FR-009: User Management Service SHALL record a successfully validated and registered username as unavailable immediately upon successful registration, preventing subsequent reuse.

---

### Assumptions

A-001: Username uniqueness is enforced globally across all account states, including deactivated accounts. Affected FRs: FR-003, FR-004.
*(Assumed: Deactivated accounts retain their usernames and those usernames remain reserved. [NEEDS CLARIFICATION: Should deactivated or deleted accounts release their usernames for reuse?])*

A-002: The uniqueness check is scoped to a single shared namespace with no tenant or organisational partitioning. Affected FRs: FR-002, FR-003.
*(Assumed: All users share one global username namespace. [NEEDS CLARIFICATION: Is there a multi-tenant model where username uniqueness is per-tenant?])*

A-003: Username uniqueness validation is performed exclusively at registration time within this story's scope. Affected FRs: FR-001, FR-006.

---

### Edge Cases

EC-001 — Concurrent duplicate registration:
Given two registration requests carrying the same username are received simultaneously,
When both requests are processed concurrently,
Then exactly one request SHALL succeed and the other SHALL receive a conflict notification indicating the username is unavailable.

EC-002 — Case-variant username submission:
Given an existing user holds the username "Jordan",
When a new registration request is submitted with the username "jordan" or "JORDAN",
Then the service SHALL reject the new request with a conflict notification, treating the names as identical.

EC-003 — Username submitted with surrounding whitespace:
Given a registration request is submitted with the username " alex " (leading and trailing spaces),
When the service evaluates uniqueness,
Then the service SHALL normalise the username by trimming whitespace before performing the uniqueness check, and SHALL apply the result of that normalisation consistently. [NEEDS CLARIFICATION: Should trimming be applied silently and the trimmed value accepted, or should the request be rejected for containing whitespace?] (Assumed: Trimming is applied silently.)

EC-004 — Missing username field:
Given a registration request is submitted without a username field,
When the service receives the request,
Then the service SHALL reject the request immediately with a notification indicating that a username is required, without performing any uniqueness check.

EC-005 — Re-registration attempt with a previously used username:
Given a user account with username "sam" was deactivated,
When a new