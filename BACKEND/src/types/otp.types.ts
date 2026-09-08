/**
 * otp.types.ts
 *
 * All shared TypeScript interfaces and domain types for the
 * Generate Unique OTP feature (US-001).
 *
 * Requirements: US-001 FR-002, FR-007, FR-011
 */

// ---------------------------------------------------------------------------
// Service request / result DTOs
// ---------------------------------------------------------------------------

/**
 * Input required to generate, persist, and dispatch a new OTP for a user.
 * The raw OTP value is never exposed in response payloads (FR-007).
 */
export interface OtpSendRequest {
  userId: string;
  purpose: OtpPurpose;
}

/**
 * Valid purpose contexts for OTP generation (FR-002).
 */
export type OtpPurpose = 'ACTIVATION' | 'LOGIN' | 'PASSWORD_RECOVERY';

/**
 * Result returned by OtpService.generateAndSend().
 * Never carries the plaintext OTP value (FR-007).
 */
export interface OtpSendResult {
  accepted: boolean;
  status: 'delivered' | 'failed';
}

// ---------------------------------------------------------------------------
// Domain entities
// ---------------------------------------------------------------------------

/**
 * Persisted OTP request record. codeHash stores the bcrypt hash of the OTP;
 * plaintext is NEVER stored.
 *
 * One user MAY have at most one ACTIVE OTP per purpose at any time (FR-004).
 */
export interface OtpRequestEntity {
  id: string;                                       // UUID v4
  userId: string;                                    // FK -> users.id
  emailAddress: string;
  codeHash: string;                                  // bcrypt hash
  status: 'ACTIVE' | 'EXPIRED' | 'CONSUMED';
  purpose: OtpPurpose;
  createdAt: Date;
  expiresAt: Date;
}
