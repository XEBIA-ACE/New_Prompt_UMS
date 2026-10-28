# Tasks: US-002

> ⚠️ **BLOCKED** — Implementation is blocked pending re-run of impact analysis anchored on `EmailOtpDeliveryAdapter` (id:2951). All tasks below are defined for planning purposes but must not be executed until blocking items are resolved. See `plan.md` for the full list of unresolved items.

---

## Implementation Tasks

- [ ] **T001** [FR-001, US-002-ac-1, STEP 1] Extend `createAuthRouter` (id:2428, BACKEND): After successful local HRMS password verification, gate the flow on the user's MFA requirement flag and verified primary email. Invoke the MFA challenge creation logic before any session issuance. Ensure no session token is issued at this stage. Evidence: `component:createAuthRouter`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`.

- [ ] **T002** [FR-001, FR-002, US-002-ac-1, US-002-ac-2, STEP 2] Extend `EmailOtpDeliveryAdapter` (id:2951, `BACKEND/src/adapters/email-otp-delivery.adapter.ts`): Implement atomic MFA challenge creation logic — within a single database transaction, invalidate all existing pending challenges for the user (satisfying US-002-ac-2 atomicity), generate a cryptographically secure random numeric OTP (CSPRNG) whose length and expiry are read exclusively from central configuration (not hard-coded), persist the new pending challenge to the MFA challenge store, and return the OTP for dispatch. Concurrent re-submissions must not result in two simultaneously active pending challenges. Evidence: `flagged_alternative_candidate:EmailOtpDeliveryAdapter:2951`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`. **[DEGRADED: CAST returned 0 DB objects and 0 downstream callees for the measured focus object; atomicity guarantee and CSPRNG presence cannot be structurally confirmed — re-anchor analysis on EmailOtpDeliveryAdapter (id=2951).]**

- [ ] **T003** [FR-001, FR-005, US-002-ac-1, US-002-ac-5, STEP 3] Extend `EmailDeliveryPort` (id:1434) and `SendGridEmailAdapter` (id:2952): Ensure the OTP dispatch call propagates delivery failures as a typed error/exception. On failure, the caller must not issue a session, must not mark the challenge as satisfied, and must surface only a generic user-facing message (no adapter name, internal error codes, or configuration details). Evidence: `component:EmailDeliveryPort`, `transaction-object:SendGridEmailAdapter:2952`, `transaction-object:EmailOtpDeliveryAdapter:2951`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`. **[DEGRADED: Error-handling logic within SendGridEmailAdapter is not structurally confirmed by CAST facts.]**

- [ ] **T004** [FR-003, US-002-ac-3, STEP 4] Extend `createAuthRouter` (id:2428): On incorrect local HRMS password, return immediately with a generic authentication failure response. No OTP must be generated, no MFA challenge record created or modified, no email dispatched, and no indication of MFA configuration must be present in the response. The response must be indistinguishable from a failed login for a non-MFA account. Evidence: `component:createAuthRouter`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`. **[DEGRADED: Guard logic for incorrect-password MFA suppression is not visible in CAST facts for the measured object graph.]**

- [ ] **T005** [FR-004, US-002-ac-4, STEP 5] Extend `createAuthRouter` (id:2428) and `EmailOtpDeliveryAdapter` (id:2951): Introduce fault-tolerance guards for MFA configuration unavailability and MFA challenge store unavailability. On either condition, abort the login attempt without generating an OTP, do not issue a session, and return a generic authentication failure state that does not expose infrastructure failure details. Evidence: `component:createAuthRouter`, `transaction-object:EmailOtpDeliveryAdapter:2951`, `transaction-object:EmailRecordRepository:2990`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`. **[DEGRADED: No structural evidence from CAST facts shows a fault-tolerance path for MFA config or OTP store unavailability.]**

- [ ] **T006** [FR-001, FR-005, US-002-ac-1, US-002-ac-5, Accessibility Obligation, STEP 6] Modify `handleSubmit` (id:2573) and `email` (id:2587) in `FRONTEND/src/app/components/organisms/LoginForm.tsx`: Update `handleSubmit` to handle the two-stage login flow (password → MFA challenge). On MFA email dispatch failure, render an accessible error state: the error message must be announced to screen readers (ARIA live region or equivalent), must not expose internal configuration details, and must inform the user that authentication cannot be completed. Evidence: `component:handleSubmit:2573`, `component:email:2587`, `component:§{main_sources}§/New_Prompt_UMS-develop/FRONTEND/src/app/components/organisms/LoginForm.tsx`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`.

- [ ] **T007** [FR-001, US-002-ac-1, STEP 7] Confirm `DefaultEmailDispatchService` (id:3002) and `EmailRecordRepository` (id:2990): Verify that email record persistence captures the OTP dispatch attempt and outcome (auditability). `DefaultEmailDispatchService` must delegate to `EmailDeliveryPort`/`SendGridEmailAdapter` and propagate failures. Evidence: `transaction-object:DefaultEmailDispatchService:3002`, `transaction-object:EmailRecordRepository:2990`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`. **[DEGRADED: Relationship between DefaultEmailDispatchService and actual code paths is not structurally confirmed by CAST call graphs.]**

---

## Verification Tasks

- [ ] **T008** [US-002-ac-1] Verify `128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-1` (characterization, ci, required before release): Given a user with required email-based MFA and a verified primary email, When they submit a correct local HRMS username/password, Then the system shall create exactly one pending MFA challenge for that user, generate a cryptographically secure random numeric code with length and expiry from central configuration, store the challenge, and send the code to the user's verified primary email, and shall not yet issue a session (F-01-R1).

- [ ] **T009** [US-002-ac-2] Verify `128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-2` (characterization, ci, required before release): Given a user with required MFA, And an existing pending MFA challenge for a previous password success, When they successfully re-enter their password, Then the system shall atomically invalidate any prior pending challenge and create a new pending challenge with a new one-time numeric code, and shall send only the new code (F-01-R1).

- [ ] **T010** [US-002-ac-3] Verify `128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-3` (characterization, ci, required before release): Given a user submits an incorrect local HRMS password, When the login is processed, Then the system shall not generate an MFA code, shall not create a pending MFA challenge, shall not send any MFA-related email, and shall not reveal whether MFA is configured for the account (F-01-R1).

- [ ] **T011** [US-002-ac-4] Verify `128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-4` (characterization, ci, required before release): Given MFA is required for a local login, And the MFA configuration or MFA code store is unavailable, When the user submits a correct username/password, Then the system shall fail the login attempt, shall not generate an MFA code, shall not issue a session, and shall present a generic authentication failure state (F-01-R1).

- [ ] **T012** [US-002-ac-5] Verify `128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-5` (characterization, ci, required before release): Given MFA is required for a local login, And email sending of the one-time code fails, When the user submits a correct username/password, Then the system shall not issue a session, shall not treat the challenge as satisfied, and shall inform the user that authentication cannot be completed without exposing configuration details (F-01-R1).

- [ ] **T013** [IMPACT, US-002-ac-1] Integration test: correct password + verified email → exactly one pending MFA challenge created, OTP email sent, no session issued.

- [ ] **T014** [IMPACT, US-002-ac-2] Integration test: re-submission of correct password atomically invalidates prior pending challenge and sends only the new OTP.

- [ ] **T015** [IMPACT, US-002-ac-3] Negative test: incorrect password → no MFA challenge created, no email sent, no MFA configuration disclosed.

- [ ] **T016** [IMPACT, US-002-ac-4] Fault-injection test: MFA config/store unavailable → login fails with generic error, no session issued.

- [ ] **T017** [IMPACT, US-002-ac-5] Fault-injection test: SendGridEmailAdapter/EmailOtpDeliveryAdapter fails → no session issued, challenge not marked satisfied, generic user-facing message returned.

- [ ] **T018** [IMPACT] Unit test: OTP length and expiry sourced exclusively from central configuration.

- [ ] **T019** [IMPACT] Atomicity test: concurrent re-submissions do not result in two active pending challenges for the same user.

---

## Provenance

- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Deterministic grounding reference**: `ae246fe2f5b81296`
- **Determinism snapshot**: `sha256:a4c756b6e681d29b3902382d6e68da1e49e173a5fdfd8d3911a98d0119bd39c7`
- **Run ID**: `128b04aa-41ca-5de5-a510-ba78e39f7f0e`
- **Project ID**: `b8725385-5107-432a-b52b-755a7c5963f5`
