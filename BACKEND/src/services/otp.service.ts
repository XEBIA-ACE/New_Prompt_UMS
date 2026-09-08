/**
 * otp.service.ts
 *
 * Core OTP issuance logic for send and resend flows (US-002).
 *
 * sendOtp / resendOtp share identical rules:
 *   1. Load user by id.
 *   2. Unknown user       -> return an accepted result without disclosure.
 *   3. Inactive/suspended -> throw OtpForbiddenError (mapped to 403 upstream).
 *   4. Rate limit exceeded -> throw OtpRateLimitExceededError (mapped to 429).
 *   5. Invalidate any existing active OTP for the user.
 *   6. Generate a numeric OTP and hash it with a keyed HMAC before persisting.
 *   7. Persist the OTP request with expiry = createdAt + OTP_TTL_MINUTES.
 *   8. Dispatch the code to the user's email address.
 *   9. Record delivery status as `delivered` or `failed` based on the
 *      provider outcome, but always report `accepted: true` to the caller —
 *      dispatch failure is tracked for observability, not surfaced as an error.
 *
 * resendOtp (US-009 / S-101) — distinct re-request flow:
 *   1. Locate existing active OTP session by identity_handle (email).
 *   2. No session found -> throw OtpSessionNotFoundError (mapped to 404).
 *   3. Account already activated -> throw OtpAccountActivatedError (mapped to 409).
 *   4. Rate limit exceeded (3 per 10-min window) -> throw
 *      OtpRateLimitExceededError (mapped to 429).
 *   5. Invalidate the prior OTP row (FR-002).
 *   6. Generate a new OTP and hash it with a keyed HMAC.
 *   7. Create a new OTP request row, carrying forward the prior resend_count + 1
 *      and resetting attemptSequence to 0 (FR-011, FR-012).
 *   8. Dispatch the code to the OTP session's delivery address (FR-004).
 *   9. Return { accepted, resendCount } to the caller (FR-008).
 *
 * Requirements: US-002 FR-002, FR-003, FR-004, FR-005, FR-006, FR-009, FR-010
 *               US-009 FR-001, FR-002, FR-003, FR-004, FR-005, FR-006,
 *               FR-007, FR-008, FR-009, FR-010, FR-011, FR-012
 */

import crypto from 'crypto';
import type { Database } from 'better-sqlite3';
import { withTransaction } from '../db/with-transaction';
import { IUserRepository } from '../repositories/user.repository';
import { IOtpRequestRepository } from '../repositories/otp-request.repository';
import { RateLimitGuard } from './rate-limit.guard';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import { OtpDispatchResult } from '../types/otp.types';
import {
  OtpForbiddenError,
  OtpRateLimitExceededError,
  OtpNotFoundError,
  OtpExpiredError,
  OtpInvalidError,
  OtpSessionNotFoundError,
  OtpAccountActivatedError,
} from '../errors/otp.errors';
import { otpConfig } from '../config/otp.config';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface OtpVerifyResult {
  userId: string;
  activatedAt: Date;
}

/**
 * Result returned by resendOtp (US-009 / S-101).
 * The OTP value is never exposed to the caller (FR-008).
 */
export interface OtpResendResult {
  accepted: boolean;
  resendCount: number;
}

export interface OtpService {
  sendOtp(userId: string): Promise<OtpDispatchResult>;
  resendOtp(identityHandle: string): Promise<OtpResendResult>;
  verifyOtp(userId: string, passcode: string): Promise<OtpVerifyResult>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random numeric code of the given length,
 * zero-padded (e.g. length 6 -> "004821").
 */
function generateNumericCode(length: number): string {
  const upperBoundExclusive = 10 ** length;
  const value = crypto.randomInt(0, upperBoundExclusive);
  return value.toString().padStart(length, '0');
}

/**
 * Hash a plaintext OTP code with a keyed HMAC so the persisted value is
 * non-reversible. Plaintext is never stored.
 */
function hashOtpCode(code: string): string {
  return crypto
    .createHmac(otpConfig.otpHashAlgorithm, otpConfig.otpHashSecret)
    .update(code)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class DefaultOtpService implements OtpService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpRequestRepository: IOtpRequestRepository,
    private readonly rateLimitGuard: RateLimitGuard,
    /**
     * Separate rate-limit guard for the re-request flow (US-009).
     * Uses tighter limits (3 per 10 min) than the general OTP send guard.
     */
    private readonly reRequestRateLimitGuard: RateLimitGuard,
    private readonly otpDeliveryPort: OtpDeliveryPort,
    private readonly db: Database,
  ) {}

  async sendOtp(userId: string): Promise<OtpDispatchResult> {
    return this.issueOtp(userId);
  }

  /**
   * Resend an OTP for an existing session (US-009 / S-101).
   *
   * This is a distinct flow from sendOtp — it resolves the user by identity
   * handle (email), validates eligibility, invalidates the prior OTP, issues
   * a replacement, and returns the updated resend_count.
   *
   * @throws OtpSessionNotFoundError     - no active OTP session found (→ 404).
   * @throws OtpAccountActivatedError    - account already activated (→ 409).
   * @throws OtpRateLimitExceededError   - re-request rate limit exceeded (→ 429).
   */
  async resendOtp(identityHandle: string): Promise<OtpResendResult> {
    // Step 1: Locate existing active OTP session by email (FR-001, A-001).
    const priorSession = await this.otpRequestRepository.findActiveByEmail(identityHandle);

    if (priorSession === null) {
      // FR-006: no prior session exists.
      throw new OtpSessionNotFoundError(identityHandle);
    }

    // Step 2: Resolve the user account to check activation status (FR-005).
    const user = await this.userRepository.findById(priorSession.userId);
    if (user === null) {
      // User was deleted but orphaned OTP row still exists — treat as no session.
      throw new OtpSessionNotFoundError(identityHandle);
    }

    if (user.status === 'active') {
      throw new OtpAccountActivatedError(identityHandle);
    }

    // Step 3: Enforce re-request rate limit — 3 per 10-minute window (FR-007, A-004).
    const allowed = await this.reRequestRateLimitGuard.allow(identityHandle);
    if (!allowed) {
      throw new OtpRateLimitExceededError(identityHandle);
    }

    // Step 4: Invalidate the prior OTP row (FR-002).
    await this.otpRequestRepository.invalidateActiveByUserId(priorSession.userId);

    // Step 5: Generate a new OTP and hash it (FR-003).
    const code = generateNumericCode(otpConfig.otpLength);
    const codeHash = hashOtpCode(code);

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + otpConfig.otpTtlMinutes * 60 * 1000);

    // Step 6: Create new OTP row carrying forward resend_count + 1, resetting
    // attempt_sequence to 0 (FR-011, FR-012).
    const newResendCount = priorSession.resendCount + 1;
    const request = await this.otpRequestRepository.create({
      userId: priorSession.userId,
      emailAddress: priorSession.emailAddress, // FR-004, A-002
      codeHash,
      status: 'pending',
      createdAt,
      expiresAt,
      invalidatedAt: null,
      attemptSequence: 0, // FR-012: reset on new OTP
      resendCount: newResendCount,
    });

    // Step 7: Dispatch to the OTP session's delivery address (FR-004, FR-010).
    const dispatchSucceeded = await this.otpDeliveryPort.dispatch(
      priorSession.emailAddress,
      code,
    );

    if (dispatchSucceeded) {
      await this.otpRequestRepository.markDelivered(request.id);
    } else {
      await this.otpRequestRepository.markFailed(request.id);
    }

    // Step 8: Return confirmation without revealing the OTP value (FR-008).
    return { accepted: true, resendCount: newResendCount };
  }

  /**
   * Verify a submitted OTP code and, on success, activate the user's account.
   *
   * @throws OtpNotFoundError - no active (non-invalidated) OTP exists for the user.
   * @throws OtpExpiredError  - the active OTP's expiry has passed.
   * @throws OtpInvalidError  - the submitted code does not match.
   */
  async verifyOtp(userId: string, passcode: string): Promise<OtpVerifyResult> {
    const user = await this.userRepository.findById(userId);
    if (user === null || (user.status !== 'pending' && user.status !== 'active')) {
      throw new OtpNotFoundError(userId);
    }

    const request = await this.otpRequestRepository.findActiveByUserId(userId);
    if (request === null) {
      throw new OtpNotFoundError(userId);
    }

    if (new Date() > request.expiresAt) {
      throw new OtpExpiredError(userId);
    }

    const submittedHash = Buffer.from(hashOtpCode(passcode));
    const storedHash = Buffer.from(request.codeHash);
    const matches =
      submittedHash.length === storedHash.length &&
      crypto.timingSafeEqual(submittedHash, storedHash);

    if (!matches) {
      throw new OtpInvalidError(userId);
    }

    const activatedAt = new Date();
    await withTransaction(this.db, () => {
      this.db
        .prepare(`UPDATE users SET status = 'active', activated_at = ? WHERE id = ?`)
        .run(activatedAt.toISOString(), userId);

      this.db
        .prepare(`UPDATE otp_requests SET invalidated_at = ? WHERE id = ?`)
        .run(activatedAt.toISOString(), request.id);
    });

    return { userId, activatedAt };
  }

  /**
   * Shared send/resend implementation — see file-level doc comment for the
   * full rule sequence.
   *
   * @throws OtpForbiddenError         - account is not active.
   * @throws OtpRateLimitExceededError - too many attempts within the window.
   */
  private async issueOtp(userId: string): Promise<OtpDispatchResult> {
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      // Never disclose whether a given user id exists.
      return { accepted: true, status: 'delivered' };
    }

    // Both freshly-registered ('pending') and already-verified ('active')
    // accounts may request an OTP — 'pending' covers post-registration
    // activation, 'active' covers any future login step-up/re-verification use.
    if (user.status !== 'active' && user.status !== 'pending') {
      throw new OtpForbiddenError(userId, user.status);
    }

    const allowed = await this.rateLimitGuard.allow(userId);
    if (!allowed) {
      throw new OtpRateLimitExceededError(userId);
    }

    await this.otpRequestRepository.invalidateActiveByUserId(userId);

    const code = generateNumericCode(otpConfig.otpLength);
    const codeHash = hashOtpCode(code);

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + otpConfig.otpTtlMinutes * 60 * 1000);
    const attemptSequence = await this.otpRequestRepository.getNextAttemptSequence(userId);

    const request = await this.otpRequestRepository.create({
      userId,
      emailAddress: user.email,
      codeHash,
      status: 'pending',
      createdAt,
      expiresAt,
      invalidatedAt: null,
      attemptSequence,
      resendCount: 0,
    });

    const dispatchSucceeded = await this.otpDeliveryPort.dispatch(user.email, code);

    if (dispatchSucceeded) {
      await this.otpRequestRepository.markDelivered(request.id);
      return { accepted: true, status: 'delivered' };
    }

    await this.otpRequestRepository.markFailed(request.id);
    return { accepted: true, status: 'failed' };
  }
}
