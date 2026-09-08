/**
 * otp.controller.ts
 *
 * Entry point for POST /api/v1/otp/send.
 *
 * Request body: { userId: string, purpose: string }
 *
 * Response mapping:
 *   accepted (delivered)        -> 202 { message, status: 'accepted' }
 *   accepted (dispatch failed)  -> 202 { message, status: 'dispatch_failed' }
 *   OtpUserNotFoundError        -> 404 OTP_USER_NOT_FOUND (FR-008)
 *   OtpAccountIneligibleError   -> 422 OTP_ACCOUNT_INELIGIBLE (FR-009)
 *   OtpPersistenceError         -> 500 (FR-012)
 *   malformed body              -> 400
 *   unexpected                  -> 500
 *
 * The plaintext OTP is never returned in any response (FR-007).
 *
 * Requirements: US-001 FR-007, FR-008, FR-009, FR-011, FR-012
 */

import { Request, Response } from 'express';
import { OtpService } from '../services/otp.service';
import type { OtpPurpose } from '../types/otp.types';
import {
  OtpUserNotFoundError,
  OtpAccountIneligibleError,
  OtpPersistenceError,
} from '../errors/otp.errors';

export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * Handle POST /api/v1/otp/send
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    const userId = req.body.userId as string | undefined;
    const purpose = req.body.purpose as string | undefined;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      res.status(400).json({ error: 'userId is required.' });
      return;
    }

    if (!purpose || typeof purpose !== 'string' || purpose.trim() === '') {
      res.status(400).json({ error: 'purpose is required.' });
      return;
    }

    const validatedPurpose = purpose.trim() as OtpPurpose;

    try {
      const result = await this.otpService.generateAndSend(
        userId.trim(),
        validatedPurpose,
      );

      res.status(202).json({
        message: 'OTP generation and delivery have been initiated.',
        status: result.status === 'delivered' ? 'accepted' : 'dispatch_failed',
      });
    } catch (err) {
      if (err instanceof OtpUserNotFoundError) {
        res.status(404).json({
          errorCode: 'OTP_USER_NOT_FOUND',
          message: err.message,
        });
        return;
      }

      if (err instanceof OtpAccountIneligibleError) {
        res.status(422).json({
          errorCode: 'OTP_ACCOUNT_INELIGIBLE',
          message: err.message,
        });
        return;
      }

      if (err instanceof OtpPersistenceError) {
        res.status(500).json({
          errorCode: 'OTP_PERSISTENCE_ERROR',
          message: err.message,
        });
        return;
      }

      console.error('[OtpController] Unexpected error:', err);
      res.status(500).json({ error: 'An unexpected error occurred while processing the OTP request.' });
    }
  }
}
