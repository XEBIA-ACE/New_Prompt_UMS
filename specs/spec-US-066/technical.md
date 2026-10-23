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