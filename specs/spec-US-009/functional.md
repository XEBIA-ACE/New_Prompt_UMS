## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

### Purpose

This specification defines the behavior of the User Management Service when a user requests a new One-Time Password (OTP) after one has already been issued. It exists to ensure users who did not receive or whose OTP has expired can recover the verification flow without re-registering.

---

### Scope

This specification covers the OTP re-request capability within the User Management Service, including eligibility validation, rate limiting, OTP invalidation, new OTP generation and delivery, and response behavior. It applies to any flow in which a valid OTP session exists and the user requests a replacement code.

---

### Non-Goals

- Initial OTP issuance during registration or login flows
- OTP verification logic and outcomes
- Password recovery or reset flows
- Account deletion flows
- Authentication token issuance
- User profile management
- Delivery channel selection or preference management
- Administrative override of OTP state

---

### Key Entities

**OTP Request**
- Identifier: unique token (text)
- Recipient reference: user identity handle (text)
- Delivery address: contact destination (text)
- Code: one-time secret value (text)
- Status: current lifecycle state — pending, verified, expired, invalidated (text)
- Issued at: timestamp of creation (datetime)
- Expires at: timestamp of expiry (datetime)
- Attempt count: number of verification attempts made (integer)
- Resend count: number of re-requests made for the same session (integer)

Relationships:
- OTP Request belongs to exactly one User Account (many-to-one)
- User Account may have at most one active OTP Request at any given time

**User Account**
- Identifier: unique system identity (text)
- Activation status: whether the account has been verified (boolean)
- Registration timestamp: when the account was created (datetime)

---

### Functional Requirements

FR-001: User Management Service SHALL accept a re-request for a new OTP only when a prior OTP session exists for the identified user. [P1]

FR-002: User Management Service SHALL invalidate the previously issued OTP before generating a replacement, ensuring only one active OTP exists per user at any time. [P1]

FR-003: User Management Service SHALL generate a new OTP with a freshly calculated expiry period upon a valid re-request. [P1]

FR-004: User Management Service SHALL deliver the newly generated OTP to the same delivery address used in the original OTP session. [P1]

FR-005: User Management Service SHALL reject a re-request if the user's account has already been activated. [P2]

FR-006: User Management Service SHALL reject a re-request if no prior OTP session exists for the identified user. [P2]

FR-007: User Management Service SHALL enforce a maximum number of OTP re-requests per user within a defined time window and MUST reject requests that exceed this limit. [P2]

[NEEDS CLARIFICATION: What is the maximum number of OTP re-requests permitted per user per time window, and what is the duration of that window?] (Assumed: 3 re-requests per 10-minute window.)

FR-008: User Management Service SHALL return a confirmation to the caller indicating that a new OTP has been dispatched, without revealing the OTP value itself. [P1]

FR-009: User Management Service SHALL return a rejection response describing why the re-request was denied when eligibility conditions are not met, without disclosing sensitive account state beyond what is necessary. [P2]

FR-010: User Management Service SHOULD notify the downstream notification service to deliver the new OTP through the appropriate channel without exposing the delivery mechanism details to the caller. [P1]

FR-011: User Management Service SHALL record each re-request event, incrementing the resend count on the OTP session record. [P2]

FR-012: User Management Service MUST NOT allow a re-request to reset or clear prior failed verification attempt counts accumulated on the original OTP session. [P2]

[NEEDS CLARIFICATION: Should failed verification attempt counts carry over to the new OTP, or should the new OTP begin with a fresh attempt count?] (Assumed: attempt count resets to zero on a new OTP issuance, but resend count carries forward.)

---

### Assumptions

**A-001**: A user identity handle (such as an email address or phone number) is sufficient to locate an existing OTP session without requiring authentication. Affects: FR-001, FR-002, FR-006.

**A-002**: The delivery address for the re-requested OTP is always the same as that used in the original OTP session; the user cannot change it during re-request. Affects: FR-004.

**A-003**: The OTP expiry duration for re-issued codes is identical to that of originally issued codes. Affects: FR-003.

**A-004**: Rate limiting applies per user identity, not per delivery address or IP address. Affects: FR-007.

---

### Edge Cases

**EC-001**
Given a user has an active OTP session and has already reached