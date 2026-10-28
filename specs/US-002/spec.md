# Feature Specification: US-002

## Story
**Title**: Create and Send Email MFA Challenge After Successful Local Password

**Description**: As an HR Manager, I want the system to send a one-time numeric MFA code to the user's verified email after a correct local password, so that only the legitimate user who controls that email can complete login.

**Behavior**: On successful local HRMS password verification for a user with required email-based MFA, the backend shall create exactly one pending MFA challenge (atomically replacing any prior pending challenge), generate a cryptographically secure random numeric OTP whose length and expiry are sourced from central configuration, persist the challenge, and dispatch the OTP to the user's verified primary email — withholding session issuance until the challenge is subsequently satisfied. On incorrect password, MFA infrastructure must not be touched and MFA configuration must not be disclosed. On unavailability of MFA configuration, the OTP store, or the email delivery service, the login attempt must fail with a generic error and no session must be issued.

---

## User Scenarios & Acceptance Criteria

- **US-002-ac-1**: Given a user with required email-based MFA and a verified primary email, When they submit a correct local HRMS username/password, Then the system shall create exactly one pending MFA challenge for that user, generate a cryptographically secure random numeric code with length and expiry from central configuration, store the challenge, and send the code to the user's verified primary email, and shall not yet issue a session (F-01-R1).
- **US-002-ac-2**: Given a user with required MFA, And an existing pending MFA challenge for a previous password success, When they successfully re-enter their password, Then the system shall atomically invalidate any prior pending challenge and create a new pending challenge with a new one-time numeric code, and shall send only the new code (F-01-R1).
- **US-002-ac-3**: Given a user submits an incorrect local HRMS password, When the login is processed, Then the system shall not generate an MFA code, shall not create a pending MFA challenge, shall not send any MFA-related email, and shall not reveal whether MFA is configured for the account (F-01-R1).
- **US-002-ac-4**: Given MFA is required for a local login, And the MFA configuration or MFA code store is unavailable, When the user submits a correct username/password, Then the system shall fail the login attempt, shall not generate an MFA code, shall not issue a session, and shall present a generic authentication failure state (F-01-R1).
- **US-002-ac-5**: Given MFA is required for a local login, And email sending of the one-time code fails, When the user submits a correct username/password, Then the system shall not issue a session, shall not treat the challenge as satisfied, and shall inform the user that authentication cannot be completed without exposing configuration details (F-01-R1).

---

## Functional Requirements

- **FR-001** [AC: US-002-ac-1]: Upon successful verification of a local HRMS username/password for a user who has required email-based MFA and a verified primary email, the system shall create exactly one pending MFA challenge record for that user. The one-time numeric code shall be generated using a cryptographically secure random source (CSPRNG). The code's length and its expiry duration shall be read exclusively from central configuration (not hard-coded). The challenge shall be persisted to the MFA challenge store before any dispatch attempt. The OTP shall be sent to the user's verified primary email address. No session token or authenticated session shall be issued at this stage. [Evidence gap: CAST structural facts do not confirm presence of a CSPRNG in the current codebase path; backend challenge-creation and session-gate logic are not mapped from the measured object graph. Candidate focus object EmailOtpDeliveryAdapter (id=2951) is the likely implementation boundary — re-anchor analysis there.]

- **FR-002** [AC: US-002-ac-2]: When a user who already has a pending MFA challenge (from a prior successful password submission) successfully submits their password again, the system shall atomically — within a single database transaction or equivalent atomic operation — invalidate (delete or mark expired) all existing pending MFA challenges for that user and create a new pending challenge with a newly generated one-time numeric code. Only the new code shall be dispatched to the user's verified primary email; no additional emails related to the invalidated challenge(s) shall be sent. [Evidence gap: No structural evidence from CAST facts confirms atomic invalidation logic or a database transaction boundary for this operation; atomicity guarantee cannot be verified from the measured object graph. Concurrent re-submissions must not result in two simultaneously active pending challenges for the same user.]

- **FR-003** [AC: US-002-ac-3]: When a user submits an incorrect local HRMS password, the system shall not generate an OTP code, shall not create or modify any pending MFA challenge record, shall not dispatch any MFA-related email, and shall not include in any response or error message any indication of whether MFA is configured for the account. The response to a failed password attempt must be indistinguishable (to the caller) from a response that would be given to a non-MFA account with an incorrect password. [Evidence gap: CAST provides no structural evidence that the backend suppresses MFA challenge creation, email dispatch, and MFA configuration disclosure on incorrect password; the guard logic is not visible in the measured object graph (0 callees, 0 DB objects, no backend callers returned for email (2587)).]

- **FR-004** [AC: US-002-ac-4]: When MFA is required for a local login and either the MFA configuration (e.g., OTP length/expiry settings) or the MFA challenge store (OTP persistence layer) is unavailable at the time of a correct password submission, the system shall: (a) abort the login attempt without generating an OTP code, (b) not issue a session token, and (c) return a generic authentication failure state to the user that does not expose the nature or details of the infrastructure failure. [Evidence gap: No structural evidence from CAST facts shows a fault-tolerance or error-handling path for MFA config or OTP store unavailability; no error-handling callees, no DB objects, and no backend orchestration objects were returned for the measured focus object.]

- **FR-005** [AC: US-002-ac-5]: When MFA is required for a local login and the email delivery step (via EmailOtpDeliveryAdapter / SendGridEmailAdapter / EmailDeliveryPort) fails after a correct password submission, the system shall: (a) not issue a session token, (b) not transition the MFA challenge to a satisfied or completed state, and (c) return a user-facing message indicating that authentication cannot be completed, without disclosing configuration details (e.g., email provider name, internal error codes, or adapter-level diagnostics). The LoginForm.tsx error state must be announced to screen readers and must not expose internal configuration (accessibility obligation). [Evidence gap: CAST returned 0 downstream callees and no call graph for email (2587); there is no structural evidence that email-send failure prevents session issuance or that the challenge is not marked satisfied on failure. Error-handling logic within SendGridEmailAdapter and EmailOtpDeliveryAdapter is not structurally confirmed.]

---

## Success Criteria

- **US-002-ac-1**: Given a user with required email-based MFA and a verified primary email, When they submit a correct local HRMS username/password, Then the system shall create exactly one pending MFA challenge for that user, generate a cryptographically secure random numeric code with length and expiry from central configuration, store the challenge, and send the code to the user's verified primary email, and shall not yet issue a session (F-01-R1).
- **US-002-ac-2**: Given a user with required MFA, And an existing pending MFA challenge for a previous password success, When they successfully re-enter their password, Then the system shall atomically invalidate any prior pending challenge and create a new pending challenge with a new one-time numeric code, and shall send only the new code (F-01-R1).
- **US-002-ac-3**: Given a user submits an incorrect local HRMS password, When the login is processed, Then the system shall not generate an MFA code, shall not create a pending MFA challenge, shall not send any MFA-related email, and shall not reveal whether MFA is configured for the account (F-01-R1).
- **US-002-ac-4**: Given MFA is required for a local login, And the MFA configuration or MFA code store is unavailable, When the user submits a correct username/password, Then the system shall fail the login attempt, shall not generate an MFA code, shall not issue a session, and shall present a generic authentication failure state (F-01-R1).
- **US-002-ac-5**: Given MFA is required for a local login, And email sending of the one-time code fails, When the user submits a correct username/password, Then the system shall not issue a session, shall not treat the challenge as satisfied, and shall inform the user that authentication cannot be completed without exposing configuration details (F-01-R1).
- **IMPACT**: Integration test: correct password + verified email → exactly one pending MFA challenge created, OTP email sent, no session issued (US-002-ac-1).
- **IMPACT**: Integration test: re-submission of correct password atomically invalidates prior pending challenge and sends only the new OTP (US-002-ac-2).
- **IMPACT**: Negative test: incorrect password → no MFA challenge created, no email sent, no MFA configuration disclosed (US-002-ac-3).
- **IMPACT**: Fault-injection test: MFA config/store unavailable → login fails with generic error, no session issued (US-002-ac-4).
- **IMPACT**: Fault-injection test: SendGridEmailAdapter/EmailOtpDeliveryAdapter fails → no session issued, challenge not marked satisfied, generic user-facing message returned (US-002-ac-5).
- **IMPACT**: Unit test: OTP length and expiry sourced exclusively from central configuration.
- **IMPACT**: Atomicity test: concurrent re-submissions do not result in two active pending challenges for the same user.

---

## Security Obligations

- OTP must be generated using a cryptographically secure random source — CAST structural facts do not confirm presence of a CSPRNG in the current codebase path.
- MFA challenge state must not be revealed on incorrect password submission (US-002-ac-3) — the frontend handleSubmit → email path must not leak MFA configuration in error responses.
- Session must not be issued until MFA challenge is satisfied — session issuance logic is not visible in CAST facts for this object.
- Email delivery failure must not expose configuration details to the end user (US-002-ac-5).
- Validate credential and personal-data handling against the Jira requirement.
- Validate credential and personal-data handling against the story's acceptance criteria.

## Accessibility Obligations

- LoginForm.tsx (containing email (2587)) must maintain accessible error messaging when MFA email dispatch fails — error states must be announced to screen readers and must not expose internal configuration.

---

## Provenance

- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Repository**: `https://github.com/XEBIA-ACE/New_Prompt_UMS` (branch: `main`)
- **Deterministic grounding reference**: `ae246fe2f5b81296`
- **Determinism snapshot**: `sha256:a4c756b6e681d29b3902382d6e68da1e49e173a5fdfd8d3911a98d0119bd39c7`
- **Run ID**: `128b04aa-41ca-5de5-a510-ba78e39f7f0e`
- **Project ID**: `b8725385-5107-432a-b52b-755a7c5963f5`
