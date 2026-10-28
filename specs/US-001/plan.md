# Implementation Plan: US-001

## Technical Context

| Item | Value |
|---|---|
| Codebase grounding snapshot | `ae246fe2f5b81296` |
| Accepted impact analysis | `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6` |
| Determinism snapshot evidence | `determinism-snapshot:sha256:e7fbb6441ffcabd74da9855a28e6a7dcc4c088127980f626b7c900e2c927fc28` |
| Accepted impact analysis revision | `1` |
| Repository | `https://github.com/XEBIA-ACE/New_Prompt_UMS` (ref: `main`, commit: `6c342dc4248be55aeaa6222f8360fba085e07577`) |
| Generation mode | `enhancement` |
| Technical design status | DEGRADED — net-new capability, no measured components |

---

## Design Steps

> **Note**: All design steps below are marked DEGRADED because this is a net-new capability with no measured components in the CAST snapshot. No existing CAST-measured objects were resolved for this requirement. The central user store, policy store, MFA evaluation entry point, and SSO assertion handler are all net-new and structurally invisible in the current CAST snapshot (`ae246fe2f5b81296`).

1. **[DEGRADED — net-new capability, no measured components] FR-001 [US-001-ac-1]**: Introduce a new MFA policy evaluation entry point within the User_Management service (`https://github.com/XEBIA-ACE/New_Prompt_UMS`). This entry point shall be invoked immediately after successful local username/password credential verification. It must classify the incoming request as a local login (distinct from SSO/IdP flows) and query three independent inputs — (a) per-user MFA enabled/disabled flag, (b) user role membership(s), and (c) org-level MFA policy rules — from a central user store and a central policy store. A final MFA-required boolean decision must be produced before the login flow continues. Note: no existing CAST-measured object was resolved for this logic; the central user store, policy store, and their API/data contracts are net-new and must be defined during implementation. Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

2. **[DEGRADED — net-new capability, no measured components] FR-002 [US-001-ac-2]**: Within the MFA policy evaluation entry point (FR-001), implement precedence logic so that a confirmed org-level or role-based mandatory MFA policy overrides a disabled per-user MFA flag. The login flow must not proceed to session creation until email-based MFA is successfully completed when this condition holds. Gap: the conflict-resolution order among multiple simultaneous org-level and role-based policies is unspecified in the acceptance criteria and must be clarified with the product owner before implementation. Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

3. **[DEGRADED — net-new capability, no measured components] FR-003 [US-001-ac-3]**: Within the MFA policy evaluation entry point (FR-001), implement the no-policy short-circuit path: when neither an org-level nor a role-based MFA policy applies and the per-user MFA flag is disabled, skip email-based MFA prompting and proceed directly to session creation. Gap: the behaviour when the per-user MFA flag is enabled but no org/role policy exists is not addressed by the acceptance criteria and must not be assumed or implemented speculatively. Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

4. **[DEGRADED — net-new capability, no measured components] FR-004 [US-001-ac-4]**: Introduce an SSO assertion handler within the User_Management service that receives successful SSO/IdP assertions. When the assertion contains a claim or attribute indicating that MFA was already completed by the external IdP or Active Directory, the handler shall bypass the local MFA policy evaluation pipeline (FR-001 through FR-003) entirely and proceed directly to HRMS session creation based on the external authentication state. Gap: the specific assertion attribute or claim name signalling IdP-completed MFA, and the trust/validation model for the SSO assertion, are net-new and must be specified during design. No existing CAST-measured SSO/IdP handling objects were found. Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

5. **[DEGRADED — net-new capability, no measured components] FR-005 [US-001-ac-5]**: Extend the SSO assertion handler (FR-004) to enforce the rule that local MFA policy evaluation is exclusively applicable to local username/password login flows. When a session originates from an external IdP or AD SSO flow (i.e., no local HRMS credentials were presented) and IdP authentication succeeds with an indication that MFA was applied per IdP policy, the HRMS shall not invoke local MFA policy evaluation for that session. Gap: the mechanism by which the HRMS distinguishes an SSO-originated session from a local-login session at the session-creation boundary is net-new; the trust boundary and assertion validation mechanism must be defined during design. Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

6. **[DEGRADED — grounding gap] Security obligation**: All credential handling, per-user flag reads, and personal-data access introduced by FR-001 through FR-005 must be validated against the Jira requirement and applicable data-protection policy before release. No existing security controls were measured in the CAST snapshot for the MFA determination flow. Evidence: `ae246fe2f5b81296`.

7. **[DEGRADED — grounding gap] Test obligations**: Implement unit and integration tests covering all five acceptance criteria (US-001-ac-1 through US-001-ac-5) for the new MFA policy evaluation and SSO assertion handler components. Tests must cover: local login MFA determination with all three policy inputs (ac-1); org/role policy overriding disabled per-user flag (ac-2); no-policy + disabled flag suppresses MFA (ac-3); SSO assertion with IdP-MFA-completed claim bypasses local MFA (ac-4); SSO-originated session exemption from local MFA policy (ac-5). Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

---

## Contract Changes

- No material API, event, or data contract change is evidenced by the current CAST snapshot.
- **Note**: The architecture_context is degraded and missing `api_contracts`; no existing API contract baseline is available against which to measure contract change for the net-new MFA evaluation and SSO handler endpoints. New endpoints introduced by FR-001–FR-005 will constitute net-new contracts and must be defined during design.

---

## Security and Quality Obligations

- Validate credential and personal-data handling against the Jira requirement.
- Validate credential and personal-data handling against the story's acceptance criteria.
- Preserve the availability, reliability, and observability constraints grounded by `ae246fe2f5b81296`.

---

## Implementation-Readiness Items (must be resolved or explicitly accepted before implementation)

1. Candidate verification flagged a possibly better-matching alternative that was not selected: `issueOtp` (1203) — review before accepting.
2. Candidate verification found the selected focus object implausible for this requirement: The requirement is about determining whether email-based MFA is required for a local HRMS login based on central policies, which is an authentication/MFA policy decision. The selected object `evaluate` (id=1240) is a generic method name with no contextual evidence linking it to MFA determination, while `DefaultPasswordPolicyEvaluator` (id=3012) and related password-policy interfaces in the candidate list are also about password policy evaluation rather than MFA requirement determination — however, `issueOtp` (id=1203) is a clearly better semantic match as OTP issuance is directly related to email-based MFA prompting for login flows.
3. Intra-object structural facts (loops, conditionals) were unavailable; the internal logic of `evaluate` (1240) cannot be verified from CAST data alone.
4. No CAST object named `evaluateMfa` or `isMfaRequired` was resolved — the requirement seed matched to `evaluate` (1240) in `password-policy.evaluator.ts`, which handles password policy, not MFA policy.
5. No MFA-specific backend dependency (OTP library, TOTP, email dispatch service) appears in the application-level inventory.
6. No SSO/IdP assertion handling objects (e.g., SAML consumer, OAuth callback, AD connector) appear in the measured callers or callees.
7. No login/sign-in transaction (e.g., `api/v1/auth/login/`) was returned in the transaction list; MFA determination for login is the core requirement but its entry point is not measured.
8. No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
9. No-match classification: Initial classification (net-new capability) has a noted caveat: MFA determination logic is a foundational authentication concern and may exist under common alternative terms that were never searched, such as `checkMfa`, `mfaEnabled`, `mfaCheck`, or `multiFactorAuth` — the searched terms were reasonable but not exhaustive of the naming space. However, there is no concrete, specific evidence that this codebase actually contains such logic, so this remains a non-specific doubt rather than a strong disagreement.
10. No-match consistency check raised a caveat about this classification: MFA determination logic is a foundational authentication concern and may exist under common alternative terms that were never searched, such as `checkMfa`, `mfaEnabled`, `mfaCheck`, or `multiFactorAuth` — the searched terms were reasonable but not exhaustive of the naming space. However, there is no concrete, specific evidence that this codebase actually contains such logic, so this remains a non-specific doubt rather than a strong disagreement.
11. Requirement detail is incomplete (see evidence_gaps); no conflicting existing implementation was found.
12. Searched 4 term(s) derived from this requirement (`isMfaRequired`, `mfaPolicy`, `requiresMfa`, `evaluateMfa`) against CAST; none resolved to an existing code object.
13. Transitive callers returned 0 — it is unclear whether the absence reflects true isolation or a CAST traversal limitation.
14. Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?
15. Zero database tables are measured; per-user MFA flags, role membership, and org-level policy stores are structurally invisible in the current CAST data.
16. The conflict-resolution order among multiple simultaneous org-level and role-based MFA policies is unspecified in the acceptance criteria and must be clarified with the product owner before implementation (FR-002 gap).
17. The behaviour when the per-user MFA flag is enabled but no org/role policy exists is not addressed by the acceptance criteria and must not be assumed or implemented speculatively (FR-003 gap).
18. The specific SSO assertion attribute or claim name signalling IdP-completed MFA, and the trust/validation model for the SSO assertion, are net-new and must be specified during design (FR-004 gap).
19. The mechanism by which the HRMS distinguishes an SSO-originated session from a local-login session at the session-creation boundary is net-new; the trust boundary and assertion validation mechanism must be defined during design (FR-005 gap).
20. All credential handling, per-user flag reads, and personal-data access introduced by FR-001 through FR-005 must be validated against the Jira requirement and applicable data-protection policy before release; no existing security controls were measured in the CAST snapshot for the MFA determination flow.
21. The architecture_context is degraded and missing `api_contracts`; no existing API contract baseline is available against which to measure contract change for the net-new MFA evaluation and SSO handler endpoints.

---

## Verification Plan

- **US-001-ac-1** (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-1`): Given a user attempts to sign in with local HRMS username/password, When the credentials are submitted, Then the system shall classify the request as a local login and query the central user and policy stores to determine MFA applicability based on per-user flags, role membership, and org-level MFA rules (F-01-R1). [type: characterization; required before: release; environment: ci]
- **US-001-ac-2** (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-2`): Given a user has an org-level or role-based mandatory MFA policy, And their personal MFA flag is disabled, When they attempt a local HRMS login with correct credentials, Then the system shall still require MFA and shall not allow them to bypass MFA (F-01-R1). [type: characterization; required before: release; environment: ci]
- **US-001-ac-3** (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-3`): Given a user has no org-level or role-based mandatory MFA policy, And their per-user MFA flag is disabled, When they attempt a local HRMS login, Then the system shall not require email-based MFA for that login (F-01-R1). [type: characterization; required before: release; environment: ci]
- **US-001-ac-4** (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-4`): Given a user signs in through an external IdP/AD SSO flow that reports MFA already completed, When HRMS receives a successful SSO assertion, Then the session creation in HRMS shall bypass local email-based MFA and grant access based on the external authentication state (F-01-R1). [type: characterization; required before: release; environment: ci]
- **US-001-ac-5** (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-5`): Given a user attempts to sign in through an external IdP/AD SSO flow without local username/password, When the IdP authentication is successful and indicates MFA applied per IdP policy, Then the HRMS shall not invoke local MFA policy evaluation for that session (F-01-R1). [type: characterization; required before: release; environment: ci]
- **IMPACT (ac-1)**: Verify acceptance criterion: Given a user attempts to sign in with local HRMS username/password, When the credentials are submitted, Then the system shall classify the request as a local login and query the central user and policy stores to determine MFA applicability based on per-user flags, role membership, and org-level MFA rules (F-01-R1).
- **IMPACT (ac-2)**: Verify acceptance criterion: Given a user has an org-level or role-based mandatory MFA policy, And their personal MFA flag is disabled, When they attempt a local HRMS login with correct credentials, Then the system shall still require MFA and shall not allow them to bypass MFA (F-01-R1).
- **IMPACT (ac-3)**: Verify acceptance criterion: Given a user has no org-level or role-based mandatory MFA policy, And their per-user MFA flag is disabled, When they attempt a local HRMS login, Then the system shall not require email-based MFA for that login (F-01-R1).
- **IMPACT (ac-4)**: Verify acceptance criterion: Given a user signs in through an external IdP/AD SSO flow that reports MFA already completed, When HRMS receives a successful SSO assertion, Then the session creation in HRMS shall bypass local email-based MFA and grant access based on the external authentication state (F-01-R1).
- **IMPACT (ac-5)**: Verify acceptance criterion: Given a user attempts to sign in through an external IdP/AD SSO flow without local username/password, When the IdP authentication is successful and indicates MFA applied per IdP policy, Then the HRMS shall not invoke local MFA policy evaluation for that session (F-01-R1).

---

## API Impact Assessment

- **Status**: blocked
- **Contract change required**: No (no material API, event, or data contract change evidenced in current snapshot)
- **Readiness checks**:
  - `accepted_impact`: BLOCKED — `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6` is set and matches; however, the impact analysis is in a degraded/gap state (`next_action: accept_with_gaps`) with all five acceptance criteria unmapped and no measured code objects resolved. The hash confirms the gap-accepted state was recorded, not that the analysis is complete.
  - `grounded_components`: WARNING — No `affected_files`, `affected_symbols`, or `affected_services` were identified. All five acceptance criteria are classified `net_new_capability` with zero CAST-measured objects resolved. The central user store, policy store, MFA evaluation entry point, and SSO assertion handler are all net-new and structurally invisible in the current CAST snapshot.
  - `verification_obligations`: PASSED — Five test obligations identified, one per acceptance criterion (US-001-ac-1 through US-001-ac-5).

---

## Provenance

- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Repository**: `https://github.com/XEBIA-ACE/New_Prompt_UMS` (ref: `main`)
- **Deterministic grounding reference**: `ae246fe2f5b81296`
- **Determinism snapshot evidence**: `determinism-snapshot:sha256:e7fbb6441ffcabd74da9855a28e6a7dcc4c088127980f626b7c900e2c927fc28`
- **Run ID**: `a578e40b-f31a-513b-b731-8b76eb8d0f37`
- **Project ID**: `b8725385-5107-432a-b52b-755a7c5963f5`