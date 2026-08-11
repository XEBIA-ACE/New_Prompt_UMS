## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Functional Specification: Generate Unique OTP

**Story ID**: US-001
**Feature**: OTP Verification
**Service**: User Management Service (S-101)

---

### Purpose

This specification defines the behavior of the User Management Service when generating a one-time passcode (OTP) for identity verification purposes. It exists to ensure that OTP generation is secure, unique, time-bound, and consistently enforced across all verification flows.

---

### Scope

This specification covers OTP generation within the User Management Service, including the creation, storage, and delivery of a one-time passcode tied to a user identity. It applies to any flow that requires identity verification via OTP, including registration activation, login verification, and password recovery.

---

### Non-Goals

- OTP verification (validation of a submitted OTP against a stored value) is out of scope.
- OTP resend throttling logic is out of scope.
- Delivery channel configuration (e.g., selecting between email and SMS) is out of scope.
- User authentication or session token issuance is out of scope.
- Rate limiting enforcement at the network or gateway layer is out of scope.
- Long-term audit logging of OTP events is out of scope.

---

### Key Entities

**OTP Record**
- Passcode value: fixed-length numeric string
- Associated user identity: reference to a registered user
- Purpose context: enumerated verification intent (e.g., activation, login, password recovery)
- Creation timestamp: point-in-time marker of when the OTP was generated
- Expiry timestamp: point-in-time marker after which the OTP is no longer valid
- Status: enumerated lifecycle state (active, expired, consumed)

**User**
- Identity reference: unique user identifier
- Contact address: delivery destination (email or phone number)
- Account state: current lifecycle status of the user account

Relationships: one User MAY have at most one active OTP Record per purpose context at any given time.

---

### Functional Requirements

FR-001: User Management Service SHALL generate a cryptographically unpredictable numeric passcode of fixed length when an OTP generation request is received. [P1]

FR-002: User Management Service SHALL associate the generated OTP with a specific user identity and a declared purpose context. [P1]

FR-003: User Management Service SHALL assign an expiry timestamp to every generated OTP, after which the OTP is considered invalid. [P1] (A-001)

FR-004: User Management Service SHALL invalidate any previously active OTP for the same user identity and purpose context before persisting a newly generated OTP. [P1]

FR-005: User Management Service SHALL persist the OTP Record in a durable store prior to initiating delivery. [P1]

FR-006: User Management Service SHALL transmit the generated OTP to the user's registered contact address via the Notification Service. [P1]

FR-007: User Management Service MUST NOT expose the raw OTP value in any response payload returned to the requesting client. [P1]

FR-008: User Management Service SHALL reject an OTP generation request when the referenced user identity does not exist in the system. [P2]

FR-009: User Management Service SHALL reject an OTP generation request when the referenced user account is in a suspended or deactivated state. [P2]

FR-010: User Management Service SHOULD record the creation timestamp of each OTP for auditability within the active session context. [P3]

FR-011: User Management Service SHALL return a confirmation to the requesting client indicating that OTP generation and delivery have been initiated successfully, without revealing passcode details. [P1]

FR-012: User Management Service SHALL treat OTP generation as an atomic operation, ensuring that a passcode is never delivered if it cannot be persisted. [P1]

---

### Assumptions

A-001: The OTP validity window (duration between creation and expiry) is a system-configured value agreed upon at deployment time and is not supplied by the requesting client.
Cross-references: FR-003

A-002: The User Management Service delegates message delivery entirely to a Notification Service and does not itself manage delivery channels or templates.
Cross-references: FR-006

A-003: The OTP is numeric and of a fixed length (exact length to be confirmed by product requirements). [NEEDS CLARIFICATION: What is the required OTP length and character set — numeric only, alphanumeric, or other?] (Assumed: 6-digit numeric)

A-004: A single user may have separate active OTPs for distinct purpose contexts simultaneously (e.g., one for activation and one for password recovery).
Cross-references: FR-004

---

### Edge Cases

EC-001:
Given a valid user identity and purpose context are supplied,
When an active OTP for the same identity and purpose context already exists,
Then the system SHALL invalidate the prior OTP, generate a new one, and initiate delivery of only the new OTP.

EC-002:
Given an OTP generation request is received,
When the referenced user identity does not exist in the system,
Then the system SHALL reject