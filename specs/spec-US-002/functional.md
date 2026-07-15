## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

**Functional Specification**
**Story**: US-002 – Deliver OTP via SMS
**Service**: User Management Service (S-101)
**Feature**: OTP Verification

---

### Purpose

This specification defines the behavior of the User Management Service when generating and delivering a one-time password (OTP) to a user via SMS. It exists to ensure that the OTP delivery flow is secure, reliable, and consistently validated before any downstream authentication or verification action is permitted.

---

### Scope

This specification covers OTP generation, SMS dispatch, delivery state tracking, and error handling within the User Management Service. It includes the send and resend OTP capabilities, the integration with the downstream SMS delivery provider, and the validation rules governing when an OTP may be issued to a given user.

---

### Non-Goals

- OTP verification and code validation against a submitted value is out of scope.
- Password recovery or reset flows that may incidentally use OTP are out of scope.
- Email-based OTP delivery is out of scope.
- Voice-call-based OTP delivery is out of scope.
- User registration or account activation logic is out of scope.
- Long-term audit log storage and compliance reporting are out of scope.
- SMS delivery provider selection, configuration, or failover strategy is out of scope.
- End-user device or SIM card compatibility is out of scope.

---

### Key Entities

**OTP Request**
- Attributes: recipient phone number (text), generated code (text), creation timestamp (datetime), expiry timestamp (datetime), delivery status (enumerated: pending, delivered, failed), attempt count (integer)
- Relationships: belongs to one User (one-to-one per active OTP window)

**User**
- Attributes: user identifier (text), registered phone number (text), account status (enumerated: active, inactive, suspended)
- Relationships: may have at most one active OTP Request at a time

---

### Functional Requirements

FR-001: User Management Service SHALL accept a request to send an OTP only when a valid, registered phone number is supplied by the caller.

FR-002: User Management Service SHALL generate a cryptographically random numeric OTP code of a fixed length upon receiving a valid send request.

[NEEDS CLARIFICATION: What is the required OTP code length (e.g., 4, 6, or 8 digits)?] (Assumed: 6 digits)

FR-003: User Management Service SHALL associate the generated OTP code with the requesting user's account for the duration of the OTP validity window.

FR-004: User Management Service SHALL set an expiry time on every generated OTP, after which the code is considered invalid.

[NEEDS CLARIFICATION: What is the required OTP validity window duration?] (Assumed: 10 minutes from generation)

FR-005: User Management Service SHALL transmit the OTP code to the user's registered phone number via the SMS Delivery Provider integration.

FR-006: User Management Service SHALL record the delivery status returned by the SMS Delivery Provider against the OTP Request.

FR-007: User Management Service SHALL reject a send request when the associated user account is not in an active state.

FR-008: User Management Service SHALL enforce a maximum number of OTP send attempts within a rolling time window to prevent abuse.

[NEEDS CLARIFICATION: What is the maximum number of OTP send attempts and the rolling window duration?] (Assumed: 5 attempts per 15-minute window per user)

FR-009: User Management Service SHALL invalidate any previously active OTP for a user when a new OTP is successfully generated for that same user.

FR-010: User Management Service SHALL support a resend request that follows identical generation, delivery, and rate-limiting rules as the initial send request.

FR-011: User Management Service MUST NOT expose the plaintext OTP code in any response returned to the caller.

FR-012: User Management Service SHALL notify the caller whether the OTP dispatch was accepted for delivery, without confirming or denying the existence of the phone number in cases where the user account cannot be located.

FR-013: User Management Service SHOULD surface a distinct delivery-failure state to the caller when the SMS Delivery Provider reports that the message could not be dispatched.

---

### Assumptions

**A-001**: The requesting caller has already been authenticated or is operating within a trusted flow (e.g., post-registration activation) before invoking OTP send. Affects: FR-001, FR-007.
*(Assumed: Caller authentication or flow context is enforced upstream by the API Gateway.)*

**A-002**: The user's phone number has been captured and stored during registration and is available to the service at the time of OTP dispatch. Affects: FR-001, FR-005.
*(Assumed: Phone number is a mandatory field during user registration.)*

**A-003**: The SMS Delivery Provider exposes a synchronous or near-synchronous acknowledgement of dispatch acceptance. Affects: FR-006, FR-013.
*(Assumed: The provider returns a delivery acceptance status within the same transaction.)*

**A-004**: OTP codes are numeric only and