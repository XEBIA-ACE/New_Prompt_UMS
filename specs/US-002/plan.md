# Implementation Plan: US-002

## Status

> ⚠️ **BLOCKED** — The impact analysis stage flagged `implementation_blocked: true`. The primary CAST focus object (`email`, id:2587, in `LoginForm.tsx`) was assessed as implausible for this requirement. The flagged alternative candidate is `EmailOtpDeliveryAdapter` (id:2951, `BACKEND/src/adapters/email-otp-delivery.adapter.ts`). Re-run impact analysis anchored on `EmailOtpDeliveryAdapter` before proceeding to implementation.
>
> API impact readiness check: **blocked**. API inventory query returned errors; no confirmed HTTP endpoint paths for the login or MFA flow.

---

## Technical Context

- **Codebase grounding snapshot**: `ae246fe2f5b81296`
- **Accepted impact analysis**: `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6` (revision 1)
- **Determinism snapshot**: `sha256:a4c756b6e681d29b3902382d6e68da1e49e173a5fdfd8d3911a98d0119bd39c7`
- **Repository**: `https://github.com/XEBIA-ACE/New_Prompt_UMS` @ commit `6c342dc4248be55aeaa6222f8360fba085e07577` (branch: `main`)

### Grounded Components

| Component | ID | Type | File |
|---|---|---|---|
| `EmailDeliveryPort` | 1434 | Typescript Interface | `BACKEND/src/ports/email-delivery.port.ts` |
| `createAuthRouter` | 2428 | Typescript Function | BACKEND (path unresolved — API inventory failed) |
| `email` | 2587 | Typescript Function | `FRONTEND/src/app/components/organisms/LoginForm.tsx` |
| `handleSubmit` | 2573 | Typescript Function | `FRONTEND/src/app/components/organisms/LoginForm.tsx` |
| `EmailOtpDeliveryAdapter` | 2951 | Typescript Class (flagged alternative candidate) | `BACKEND/src/adapters/email-otp-delivery.adapter.ts` |
| `SendGridEmailAdapter` | 2952 | Typescript Class (transaction-confirmed) | BACKEND |
| `DefaultEmailDispatchService` | 3002 | Typescript Class (transaction-confirmed) | `BACKEND/src/services/email-dispatch.service.ts` |
| `EmailRecordRepository` | 2990 | Typescript Class (transaction-confirmed) | `BACKEND/src/repositories/email-record.repository.ts` |
| `DefaultEmailValidator` | 3011 | Typescript Class (transaction-confirmed) | BACKEND |

### Blast Radius (CAST-measured, focus object: `email` id:2587)

- Direct callers: 2 (`handleSubmit` id:2573, `createAuthRouter` id:2428)
- Transitive callers: 0
- Callees: 1 (`EmailDeliveryPort` id:1434 — IMPLEMENT relationship)
- Transactions: 20
- Data objects: 0
- Grounding status: grounded
- Candidate verification status: **implausible** (see blocking reasons below)

---

## Unresolved Items (must be resolved or explicitly accepted before implementation)

1. A second check confirms `EmailOtpDeliveryAdapter` (2951) as the likely correct object for this requirement — re-run impact analysis anchored on it rather than treating this as unmapped.
2. API inventory query failed with errors — no confirmed HTTP endpoint paths for the login or MFA flow.
3. CAST returned 0 database objects — MFA challenge store schema and DB atomicity cannot be assessed.
4. CAST returned 0 downstream callees for `email` (2587) — outward call chain to backend MFA logic is unmapped.
5. Candidate verification flagged a possibly better-matching alternative that was not selected: `EmailOtpDeliveryAdapter` (2951) — review before accepting.
6. Candidate verification found the selected focus object implausible for this requirement: The requirement is to create and send an email MFA (OTP) challenge after a successful local password login; a generic `email` Typescript Function (id=2587) is unlikely to represent this specific behavior. Candidates like `EmailOtpDeliveryAdapter` (id=2951) and `sendOtp` methods (ids=1012, 1047, 1206) are semantically far closer to the requirement of sending a one-time numeric MFA code via email.
7. Does an existing MFA challenge table/collection exist in the database? CAST returned 0 DB objects for this object.
8. Is atomic invalidation of prior pending challenges (US-002-ac-2) enforced at the database layer (e.g., via a transaction or unique constraint)? Not determinable from CAST facts.
9. Is the CSPRNG for OTP generation already implemented in the backend, or does it need to be introduced?
10. No CAST violations were found on `email` (2587), so no co-violation remediation is required for this object specifically.
11. No backend (non-TypeScript-frontend) objects were returned as direct or transitive callers — backend MFA orchestration logic is outside the measured blast radius of this object.
12. Requirement traceability incomplete for US-002-ac-1, US-002-ac-2, US-002-ac-3, US-002-ac-4, US-002-ac-5.
13. The `email` (2587) object in `LoginForm.tsx` is the frontend email input field/function, not the backend OTP dispatch logic itself; backend MFA challenge creation logic must be implemented or extended separately.
14. The transaction-level objects (`EmailOtpDeliveryAdapter`, `EmailRecordRepository`, `SendGridEmailAdapter`, etc.) represent backend services reachable via the email field's call chain, but CAST did not return resolvable caller graphs or DB mappings for them from this object's vantage point.
15. Transaction call graphs were not expanded — the relationship between transaction-level email objects and actual code paths is not structurally confirmed.
16. What is the current session-issuance mechanism and where is it gated relative to MFA completion? Not visible in CAST facts for this object.
17. Which backend endpoint receives the login form submission from `handleSubmit` (2573)? API inventory query failed — endpoint path is unknown.

---

## Requirement Coverage

| Criterion | Status | Notes |
|---|---|---|
| US-002-ac-1 | partially_mapped | Frontend surface and transaction objects identified; backend challenge-creation and session-gate logic unmapped |
| US-002-ac-2 | unmapped | No structural evidence for atomic invalidation logic or DB transaction boundary |
| US-002-ac-3 | partially_mapped | Frontend path identified; backend guard logic not visible in object graph |
| US-002-ac-4 | unmapped | No structural evidence for fault-tolerance path for MFA config or OTP store unavailability |
| US-002-ac-5 | partially_mapped | Delivery adapter transaction objects identified; error-handling logic not structurally confirmed |

---

## Contract Changes Required

- **API contract** (`unknown` — API inventory query returned errors): `createAuthRouter` (id:2428) is the grounded backend entry point for the login/MFA flow, but its HTTP path and method are unresolvable from current evidence. Contract change required once endpoint is confirmed.
- **Data contract** — `EmailRecordRepository` / `IEmailRecordRepository` (id:2990 / id:1450): Persistence layer for email records confirmed in transaction list; no table-level mapping produced by CAST. Schema and atomicity guarantees cannot be assessed. Contract change required.
- **Data contract** — MFA challenge store (OTP table/collection): Required by US-002-ac-1 and US-002-ac-2; not visible in CAST facts. Schema, unique constraints, and atomicity guarantees cannot be assessed. Contract change required.

---

## Design Steps

> ⚠️ These steps are DEGRADED due to the blocked impact analysis. All steps carry evidence gaps from CAST structural facts. Re-anchor analysis on `EmailOtpDeliveryAdapter` (id=2951) before executing.

**STEP 1** [FR-001, US-002-ac-1] — Extend provider-confirmed component `createAuthRouter` (id:2428, BACKEND): After successful local HRMS password verification, gate the flow on the user's MFA requirement flag and verified primary email. Invoke the MFA challenge creation logic before any session issuance. Ensure no session token is issued at this stage.
- Evidence: `component:createAuthRouter`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`

**STEP 2** [FR-001, FR-002, US-002-ac-1, US-002-ac-2] — Extend provider-confirmed component `EmailOtpDeliveryAdapter` (id:2951, file: `BACKEND/src/adapters/email-otp-delivery.adapter.ts`): Implement atomic MFA challenge creation logic — within a single database transaction, invalidate all existing pending challenges for the user (satisfying US-002-ac-2 atomicity), generate a cryptographically secure random numeric OTP (CSPRNG) whose length and expiry are read exclusively from central configuration (not hard-coded), persist the new pending challenge to the MFA challenge store, and return the OTP for dispatch. Concurrent re-submissions must not result in two simultaneously active pending challenges.
- Evidence: `component:EmailOtpDeliveryAdapter`, `flagged_alternative_candidate:EmailOtpDeliveryAdapter:2951`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`
- **[DEGRADED]**: CAST returned 0 DB objects and 0 downstream callees for the measured focus object; atomicity guarantee and CSPRNG presence cannot be structurally confirmed from current object graph — re-anchor analysis on `EmailOtpDeliveryAdapter` (id=2951).

**STEP 3** [FR-001, FR-005, US-002-ac-1, US-002-ac-5] — Extend provider-confirmed component `EmailDeliveryPort` (id:1434, Typescript Interface) and its implementation `SendGridEmailAdapter` (id:2952, transaction-confirmed): Ensure the dispatch call to send the OTP to the user's verified primary email propagates delivery failures as a typed error/exception. On failure, the caller must not issue a session, must not mark the challenge as satisfied, and must surface only a generic user-facing message (no adapter name, internal error codes, or configuration details).
- Evidence: `component:EmailDeliveryPort`, `transaction-object:SendGridEmailAdapter:2952`, `transaction-object:EmailOtpDeliveryAdapter:2951`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`
- **[DEGRADED]**: Error-handling logic within `SendGridEmailAdapter` is not structurally confirmed by CAST facts.

**STEP 4** [FR-003, US-002-ac-3] — Extend provider-confirmed component `createAuthRouter` (id:2428): On incorrect local HRMS password, the backend must return immediately with a generic authentication failure response. No OTP must be generated, no MFA challenge record created or modified, no email dispatched, and no indication of MFA configuration must be present in the response body, headers, or error message. The response must be indistinguishable from a failed login for a non-MFA account.
- Evidence: `component:createAuthRouter`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`
- **[DEGRADED]**: Guard logic for incorrect-password MFA suppression is not visible in CAST facts for the measured object graph.

**STEP 5** [FR-004, US-002-ac-4] — Extend provider-confirmed components `createAuthRouter` (id:2428) and `EmailOtpDeliveryAdapter` (id:2951): Introduce fault-tolerance guards for MFA configuration unavailability (e.g., OTP length/expiry config missing or unreadable) and MFA challenge store unavailability (OTP persistence layer unreachable). On either condition, abort the login attempt without generating an OTP, do not issue a session, and return a generic authentication failure state that does not expose infrastructure failure details.
- Evidence: `component:createAuthRouter`, `transaction-object:EmailOtpDeliveryAdapter:2951`, `transaction-object:EmailRecordRepository:2990`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`
- **[DEGRADED]**: No structural evidence from CAST facts shows a fault-tolerance path for MFA config or OTP store unavailability.

**STEP 6** [FR-001, FR-005, US-002-ac-1, US-002-ac-5, Accessibility Obligation] — Modify provider-confirmed components `handleSubmit` (id:2573) and `email` (id:2587) in `FRONTEND/src/app/components/organisms/LoginForm.tsx`: Update the `handleSubmit` submission handler to correctly handle the two-stage login flow (password → MFA challenge). On MFA email dispatch failure, render an accessible error state in `LoginForm.tsx`: the error message must be announced to screen readers (ARIA live region or equivalent), must not expose internal configuration details (e.g., email provider name, adapter diagnostics), and must inform the user that authentication cannot be completed.
- Evidence: `component:handleSubmit:2573`, `component:email:2587`, `component:§{main_sources}§/New_Prompt_UMS-develop/FRONTEND/src/app/components/organisms/LoginForm.tsx`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`

**STEP 7** [FR-001, US-002-ac-1] — Extend provider-confirmed transaction-confirmed components `DefaultEmailDispatchService` (id:3002) and `EmailRecordRepository` (id:2990): Confirm that email record persistence (`EmailRecordRepository`) captures the OTP dispatch attempt and outcome, enabling auditability. `DefaultEmailDispatchService` must delegate to `EmailDeliveryPort`/`SendGridEmailAdapter` and propagate failures.
- Evidence: `transaction-object:DefaultEmailDispatchService:3002`, `transaction-object:EmailRecordRepository:2990`, `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`
- **[DEGRADED]**: Relationship between `DefaultEmailDispatchService` and actual code paths is not structurally confirmed by CAST call graphs.

**STEP 8** [All ACs] — Implement test obligations (see Verification Plan below).
- Evidence: `sha256:ec905b0c47ac2b199a466b6b3351cfbc5ec4dc333cecdf33288910f49f9cbef6`, `ae246fe2f5b81296`

---

## Security and Quality Obligations

- OTP must be generated using a cryptographically secure random source — CAST structural facts do not confirm presence of a CSPRNG in the current codebase path.
- MFA challenge state must not be revealed on incorrect password submission (US-002-ac-3) — the frontend `handleSubmit` → `email` path must not leak MFA configuration in error responses.
- Session must not be issued until MFA challenge is satisfied — session issuance logic is not visible in CAST facts for this object.
- Email delivery failure must not expose configuration details to the end user (US-002-ac-5).
- Validate credential and personal-data handling against the Jira requirement.
- Validate credential and personal-data handling against the story's acceptance criteria.
- Preserve the availability, reliability, and observability constraints grounded by `ae246fe2f5b81296`.

---

## Verification Plan

- **US-002-ac-1** (`128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-1`, type: characterization, env: ci, required before: release): Given a user with required email-based MFA and a verified primary email, When they submit a correct local HRMS username/password, Then the system shall create exactly one pending MFA challenge for that user, generate a cryptographically secure random numeric code with length and expiry from central configuration, store the challenge, and send the code to the user's verified primary email, and shall not yet issue a session (F-01-R1).
- **US-002-ac-2** (`128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-2`, type: characterization, env: ci, required before: release): Given a user with required MFA, And an existing pending MFA challenge for a previous password success, When they successfully re-enter their password, Then the system shall atomically invalidate any prior pending challenge and create a new pending challenge with a new one-time numeric code, and shall send only the new code (F-01-R1).
- **US-002-ac-3** (`128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-3`, type: characterization, env: ci, required before: release): Given a user submits an incorrect local HRMS password, When the login is processed, Then the system shall not generate an MFA code, shall not create a pending MFA challenge, shall not send any MFA-related email, and shall not reveal whether MFA is configured for the account (F-01-R1).
- **US-002-ac-4** (`128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-4`, type: characterization, env: ci, required before: release): Given MFA is required for a local login, And the MFA configuration or MFA code store is unavailable, When the user submits a correct username/password, Then the system shall fail the login attempt, shall not generate an MFA code, shall not issue a session, and shall present a generic authentication failure state (F-01-R1).
- **US-002-ac-5** (`128b04aa-41ca-5de5-a510-ba78e39f7f0e:test:characterization:US-002-ac-5`, type: characterization, env: ci, required before: release): Given MFA is required for a local login, And email sending of the one-time code fails, When the user submits a correct username/password, Then the system shall not issue a session, shall not treat the challenge as satisfied, and shall inform the user that authentication cannot be completed without exposing configuration details (F-01-R1).
- **IMPACT**: Integration test: correct password + verified email → exactly one pending MFA challenge created, OTP email sent, no session issued (US-002-ac-1).
- **IMPACT**: Integration test: re-submission of correct password atomically invalidates prior pending challenge and sends only the new OTP (US-002-ac-2).
- **IMPACT**: Negative test: incorrect password → no MFA challenge created, no email sent, no MFA configuration disclosed (US-002-ac-3).
- **IMPACT**: Fault-injection test: MFA config/store unavailable → login fails with generic error, no session issued (US-002-ac-4).
- **IMPACT**: Fault-injection test: SendGridEmailAdapter/EmailOtpDeliveryAdapter fails → no session issued, challenge not marked satisfied, generic user-facing message returned (US-002-ac-5).
- **IMPACT**: Unit test: OTP length and expiry sourced exclusively from central configuration.
- **IMPACT**: Atomicity test: concurrent re-submissions do not result in two active pending challenges for the same user.

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
