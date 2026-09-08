/**
 * otp.errors.ts
 *
 * Custom domain error classes for the Generate Unique OTP feature (US-001).
 * All errors extend the built-in Error class so they are instanceof-compatible
 * with standard JS error handling.
 *
 * Requirements: US-001 FR-008, FR-009
 */

// ---------------------------------------------------------------------------
// User not found (FR-008)
// ---------------------------------------------------------------------------

export class OtpUserNotFoundError extends Error {
  public readonly userId: string;

  constructor(userId: string) {
    super(`User '${userId}' not found.`);
    this.name = 'OtpUserNotFoundError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpUserNotFoundError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Account ineligible — suspended or deactivated (FR-009)
// ---------------------------------------------------------------------------

export class OtpAccountIneligibleError extends Error {
  public readonly userId: string;
  public readonly accountStatus: string;

  constructor(userId: string, accountStatus: string) {
    super(`OTP generation is not allowed for user '${userId}' with account status '${accountStatus}'.`);
    this.name = 'OtpAccountIneligibleError';
    this.userId = userId;
    this.accountStatus = accountStatus;
    Object.setPrototypeOf(this, OtpAccountIneligibleError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Persistence failure — delivery must NOT be attempted (FR-012)
// ---------------------------------------------------------------------------

export class OtpPersistenceError extends Error {
  public readonly userId: string;

  constructor(userId: string, cause?: string) {
    super(`Failed to persist OTP for user '${userId}'${cause ? `: ${cause}` : ''}.`);
    this.name = 'OtpPersistenceError';
    this.userId = userId;
    Object.setPrototypeOf(this, OtpPersistenceError.prototype);
  }
}
