# Feature Specification: US-001

## Story
**US-001 — Determine MFA Requirement for Local HRMS Login**

As an IT Administrator, I want the HRMS to determine whether email-based MFA is required for a local username/password login based on central policies, so that only applicable users are prompted for MFA and security rules are consistently enforced.

The system must evaluate MFA applicability by consulting per-user flags, role membership, and org-level MFA rules for local logins, enforce org-level or role-based mandatory MFA regardless of per-user flag state, suppress local MFA when no applicable policy exists and the per-user flag is disabled, and bypass local MFA evaluation entirely for sessions established via an external IdP/AD SSO flow that has already applied MFA.

---

## User Scenarios & Acceptance Criteria

- **US-001-ac-1**: Given a user attempts to sign in with local HRMS username/password, When the credentials are submitted, Then the system shall classify the request as a local login and query the central user and policy stores to determine MFA applicability based on per-user flags, role membership, and org-level MFA rules (F-01-R1).
- **US-001-ac-2**: Given a user has an org-level or role-based mandatory MFA policy, And their personal MFA flag is disabled, When they attempt a local HRMS login with correct credentials, Then the system shall still require MFA and shall not allow them to bypass MFA (F-01-R1).
- **US-001-ac-3**: Given a user has no org-level or role-based mandatory MFA policy, And their per-user MFA flag is disabled, When they attempt a local HRMS login, Then the system shall not require email-based MFA for that login (F-01-R1).
- **US-001-ac-4**: Given a user signs in through an external IdP/AD SSO flow that reports MFA already completed, When HRMS receives a successful SSO assertion, Then the session creation in HRMS shall bypass local email-based MFA and grant access based on the external authentication state (F-01-R1).
- **US-001-ac-5**: Given a user attempts to sign in through an external IdP/AD SSO flow without local username/password, When the IdP authentication is successful and indicates MFA applied per IdP policy, Then the HRMS shall not invoke local MFA policy evaluation for that session (F-01-R1).

---

## Functional Requirements

- **FR-001 [US-001-ac-1]**: Upon submission of local HRMS username/password credentials, the authentication subsystem shall classify the incoming request as a local login (distinct from SSO/IdP flows) and shall query the central user store and central policy store to determine MFA applicability. The determination shall incorporate three independent inputs: (a) the per-user MFA enabled/disabled flag, (b) the user's role membership(s), and (c) org-level MFA policy rules. All three inputs must be evaluated before a final MFA-required decision is produced. [Gap: the specific API contract, data schema, and service boundaries for the central user and policy stores are not yet identified in the measured codebase; these components are net-new per the impact analysis.]
- **FR-002 [US-001-ac-2]**: When the MFA policy evaluation (FR-001) determines that an org-level or role-based mandatory MFA policy applies to the authenticating user, the system shall require email-based MFA regardless of the state of that user's personal MFA flag. A disabled per-user MFA flag shall not constitute a bypass condition when an org-level or role-based policy mandates MFA. The login flow shall not proceed to session creation until MFA is successfully completed. [Gap: the precedence logic between org-level policy, role-based policy, and per-user flag is confirmed by this criterion but the exact conflict-resolution order among multiple simultaneous policies is not specified in the acceptance criteria and must be clarified before implementation.]
- **FR-003 [US-001-ac-3]**: When the MFA policy evaluation (FR-001) determines that no org-level MFA policy and no role-based MFA policy apply to the authenticating user, and the user's per-user MFA flag is disabled, the system shall not prompt for or require email-based MFA for that local login session. The user shall proceed directly to session creation after successful credential verification. [Gap: the behaviour when the per-user MFA flag is enabled but no org/role policy exists is not addressed by this acceptance criterion; that case is not specified and must not be assumed.]
- **FR-004 [US-001-ac-4]**: When HRMS receives a successful SSO assertion from an external IdP or Active Directory that includes a claim or attribute indicating that MFA has already been completed by the IdP, the session creation process shall bypass local email-based MFA evaluation entirely and shall grant the user access based solely on the external authentication state conveyed in the assertion. The local MFA policy evaluation pipeline (FR-001 through FR-003) shall not be invoked for such sessions. [Gap: the specific assertion attribute or claim name that signals IdP-completed MFA is not defined in the acceptance criteria; the parsing and trust model for the SSO assertion are net-new and must be specified during design.]
- **FR-005 [US-001-ac-5]**: When a user authenticates via an external IdP or AD SSO flow (i.e., without presenting local HRMS username/password credentials) and the IdP authentication succeeds with an indication that MFA was applied per IdP policy, the HRMS shall not invoke its local MFA policy evaluation for the resulting session. Local MFA policy evaluation is exclusively applicable to local username/password login flows; SSO-originated sessions are exempt from local MFA policy processing. [Gap: the mechanism by which the HRMS distinguishes an SSO-originated session from a local-login session at the session-creation boundary is not measured in the existing codebase and represents a net-new integration point; the trust boundary and assertion validation mechanism must be defined during design.]

---

## Success Criteria

- **US-001-ac-1**: Given a user attempts to sign in with local HRMS username/password, When the credentials are submitted, Then the system shall classify the request as a local login and query the central user and policy stores to determine MFA applicability based on per-user flags, role membership, and org-level MFA rules (F-01-R1).
- **US-001-ac-2**: Given a user has an org-level or role-based mandatory MFA policy, And their personal MFA flag is disabled, When they attempt a local HRMS login with correct credentials, Then the system shall still require MFA and shall not allow them to bypass MFA (F-01-R1).
- **US-001-ac-3**: Given a user has no org-level or role-based mandatory MFA policy, And their per-user MFA flag is disabled, When they attempt a local HRMS login, Then the system shall not require email-based MFA for that login (F-01-R1).
- **US-001-ac-4**: Given a user signs in through an external IdP/AD SSO flow that reports MFA already completed, When HRMS receives a successful SSO assertion, Then the session creation in HRMS shall bypass local email-based MFA and grant access based on the external authentication state (F-01-R1).
- **US-001-ac-5**: Given a user attempts to sign in through an external IdP/AD SSO flow without local username/password, When the IdP authentication is successful and indicates MFA applied per IdP policy, Then the HRMS shall not invoke local MFA policy evaluation for that session (F-01-R1).

---

## Bias Flags

> ⚠️ Protected characteristics mentioned (disabled) — verify they are required by the source requirement.

---

## Provenance

- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:bbe403710218008676fc682ddff22f4d6c8e5cc6043557b8eec21c7eebd61ff6`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Repository**: `https://github.com/XEBIA-ACE/New_Prompt_UMS` (ref: `main`)
- **Deterministic grounding reference**: `ae246fe2f5b81296`
- **Codebase grounding snapshot**: `ae246fe2f5b81296`
- **Determinism snapshot evidence**: `determinism-snapshot:sha256:e7fbb6441ffcabd74da9855a28e6a7dcc4c088127980f626b7c900e2c927fc28`
- **Run ID**: `a578e40b-f31a-513b-b731-8b76eb8d0f37`
- **Project ID**: `b8725385-5107-432a-b52b-755a7c5963f5`
- **Generation mode**: `enhancement`
- **Grounding status**: `grounded`
- **Confidence**: `medium (65)`