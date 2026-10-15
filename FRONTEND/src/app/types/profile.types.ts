export interface UserProfileResponse {
  username: string;
  email: string;
  status: "pending" | "active" | "suspended" | "deleted";
  registrationTimestamp: string;
  lastLoginAt: string | null;
  activeSessions: number;
}

export interface ProfileErrorResponse {
  error?: string;
  error_code?: "USER_NOT_FOUND";
  message?: string;
}

/* ── US-004: GET/PUT /api/user/profile ─────────────────────────────── */

export interface ProfileDetailsResponse {
  username: string;
  email: string;
  displayName: string | null;
  phoneNumber: string | null;
  status: "pending" | "active" | "suspended" | "deleted";
  registrationTimestamp: string;
  lastLoginAt: string | null;
  profileUpdatedAt: string | null;
  version: number;
  csrfToken: string;
}

export interface UpdateProfileRequest {
  displayName: string | null;
  email: string;
  phoneNumber: string | null;
  version: number;
}

export type EditableProfileField = "displayName" | "email" | "phoneNumber";

export type ProfileFieldErrors = Partial<Record<EditableProfileField | "version" | "body", string>> &
  Record<string, string | undefined>;

export interface UpdateProfileErrorResponse {
  error?: string;
  error_code?:
    | "PROFILE_VALIDATION_FAILED"
    | "PROFILE_VERSION_CONFLICT"
    | "EMAIL_ALREADY_IN_USE"
    | "CSRF_TOKEN_INVALID"
    | "RATE_LIMITED"
    | "USER_NOT_FOUND"
    | "SESSION_INVALID";
  message?: string;
  fieldErrors?: ProfileFieldErrors;
  currentVersion?: number;
}
