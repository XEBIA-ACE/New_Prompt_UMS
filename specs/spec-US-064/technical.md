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