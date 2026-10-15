/**
 * profile.routes.ts
 *
 * US-004 router, mounted by app.ts at /api/user:
 *   GET /profile  session → rate limit → handler
 *   PUT /profile  session → rate limit → CSRF → handler
 *
 * There is deliberately no user-id path/body parameter: the target profile is
 * always the session's own user (self-only scope).
 */

import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import type { Redis } from 'ioredis';
import { SessionService } from '../services/session.service';
import { DefaultProfileService } from '../services/profile.service';
import { HmacCsrfTokenService } from '../services/csrf-token.service';
import { ProfileRepository } from '../repositories/profile.repository';
import { ProfileController } from '../controllers/profile.controller';
import { createSessionValidationMiddleware } from '../middleware/session-validation.middleware';
import {
  createCsrfProtectionMiddleware,
  createUserRateLimitMiddleware,
} from '../middleware/profile-security.middleware';
import { profileConfig } from '../config/profile.config';

export function createProfileRouter(db: Database, redis: Redis, sessionService: SessionService): Router {
  const router = Router();

  const csrfTokenService = new HmacCsrfTokenService(profileConfig.csrfSecret);
  const controller = new ProfileController(
    new DefaultProfileService(db, new ProfileRepository(db)),
    csrfTokenService,
  );

  const requireSession = createSessionValidationMiddleware(sessionService);
  const rateLimit = createUserRateLimitMiddleware(
    redis,
    'profile:rl',
    profileConfig.rateLimitMaxRequests,
    profileConfig.rateLimitWindowSeconds,
  );
  const requireCsrf = createCsrfProtectionMiddleware(csrfTokenService);

  router.get('/profile', requireSession, rateLimit, (req, res) => {
    void controller.getProfile(req, res);
  });

  router.put('/profile', requireSession, rateLimit, requireCsrf, (req, res) => {
    void controller.updateProfile(req, res);
  });

  return router;
}
