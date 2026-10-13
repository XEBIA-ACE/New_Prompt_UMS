/**
 * otp.errors.ts
 *
 * Custom domain error classes for the OTP Delivery via SMS Feature (F-02).
 * All errors extend the built-in Error class so they are instanceof-compatible
 * with standard JS error handling.
 */

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

export class OtpRateLimitExceededError extends Error {
  public readonly userId: string;

  constructor(userId: string) {
    super(`OTP rate limit exceeded for user '${userId}'.`);
    this.name = 'OtpRateLimitExceededError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpRateLimitExceededError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Account state
// ---------------------------------------------------------------------------

export class OtpForbiddenError extends Error {
  public readonly userId: string;
  public readonly accountStatus: string;

  constructor(userId: string, accountStatus: string) {
    super(`OTP dispatch is forbidden for user '${userId}' with account status '${accountStatus}'.`);
    this.name = 'OtpForbiddenError';
    this.userId = userId;
    this.accountStatus = accountStatus;
    Object.setPrototypeOf(this, OtpForbiddenError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Dispatch failures
// ---------------------------------------------------------------------------

export class OtpDispatchFailedError extends Error {
  public readonly userId: string;

  constructor(userId: string, reason?: string) {
    super(`Failed to dispatch OTP for user '${userId}'${reason ? `: ${reason}` : ''}.`);
    this.name = 'OtpDispatchFailedError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpDispatchFailedError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Verification flow
// ---------------------------------------------------------------------------

export class OtpNotFoundError extends Error {
  public readonly userId: string;

  constructor(userId: string) {
    super(`No active OTP request was found for user '${userId}'.`);
    this.name = 'OtpNotFoundError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpNotFoundError.prototype);
  }
}

export class OtpExpiredError extends Error {
  public readonly userId: string;

  constructor(userId: string) {
    super(`The OTP for user '${userId}' has expired.`);
    this.name = 'OtpExpiredError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpExpiredError.prototype);
  }
}

export class OtpInvalidError extends Error {
  public readonly userId: string;

  constructor(userId: string) {
    super(`The submitted OTP is incorrect for user '${userId}'.`);
    this.name = 'OtpInvalidError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpInvalidError.prototype);
  }
}

/**
 * Raised when the active OTP has been locked because the number of failed
 * verification attempts exceeded OTP_MAX_ATTEMPTS. Mapped to 409 OTP_LOCKED.
 *
 * Requirements: S3-AC4 / FR-004
 */
export class OtpLockedError extends Error {
  public readonly userId: string;

  constructor(userId: string) {
    super(`The OTP for user '${userId}' is locked after too many failed attempts.`);
    this.name = 'OtpLockedError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpLockedError.prototype);
  }
}

/**
 * Raised when OTP verification is attempted for an account that is locked or
 * deleted. Mapped to 422 ACCOUNT_STATE_INVALID.
 *
 * Requirements: S3-AC5 / FR-005
 */
export class OtpAccountStateInvalidError extends Error {
  public readonly userId: string;
  public readonly accountState: string;

  constructor(userId: string, accountState: string) {
    super(`OTP verification is not permitted for user '${userId}' in account state '${accountState}'.`);
    this.name = 'OtpAccountStateInvalidError';
    this.userId = userId;
    this.accountState = accountState;
    Object.setPrototypeOf(this, OtpAccountStateInvalidError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Verification response contract
// ---------------------------------------------------------------------------

/**
 * Machine-readable error codes returned by POST /api/v1/otp/verify.
 *
 * Requirements: S3-AC1..S3-AC5, S3-AC7 / FR-001..FR-005, FR-007
 */
export const OtpVerificationErrorCode = {
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_PASSCODE: 'INVALID_PASSCODE',
  OTP_LOCKED: 'OTP_LOCKED',
  ACCOUNT_STATE_INVALID: 'ACCOUNT_STATE_INVALID',
  OTP_NOT_FOUND: 'OTP_NOT_FOUND',
  OTP_EXPIRED: 'OTP_EXPIRED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type OtpVerificationErrorCode =
  (typeof OtpVerificationErrorCode)[keyof typeof OtpVerificationErrorCode];

export interface OtpVerificationFailure {
  status: number;
  errorCode: OtpVerificationErrorCode;
}

/**
 * Map a domain error raised during OTP verification to its HTTP status and
 * error code. Unknown errors map to 500 INTERNAL_ERROR.
 */
export function mapOtpVerificationError(err: unknown): OtpVerificationFailure {
  if (err instanceof OtpInvalidError) {
    return { status: 422, errorCode: OtpVerificationErrorCode.INVALID_PASSCODE };
  }
  if (err instanceof OtpLockedError) {
    return { status: 409, errorCode: OtpVerificationErrorCode.OTP_LOCKED };
  }
  if (err instanceof OtpAccountStateInvalidError) {
    return { status: 422, errorCode: OtpVerificationErrorCode.ACCOUNT_STATE_INVALID };
  }
  if (err instanceof OtpNotFoundError) {
    return { status: 404, errorCode: OtpVerificationErrorCode.OTP_NOT_FOUND };
  }
  if (err instanceof OtpExpiredError) {
    return { status: 410, errorCode: OtpVerificationErrorCode.OTP_EXPIRED };
  }
  return { status: 500, errorCode: OtpVerificationErrorCode.INTERNAL_ERROR };
}
