/**
 * otp.controller.ts
 *
 * Entry point for POST /api/v1/otp/send, POST /api/v1/otp/resend, and
 * POST /api/v1/otp/verify.
 *
 * Request body (send/resend): { userId: string }
 * Request body (verify):      { userId: string, passcode: string }
 *
 * Response mapping (send/resend):
 *   accepted (delivered)        -> 202 { status: 'accepted' }
 *   accepted (dispatch failed)  -> 202 { status: 'dispatch_failed' }
 *   OtpForbiddenError           -> 403 OTP_FORBIDDEN
 *   OtpRateLimitExceededError   -> 429 OTP_RATE_LIMIT_EXCEEDED
 *   malformed body              -> 400
 *   unexpected                  -> 500
 *
 * Response mapping (verify) — body is always { outcome, error_code, message, ... }:
 *   success                     -> 200 outcome='success', error_code=null
 *   missing/invalid field       -> 400 MISSING_REQUIRED_FIELD
 *   OtpInvalidError             -> 422 INVALID_PASSCODE
 *   OtpLockedError              -> 409 OTP_LOCKED
 *   OtpAccountStateInvalidError -> 422 ACCOUNT_STATE_INVALID
 *   OtpNotFoundError            -> 404 OTP_NOT_FOUND
 *   OtpExpiredError             -> 410 OTP_EXPIRED
 *   unexpected                  -> 500 INTERNAL_ERROR
 *
 * The plaintext OTP is never returned in any response.
 *
 * Requirements: US-002 FR-011, FR-012, FR-013; US-005 FR-001–012;
 *   S3-AC1..S3-AC7 (story 560cb07c-55f3-542f-a90f-918fd47e5379)
 */

import { Request, Response } from 'express';
import { OtpService } from '../services/otp.service';
import {
  OtpForbiddenError,
  OtpRateLimitExceededError,
  OtpVerificationErrorCode,
  mapOtpVerificationError,
} from '../errors/otp.errors';
import { OtpVerifyFailureBody, OtpVerifySuccessBody } from '../types/otp.types';

const PASSCODE_PATTERN = /^\d{4,8}$/;

export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * Handle POST /api/v1/otp/send
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    await this.handle(req, res, (userId) => this.otpService.sendOtp(userId));
  }

  /**
   * Handle POST /api/v1/otp/resend
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    await this.handle(req, res, (userId) => this.otpService.resendOtp(userId));
  }

  /**
   * Handle POST /api/v1/otp/verify
   *
   * Every response body carries `outcome` and `error_code` (S3-AC7 / FR-007).
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const userId = body.userId;
    const passcode = body.passcode;

    // S3-AC1 / FR-001
    if (typeof userId !== 'string' || userId.trim() === '') {
      this.sendVerifyFailure(res, 400, OtpVerificationErrorCode.MISSING_REQUIRED_FIELD, 'userId is required.');
      return;
    }

    if (typeof passcode !== 'string' || passcode.trim() === '') {
      this.sendVerifyFailure(res, 400, OtpVerificationErrorCode.MISSING_REQUIRED_FIELD, 'passcode is required.');
      return;
    }

    // S3-AC2 / FR-002
    if (!PASSCODE_PATTERN.test(passcode.trim())) {
      this.sendVerifyFailure(
        res,
        400,
        OtpVerificationErrorCode.MISSING_REQUIRED_FIELD,
        'passcode must be a 4-8 digit string.',
      );
      return;
    }

    try {
      const result = await this.otpService.verifyOtp(userId.trim(), passcode.trim());
      // S3-AC6 / FR-006
      const successBody: OtpVerifySuccessBody = {
        outcome: 'success',
        error_code: null,
        message: 'Account activated successfully.',
        userId: result.userId,
        activatedAt: result.activatedAt,
      };
      res.status(200).json(successBody);
    } catch (err) {
      // S3-AC3, S3-AC4, S3-AC5 / FR-003, FR-004, FR-005
      const failure = mapOtpVerificationError(err);
      if (failure.errorCode === OtpVerificationErrorCode.INTERNAL_ERROR) {
        console.error('[OtpController] Unexpected error during verification:', err);
        this.sendVerifyFailure(
          res,
          failure.status,
          failure.errorCode,
          'An unexpected error occurred while verifying the OTP.',
        );
        return;
      }
      this.sendVerifyFailure(res, failure.status, failure.errorCode, (err as Error).message);
    }
  }

  private sendVerifyFailure(
    res: Response,
    status: number,
    errorCode: OtpVerificationErrorCode,
    message: string,
  ): void {
    const failureBody: OtpVerifyFailureBody = { outcome: 'failure', error_code: errorCode, message };
    res.status(status).json(failureBody);
  }

  private async handle(
    req: Request,
    res: Response,
    invoke: (userId: string) => ReturnType<OtpService['sendOtp']>,
  ): Promise<void> {
    const userId = req.body.userId as string | undefined;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      res.status(400).json({ error: 'userId is required.' });
      return;
    }

    try {
      const result = await invoke(userId.trim());
      res.status(202).json({
        status: result.status === 'delivered' ? 'accepted' : 'dispatch_failed',
      });
    } catch (err) {
      if (err instanceof OtpForbiddenError) {
        res.status(403).json({ errorCode: 'OTP_FORBIDDEN', message: err.message });
        return;
      }

      if (err instanceof OtpRateLimitExceededError) {
        res.status(429).json({ errorCode: 'OTP_RATE_LIMIT_EXCEEDED', message: err.message });
        return;
      }

      console.error('[OtpController] Unexpected error:', err);
      res.status(500).json({ error: 'An unexpected error occurred while processing the OTP request.' });
    }
  }
}
