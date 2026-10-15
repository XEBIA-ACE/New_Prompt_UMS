/**
 * profile.types.ts
 *
 * Types backing the US-004 profile contract:
 *   GET /api/user/profile  — view the caller's own profile
 *   PUT /api/user/profile  — replace the caller's editable profile attributes
 *   user.profile.updated   — domain event published on a successful update
 */

/** Attributes the owner may edit via PUT /api/user/profile. */
export interface EditableProfileFields {
  displayName: string | null;
  email: string;
  phoneNumber: string | null;
}

export type EditableProfileField = keyof EditableProfileFields;

export const EDITABLE_PROFILE_FIELDS: readonly EditableProfileField[] = [
  'displayName',
  'email',
  'phoneNumber',
];

/** Full profile view: editable attributes plus read-only account metadata. */
export interface ProfileDetails extends EditableProfileFields {
  userId: string;
  username: string;
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  registrationTimestamp: Date;
  lastLoginAt: Date | null;
  profileUpdatedAt: Date | null;
  version: number;
}

/** Validated PUT /api/user/profile body. */
export interface UpdateProfileCommand extends EditableProfileFields {
  /** Optimistic-locking token — must equal the version the client last read. */
  version: number;
}

export type ProfileFieldErrors = Partial<Record<string, string>>;

export const USER_PROFILE_UPDATED_TOPIC = 'user.profile.updated';

/** Payload of the `user.profile.updated` event. Carries field names only, never values. */
export interface UserProfileUpdatedEvent {
  eventId: string;
  topic: typeof USER_PROFILE_UPDATED_TOPIC;
  occurredAt: string;
  userId: string;
  profileVersion: number;
  changedFields: EditableProfileField[];
}

export type ProfileAuditAction = 'profile.viewed' | 'profile.updated';
