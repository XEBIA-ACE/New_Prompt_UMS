/**
 * registration.validator.ts
 *
 * Structural / mandatory-field validation for the registration request.
 * Pure function — zero DB calls, no side effects.
 *
 * Implements FR-001–008, FR-010, FR-012.
 * Phone validation: FR-005 (E.164-derived "+CountryCode-Number" format).
 */

import {
  RegistrationRequestDto,
  RegistrationValidationResult,
  FieldError,
} from '../types/registration.types';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface RegistrationValidator {
  validate(request: RegistrationRequestDto): RegistrationValidationResult;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * RFC 5321-inspired structural pattern (FR-005).
 * Matches: local@domain.tld  where tld is at least 2 alpha characters.
 */
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * E.164-derived phone pattern: "+CountryCode-Number".
 * Starts with "+", followed by 1-3 digit country code, a dash, then 1-14 digits.
 * Total digits (excluding "+") must not exceed 15 (E.164 limit).
 * Implements FR-005.
 */
const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

/**
 * DefaultRegistrationValidator
 *
 * Validation pipeline:
 *  1. Trim all string fields (FR-010).
 *  2. Presence checks on all required fields — collects ALL errors
 *     before returning (FR-007).
 *  3. Only when every presence check passes, run structural checks:
 *     - email format (FR-005)
 *     - phone format (FR-005)
 *     - password === passwordConfirmation (FR-006)
 *  4. Return RegistrationValidationResult with isValid flag (FR-012).
 */
export class DefaultRegistrationValidator implements RegistrationValidator {
  validate(request: RegistrationRequestDto): RegistrationValidationResult {
    const fieldErrors: FieldError[] = [];

    // Step 1 — trim all string fields (FR-010)
    const username = request.username?.trim() ?? '';
    const emailAddress = request.emailAddress?.trim() ?? '';
    const password = request.password?.trim() ?? '';
    const passwordConfirmation = request.passwordConfirmation?.trim() ?? '';
    const phone = request.phone?.trim() ?? '';

    // Step 2 — presence checks (FR-001, FR-002, FR-003, FR-004)
    if (username.length === 0) {
      fieldErrors.push({
        fieldName: 'username',
        errorMessage: 'Username is required.',
      });
    }

    if (emailAddress.length === 0) {
      fieldErrors.push({
        fieldName: 'emailAddress',
        errorMessage: 'Email address is required.',
      });
    }

    if (password.length === 0) {
      fieldErrors.push({
        fieldName: 'password',
        errorMessage: 'Password is required.',
      });
    }

    if (passwordConfirmation.length === 0) {
      fieldErrors.push({
        fieldName: 'passwordConfirmation',
        errorMessage: 'Password confirmation is required.',
      });
    }

    // Step 3 — structural checks only when all presence checks pass (FR-005, FR-006)
    if (fieldErrors.length === 0) {
      // Email format check
      if (!EMAIL_PATTERN.test(emailAddress)) {
        fieldErrors.push({
          fieldName: 'emailAddress',
          errorMessage: 'Invalid email format.',
        });
      }

      // Phone format check (FR-005) — only validate if phone was provided
      if (phone.length > 0 && !PHONE_PATTERN.test(phone)) {
        fieldErrors.push({
          fieldName: 'phone',
          errorMessage: 'Phone must be in +CountryCode-Number format (e.g. +1-5551234567).',
        });
      }

      // Password match check (FR-006)
      if (password !== passwordConfirmation) {
        fieldErrors.push({
          fieldName: 'passwordConfirmation',
          errorMessage: 'Passwords do not match.',
        });
      }
    }

    // Step 4 — build result (FR-012)
    return {
      isValid: fieldErrors.length === 0,
      fieldErrors,
    };
  }
}
