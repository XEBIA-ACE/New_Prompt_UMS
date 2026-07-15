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