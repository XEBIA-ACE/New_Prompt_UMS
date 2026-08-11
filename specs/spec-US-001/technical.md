## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification: Generate Unique OTP

**Story ID**: US-001
**Service**: User Management Service (S-101)
**Spec Version**: 1.0

---

## 1. Contracts & Interfaces

### 1.1 API Contract

**Endpoint**: POST /api/v1/otp/send
**Auth**: The API Gateway SHALL validate the inbound JWT before the request reaches this service. [NEEDS CLARIFICATION: Is a JWT required for all OTP generation flows, including unauthenticated registration activation?] (Assumed: the endpoint is accessible with a valid API Gateway session token; unauthenticated callers are permitted for registration flows.)

**Request Body** (application/json):
- user_id: UUID string, required
- purpose: enum string, one of ACTIVATION | LOGIN | PASSWORD_RECOVERY, required

**Response — 202 Accepted**:
- message: string, human-readable confirmation that OTP generation and delivery have been initiated
- The raw OTP value SHALL NOT appear in this response (FR-007)

**Response — 404 Not Found**: returned when the user_id does not exist (FR-008)

**Response — 422 Unprocessable Entity**: returned when the account is in SUSPENDED or DEACTIVATED state (FR-009)

**Response — 500 Internal Server Error**: returned when persistence fails before delivery is attempted (FR-012)

### 1.2 Data Model

**Table: otp_records**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, default gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → users(id) |
| purpose | VARCHAR(32) | NOT NULL, CHECK IN ('ACTIVATION','LOGIN','PASSWORD_RECOVERY') |
| passcode_hash | VARCHAR(255) | NOT NULL |
| status | VARCHAR(16) | NOT NULL, CHECK IN ('ACTIVE','EXPIRED','CONSUMED'), default 'ACTIVE' |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| expires_at | TIMESTAMPTZ | NOT NULL |

**Indexes**:
- UNIQUE partial index on (user_id, purpose) WHERE status = 'ACTIVE' — enforces the one-active-OTP-per-user-per-purpose invariant (FR-004, A-004)
- Index on (user_id, purpose, status) for fast lookup during invalidation

**Configuration property**: otp.expiry.seconds (integer, set at deployment, not client-supplied — A-001). Default assumed 300 seconds.

---

## 2. Test Strategy

Tests SHALL be written before implementation is merged. Each test case references the contract property it validates.

**Unit Tests** (class: OtpServiceTest):
- TC-001: generateOtp() produces a 6-digit numeric string — validates FR-001, A-003
- TC-002: generateOtp() output passes NIST SP 800-22 basic randomness check over 10,000 samples — validates FR-001
- TC-003: buildOtpRecord() sets expires_at = created_at + otp.expiry.seconds — validates FR-003, A-001
- TC-004: buildOtpRecord() stores bcrypt hash of passcode, not plaintext — validates FR-007 (storage layer equivalent)
- TC-005: generateAndSend() marks prior ACTIVE record EXPIRED before insert — validates FR-004, EC-001
- TC-006: generateAndSend() throws UserNotFoundException when user_id absent — validates FR-008, EC-002
- TC-007: generateAndSend() throws AccountIneligibleException when status is SUSPENDED or DEACTIVATED — validates FR-009
- TC-008: generateAndSend() does not invoke NotificationServiceClient when OtpRepository.save() throws — validates FR-012

**Integration Tests** (class: OtpGenerationIntegrationTest, Testcontainers PostgreSQL):
- TC-009: POST /api/v1/otp/send returns 202 and body contains no passcode field — validates FR-007, FR-011
- TC-010: Two sequential requests for same user_id + purpose leave exactly one ACTIVE row — validates FR-004
- TC-011: POST with non-existent user_id returns 404 — validates FR-008
- TC-012: POST with suspended user returns 422 — validates FR-009

**Contract Tests** (Pact, consumer: Notification Service):
- TC-013: NotificationServiceClient publishes an event payload containing user_id, purpose, and masked_otp_hint — validates FR-006, FR-007

---

## 3. Implementation Approach

### 3.1 Core Classes and Methods

**OtpController** (Spring @RestController, path /api/v1/otp/send):
- handleSend(@RequestBody OtpSendRequest req): validates input