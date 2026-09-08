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
// Re-request (US-009) errors
// ---------------------------------------------------------------------------

export class OtpSessionNotFoundError extends Error {
  public readonly identityHandle: string;

  constructor(identityHandle: string) {
    super(`No active OTP session was found for '${identityHandle}'.`);
    this.name = 'OtpSessionNotFoundError';
    this.identityHandle = identityHandle;
    Object.setPrototypeOf(this, OtpSessionNotFoundError.prototype);
  }
}

export class OtpAccountActivatedError extends Error {
  public readonly identityHandle: string;

  constructor(identityHandle: string) {
    super(`OTP re-request is not allowed for an already activated account.`);
    this.name = 'OtpAccountActivatedError';
    this.identityHandle = identityHandle;
    Object.setPrototypeOf(this, OtpAccountActivatedError.prototype);
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
