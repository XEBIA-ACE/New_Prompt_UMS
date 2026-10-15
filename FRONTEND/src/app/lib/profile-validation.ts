/*
 * Client-side mirror of BACKEND/src/validators/profile.validator.ts (US-004).
 * The server remains authoritative; this only gives immediate feedback.
 */
import type { EditableProfileField } from "../types/profile.types";

export interface ProfileFormValues {
  displayName: string;
  email: string;
  phoneNumber: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ().-]+$/;
const DISPLAY_NAME_FORBIDDEN = /[<>\u0000-\u001F\u007F]/;

export function validateProfileForm(
  values: ProfileFormValues
): Partial<Record<EditableProfileField, string>> {
  const errors: Partial<Record<EditableProfileField, string>> = {};

  const displayName = values.displayName.trim();
  if (displayName.length > 100) {
    errors.displayName = "Display name must be at most 100 characters.";
  } else if (DISPLAY_NAME_FORBIDDEN.test(displayName)) {
    errors.displayName = "Display name contains characters that are not allowed.";
  }

  const email = values.email.trim();
  if (email.length === 0) {
    errors.email = "Email is required.";
  } else if (email.length > 254) {
    errors.email = "Email must be at most 254 characters.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = values.phoneNumber.trim();
  if (phone.length > 0) {
    const digits = phone.replace(/\D/g, "").length;
    if (!PHONE_PATTERN.test(phone) || digits < 7 || digits > 15) {
      errors.phoneNumber = "Enter a valid phone number (7–15 digits, optional leading +).";
    }
  }

  return errors;
}
