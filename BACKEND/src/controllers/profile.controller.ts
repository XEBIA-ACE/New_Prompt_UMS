/**
 * profile.controller.ts
 *
 * US-004 handlers:
 *   GET /api/user/profile → 200 profile + csrfToken
 *   PUT /api/user/profile → 200 updated profile + csrfToken
 *
 * Error mapping:
 *   ProfileValidationException         → 422 PROFILE_VALIDATION_FAILED (+ fieldErrors)
 *   ProfileVersionConflictException    → 409 PROFILE_VERSION_CONFLICT (+ currentVersion)
 *   ProfileEmailAlreadyInUseException  → 409 EMAIL_ALREADY_IN_USE (+ fieldErrors.email)
 *   UserNotFoundException              → 404 USER_NOT_FOUND
 *   unexpected                         → 500
 */

import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { CsrfTokenService } from '../services/csrf-token.service';
import { bearerTokenOf } from '../middleware/profile-security.middleware';
import { validateUpdateProfileBody } from '../validators/profile.validator';
import { UserNotFoundException } from '../errors/registration.errors';
import {
  ProfileEmailAlreadyInUseException,
  ProfileValidationException,
  ProfileVersionConflictException,
} from '../errors/profile.errors';
import { ProfileDetails } from '../types/profile.types';

export function serializeProfile(profile: ProfileDetails, csrfToken: string) {
  return {
    username: profile.username,
    email: profile.email,
    displayName: profile.displayName,
    phoneNumber: profile.phoneNumber,
    status: profile.status,
    registrationTimestamp: profile.registrationTimestamp.toISOString(),
    lastLoginAt: profile.lastLoginAt ? profile.lastLoginAt.toISOString() : null,
    profileUpdatedAt: profile.profileUpdatedAt ? profile.profileUpdatedAt.toISOString() : null,
    version: profile.version,
    csrfToken,
  };
}

export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly csrfTokenService: CsrfTokenService,
  ) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.userId as string;
    try {
      const profile = await this.profileService.getProfile(userId);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(serializeProfile(profile, this.csrfTokenService.issue(bearerTokenOf(req))));
    } catch (err) {
      this.handleError(err, res, 'getProfile');
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.userId as string;
    try {
      const command = validateUpdateProfileBody(req.body);
      const profile = await this.profileService.updateProfile(userId, command);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(serializeProfile(profile, this.csrfTokenService.issue(bearerTokenOf(req))));
    } catch (err) {
      this.handleError(err, res, 'updateProfile');
    }
  }

  private handleError(err: unknown, res: Response, operation: string): void {
    if (err instanceof ProfileValidationException) {
      res.status(422).json({
        error_code: 'PROFILE_VALIDATION_FAILED',
        message: err.message,
        fieldErrors: err.fieldErrors,
      });
    } else if (err instanceof ProfileVersionConflictException) {
      res.status(409).json({
        error_code: 'PROFILE_VERSION_CONFLICT',
        message: err.message,
        currentVersion: err.currentVersion,
      });
    } else if (err instanceof ProfileEmailAlreadyInUseException) {
      res.status(409).json({
        error_code: 'EMAIL_ALREADY_IN_USE',
        message: err.message,
        fieldErrors: { email: err.message },
      });
    } else if (err instanceof UserNotFoundException) {
      res.status(404).json({ error_code: 'USER_NOT_FOUND', message: err.message });
    } else {
      console.error(`[ProfileController] Unexpected error during ${operation}:`, err);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
}
