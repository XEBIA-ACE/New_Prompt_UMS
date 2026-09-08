/**
 * otp.service.ts
 *
 * Core OTP generation logic for the Generate Unique OTP feature (US-001).
 *
 * generateAndSend() follows this rule sequence:
 *   1. Load user by id.
 *   2. Unknown user       -> throw OtpUserNotFoundError (mapped to 404 upstream, FR-008).
 *   3. Suspended/deactivated -> throw OtpAccountIneligibleError (mapped to 422 upstream, FR-009).
 *   4. Expire any existing ACTIVE OTP for the same user+purpose (FR-004, EC-001).
 *   5. Generate a cryptographically random numeric code (FR-001, A-003).
 *   6. Hash the code with bcrypt (FR-007).
 *   7. Persist the OTP record with expiry = createdAt + otp.expiry.seconds (FR-003, FR-005).
 *   8. Dispatch the code to the user's email address (FR-006).
 *   9. Report delivery status as `delivered` or `failed` — never surfaces
 *      the plaintext OTP to the caller (FR-007, FR-011).
 *   10. If persistence fails, delivery is NOT attempted (FR-012).
 *
 * Requirements: US-001 FR-001–007, FR-009, FR-011, FR-012
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import type { Database } from 'better-sqlite3';
import { withTransaction } from '../db/with-transaction';
import { IUserRepository } from '../repositories/user.repository';
import { IOtpRequestRepository } from '../repositories/otp-request.repository';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import { OtpSendResult, OtpPurpose } from '../types/otp.types';
import {
  OtpUserNotFoundError,
  OtpAccountIneligibleError,
  OtpPersistenceError,
} from '../errors/otp.errors';
import { otpConfig } from '../config/otp.config';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface OtpService {
  generateAndSend(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<OtpSendResult>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random numeric code of the given length,
 * zero-padded (e.g. length 6 -> "004821").
 *
 * Uses crypto.randomInt which draws from the OS CSPRNG, satisfying
 * FR-001 (cryptographically unpredictable).
 */
function generateNumericCode(length: number): string {
  const upperBoundExclusive = 10 ** length;
  const value = crypto.randomInt(0, upperBoundExclusive);
  return value.toString().padStart(length, '0');
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class DefaultOtpService implements OtpService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpRequestRepository: IOtpRequestRepository,
    private readonly otpDeliveryPort: OtpDeliveryPort,
    private readonly db: Database,
  ) {}

  /**
   * Generate, persist, and dispatch an OTP for the given user and purpose.
   *
   * @throws OtpUserNotFoundError        - user does not exist (FR-008).
   * @throws OtpAccountIneligibleError   - account is suspended/deactivated (FR-009).
   * @throws OtpPersistenceError         - database write failed before delivery (FR-012).
   */
  async generateAndSend(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<OtpSendResult> {
    // Step 1–3: Validate user existence and account state.
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      throw new OtpUserNotFoundError(userId);
    }

    if (user.status === 'suspended' || user.status === 'deleted') {
      throw new OtpAccountIneligibleError(userId, user.status);
    }

    // Step 4: Expire any existing ACTIVE OTP for this user+purpose (FR-004).
    await this.otpRequestRepository.expireActiveByUserAndPurpose(userId, purpose);

    // Steps 5–6: Generate code and hash it.
    const code = generateNumericCode(otpConfig.otpLength);
    const codeHash = await bcrypt.hash(code, otpConfig.bcryptWorkFactor);

    // Step 7: Persist the OTP record (FR-003, FR-005).
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() + otpConfig.otpExpirySeconds * 1000,
    );

    try {
      withTransaction(this.db, () => {
        this.db
          .prepare(
            `INSERT INTO otp_requests
              (id, user_id, email_address, code_hash, status, purpose,
               created_at, expires_at, attempt_sequence)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            crypto.randomUUID(),
            userId,
            user.email,
            codeHash,
            'ACTIVE',
            purpose,
            createdAt.toISOString(),
            expiresAt.toISOString(),
            0,
          );
      });
    } catch (err) {
      const cause = err instanceof Error ? err.message : 'Unknown error';
      throw new OtpPersistenceError(userId, cause);
    }

    // Step 8: Dispatch the code (FR-006).
    const dispatched = await this.otpDeliveryPort.dispatch(user.email, code);

    // Step 9: Report status without revealing the code (FR-007, FR-011).
    return { accepted: true, status: dispatched ? 'delivered' : 'failed' };
  }
}
