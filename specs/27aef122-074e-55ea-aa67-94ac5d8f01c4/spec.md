# Feature Specification: 27aef122-074e-55ea-aa67-94ac5d8f01c4

## User Scenarios & Testing
- **27aef122-074e-55ea-aa67-94ac5d8f01c4**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in locked state, then the controller returns HTTP 422 with error_code ACCOUNT_STATE_INVALID and outcome field indicating account state is invalid.
- **27aef122-074e-55ea-aa67-94ac5d8f01c4**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in deleted state, then the controller returns HTTP 422 with error_code ACCOUNT_STATE_INVALID and outcome field indicating account state is invalid.
- **27aef122-074e-55ea-aa67-94ac5d8f01c4**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in active state and OTP is valid, then the controller proceeds with OTP verification and does not reject based on account state.
- **27aef122-074e-55ea-aa67-94ac5d8f01c4**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in pending/unverified state and OTP is valid, then the controller proceeds with OTP verification and does not reject based on account state.
- **27aef122-074e-55ea-aa67-94ac5d8f01c4**: Given a POST /api/v1/otp/verify request, when the account state validation logic is called, then it uses the existing account state enum and validation method from the user service or repository without creating new validation logic.

## Functional Requirements
- FR-001: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in locked state, then the controller returns HTTP 422 with error_code ACCOUNT_STATE_INVALID and outcome field indicating account state is invalid.
- FR-002: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in deleted state, then the controller returns HTTP 422 with error_code ACCOUNT_STATE_INVALID and outcome field indicating account state is invalid.
- FR-003: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in active state and OTP is valid, then the controller proceeds with OTP verification and does not reject based on account state.
- FR-004: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in pending/unverified state and OTP is valid, then the controller proceeds with OTP verification and does not reject based on account state.
- FR-005: Given a POST /api/v1/otp/verify request, when the account state validation logic is called, then it uses the existing account state enum and validation method from the user service or repository without creating new validation logic.

## Success Criteria
- **S5-AC1**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in locked state, then the controller returns HTTP 422 with error_code ACCOUNT_STATE_INVALID and outcome field indicating account state is invalid.
- **S5-AC2**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in deleted state, then the controller returns HTTP 422 with error_code ACCOUNT_STATE_INVALID and outcome field indicating account state is invalid.
- **S5-AC3**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in active state and OTP is valid, then the controller proceeds with OTP verification and does not reject based on account state.
- **S5-AC4**: Given a POST /api/v1/otp/verify request with a valid UUID user_id and valid passcode, when the account is in pending/unverified state and OTP is valid, then the controller proceeds with OTP verification and does not reject based on account state.
- **S5-AC5**: Given a POST /api/v1/otp/verify request, when the account state validation logic is called, then it uses the existing account state enum and validation method from the user service or repository without creating new validation logic.
- **IMPACT**: Update existing tests to expect 422 for locked/deleted accounts.
- **IMPACT**: Add new test cases for each account state scenario (locked, deleted, active, pending/unverified).

## Provenance
- **Policy version**: `ace-spec-format/v1`
- **Accepted impact analysis revision**: `1`
- **Accepted impact analysis**: `sha256:1e5dd21f85c165888383c1f37488d55baa6fc41cb55ac95edd321090a1ba8480`
- **Repository baseline commit**: `6c342dc4248be55aeaa6222f8360fba085e07577`