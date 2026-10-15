/**
 * profile-security.middleware.ts
 *
 * Request guards for US-004 /api/user/profile. Both run AFTER
 * SessionValidationMiddleware (they rely on req.userId and the Bearer token).
 *
 *  - createUserRateLimitMiddleware: fixed-window per-user counter in Redis
 *    (`profile:rl:{userId}`) → 429 RATE_LIMITED + Retry-After. Fails open
 *    (logs and allows) if Redis is unreachable, so a cache outage does not
 *    take the profile page down.
 *  - createCsrfProtectionMiddleware: requires `X-CSRF-Token` to match the
 *    token bound to the caller's session → 403 CSRF_TOKEN_INVALID.
 */

import { Request, Response, NextFunction } from 'express';
import type { Redis } from 'ioredis';
import { CsrfTokenService } from '../services/csrf-token.service';

export const CSRF_HEADER = 'x-csrf-token';

export function bearerTokenOf(req: Request): string {
  return (req.header('authorization') ?? '').slice('Bearer '.length).trim();
}

export function createUserRateLimitMiddleware(
  redis: Redis,
  keyPrefix: string,
  maxRequests: number,
  windowSeconds: number,
) {
  return async function userRateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const key = `${keyPrefix}:${req.userId as string}`;
    let count: number;
    try {
      count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
    } catch (err) {
      console.error('[UserRateLimitMiddleware] Redis unavailable; allowing request.', {
        key,
        error: err instanceof Error ? err.message : String(err),
      });
      next();
      return;
    }

    if (count > maxRequests) {
      res.setHeader('Retry-After', String(windowSeconds));
      res.status(429).json({ error_code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' });
      return;
    }
    next();
  };
}

export function createCsrfProtectionMiddleware(csrfTokenService: CsrfTokenService) {
  return function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!csrfTokenService.verify(bearerTokenOf(req), req.header(CSRF_HEADER))) {
      res.status(403).json({ error_code: 'CSRF_TOKEN_INVALID', message: 'Missing or invalid CSRF token.' });
      return;
    }
    next();
  };
}
