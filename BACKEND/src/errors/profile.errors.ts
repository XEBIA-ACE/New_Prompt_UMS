/**
 * profile.errors.ts
 *
 * Domain errors for US-004 (GET/PUT /api/user/profile), following the
 * instanceof-compatible convention of the other *.errors.ts files.
 */

import { ProfileFieldErrors } from '../types/profile.types';

/** PUT body failed field-level validation → 422 PROFILE_VALIDATION_FAILED. */
export class ProfileValidationException extends Error {
  public readonly fieldErrors: ProfileFieldErrors;

  constructor(fieldErrors: ProfileFieldErrors) {
    super('One or more profile fields are invalid.');
    this.name = 'ProfileValidationException';
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, ProfileValidationException.prototype);
  }
}

/** Submitted `version` is stale (concurrent update) → 409 PROFILE_VERSION_CONFLICT. */
export class ProfileVersionConflictException extends Error {
  public readonly currentVersion: number;

  constructor(currentVersion: number) {
    super('The profile was modified since it was last loaded. Reload and try again.');
    this.name = 'ProfileVersionConflictException';
    this.currentVersion = currentVersion;
    Object.setPrototypeOf(this, ProfileVersionConflictException.prototype);
  }
}

/** Requested email belongs to another account → 409 EMAIL_ALREADY_IN_USE. */
export class ProfileEmailAlreadyInUseException extends Error {
  constructor() {
    super('This email address is already in use by another account.');
    this.name = 'ProfileEmailAlreadyInUseException';
    Object.setPrototypeOf(this, ProfileEmailAlreadyInUseException.prototype);
  }
}
