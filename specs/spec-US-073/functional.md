## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

### Purpose

This specification defines the behavior of the User Management Service when sending a confirmation email to a newly registered user. It exists to ensure that every successful registration triggers a timely, well-formed email communication as part of the onboarding flow.

---

### Scope

This specification covers the post-registration email dispatch capability within the User Management Service (S-101), including the trigger conditions, email content rules, delivery integration, retry behavior, and error handling associated with sending a confirmation or activation email after a user account is created.

---

### Non-Goals

- Defining the registration form or input validation logic prior to account creation
- Specifying the visual design or HTML template rendering engine
- Managing email unsubscribe or marketing preferences
- Handling email delivery bounce processing or inbox placement optimization
- Defining OTP generation or verification flows (handled separately)
- Specifying account activation logic that follows email link click
- Managing user profile updates post-registration

---

### Key Entities

**User**
- user_id: unique identifier
- email_address: text
- display_name: text
- registration_timestamp: datetime
- account_status: enumeration (pending, active, suspended)
- email_confirmed: boolean

**Registration Email Record**
- record_id: unique identifier
- user_id: reference to User (many-to-one)
- recipient_address: text
- dispatch_timestamp: datetime
- delivery_status: enumeration (queued, sent, failed)
- retry_count: integer
- activation_token: opaque token

**Activation Token**
- token_value: opaque text
- user_id: reference to User (one-to-one)
- issued_at: datetime
- expires_at: datetime
- consumed: boolean

---

### Assumptions

[NEEDS CLARIFICATION: Should the post-registration email serve purely as a welcome notice, or must it contain an activation link to verify the email address?] (Assumed: A-001 — The email serves as an activation/confirmation email containing a unique activation link.)

[NEEDS CLARIFICATION: Is there a defined token expiry window for the activation link?] (Assumed: A-002 — The activation token expires 24 hours after issuance.)

[NEEDS CLARIFICATION: Is email dispatch synchronous within the registration request or asynchronous via a background process?] (Assumed: A-003 — Email dispatch is asynchronous; registration completes before the email is delivered.)

**A-001** — Affects FR-001, FR-004, FR-005
**A-002** — Affects FR-005, FR-006, EC-003
**A-003** — Affects FR-002, FR-003, FR-009

---

### Functional Requirements

**FR-001 (P1):** User Management Service SHALL trigger a post-registration email dispatch event immediately after a new user account is successfully created and persisted.

**FR-002 (P1):** User Management Service SHALL enqueue the email dispatch request asynchronously so that the registration response is not blocked by email delivery latency.

**FR-003 (P1):** User Management Service SHALL generate a unique, single-use activation token and associate it with the newly registered user prior to dispatching the email.

**FR-004 (P1):** User Management Service SHALL include the activation token as an embedded link within the confirmation email sent to the registered email address.

**FR-005 (P1):** User Management Service SHALL address the confirmation email to the exact email address supplied during registration, using the user's display name as the recipient label where available.

**FR-006 (P1):** User Management Service SHALL set an expiry on the activation token such that the link becomes invalid after the defined validity window has elapsed (assumed 24 hours per A-002).

**FR-007 (P2):** User Management Service SHALL record a Registration Email Record capturing the dispatch attempt, recipient address, timestamp, and initial delivery status at the time of enqueue.

**FR-008 (P2):** User Management Service SHALL update the delivery status on the Registration Email Record to reflect the outcome reported by the downstream email delivery service.

**FR-009 (P2):** User Management Service SHALL retry a failed email dispatch at least once before marking the Registration Email Record status as permanently failed.

**FR-010 (P2):** User Management Service MUST NOT dispatch more than one registration confirmation email per registration event for a given user account.

**FR-011 (P2):** User Management Service SHALL reject any attempt to trigger a post-registration email for a user account that does not exist or has not reached a pending-confirmation state.

**FR-012 (P2):** User Management Service SHOULD log a structured failure event when the downstream email delivery service is unavailable, including the user identifier and the number of retry attempts made.

**FR-013 (P3):** User Management Service MAY expose an internal administrative capability to manually re-trigger a registration confirmation email for a specific user, subject to the user's account still being in a pending-confirmation state.

**FR-014 (P3):** User Management Service SHOULD include a human