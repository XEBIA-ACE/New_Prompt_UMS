# Implementation Plan: Config: add OTP_MAX_ATTEMPTS environment variable

**Story ID**: `c6f113b0-ea24-5cf5-8f61-cb95239d21e2`  
**Accepted impact analysis**: `sha256:9f1ab8e064177a0bee2a3e716c8ef26354528458e84d6a630806de1911333012` (revision 1)  
**Grounding fingerprint**: `ae246fe2f5b81296`

---

## Technical Context

### Grounding Evidence References

- Codebase grounding snapshot: `ae246fe2f5b81296`
- Accepted impact analysis: `sha256:9f1ab8e064177a0bee2a3e716c8ef26354528458e84d6a630806de1911333012`
- Determinism snapshot: `sha256:59656527dc5c0fcd25bf703124dc7f244514ccaa1eb7988e454d3ce1e0b3066a`
- Flagged alternative candidate: `OtpConfig` (CAST id=1439, `BACKEND/src/config/otp.config.ts`, TypeScript Interface)
- Known dotenv consumer: `test-sendgrid.ts` (CAST id=957)
- Functional spec references: `spec_functional:FR-001:S2-AC1`, `spec_functional:FR-002:S2-AC2`, `spec_functional:FR-003:S2-AC3`, `spec_functional:FR-004:S2-AC4`, `spec_functional:FR-005:S2-AC5`

### Affected Components

| Component | CAST ID | File | Notes |
|-----------|---------|------|-------|
| `OtpConfig` | 1439 | `BACKEND/src/config/otp.config.ts` | TypeScript Interface — flagged alternative candidate; primary focus object was a mismatch |
| `test-sendgrid.ts` | 957 | (dotenv consumer) | Known dotenv consumer; confirms dotenv load path |

> **⚠ DEGRADED DISCLOSURE**: The CAST focus object returned for this story (`Accordion`, id=2670, `FRONTEND/src/app/components/ui/accordion.tsx`) is a confirmed lookup mismatch and is entirely unrelated to OTP configuration. The design is grounded instead on the flagged alternative candidate `OtpConfig` (id=1439, `BACKEND/src/config/otp.config.ts`) and the known dotenv consumer `test-sendgrid.ts` (id=957). All five acceptance criteria (S2-AC1 through S2-AC5) are structurally unmapped in the CAST snapshot. The architecture context is marked degraded (missing_core: api_contracts). **This plan must be reviewed against the live repository before implementation.**

---

## Design Steps

1. **Modify `BACKEND/src/config/otp.config.ts`** — Extend the `OtpConfig` TypeScript interface (CAST object id=1439) to include an `OTP_MAX_ATTEMPTS` field typed as `number`. Read `process.env.OTP_MAX_ATTEMPTS` at module load time, parse it with `parseInt`/`Number`, validate the result is a positive integer, and export the resolved value (defaulting to `5` when the variable is absent). If the parsed value is `NaN` or non-positive, either fall back to `5` or throw a descriptive startup error — never export `NaN`. This satisfies FR-001 (S2-AC1), FR-002 (S2-AC2), FR-004 (S2-AC4), and FR-005 (S2-AC5).

2. **Confirm dotenv load order** — The dotenv configuration layer is wired through `test-sendgrid.ts` / CAST object id=957 as the known dotenv consumer. Ensure `OTP_MAX_ATTEMPTS` is loaded from the `.env` file before the OTP config module resolves its value. No logic change to `test-sendgrid.ts` itself is required; this step confirms the dotenv load order is correct.

3. **Update `.env.example`** — Add an `OTP_MAX_ATTEMPTS=5` entry with an inline comment explaining its purpose (maximum number of failed OTP verification attempts before the OTP is locked) to the `.env.example` (or equivalent environment template) file in the repository root. This satisfies FR-003 (S2-AC3).

4. **Write tests** — Write unit tests for the OTP config module covering:
   - (a) `OTP_MAX_ATTEMPTS` absent → exports `5` as `number` (S2-AC1)
   - (b) `OTP_MAX_ATTEMPTS=10` → exports `10` as `number` (S2-AC2)
   - (c) `OTP_MAX_ATTEMPTS='abc'` → falls back to `5` or throws descriptive error, never exports `NaN` (S2-AC5)
   - Add a TypeScript compilation check confirming the exported symbol is typed as `number` with no `parseInt`/type-cast required at call sites (S2-AC4)
   - Add a file-content assertion confirming `.env.example` contains the `OTP_MAX_ATTEMPTS=5` line with a comment (S2-AC3)

---

## Contract Changes

No material API, event, or data contract change is evidenced by this story. `contract_change_required: false`.

> **Note**: Architecture context is degraded (missing_core: api_contracts); no API contracts were available to assess contract impact against. This assessment is based on the functional scope of the change (configuration plumbing only, no HTTP endpoints modified).

---

## Security and Quality Obligations

- `OTP_MAX_ATTEMPTS` must not be set to `0` or a negative number; the config layer should validate the parsed value is a positive integer to prevent disabling brute-force protection.
- The `.env.example` entry must not expose a production-tuned value; the documented default of `5` is appropriate for a template file.
- Preserve the availability, reliability, and observability constraints grounded by `ae246fe2f5b81296`.

---

## Migration and Rollback

- Document dependency and configuration migration.
- Provide a tested rollback path.
- No database tables are touched by this purely configuration-layer change.

---

## Implementation-Readiness Items (Must Be Resolved or Explicitly Accepted Before Implementation)

1. Candidate verification flagged a possibly better-matching alternative that was not selected: `OtpConfig` (1439) — review before accepting.
2. Candidate verification found the selected focus object implausible for this requirement: The requirement is about adding an `OTP_MAX_ATTEMPTS` environment variable and wiring it through the OTP config module, but the selected object is `Accordion`, a frontend UI component in `accordion.tsx`, which has no relationship to OTP configuration or environment variables. A clearly better match exists in the candidate list: `OtpConfig` (id=1439), a TypeScript Interface in the OTP config file, which directly corresponds to the configuration plumbing change described in the requirement.
3. Does the downstream OTP service (S3) already import from the OTP config module, or will a new import be introduced?
4. Is there an existing dotenv config aggregator object in CAST that should be updated, or is this a new file?
5. No `.env.example` or equivalent template file object was returned by CAST; S2-AC3 cannot be structurally evidenced.
6. No CAST object for the OTP config module was returned; structural coverage of the config file is absent.
7. No CAST object for the dotenv configuration layer was returned; wiring path cannot be structurally verified.
8. No CAST object for the downstream OTP service (S3) that will consume `OTP_MAX_ATTEMPTS` was returned; caller impact on that service is unmeasured.
9. No database tables are touched by this purely configuration-layer change.
10. No-match classification (all acceptance criteria unmapped): Initial classification (net-new capability) has a noted caveat: The search terms tried were very specific to the new variable name and module names, but no attempt was made to search for existing OTP attempt-limiting patterns using more generic terms like `maxAttempts`, `max_attempts`, or `otp` combined with `config` or `env`. While this doesn't prove the capability exists, the absence of broader synonym searches leaves mild doubt that a related config key could exist under a different name.
11. No-match consistency check raised a caveat about this classification: same caveat as above regarding synonym search coverage.
12. Requirement detail is incomplete (see evidence_gaps); no conflicting existing implementation was found.
13. Runtime/startup behaviour for NaN-guard (S2-AC5) is not observable from static structural facts.
14. Should the NaN-guard strategy be a silent fallback to `5` or a hard startup error? The story leaves this open.
15. The 10 measured transactions and 0 callers belong to the `Accordion` UI component and are unrelated to the OTP configuration change.
16. The CAST focus object `Accordion` (2670) is a lookup mismatch; the actual OTP config module and dotenv wiring objects were not returned by the structural query.
17. The application-level inventory facts (20 Radix UI dependencies) are frontend dependencies and do not include the OTP config or dotenv modules relevant to this story.
18. TypeScript type information for the exported `OTP_MAX_ATTEMPTS` symbol was not returned; S2-AC4 cannot be structurally evidenced.
19. Which CAST object ID corresponds to the OTP config module in the `User_Management` application?
20. Architecture context is degraded (missing_core: api_contracts); no API contracts were available to assess contract impact against.
21. All five acceptance criteria (S2-AC1 through S2-AC5) are structurally unmapped in the CAST snapshot; the technical design is derived from the functional specification and the flagged alternative candidate only. The design must be reviewed against the live repository before implementation.

---

## Verification Plan

| Obligation ID | Criterion | Expected Assertion | Type | Environment |
|--------------|-----------|-------------------|------|-------------|
| `4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC1` | S2-AC1 | Given OTP_MAX_ATTEMPTS is not set in the environment, when the application starts, then the OTP config module exports the value 5 as a number. | characterization | ci |
| `4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC2` | S2-AC2 | Given OTP_MAX_ATTEMPTS=10 is set in the environment, when the application starts, then the OTP config module exports the value 10 as a number. | characterization | ci |
| `4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC3` | S2-AC3 | Given the .env.example (or equivalent template) file, when a developer reads it, then it contains an OTP_MAX_ATTEMPTS entry with the value 5 and a brief comment explaining its purpose. | characterization | ci |
| `4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC4` | S2-AC4 | Given the OTP config module is imported by any TypeScript file, when the exported OTP_MAX_ATTEMPTS value is used in a numeric comparison, then no type cast or parseInt call is required because the value is already typed as a number. | characterization | ci |
| `4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC5` | S2-AC5 | Given OTP_MAX_ATTEMPTS is set to a non-numeric string in the environment, when the application starts, then the config layer either falls back to the default of 5 or throws a descriptive startup error rather than silently propagating NaN. | characterization | ci |

### Additional Test Obligations (from Impact Analysis)

- Unit test: OTP config module returns `5` (number) when `OTP_MAX_ATTEMPTS` is absent from the environment (covers S2-AC1).
- Unit test: OTP config module returns `10` (number) when `OTP_MAX_ATTEMPTS=10` is set (covers S2-AC2).
- File-existence / content test: `.env.example` contains an `OTP_MAX_ATTEMPTS=5` line with a comment (covers S2-AC3).
- TypeScript compilation test: confirm exported `OTP_MAX_ATTEMPTS` is typed as `number` so no `parseInt` or type cast is needed at call sites (covers S2-AC4).
- Unit test: OTP config module falls back to `5` or throws a descriptive error when `OTP_MAX_ATTEMPTS` is set to a non-numeric string such as `'abc'` (covers S2-AC5).

All test obligations are required before **release** and must run in the **ci** environment.
