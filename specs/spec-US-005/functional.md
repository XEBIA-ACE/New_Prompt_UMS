## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

**Functional Specification**
**Story**: US-005 – Verify OTP on User Entry
**Service**: User Management Service (S-101)
**Feature**: OTP Verification

---

### Purpose

This specification defines the behavior of the User Management Service when a user submits a one-time passcode (OTP) for verification. It ensures that only users who present a valid, unexpired, and correctly matched OTP are granted verified status.

---

### Scope

This specification covers the OTP verification capability within the User Management Service, including input validation, OTP matching logic, attempt tracking, expiry enforcement, and downstream state transitions triggered by successful verification. It does not cover OTP generation, delivery, or resend flows.

---

### Non-Goals

- OTP generation and initial dispatch to the user
- OTP resend or refresh workflows
- Password recovery or reset flows
- User registration or account creation
- Authentication token issuance beyond confirming verified status
- Rate limiting or throttling policy configuration
- Notification delivery mechanisms (e.g., SMS, email infrastructure)
- Audit logging implementation details
- Session management post-verification

---

### Key Entities

**OTP Record**
- identifier: unique reference
- associated_user: reference to User (cardinality: many OTP Records to one User)
- passcode_value: masked credential string
- issued_at: timestamp
- expires_at: timestamp
- status: enumeration (pending, verified, expired, invalidated)
- attempt_count: integer

**User**
- identifier: unique reference
- account_status: enumeration (unverified, active, locked, deleted)
- Related to OTP Record (one User to many OTP Records)

**Verification Result**
- outcome: enumeration (success, failure, expired, locked)
- verified_at: timestamp (populated on success)
- Related to OTP Record (one Verification Result to one OTP Record)

---

### Assumptions

**A-001**: A user must have a previously issued, non-consumed OTP record in a pending state before verification can succeed. *(Affects: FR-001, FR-003, FR-006)*

**A-002**: The OTP has a finite validity window established at issuance time; this specification assumes that window is enforced at the moment of verification. *(Affects: FR-004, FR-005)*

**A-003**: A maximum number of consecutive failed verification attempts is defined by system policy; this specification assumes that threshold exists and is enforced. *(Affects: FR-007, FR-008)*

**A-004**: Successful OTP verification may transition the user's account to an active or verified state, depending on the context (e.g., registration activation vs. step-up authentication). [NEEDS CLARIFICATION: Does OTP verification always activate the account, or does it serve multiple contextual purposes (e.g., login step-up, password recovery confirmation)?] (Assumed: OTP verification in this story primarily serves account activation after registration.)

---

### Functional Requirements

**FR-001 [P1]**: User Management Service SHALL accept a verification request containing a user identity reference and a submitted passcode value.

**FR-002 [P1]**: User Management Service SHALL reject a verification request that is missing either the user identity reference or the submitted passcode value, and SHALL inform the requester that required fields are absent.

**FR-003 [P1]**: User Management Service SHALL locate the most recent pending OTP record associated with the provided user identity reference before proceeding with any comparison.

**FR-004 [P1]**: User Management Service SHALL compare the submitted passcode value against the stored passcode value using a secure, timing-safe comparison method.

**FR-005 [P1]**: User Management Service SHALL reject verification and return an expiry failure outcome when the current time exceeds the OTP record's expiry timestamp, regardless of passcode correctness.

**FR-006 [P1]**: User Management Service SHALL reject verification with a not-found failure outcome when no pending OTP record exists for the provided user identity reference.

**FR-007 [P2]**: User Management Service SHALL increment the attempt count on the OTP record each time a verification request is received and the passcode value does not match.

**FR-008 [P2]**: User Management Service SHALL invalidate the OTP record and lock further verification attempts when the attempt count reaches the system-defined maximum threshold.

**FR-009 [P2]**: User Management Service SHALL reject verification with a locked outcome when the OTP record has been invalidated due to excessive failed attempts.

**FR-010 [P1]**: User Management Service SHALL mark the OTP record status as verified and record the verification timestamp upon a successful passcode match within the validity window.

**FR-011 [P1]**: User Management Service SHALL transition the associated user's account status to active upon successful OTP verification, provided the account is currently in an unverified state.

**FR-012 [P2]**: User Management Service SHALL reject verification with an account-state failure outcome when the associated user's account is in a locked or deleted state, even if