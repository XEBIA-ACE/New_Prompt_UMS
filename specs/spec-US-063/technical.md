## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Password Strength Validation
**Service**: User Management Service (S-101)
**Feature**: Password Strength Validation at Registration
**References**: FR-001 through FR-012, EC-001 through EC-004

---

## 1. Contracts & Interfaces

### 1.1 Affected Endpoint

**POST /api/v1/users/register** — existing endpoint; no path change. The request and response contracts are extended as follows.

**Request Body Contract**
The endpoint already accepts a registration payload. The `password` field SHALL be treated as a required string. The service SHALL reject any password that is null, empty, whitespace-only, shorter than 8 characters, longer than 128 characters, or missing any of the four character-class requirements (uppercase, lowercase, digit, special character). Special characters are defined as printable non-alphanumeric ASCII characters (codepoints 33–47, 58–64, 91–96, 123–126).

**Success Response**
HTTP 201 Created — no change from existing behavior.

**Validation Failure Response**
HTTP 422 Unprocessable Entity. The response body SHALL include a `violations` array containing one string message per failed rule. The response SHALL NOT include a 400 Bad Request for password-specific rule failures; 400 is reserved for malformed request structure.

**Response Body Schema (422)**
The body SHALL carry a top-level `error` string set to `"PASSWORD_POLICY_VIOLATION"` and a `violations` array of human-readable strings, one entry per violated rule. All violations detected in the single evaluation pass SHALL appear together.

### 1.2 Internal Interface — PasswordPolicyEvaluator

```
interface PasswordPolicyEvaluator {
    PasswordValidationResult evaluate(String password, PasswordPolicy policy);
}
```

`PasswordValidationResult` carries a `boolean valid` and `List<String> violations`. `PasswordPolicy` is a value object carrying `minimumLength` (int), `maximumLength` (int), `requiresUppercase` (boolean), `requiresLowercase` (boolean), `requiresDigit` (boolean), `requiresSpecialCharacter` (boolean).

---

## 2. Test Strategy

All tests are unit or integration tests within S-101. No cross-service calls are introduced.

**TC-001** (covers FR-009, EC-001): Submit a registration request with a null password field. Assert HTTP 422 and a violation message stating the password is required.

**TC-002** (covers FR-009, EC-001): Submit a whitespace-only password. Assert HTTP 422 with the absent-password violation.

**TC-003** (covers FR-002, A-001): Submit a 7-character password satisfying all other rules. Assert HTTP 422 with the minimum-length violation message only.

**TC-004** (covers FR-011, A-003, EC-004): Submit a 129-character password. Assert HTTP 422 with the maximum-length violation. Assert the evaluator does not process character-class checks on oversized input.

**TC-005** (covers FR-003): Submit a password with no uppercase letter. Assert HTTP 422 with the uppercase violation.

**TC-006** (covers FR-004): Submit a password with no lowercase letter. Assert HTTP 422 with the lowercase violation.

**TC-007** (covers FR-005): Submit a password with no digit. Assert HTTP 422 with the digit violation.

**TC-008** (covers FR-006, A-002): Submit a password with no special character. Assert HTTP 422 with the special-character violation.

**TC-009** (covers FR-007, FR-010, EC-003): Submit a password that is too short, has no digit, and has no special character. Assert HTTP 422 with exactly three violation messages returned simultaneously.

**TC-010** (covers FR-001, FR-008): Submit a fully compliant password. Assert HTTP 201 and confirm no user record is written when violations exist in parallel test cases.

**TC-011** (covers FR-012): Invoke `PasswordPolicyEvaluator.evaluate()` directly with the same password twice using the same `PasswordPolicy` instance. Assert identical `PasswordValidationResult` objects, confirming channel-agnostic determinism.

**TC-012** (unit, covers FR-010): Call `PasswordPolicyEvaluator.evaluate()` with a password violating all five rules. Assert that `violations` has exactly five entries without any short-circuit exit.

---

## 3. Implementation Approach

### 3.1 Data Model Changes

**No new database tables are required.** The `PasswordPolicy` is a configuration-backed value object, not a persisted entity, consistent with A-004 (policy is fixed at service configuration time).

A new configuration block SHALL be added to the service's existing application configuration file (e.g., `application.yml`) under the key `password-policy`: