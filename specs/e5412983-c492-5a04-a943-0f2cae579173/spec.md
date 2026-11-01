# Feature Specification: e5412983-c492-5a04-a943-0f2cae579173

## User Scenarios & Testing
- **S2-AC1**: Given the OTP config module is imported, when OTP_MAX_ATTEMPTS is read, then it returns the integer 5 when no override environment variable is set.
- **S2-AC2**: Given an environment variable is set to a valid integer override for OTP_MAX_ATTEMPTS, when the OTP config module is imported, then OTP_MAX_ATTEMPTS reflects the overridden value rather than the default 5.
- **S2-AC3**: Given the OTP error definitions module is imported, when OTP_LOCKED is accessed, then it exposes a code property whose string value is exactly 'OTP_LOCKED'.
- **S2-AC4**: Given the OTP error definitions module is imported, when ACCOUNT_STATE_INVALID is accessed, then it exposes a code property whose string value is exactly 'ACCOUNT_STATE_INVALID'.
- **S2-AC5**: Given the OTP config module is modified, when all pre-existing exports are inspected, then every export that existed before this story is still present and unchanged.
- **S2-AC6**: Given the OTP error definitions module is modified, when all pre-existing exports are inspected, then every export that existed before this story is still present and unchanged.

## Functional Requirements
- FR-S2-AC1: The OTP config module SHALL export a constant named OTP_MAX_ATTEMPTS which, when the module is imported with no relevant override environment variable set, evaluates to the integer value 5. (Trace: S2-AC1; Evidence/impact: accepted impact revision 1, hash sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0.)
- FR-S2-AC2: The OTP config module SHALL read a single, implementation-defined environment variable at module initialisation such that, when that variable is present and contains a syntactically valid integer, the exported OTP_MAX_ATTEMPTS constant reflects the overridden integer value instead of the default 5; the specific environment variable name, valid range, and handling of invalid values are intentionally left unspecified by this story and MUST be resolved during implementation without contradicting S2-AC1 or the security obligations in the accepted impact analysis. (Trace: S2-AC2; Evidence/impact: accepted impact revision 1, hash sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0.)
- FR-S2-AC3: The OTP error definitions module SHALL define and export an error entry identified as OTP_LOCKED such that, when imported and accessed via its public API, it exposes a code property whose value is the string literal "OTP_LOCKED"; any additional shape (e.g., message, HTTP status) is outside the scope of this story. (Trace: S2-AC3; Evidence/impact: accepted impact revision 1, hash sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0.)
- FR-S2-AC4: The OTP error definitions module SHALL define and export an error entry identified as ACCOUNT_STATE_INVALID such that, when imported and accessed via its public API, it exposes a code property whose value is the string literal "ACCOUNT_STATE_INVALID"; as with OTP_LOCKED, any additional properties are outside the scope of this story. (Trace: S2-AC4; Evidence/impact: accepted impact revision 1, hash sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0.)
- FR-S2-AC5: After adding OTP_MAX_ATTEMPTS, the OTP config module SHALL continue to expose every pre-existing export (names and values) exactly as before, with no removals, renames, or semantic changes; verification MAY be performed via tests or code review that enumerate the module's exports before and after the change. (Trace: S2-AC5; Evidence/impact: accepted impact revision 1, hash sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0.)
- FR-S2-AC6: After adding OTP_LOCKED and ACCOUNT_STATE_INVALID, the OTP error definitions module SHALL continue to expose every pre-existing export (names and values) exactly as before, with no removals, renames, or semantic changes; verification MAY be performed via tests or code review that enumerate the module's exports before and after the change. (Trace: S2-AC6; Evidence/impact: accepted impact revision 1, hash sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0.)

## Success Criteria
- **S2-AC1**: Given the OTP config module is imported, when OTP_MAX_ATTEMPTS is read, then it returns the integer 5 when no override environment variable is set.
- **S2-AC2**: Given an environment variable is set to a valid integer override for OTP_MAX_ATTEMPTS, when the OTP config module is imported, then OTP_MAX_ATTEMPTS reflects the overridden value rather than the default 5.
- **S2-AC3**: Given the OTP error definitions module is imported, when OTP_LOCKED is accessed, then it exposes a code property whose string value is exactly 'OTP_LOCKED'.
- **S2-AC4**: Given the OTP error definitions module is imported, when ACCOUNT_STATE_INVALID is accessed, then it exposes a code property whose string value is exactly 'ACCOUNT_STATE_INVALID'.
- **S2-AC5**: Given the OTP config module is modified, when all pre-existing exports are inspected, then every export that existed before this story is still present and unchanged.
- **S2-AC6**: Given the OTP error definitions module is modified, when all pre-existing exports are inspected, then every export that existed before this story is still present and unchanged.
- **IMPACT**: S2-AC1: Add or update automated tests to assert that importing the OTP config module exposes OTP_MAX_ATTEMPTS with a default integer value of 5 when no environment override is present.
- **IMPACT**: S2-AC2: Add or update automated tests to verify that setting a valid integer environment override for OTP_MAX_ATTEMPTS results in the exported constant reflecting the overridden value and that type conversion behaves as expected.
- **IMPACT**: S2-AC3: Add or update automated tests to confirm that importing the OTP error definitions module exposes OTP_LOCKED with a code property exactly equal to 'OTP_LOCKED'.
- **IMPACT**: S2-AC4: Add or update automated tests to confirm that importing the OTP error definitions module exposes ACCOUNT_STATE_INVALID with a code property exactly equal to 'ACCOUNT_STATE_INVALID'.
- **IMPACT**: S2-AC5: Add or update regression tests (e.g., snapshot or explicit key checks) to ensure all pre-existing exports from the OTP config module remain present and unchanged after adding OTP_MAX_ATTEMPTS.
- **IMPACT**: S2-AC6: Add or update regression tests to ensure all pre-existing exports from the OTP error definitions module remain present and unchanged after adding OTP_LOCKED and ACCOUNT_STATE_INVALID.

## Provenance
- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:308b0e1ecf962e8fca3923ef3ea65936c731c064a6eef74d805089aaa790c8d0`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`