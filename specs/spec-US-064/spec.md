# Unique Username Validation

| | |
|---|---|
| **ID** | US-064 |
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

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Username Uniqueness Validation
**Service**: User Management Service (S-101)
**Feature**: Username Uniqueness Enforcement at Registration
**Refs**: FR-001 through FR-009, EC-001 through EC-005, A-001, A-002, A-003

---

## 1. Contracts & Interfaces

### 1.1 Affected Endpoint

**POST /api/v1/users/register**

This existing endpoint is the sole entry point modified by this specification.

**Request body contract** (existing fields; no new top-level fields added):

- `username` (string, REQUIRED): The caller-supplied username. SHALL be trimmed of leading and trailing whitespace before any processing (EC-003). MUST NOT be absent or empty (FR-001, EC-004).
- `email` (string, REQUIRED): unchanged.
- `password` (string, REQUIRED): unchanged; out of scope for this spec.

**Success response**: HTTP 201 Created. Body includes the created user record. No contract changes to the success path.

**Conflict response — username taken** (FR-005): HTTP 409 Conflict.
Response body SHALL include:
- `error_code` (string): fixed value `USERNAME_UNAVAILABLE`
- `message` (string): human-readable explanation that the username is already in use
- `field` (string): fixed value `username`
- `suggestion_hint` (string, OPTIONAL): MAY be populated with advice to choose an alternative username (FR-007); the service SHALL NOT auto-generate candidate usernames in this iteration

**Validation failure response — missing username** (FR-001, EC-004): HTTP 422 Unprocessable Entity.
Response body SHALL include:
- `error_code`: `USERNAME_REQUIRED`
- `message`: human-readable explanation
- `field`: `username`

### 1.2 Data Model Changes

**Table: `users`** (existing)

Add the following:

- Column `username_normalised` (VARCHAR(255), NOT NULL): stores the lowercased, whitespace-trimmed form of the username. This column drives uniqueness enforcement (FR-002).
- Unique index `uidx_users_username_normalised` on `username_normalised`. This index MUST be a database-enforced unique constraint and is the primary mechanism for FR-008 atomicity.

No changes to the existing `username` column, which retains the caller-supplied casing for display purposes.

**Migration**: `V{next}__add_username_normalised_to_users.sql`
- Adds `username_normalised` column.
- Backfills existing rows: `UPDATE users SET username_normalised = LOWER(TRIM(username))`.
- Applies the unique constraint.

[NEEDS CLARIFICATION: Should the migration fail or skip backfill if existing data already contains case-variant duplicates in the `username` column?] (Assumed: Migration fails fast and a data-cleanup script MUST be run before deployment if duplicates exist.)

---

## 2. Test Strategy

Tests are ordered by contract surface they validate. All tests target `RegistrationServiceTest` (unit) and `RegistrationIntegrationTest` (integration against a test database).

**TC-001 — Missing username field** (validates: HTTP 422, `USERNAME_REQUIRED`, FR-001, EC-004)
Unit test on `RegistrationRequestValidator.validate()`: assert `ValidationException` is raised when `username` is null or empty string. Integration test: POST with no `username` key returns 422 with `error_code = USERNAME_REQUIRED`.

**TC-002 — Whitespace-only username** (validates: FR-001, EC-003)
Unit test: `UsernameNormaliser.normalise(" ")` returns empty string; validator then rejects it with `USERNAME_REQUIRED`.

**TC-003 — Whitespace trimming applied silently** (validates: EC-003)
Integration test: POST with `username = " alice "` where no user named `alice` exists returns 201 and the stored `username_normalised` equals `alice`.

**TC-004 — Case-insensitive conflict detection** (validates: FR-002, FR-004, EC-002)
Integration test: seed a user with `username_normalised = jordan`. POST with `username = JORDAN` returns 409 with `error_code = USERNAME_UNAVAILABLE`.

**TC-005 — Conflict across all account statuses** (validates: FR-003, A-001)
Integration test: parameterised over `account_status` values `[pending, active, deactivated]`. For each, seed a user in that state, POST with the same normalised username, assert 409.

**TC-006 — Successful registration marks username unavailable** (validates: FR-009)
Integration test: POST with `username = newuser` returns 201; subsequent POST with `username = newuser` returns 409.

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._