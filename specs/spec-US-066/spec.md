# Set Up Data Encryption

| | |
|---|---|
| **ID** | US-066 |
| **Feature** | F-01 — User Registration |
| **Epic** | EP-003 — Develop Backend for User Data Storage |
| **Status** | Draft |
| **Date** | 2026-07-03 |

## Background

Part of feature *User Registration*.

## Acceptance Criteria

### Story

- [ ] Given the user data is stored, When the data is at rest, Then it should be encrypted.
- [ ] Given an authorized user requests access, When the data needs to be decrypted, Then the data decryption occurs.
- [ ] Given encryption keys are needed, When storing and managing them, Then keys are stored and managed securely.

### Epic

- [ ] Given a user data request, when the system processes it, then the data should be encrypted at all times.
- [ ] Given a backup operation is triggered, when data is available, then it should successfully backup without any data loss.
- [ ] Given a database update, when it occurs during high load, then the system should handle it within performance requirements without affecting user experience.

## Proposed Solution

### Functional Specification

## S-101

### Purpose

This specification defines the required data encryption behavior for user data managed by the User Management Service, ensuring privacy and integrity throughout storage and authorized access.

### Scope

This specification applies to all points where user data is stored or accessed in the User Management Service, covering data encryption at rest, secure authorized decryption, and robust key management. It specifically targets data from registration, authentication, OTP management, and user account lifecycle operations.

### Non-Goals

1. Encrypting data transmitted between client and service.
2. Encrypting outbound notifications via email or SMS.
3. Defining cryptographic algorithms or key lengths.
4. Handling regulatory compliance evidence.
5. Encrypting data stored in non-primary services.
6. Providing end-user controls for encryption configuration.
7. Addressing physical security of storage hardware.
8. Supporting bring-your-own-key scenarios.
9. Exposing cryptographic keys to admins or end-users.
10. Re-encrypting data on demand without schema changes.

### Key Entities

- UserAccount  
  - user_id (string)
  - credentials (string)
  - email (string)
  - phone_number (string)
  - created_at (datetime)
  - last_login (datetime)
- OTPEntry  
  - otp_id (string)
  - user_id (string, relates to UserAccount 1:N)
  - otp_value (string)
  - expires_at (datetime)
  - verified (boolean)
- AuditLog  
  - log_id (string)
  - user_id (string, relates to UserAccount 1:N)
  - action (string)
  - timestamp (datetime)
- EncryptionKey  
  - key_id (string)
  - key_material (string)
  - status (string)
  - created_at (datetime)
  - expires_at (datetime)

### Functional Requirements

FR-001: User Management Service MUST encrypt all user data at rest, including user account, OTP, and audit log records.  
FR-002: User Management Service MUST decrypt user data only for authorized requests where access is required per functional flow.  
FR-003: User Management Service MUST securely store and manage encryption keys to prevent unauthorized access.  
FR-004: User Management Service SHALL NOT allow unencrypted user data to persist in temporary or permanent storage.  
FR-005: User Management Service SHOULD log all decryption events, including user identity and purpose, for auditability.  
FR-006: User Management Service MAY rotate encryption keys periodically following business policy or security best practices.

### Assumptions Propagation

A-001: All user data within the relevant storage scope is subject to encryption (FR-001, FR-004).  
A-002: Only explicit, authenticated, and authorized flows may access decrypted data (FR-002, FR-005).  
A-003: Encryption key management is handled internally; no external key sources or user-supplied keys are involved (FR-003, FR-006).  
A-004: Audit logging is a core service feature and applies to sensitive operations, such as decryption (FR-005).

### Success Criteria

SC-001: Percentage of user data records stored in encrypted form equals 100%.  
SC-002: Number of unauthorized access attempts to decrypted user data equals 0.  
SC-003: Number of decryption events lacking an audit log entry equals 0.

### Priority Levels

- FR-001: P1 (Core user goal of encrypted storage)
- FR-002: P1 (Authorized access to decrypted data)
- FR-003: P1 (Essential for data integrity and privacy)
- FR-004: P2 (Validates full encryption; error/alternate flow)
- FR-005: P2 (Auditability; advanced validation)
- FR-006: P3 (Periodic key rotation; optimization)

### Edge Cases

EC-001: Given a corrupted encryption key, When decryption is requested, Then the system SHOULD reject the operation and log an error. (FR-002, FR-003)  
EC-002: Given a non-authorized user, When attempting to access encrypted data, Then access SHALL be denied and logged. (FR-002, FR-005)  
EC-003: Given a data storage failure, When data cannot be encrypted, Then the operation MUST be aborted, and no unencrypted data SHALL persist. (FR-001, FR-004)  
EC-004: Given key expiration, When a key is unavailable for decryption, Then access SHALL be denied until business policy determines next steps. (FR-003, FR-006)  
EC-005: Given a request for audit log, When a decryption occurs, Then an entry SHOULD exist recording access. (FR-005)

### Independent Testability

Minimum viable test scenario:
- Preconditions:
  1. A user is successfully registered.
  2. User account data exists in the service.
  3. Test data is available for retrieval.
  4. The test user has valid authorization.
  5. Encryption system is configured and operational.
- User Action: Authorized retrieval of user account data.
- Observable Outcome: Retrieved data is decrypted for authorized user, stored data remains encrypted, and the decryption event is logged.

### Technical Design

## S-101

---
## 1. Contracts & Interfaces

### 1.1 API Contracts

#### *No changes to external API request/response schemas are required*  
All encryption and decryption operations SHALL be transparent to clients. The following implicit contract requirements MUST be observed:

- All endpoints that access or persist user data (e.g., POST /api/v1/users/register, GET /api/v1/users/me) SHALL process encrypted data at rest and return decrypted content to authorized callers.
- No new fields SHALL be added to input/output JSON, but the service’s internal data access objects (DAOs) and service layer SHALL enforce encryption and decryption on the fly.

#### 1.2 Internal Service Interfaces

##### EncryptionService Interface

- String encrypt(String plaintext, KeyReference keyRef)
- String decrypt(String ciphertext, KeyReference keyRef)
- KeyReference getActiveEncryptionKey()
- void rotateEncryptionKey()
- void validateKeyStatus(KeyReference keyRef) // throws on expired/corrupted

##### AuditLogger Interface

- void logDecryptionEvent(String userId, String purpose, String actorId, Date timestamp)

##### KeyManagementService Interface

- KeyReference generateKey()
- KeyReference fetchKey(String keyId)
- void markKeyExpired(String keyId)

#### 1.3 Data Schemas

##### UserAccount Table

- credentials, email, phone_number columns MUST be stored as VARBINARY or BYTEA, NOT as plain VARCHAR.
- Additional metadata column: encryption_key_id (references EncryptionKey.key_id)

##### OTPEntry Table

- otp_value column MUST be VARBINARY/BYTEA.
- encryption_key_id column (references EncryptionKey.key_id)

##### AuditLog Table

- Add decryption_purpose (nullable string)
- Add actor_id (nullable string)

##### EncryptionKey Table

- key_id (PK), key_material (encrypted in KMS/HSM), status, created_at, expires_at

##### Indexes

- New index on UserAccount(encryption_key_id)
- New index on OTPEntry(encryption_key_id)

---

## 2. Test Strategy

1. **Test: Encrypted Storage (FR-001, FR-004, SC-001)**
    - Create user/account/otp records; validate at-PG level that credentials, email, phone_number, otp_value data is unreadable as cleartext.
    - Assert all data fields are non-NULL and non-plaintext following persistence.
2. **Test: Authorized Decryption (FR-002, SC-002)**
    - Authenticate as user; perform GET /api/v1/users/me; assert returned values are correctly decrypted and match original values.
    - Attempt unauthorized access, assert HTTP 403 and no decryption attempted.
3. **Test: Audit Logging (FR-005, EC-002, SC-003)**
    - Trigger authorized decryption; check AuditLog for event with correct user, purpose, actor.
    - Attempt unauthorized access; check AuditLog for denied event.
    - Negative: forcibly fail audit log; ensure decryption aborts.
4. **Test: Key Management Failure (EC-001, EC-004)**
    - Simulate corrupted or expired key access via test harness; assert decryption is rejected and error is logged.
5. **Test: Data Integrity (EC-003)**
    - Simulate storage failure (e.g. disk or DB error after encryption but before write); assert no cleartext data remains, operation rolls back.

---

## 3. Implementation Approach

### 3.1 Service Classes

- EncryptionServiceImpl: handles encrypt(), decrypt(), key rotation
- KeyManagementServiceImpl: generates, fetches, invalidates keys; interacts w/ HSM or KMS [NEEDS CLARIFICATION: Is there an org standard KMS/HSM, or must we implement our own?] (Assumed: Internal service with software-based encryption-key store)
- TransparentEncryptionJpaConverter: JPA attribute converter to apply EncryptionService.encrypt()/decrypt() on mapped columns (marked via @Convert)

### 3.2 Entity Changes

- UserAccountEntity: @Convert(converter = TransparentEncryptionJpaConverter.class) on credentials, email, phoneNumber
- OTPEntryEntity: @Convert(...) on otpValue
- encryptionKeyId property mapped and set on row creation
- All DAOs & repositories updated to exclude raw values from logs, debugging, and error traces

### 3.3 Secure Key Storage

- EncryptionKey material is never exposed to the application; fetched and used via KMS API or secret management lib
- Key references/id only retained in main DB schemas

### 3.4 Decryption Flow Enforcement

- All service-layer access to user/otp/audit data passes through an authorization interceptor (AuthorizationAspect)
- AuthorizationAspect checks for user permissions, then proceeds with decrypt() calls
- AuditLogger logs all authorized decryption and access denial attempts

### 3.5 Key Rotation

- Periodic job: KeyRotationScheduler triggers EncryptionService.rotateEncryptionKey(), marks old keys as expired

### 3.6 Failure Handling

- All decrypt() calls wrapped; corrupted/expired keys throw KeyInvalidException, handled at service edge with standardized error (HTTP 500 or 403 as appropriate)
- Storage failures rollback partially-written data

---

## 4. Architectural Decision Records (ADRs)

**ADR-001:** Column-level encryption using JPA Converter and centralized EncryptionService  
- *Context*: Fine-grained field encryption or whole-table encryption needed.  
- *Decision*: Use JPA AttributeConverter for critical fields, invoke EncryptionService for serialization.  
- *Rationale*: Transparent for devs/clients, reduces risk of accidental exposure, aligns with FR-001/FR-004.  
- *Alternative*: Encrypt/decrypt at controller/service level—REJECTED: error-prone, risk of omission

## Affected Services

_None identified._

## API Changes

_No API changes identified._

## Open Questions / Gaps

_No gaps identified._