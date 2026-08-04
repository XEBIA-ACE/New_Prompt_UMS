# Design Mobile Registration Interface

| | |
|---|---|
| **ID** | US-057 |
| **Feature** | F-01 — User Registration |
| **Epic** | EP-001 — Design User Registration Interface |
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

### Purpose

The purpose of this specification is to define the functional requirements for the mobile registration interface capability within the User Management Service, enabling users to register an account via a mobile device.

### Scope

This specification covers user-initiated registration via a mobile interface, including required data capture, validation, OTP-based verification, business rules, error handling, and integration with user verification and authentication logic within the User Management Service.

### Non-Goals

1. Management of user login after registration
2. Password reset or recovery flows
3. Registration via non-mobile interfaces (e.g., web-only flows)
4. UI/UX design specifications or mobile client behavior
5. Push notification or SMS delivery mechanics beyond logical integration
6. Post-registration profile management
7. Integration with third-party identity providers or social logins
8. Analytics or tracking unrelated to registration success/error
9. Management of user consents or privacy settings outside registration
10. Support for batch or bulk user registrations

### Key Entities

- **User**
  - user_id : UUID
  - given_name : string
  - family_name : string
  - mobile_number : string
  - password : string
  - email_address : string
  - registration_status : enum (PENDING_VERIFICATION, ACTIVE, REJECTED)
  - created_at : datetime

- **OTPVerification**
  - otp_id : UUID
  - user_id : UUID (relates to User, 1:1)
  - otp_code : string
  - expiry : datetime
  - status : enum (SENT, VERIFIED, EXPIRED)

### Functional Requirements

FR-001: User Management Service SHALL enable mobile users to initiate user registration by submitting required personal data (given_name, family_name, mobile_number, password, email_address). [P1]

FR-002: User Management Service SHALL validate all submitted fields for presence, correct format (e.g., valid email address, strong password), and uniqueness of mobile_number and email_address. [P1]

FR-003: User Management Service SHALL reject registration attempts with duplicate mobile_number or email_address values. [P2]

FR-004: User Management Service SHALL trigger OTP generation for the submitted mobile_number after pre-validation succeeds, and initiate delivery to the specified mobile_number via an integrated OTP Handler. [P1]

FR-005: User Management Service SHALL create a new user entity in a PENDING_VERIFICATION state until OTP verification is complete. [P1]

FR-006: User Management Service SHALL allow a submitted registration to be completed and the corresponding user status set to ACTIVE only after successful OTP entry and validation. [P1]

FR-007: User Management Service MUST reject a registration if required fields are missing, contain prohibited formats, or fail business validation. [P2]

FR-008: User Management Service SHOULD provide meaningful rejection reasons when registration fails (e.g., duplicate mobile_number, weak password). [P2]

FR-009: User Management Service MAY allow retrying OTP delivery per rate limit and expiry policies enforced by the OTP Handler. [P2]

FR-010: User Management Service SHALL NOT proceed with user activation if OTP verification fails or expires. [P1]

### Assumptions

A-001: The mobile registration flow is distinct from any web-based registration flows. [Affects: FR-001, FR-002, FR-004, FR-005, FR-006]
A-002: OTP delivery is abstracted and managed by the OTP Handler component via integration. [Affects: FR-004, FR-009]
A-003: Password complexity requirements are consistent with current organizational standards. [Affects: FR-002, FR-007]
A-004: Only one registration per mobile_number or email_address is permitted at a time. [Affects: FR-003, FR-007]

### Success Criteria

SC-001: Percentage of registrations completed and transitioned to ACTIVE status within five minutes is at least 95%.
SC-002: Duplicate registration attempts for an existing mobile_number or email_address are rejected in 100% of cases.
SC-003: Registration attempts with invalid data (invalid email, weak password, missing mandatory fields) are rejected in 100% of cases.

### Priority Levels

- FR-001, FR-002, FR-004, FR-005, FR-006, FR-010: P1 (core functionality)
- FR-003, FR-007, FR-008, FR-009: P2 (validation, error, alternate flow)

### Edge Cases

EC-001: Given a user submits registration with an already-registered mobile_number, when the request is processed, then the registration is rejected with a duplicate mobile_number reason. [FR-003][P2]

EC-002: Given a registration attempt includes a syntactically invalid email_address, when registration is processed, then the submission is rejected due to email format validation. [FR-002][P1]

EC-003: Given a user initiates registration but OTP expires before verification, when the user attempts to verify, then user status remains PENDING_VERIFICATION and registration is not activated. [FR-010][P1]

EC-004: Given multiple OTP resend requests occur in quick succession, when OTP Handler rate limits are exceeded, then additional resend attempts are denied until cooldown elapses. [FR-009][P2]

EC-005: Given user submits registration missing a required field (e.g., password), when registration is processed, then the submission is rejected with a missing data reason. [FR-007][P2]

EC-006: Given a user enters an incorrect OTP code for verification, when verification is evaluated

### Technical Design

## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

## 1. Contracts & Interfaces

### 1.1 API Contracts

#### 1.1.1 POST /api/v1/user/register

- Description: Initiate mobile user registration
- Request Body:
  - given_name (string, REQUIRED)
  - family_name (string, REQUIRED)
  - mobile_number (string, REQUIRED, E.164 format)
  - password (string, REQUIRED, password policy applies)
  - email_address (string, REQUIRED, valid email)
- Success Response: 201 Created
  - Body: user_id (UUID), registration_status ("PENDING_VERIFICATION"), otp_sent (boolean)
- Error Responses:
  - 400 Bad Request (missing/invalid fields, weak password, invalid format)
  - 409 Conflict (duplicate mobile_number/email_address)
  - 500 Internal Server Error (unexpected failure)
  - Error Body: code (string), message (string)

#### 1.1.2 POST /api/v1/user/otp/send

- Description: Initiate OTP delivery for registration
- Request Body:
  - user_id (UUID, REQUIRED)
- Success Response: 200 OK
  - Body: otp_id (UUID), expiry (datetime), status ("SENT")
- Error Responses:
  - 404 Not Found (user not in PENDING_VERIFICATION)
  - 429 Too Many Requests (rate limit exceeded) [via OTP Handler]
  - 400 Bad Request (invalid user_id)

#### 1.1.3 POST /api/v1/user/otp/verify

- Description: Complete registration by submitting OTP
- Request Body:
  - user_id (UUID, REQUIRED)
  - otp_code (string, REQUIRED)
- Success Response: 200 OK
  - Body: user_id (UUID), registration_status ("ACTIVE")
- Error Responses:
  - 400 Bad Request (invalid/expired OTP)
  - 401 Unauthorized (incorrect OTP)
  - 409 Conflict (already verified)
  - 404 Not Found (user not found)

#### 1.1.4 POST /api/v1/user/otp/resend

- Description: Retry OTP delivery. Rate limits/expiry enforced by OTP Handler.
- Request Body:
  - user_id (UUID, REQUIRED)
- Success Response: 200 OK (otp resent)
- Error Response: 429 Too Many Requests (rate limited)

### 1.2 Data Schema Changes

#### User Table (`users`)

- user_id: UUID (PK)
- given_name: VARCHAR(128) NOT NULL
- family_name: VARCHAR(128) NOT NULL
- mobile_number: VARCHAR(32) NOT NULL, UNIQUE
- password: VARCHAR(256) NOT NULL
- email_address: VARCHAR(256) NOT NULL, UNIQUE
- registration_status: ENUM('PENDING_VERIFICATION', 'ACTIVE', 'REJECTED') DEFAULT 'PENDING_VERIFICATION'
- created_at: TIMESTAMP NOT NULL

**Indexes**:
- UNIQUE INDEX idx_users_mobile_number (mobile_number)
- UNIQUE INDEX idx_users_email_address (email_address)

#### OTPVerification Table (`otp_verifications`)

- otp_id: UUID (PK)
- user_id: UUID (FK to users.user_id, UNIQUE NOT NULL)
- otp_code: VARCHAR(16) NOT NULL
- expiry: TIMESTAMP NOT NULL
- status: ENUM('SENT', 'VERIFIED', 'EXPIRED') NOT NULL
- created_at: TIMESTAMP NOT NULL

**Indexes**:
- UNIQUE INDEX idx_otp_user (user_id)

---

## 2. Test Strategy

### 2.1 Registration API Test Cases (`POST /api/v1/user/register`)

- TC-01: Register with all valid fields (verify 201, correct schema, registration_status=PENDING_VERIFICATION, otp_sent)
- TC-02: Register missing required field (400, code/message verify missing field – validates error contract)
- TC-03: Register with weak password (400, code/message indicates weak password – validates password validation)
- TC-04: Register with invalid email (400, code/message indicates invalid email – validates email syntax)
- TC-05: Register with duplicate mobile_number (409, code/message specifies duplicate mobile_number)
- TC-06: Register with duplicate email_address (409, code/message specifies duplicate email_address)
- TC-07: Register with internal DB error (500)

### 2.2 OTP Send/Resend API (`POST /api/v1/user/otp/send`, `POST /api/v1/user/otp/resend`)

- TC-08: Send OTP for pending user (200, correct status/expiry)
- TC-09: OTP send for non-existent user (404)
- TC-10: OTP resend within rate limit (200)
- TC-11: OTP resend exceeding rate limit (429)
- TC-12: OTP send where user is not pending (404)

### 2.3 OTP Verification API (`POST /api/v1/user/otp/verify`)

- TC-13: Verify valid OTP before expiry (200, user status ACTIVE)
- TC-14: Verify expired OTP (400 or 401, user remains PENDING_VERIFICATION)
- TC-15: Verify incorrect OTP (401)
- TC-16: Verify already active user (409)
- TC-17: Verify with invalid user_id (404)

### 2.4 Data Model

- TC-18: After registration, record written to `users` with correct fields, status=PENDING_VERIFICATION
- TC-19: After OTP send, record in `otp_verifications` with user_id, otp_code, status=SENT

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._