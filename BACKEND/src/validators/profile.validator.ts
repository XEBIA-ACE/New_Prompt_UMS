/**
 * profile.validator.ts
 *
 * Validates and sanitises the PUT /api/user/profile body (US-004).
 *
 * Rules:
 *   - body must be a JSON object containing only: displayName, email,
 *     phoneNumber, version (read-only fields such as username/status/userId
 *     are rejected, which also prevents targeting another user's record)
 *   - displayName: optional (null/"" clears it); trimmed; 1–100 chars;
 *     no control characters or angle brackets
 *   - email: required; trimmed; <= 254 chars; same format rule as registration
 *   - phoneNumber: optional (null/"" clears it); trimmed; digits with optional
 *     leading "+" and space/()/- separators; 7–15 digits (E.164 maximum)
 *   - version: required positive integer (optimistic-locking token)
 */

import { DefaultEmailValidator } from './email.validator';
import { ProfileValidationException } from '../errors/profile.errors';
import { ProfileFieldErrors, UpdateProfileCommand } from '../types/profile.types';

export const DISPLAY_NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

const ALLOWED_KEYS = new Set(['displayName', 'email', 'phoneNumber', 'version']);
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const ANGLE_BRACKETS = /[<>]/;
const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]*[0-9]$/;

const emailValidator = new DefaultEmailValidator();

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(
  raw: unknown,
  field: string,
  errors: ProfileFieldErrors,
): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw !== 'string') {
    errors[field] = 'Must be a string or null.';
    return null;
  }
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

export function validateUpdateProfileBody(body: unknown): UpdateProfileCommand {
  if (!isPlainObject(body)) {
    throw new ProfileValidationException({ body: 'Request body must be a JSON object.' });
  }

  const errors: ProfileFieldErrors = {};

  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors[key] = 'Unknown or read-only field.';
    }
  }

  // displayName
  const displayName = optionalText(body.displayName, 'displayName', errors);
  if (displayName !== null) {
    if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
      errors.displayName = `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters.`;
    } else if (CONTROL_CHARS.test(displayName) || ANGLE_BRACKETS.test(displayName)) {
      errors.displayName = 'Display name contains characters that are not allowed.';
    }
  }

  // email
  let email = '';
  if (typeof body.email !== 'string' || body.email.trim() === '') {
    errors.email = 'Email is required.';
  } else {
    email = body.email.trim();
    if (email.length > EMAIL_MAX_LENGTH) {
      errors.email = `Email must be at most ${EMAIL_MAX_LENGTH} characters.`;
    } else {
      try {
        emailValidator.validateFormat(email);
      } catch {
        errors.email = 'Enter a valid email address.';
      }
    }
  }

  // phoneNumber
  const phoneNumber = optionalText(body.phoneNumber, 'phoneNumber', errors);
  if (phoneNumber !== null) {
    const digitCount = phoneNumber.replace(/[^0-9]/g, '').length;
    if (
      !PHONE_PATTERN.test(phoneNumber) ||
      digitCount < PHONE_MIN_DIGITS ||
      digitCount > PHONE_MAX_DIGITS
    ) {
      errors.phoneNumber = `Enter a valid phone number (${PHONE_MIN_DIGITS}–${PHONE_MAX_DIGITS} digits, optional leading +).`;
    }
  }

  // version
  const version = body.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    errors.version = 'Version is required and must be a positive integer.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ProfileValidationException(errors);
  }

  return { displayName, email, phoneNumber, version: version as number };
}
