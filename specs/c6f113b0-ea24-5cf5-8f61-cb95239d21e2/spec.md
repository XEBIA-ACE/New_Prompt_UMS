# Feature Specification: Config: add OTP_MAX_ATTEMPTS environment variable

**Story ID**: `c6f113b0-ea24-5cf5-8f61-cb95239d21e2`  
**Title**: Config: add OTP_MAX_ATTEMPTS environment variable  
**Component**: `BACKEND/src/config`  
**Effort**: XS  
**Generation mode**: `tech_upgrade`  
**Upgrade option**: `OPT-INCREMENTAL-VERIFY-GAP`

---

## Description

The OTP verify flow currently has no configurable upper bound on failed attempts; any limit would have to be hardcoded. This story adds `OTP_MAX_ATTEMPTS` as a named environment variable with a default value of 5, wires it through the dotenv configuration layer, and exports it from the OTP config module. Once in place, downstream service code (S3) can read the value from the config module rather than embedding a magic number, and operators can override the limit per environment without touching source code. No service logic is changed here; this story is purely a configuration plumbing change.

---

## User Scenarios & Acceptance Criteria

- **S2-AC1**: Given OTP_MAX_ATTEMPTS is not set in the environment, when the application starts, then the OTP config module exports the value 5 as a number.
- **S2-AC2**: Given OTP_MAX_ATTEMPTS=10 is set in the environment, when the application starts, then the OTP config module exports the value 10 as a number.
- **S2-AC3**: Given the .env.example (or equivalent template) file, when a developer reads it, then it contains an OTP_MAX_ATTEMPTS entry with the value 5 and a brief comment explaining its purpose.
- **S2-AC4**: Given the OTP config module is imported by any TypeScript file, when the exported OTP_MAX_ATTEMPTS value is used in a numeric comparison, then no type cast or parseInt call is required because the value is already typed as a number.
- **S2-AC5**: Given OTP_MAX_ATTEMPTS is set to a non-numeric string in the environment, when the application starts, then the config layer either falls back to the default of 5 or throws a descriptive startup error rather than silently propagating NaN.

---

## Functional Requirements

- **FR-001 [S2-AC1]**: The OTP config module (`BACKEND/src/config/otp.config.ts`) must read `process.env.OTP_MAX_ATTEMPTS` at application startup and, when the variable is absent from the environment, export the numeric value `5` as the resolved `OTP_MAX_ATTEMPTS`. The exported value must be of TypeScript type `number`, not `string`.
- **FR-002 [S2-AC2]**: When `OTP_MAX_ATTEMPTS` is present in the environment (e.g. `OTP_MAX_ATTEMPTS=10`), the OTP config module must parse and export the supplied value as a number (e.g. `10`), overriding the default of `5`. The override must take effect without any code change.
- **FR-003 [S2-AC3]**: The `.env.example` file (or the project's equivalent documented environment template) must contain an `OTP_MAX_ATTEMPTS=5` entry accompanied by a brief inline comment that explains the variable's purpose (i.e. the maximum number of failed OTP verification attempts before the OTP is locked).
- **FR-004 [S2-AC4]**: The `OTP_MAX_ATTEMPTS` symbol exported from the OTP config module must be statically typed as `number` in TypeScript, such that any importing TypeScript file can use it directly in a numeric comparison (e.g. `attemptCount >= OTP_MAX_ATTEMPTS`) without requiring a type cast, `Number()` call, or `parseInt()` call at the call site.
- **FR-005 [S2-AC5]**: When `OTP_MAX_ATTEMPTS` is set to a non-numeric string (e.g. `'abc'`) in the environment, the config layer must not silently propagate `NaN`; it must either (a) fall back to the default value of `5` and continue startup normally, or (b) throw a descriptive startup error that identifies the invalid value and the expected type. The chosen strategy (fallback vs. hard error) is left open by the story and must be resolved before implementation; the functional requirement is satisfied by either approach provided `NaN` is never exported.

---

## Success Criteria (Verification)

| ID | Criterion | Test Obligation |
|----|-----------|----------------|
| S2-AC1 | OTP config module exports `5` as `number` when `OTP_MAX_ATTEMPTS` is absent | Unit test: OTP config module returns 5 (number) when OTP_MAX_ATTEMPTS is absent from the environment |
| S2-AC2 | OTP config module exports `10` as `number` when `OTP_MAX_ATTEMPTS=10` | Unit test: OTP config module returns 10 (number) when OTP_MAX_ATTEMPTS=10 is set |
| S2-AC3 | `.env.example` contains `OTP_MAX_ATTEMPTS=5` with inline comment | File-existence / content test: .env.example contains an OTP_MAX_ATTEMPTS=5 line with a comment |
| S2-AC4 | Exported `OTP_MAX_ATTEMPTS` is typed as `number`; no `parseInt`/cast required at call sites | TypeScript compilation test: confirm exported OTP_MAX_ATTEMPTS is typed as number so no parseInt or type cast is needed at call sites |
| S2-AC5 | Non-numeric env value falls back to `5` or throws descriptive error; `NaN` is never exported | Unit test: OTP config module falls back to 5 or throws a descriptive error when OTP_MAX_ATTEMPTS is set to a non-numeric string such as `'abc'` |

---

## Security Obligations

- `OTP_MAX_ATTEMPTS` must not be set to `0` or a negative number; the config layer should validate the parsed value is a positive integer to prevent disabling brute-force protection.
- The `.env.example` entry must not expose a production-tuned value; the documented default of `5` is appropriate for a template file.

---

## Provenance

- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis hash**: `sha256:9f1ab8e064177a0bee2a3e716c8ef26354528458e84d6a630806de1911333012`
- **Repository**: `https://github.com/XEBIA-ACE/New_Prompt_UMS`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577` (ref: `main`)
- **Deterministic grounding fingerprint**: `ae246fe2f5b81296`
- **Run ID**: `4db165b0-f745-5a0c-b6a7-4234130fbd8d`
- **Project ID**: `fe046759-34f5-461e-b9f5-f86027f9095d`
- **CAST application**: `User_Management`
- **Determinism snapshot hash**: `sha256:59656527dc5c0fcd25bf703124dc7f244514ccaa1eb7988e454d3ce1e0b3066a`
- **Flagged alternative CAST candidate**: `OtpConfig` (id=1439, `BACKEND/src/config/otp.config.ts`, TypeScript Interface) — review before accepting; the primary CAST focus object (`Accordion`, id=2670) is a confirmed lookup mismatch.
- **API impact status**: `blocked` — architecture context degraded (missing_core: api_contracts); all five acceptance criteria structurally unmapped in CAST snapshot.
