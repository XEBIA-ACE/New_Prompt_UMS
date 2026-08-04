## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

## Functional Specification: Send OTP

**Story ID**: US-007
**Feature**: OTP Verification
**Service**: User Management Service (S-101)
**Version**: 1.0

---

### Purpose

This specification defines the behavior of the User Management Service when a user requests a one-time passcode (OTP) to be delivered to their registered contact. It establishes the rules governing OTP generation, delivery, and lifecycle management.

---

### Scope

This specification covers the OTP send capability within the User Management Service, including request validation, OTP generation, delivery via an external notification channel, and storage of the active OTP record. It does not cover OTP verification or resend flows, which are addressed in separate specifications.

---

### Non-Goals

- OTP verification or confirmation of a submitted code
- OTP resend rate-limiting beyond initial send constraints
- Password recovery flows that may incidentally use OTP
- Delivery channel selection by the end user
- OTP delivery to unregistered contact addresses
- Multi-factor authentication session management
- Audit logging format or retention policy
- User account registration or activation flows

---

### Key Entities

**OTP Record**
- recipient_identity: text (the registered contact address, e.g., email or phone)
- passcode: text (the generated one-time code, stored in a non-recoverable form)
- created_at: timestamp
- expires_at: timestamp
- status: enumeration (pending, consumed, expired)
- purpose: enumeration (e.g., identity verification, login confirmation)

Relationship: One OTP Record is associated with exactly one registered User account (cardinality: many-to-one).

**User Account**
- identity: text (registered contact address)
- account_status: enumeration (active, inactive, suspended)

Relationship: A User Account may have zero or more OTP Records over time; at most one OTP Record per purpose SHALL be active at any given moment.

---

### Assumptions

**A-001**: The requesting party has already been authenticated or is operating within a flow that permits OTP issuance without prior full authentication (e.g., login initiation). [NEEDS CLARIFICATION: Must the caller be authenticated via JWT before requesting an OTP, or is this step pre-authentication?] (Assumed: OTP send may occur in a pre-authentication context, such as login initiation.) Affects: FR-001, FR-002.

**A-002**: The User Management Service delegates message delivery to a dedicated external notification service and does not transmit messages directly. Affects: FR-007, FR-008.

**A-003**: OTP codes are numeric and of a fixed length defined by system configuration. [NEEDS CLARIFICATION: What is the required OTP length and character set?] (Assumed: six-digit numeric code.) Affects: FR-005.

**A-004**: A single delivery channel (e.g., email or SMS) is associated with each user account at the time of registration; the system selects it automatically. Affects: FR-007.

---

### Functional Requirements

**FR-001 (P1)**: User Management Service SHALL accept an OTP send request that includes a valid registered identity (contact address) as its sole required input.

**FR-002 (P1)**: User Management Service MUST reject any OTP send request that does not include a recognizable registered identity, and SHALL return a descriptive rejection indicating the input is missing or unrecognizable.

**FR-003 (P1)**: User Management Service MUST verify that the provided identity corresponds to an existing user account before proceeding with OTP generation.

**FR-004 (P2)**: User Management Service SHALL reject an OTP send request when the associated user account is in a suspended or inactive state, and SHALL inform the requester that the account is not eligible.

**FR-005 (P1)**: User Management Service SHALL generate a cryptographically unpredictable one-time passcode conforming to the configured length and character set upon successful identity resolution.

**FR-006 (P1)**: User Management Service SHALL assign an expiry timestamp to each generated OTP, defining a bounded validity window after which the code is no longer usable.

**FR-007 (P1)**: User Management Service SHALL transmit the generated OTP and the recipient's contact address to the external notification service for delivery over the appropriate channel.

**FR-008 (P2)**: User Management Service MUST record the outcome of the notification service dispatch attempt and SHALL treat a delivery dispatch failure as a transient error, surfacing an appropriate rejection to the requester.

**FR-009 (P1)**: User Management Service SHALL persist an OTP Record with status "pending" upon successful dispatch to the notification service.

**FR-010 (P2)**: User Management Service MUST invalidate any previously active OTP Record for the same user and purpose before persisting the newly generated one, ensuring only one active code exists per user per purpose at any time.

**FR-011 (P2)**: User Management Service SHALL enforce a maximum number of active OTP send attempts within a rolling time window per identity