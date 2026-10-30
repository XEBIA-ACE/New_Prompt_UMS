# Tasks: Config: add OTP_MAX_ATTEMPTS environment variable

**Story ID**: `c6f113b0-ea24-5cf5-8f61-cb95239d21e2`  
**Accepted impact analysis**: `sha256:9f1ab8e064177a0bee2a3e716c8ef26354528458e84d6a630806de1911333012` (revision 1)  
**Grounding fingerprint**: `ae246fe2f5b81296`

> **⚠ DEGRADED DISCLOSURE**: The CAST focus object (`Accordion`, id=2670) is a confirmed lookup mismatch. All tasks below are grounded on the flagged alternative candidate `OtpConfig` (id=1439, `BACKEND/src/config/otp.config.ts`) and the functional specification only. All five acceptance criteria are structurally unmapped in the CAST snapshot. Review against the live repository before beginning implementation.

---

## Implementation Tasks

- [ ] **T001** — `FR-001 [S2-AC1]`: Modify `BACKEND/src/config/otp.config.ts` to read `process.env.OTP_MAX_ATTEMPTS` at application startup. When the variable is absent from the environment, export the numeric value `5` as the resolved `OTP_MAX_ATTEMPTS`. The exported value must be of TypeScript type `number`, not `string`. *(Evidence ref: `spec_functional:FR-001:S2-AC1`)*

- [ ] **T002** — `FR-002 [S2-AC2]`: Ensure that when `OTP_MAX_ATTEMPTS` is present in the environment (e.g. `OTP_MAX_ATTEMPTS=10`), the OTP config module parses and exports the supplied value as a number (e.g. `10`), overriding the default of `5`. The override must take effect without any code change. *(Evidence ref: `spec_functional:FR-002:S2-AC2`)*

- [ ] **T003** — `FR-003 [S2-AC3]`: Add an `OTP_MAX_ATTEMPTS=5` entry with a brief inline comment explaining its purpose (maximum number of failed OTP verification attempts before the OTP is locked) to the `.env.example` file (or the project's equivalent documented environment template) in the repository root. *(Evidence ref: `spec_functional:FR-003:S2-AC3`)*

- [ ] **T004** — `FR-004 [S2-AC4]`: Ensure the `OTP_MAX_ATTEMPTS` symbol exported from the OTP config module is statically typed as `number` in TypeScript, such that any importing TypeScript file can use it directly in a numeric comparison (e.g. `attemptCount >= OTP_MAX_ATTEMPTS`) without requiring a type cast, `Number()` call, or `parseInt()` call at the call site. *(Evidence ref: `spec_functional:FR-004:S2-AC4`)*

- [ ] **T005** — `FR-005 [S2-AC5]`: Implement NaN-guard in the config layer: when `OTP_MAX_ATTEMPTS` is set to a non-numeric string (e.g. `'abc'`), the config layer must not silently propagate `NaN`. It must either (a) fall back to the default value of `5` and continue startup normally, or (b) throw a descriptive startup error that identifies the invalid value and the expected type. **Resolve the fallback-vs-hard-error strategy before implementation.** *(Evidence ref: `spec_functional:FR-005:S2-AC5`)*

- [ ] **T006** — Security validation: Add a positive-integer guard to the config layer so that `OTP_MAX_ATTEMPTS` cannot be set to `0` or a negative number (which would disable brute-force protection).

- [ ] **T007** — Confirm dotenv load order: Verify that `OTP_MAX_ATTEMPTS` is loaded from the `.env` file (via the dotenv layer, known consumer `test-sendgrid.ts`, CAST id=957) before the OTP config module resolves its value. No logic change to `test-sendgrid.ts` is required unless load order is incorrect.

---

## Verification / Test Tasks

- [ ] **T008** — Verify `S2-AC1` (`4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC1`): Write unit test — OTP config module returns `5` (number) when `OTP_MAX_ATTEMPTS` is absent from the environment. Required before release; run in CI.

- [ ] **T009** — Verify `S2-AC2` (`4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC2`): Write unit test — OTP config module returns `10` (number) when `OTP_MAX_ATTEMPTS=10` is set. Required before release; run in CI.

- [ ] **T010** — Verify `S2-AC3` (`4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC3`): Write file-existence / content test — `.env.example` contains an `OTP_MAX_ATTEMPTS=5` line with a comment. Required before release; run in CI.

- [ ] **T011** — Verify `S2-AC4` (`4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC4`): Add TypeScript compilation check — confirm exported `OTP_MAX_ATTEMPTS` is typed as `number` so no `parseInt` or type cast is needed at call sites. Required before release; run in CI.

- [ ] **T012** — Verify `S2-AC5` (`4db165b0-f745-5a0c-b6a7-4234130fbd8d:test:characterization:S2-AC5`): Write unit test — OTP config module falls back to `5` or throws a descriptive error when `OTP_MAX_ATTEMPTS` is set to a non-numeric string such as `'abc'`; confirm `NaN` is never exported. Required before release; run in CI.

---

## Open Items (Must Be Resolved or Explicitly Accepted Before Implementation)

1. **[BLOCKER — CAST mismatch]** Candidate verification found the selected focus object implausible: `Accordion` (id=2670) is a frontend UI component unrelated to OTP configuration. Confirm `OtpConfig` (id=1439) as the correct grounding object before proceeding.
2. **[OPEN]** Does the downstream OTP service (S3) already import from the OTP config module, or will a new import be introduced?
3. **[OPEN]** Is there an existing dotenv config aggregator object in CAST that should be updated, or is this a new file?
4. **[OPEN]** Which CAST object ID corresponds to the OTP config module in the `User_Management` application?
5. **[OPEN]** Should the NaN-guard strategy (S2-AC5 / T005) be a silent fallback to `5` or a hard startup error? Must be resolved before T005 is implemented.
6. **[GAP]** No `.env.example` or equivalent template file object was returned by CAST; S2-AC3 cannot be structurally evidenced — verify file exists in the live repository.
7. **[GAP]** No CAST object for the OTP config module was returned; structural coverage of the config file is absent.
8. **[GAP]** No CAST object for the dotenv configuration layer was returned; wiring path cannot be structurally verified.
9. **[GAP]** No CAST object for the downstream OTP service (S3) that will consume `OTP_MAX_ATTEMPTS` was returned; caller impact on that service is unmeasured.
10. **[GAP]** TypeScript type information for the exported `OTP_MAX_ATTEMPTS` symbol was not returned; S2-AC4 cannot be structurally evidenced.
11. **[CAVEAT]** No-match classification (all acceptance criteria unmapped): net-new capability classification has a noted caveat — broader synonym searches for `maxAttempts`, `max_attempts`, `otp`+`config`, `otp`+`env` were not performed. Mild doubt remains that a related config key could exist under a different name.
12. **[DEGRADED]** Architecture context is degraded (missing_core: api_contracts); no API contracts were available to assess contract impact against.
