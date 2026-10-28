# Tasks: US-001

> **Context**: All implementation tasks below are net-new (no pre-existing measured implementation found). Scope is derived from requirement text and accepted impact analysis (`sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`). Technical design is DEGRADED due to absence of measured components in CAST snapshot (`ae246fe2f5b81296`).

---

## Implementation Tasks

- [ ] **T001** — FR-001 [US-001-ac-1]: Introduce a new MFA policy evaluation entry point within the User_Management service. Upon submission of local HRMS username/password credentials, the authentication subsystem shall classify the incoming request as a local login (distinct from SSO/IdP flows) and shall query the central user store and central policy store to determine MFA applicability. The determination shall incorporate three independent inputs: (a) the per-user MFA enabled/disabled flag, (b) the user's role membership(s), and (c) org-level MFA policy rules. All three inputs must be evaluated before a final MFA-required decision is produced. [Gap: the specific API contract, data schema, and service boundaries for the central user and policy stores are not yet identified in the measured codebase; these components are net-new per the impact analysis.] Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

- [ ] **T002** — FR-002 [US-001-ac-2]: Within the MFA policy evaluation entry point (T001/FR-001), implement precedence logic so that a confirmed org-level or role-based mandatory MFA policy overrides a disabled per-user MFA flag. The system shall require email-based MFA regardless of the state of the user's personal MFA flag when such a policy applies. The login flow shall not proceed to session creation until MFA is successfully completed. [Gap: the conflict-resolution order among multiple simultaneous org-level and role-based MFA policies is unspecified in the acceptance criteria and must be clarified with the product owner before implementation (FR-002 gap).] Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

- [ ] **T003** — FR-003 [US-001-ac-3]: Within the MFA policy evaluation entry point (T001/FR-001), implement the no-policy short-circuit path: when neither an org-level nor a role-based MFA policy applies to the authenticating user, and the user's per-user MFA flag is disabled, skip email-based MFA prompting and proceed directly to session creation after successful credential verification. [Gap: the behaviour when the per-user MFA flag is enabled but no org/role policy exists is not addressed by the acceptance criteria and must not be assumed or implemented speculatively (FR-003 gap).] Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

- [ ] **T004** — FR-004 [US-001-ac-4]: Introduce an SSO assertion handler within the User_Management service that receives successful SSO/IdP assertions. When the assertion contains a claim or attribute indicating that MFA was already completed by the external IdP or Active Directory, the handler shall bypass the local MFA policy evaluation pipeline (FR-001 through FR-003) entirely and proceed directly to HRMS session creation based on the external authentication state. [Gap: the specific assertion attribute or claim name signalling IdP-completed MFA, and the trust/validation model for the SSO assertion, are net-new and must be specified during design (FR-004 gap). No existing CAST-measured SSO/IdP handling objects were found.] Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

- [ ] **T005** — FR-005 [US-001-ac-5]: Extend the SSO assertion handler (T004/FR-004) to enforce the rule that local MFA policy evaluation is exclusively applicable to local username/password login flows. When a session originates from an external IdP or AD SSO flow (no local HRMS credentials presented) and IdP authentication succeeds with an indication that MFA was applied per IdP policy, the HRMS shall not invoke local MFA policy evaluation for that session. [Gap: the mechanism by which the HRMS distinguishes an SSO-originated session from a local-login session at the session-creation boundary is net-new; the trust boundary and assertion validation mechanism must be defined during design (FR-005 gap).] Evidence: `ae246fe2f5b81296`, `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`.

- [ ] **T006** — Security review: Validate all credential handling, per-user flag reads, and personal-data access introduced by FR-001 through FR-005 against the Jira requirement and applicable data-protection policy before release. No existing security controls were measured in the CAST snapshot for the MFA determination flow. Evidence: `ae246fe2f5b81296`.

---

## Verification Tasks

- [ ] **T007** — Verify US-001-ac-1 (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-1`): Given a user attempts to sign in with local HRMS username/password, When the credentials are submitted, Then the system shall classify the request as a local login and query the central user and policy stores to determine MFA applicability based on per-user flags, role membership, and org-level MFA rules (F-01-R1). [type: characterization; required before: release; environment: ci]

- [ ] **T008** — Verify US-001-ac-2 (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-2`): Given a user has an org-level or role-based mandatory MFA policy, And their personal MFA flag is disabled, When they attempt a local HRMS login with correct credentials, Then the system shall still require MFA and shall not allow them to bypass MFA (F-01-R1). [type: characterization; required before: release; environment: ci]

- [ ] **T009** — Verify US-001-ac-3 (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-3`): Given a user has no org-level or role-based mandatory MFA policy, And their per-user MFA flag is disabled, When they attempt a local HRMS login, Then the system shall not require email-based MFA for that login (F-01-R1). [type: characterization; required before: release; environment: ci]

- [ ] **T010** — Verify US-001-ac-4 (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-4`): Given a user signs in through an external IdP/AD SSO flow that reports MFA already completed, When HRMS receives a successful SSO assertion, Then the session creation in HRMS shall bypass local email-based MFA and grant access based on the external authentication state (F-01-R1). [type: characterization; required before: release; environment: ci]

- [ ] **T011** — Verify US-001-ac-5 (`a578e40b-f31a-513b-b731-8b76eb8d0f37:test:characterization:US-001-ac-5`): Given a user attempts to sign in through an external IdP/AD SSO flow without local username/password, When the IdP authentication is successful and indicates MFA applied per IdP policy, Then the HRMS shall not invoke local MFA policy evaluation for that session (F-01-R1). [type: characterization; required before: release; environment: ci]

- [ ] **T012** — Verify IMPACT (ac-1): Verify acceptance criterion: Given a user attempts to sign in with local HRMS username/password, When the credentials are submitted, Then the system shall classify the request as a local login and query the central user and policy stores to determine MFA applicability based on per-user flags, role membership, and org-level MFA rules (F-01-R1).

- [ ] **T013** — Verify IMPACT (ac-2): Verify acceptance criterion: Given a user has an org-level or role-based mandatory MFA policy, And their personal MFA flag is disabled, When they attempt a local HRMS login with correct credentials, Then the system shall still require MFA and shall not allow them to bypass MFA (F-01-R1).

- [ ] **T014** — Verify IMPACT (ac-3): Verify acceptance criterion: Given a user has no org-level or role-based mandatory MFA policy, And their per-user MFA flag is disabled, When they attempt a local HRMS login, Then the system shall not require email-based MFA for that login (F-01-R1).

- [ ] **T015** — Verify IMPACT (ac-4): Verify acceptance criterion: Given a user signs in through an external IdP/AD SSO flow that reports MFA already completed, When HRMS receives a successful SSO assertion, Then the session creation in HRMS shall bypass local email-based MFA and grant access based on the external authentication state (F-01-R1).

- [ ] **T016** — Verify IMPACT (ac-5): Verify acceptance criterion: Given a user attempts to sign in through an external IdP/AD SSO flow without local username/password, When the IdP authentication is successful and indicates MFA applied per IdP policy, Then the HRMS shall not invoke local MFA policy evaluation for that session (F-01-R1).

---

## Open Items (must be resolved or explicitly accepted before implementation proceeds)

1. Candidate verification flagged a possibly better-matching alternative that was not selected: `issueOtp` (1203) — review before accepting.
2. Candidate verification found the selected focus object implausible for this requirement: `evaluate` (id=1240) is a generic method name with no contextual evidence linking it to MFA determination; `issueOtp` (id=1203) is a clearly better semantic match.
3. Intra-object structural facts (loops, conditionals) were unavailable; the internal logic of `evaluate` (1240) cannot be verified from CAST data alone.
4. No CAST object named `evaluateMfa` or `isMfaRequired` was resolved — the requirement seed matched to `evaluate` (1240) in `password-policy.evaluator.ts`, which handles password policy, not MFA policy.
5. No MFA-specific backend dependency (OTP library, TOTP, email dispatch service) appears in the application-level inventory.
6. No SSO/IdP assertion handling objects (e.g., SAML consumer, OAuth callback, AD connector) appear in the measured callers or callees.
7. No login/sign-in transaction (e.g., `api/v1/auth/login/`) was returned in the transaction list; MFA determination for login is the core requirement but its entry point is not measured.
8. No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
9. No-match classification caveat: MFA determination logic is a foundational authentication concern and may exist under common alternative terms (`checkMfa`, `mfaEnabled`, `mfaCheck`, `multiFactorAuth`) that were never searched — the searched terms were reasonable but not exhaustive. No concrete evidence of existing logic was found.
10. Searched 4 term(s) (`isMfaRequired`, `mfaPolicy`, `requiresMfa`, `evaluateMfa`) against CAST; none resolved to an existing code object.
11. Transitive callers returned 0 — unclear whether the absence reflects true isolation or a CAST traversal limitation.
12. Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?
13. Zero database tables are measured; per-user MFA flags, role membership, and org-level policy stores are structurally invisible in the current CAST data.
14. Conflict-resolution order among multiple simultaneous org-level and role-based MFA policies is unspecified — must be clarified with product owner before implementation (FR-002 gap).
15. Behaviour when the per-user MFA flag is enabled but no org/role policy exists is not addressed — must not be assumed or implemented speculatively (FR-003 gap).
16. Specific SSO assertion attribute or claim name signalling IdP-completed MFA, and the trust/validation model, are net-new — must be specified during design (FR-004 gap).
17. Mechanism by which HRMS distinguishes an SSO-originated session from a local-login session at the session-creation boundary is net-new — trust boundary and assertion validation mechanism must be defined during design (FR-005 gap).
18. Architecture_context is degraded and missing `api_contracts`; no existing API contract baseline is available for the net-new MFA evaluation and SSO handler endpoints.

---

## Provenance

- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Deterministic grounding reference**: `ae246fe2f5b81296`
- **Run ID**: `a578e40b-f31a-513b-b731-8b76eb8d0f37`