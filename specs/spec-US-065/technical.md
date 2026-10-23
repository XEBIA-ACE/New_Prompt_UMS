## S-101

Key words MUST, MUST NOT, SHALL, SHALL NOT, SHOULD, SHOULD NOT, MAY, and OPTIONAL in this document are to be interpreted as described in RFC 2119.

---

# Technical Design Specification — Registration Field Validation
**Service**: User Management Service (S-101)
**Feature**: Mandatory Field Validation for User Registration
**Refs**: FR-001 through FR-012, A-001 through A-004

---

## 1. Contracts & Interfaces

### 1.1 Endpoint Contract

**Affected Endpoint**: `POST /api/v1/users/register`
**Change Type**: Validation layer addition; no change to path, method, or success response envelope.

**Request Body Schema** — `RegistrationRequest`

The request body SHALL carry four text fields: `username`, `email_address`, `password`, and `password_confirmation`. All four fields are mandatory. Fields MAY be absent (null) or present as strings; both cases are handled by the validation layer.

**Success Response** — HTTP 200 (or the existing success code used by account creation; see note below)
[NEEDS CLARIFICATION: Does the existing POST /api/v1/users/register return HTTP 201 on success or HTTP 200?] (Assumed: HTTP 201 Created.)

Validation passes transparently; the request is forwarded to the account creation stage without field mutation (FR-012).

**Validation Failure Response** — HTTP 422 Unprocessable Entity

The response body SHALL conform to the `RegistrationValidationResult` schema: a boolean `is_valid` set to `false`, and a `field_errors` array containing one `FieldError` object per failing field. Each `FieldError` SHALL carry `field_name` (matching the request field name exactly) and `error_message` (a human-readable English string). All field failures SHALL be reported in a single response (FR-007, A-004).

### 1.2 Internal Interface

**Class**: `RegistrationRequestDto`
Properties: `username: String`, `emailAddress: String`, `password: String`, `passwordConfirmation: String`. Deserialized from the inbound JSON body by the controller layer.

**Class**: `RegistrationValidationResult`
Properties: `isValid: boolean`, `fieldErrors: List<FieldError>`.

**Class**: `FieldError`
Properties: `fieldName: String`, `errorMessage: String`.

**Interface**: `RegistrationValidator`
Single method: `RegistrationValidationResult validate(RegistrationRequestDto request)`.

**Class**: `DefaultRegistrationValidator implements RegistrationValidator`
Implements all field validation rules. SHALL NOT perform persistence, uniqueness checks, or downstream calls.

---

## 2. Test Strategy

All tests are unit or integration tests within S-101. No cross-service test harness is required.

**Unit Tests — `DefaultRegistrationValidatorTest`**

- `validate_nullUsername_returnsFieldError` — validates FR-001; asserts `field_errors` contains an entry for `username`.
- `validate_whitespaceOnlyUsername_returnsFieldError` — validates FR-001, A-003; input is `"   "`.
- `validate_nullEmail_returnsFieldError` — validates FR-002.
- `validate_whitespaceOnlyEmail_returnsFieldError` — validates FR-002, A-003.
- `validate_nullPassword_returnsFieldError` — validates FR-003.
- `validate_nullPasswordConfirmation_returnsFieldError` — validates FR-004.
- `validate_malformedEmail_returnsFieldError` — validates FR-005; inputs SHALL include `"notanemail"`, `"missing@"`, `"@nodomain"`, and `"no-at-sign"`.
- `validate_passwordMismatch_returnsFieldError` — validates FR-006; asserts `field_errors` contains entry for `password_confirmation`.
- `validate_multipleFailures_allErrorsReturned` — validates FR-007, A-004; submits request with null username and malformed email; asserts both errors present in single result.
- `validate_eachErrorHasNonBlankMessage` — validates FR-008; iterates all failure scenarios and asserts `errorMessage` is non-null and non-blank.
- `validate_leadingTrailingWhitespaceTrimmedBeforePresenceCheck` — validates FR-010, A-003; input `"  a  "` for username SHALL pass presence check after trim.
- `validate_fullyValidRequest_isValidTrue_noFieldErrors` — validates FR-012 contract side; asserts `isValid = true` and `fieldErrors` is empty.

**Integration Tests — `RegistrationControllerValidationIT`**

- `post_register_missingFields_returns422WithFieldErrors` — validates HTTP contract (HTTP 422, `field_errors` array populated).
- `post_register_validPayload_returns201` — validates FR-012 end-to-end; MAY stub the downstream account creation stage.
- `post_register_passwordMism