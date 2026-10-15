/**
 * profile.config.ts
 *
 * Configuration for US-004 (GET/PUT /api/user/profile): per-user rate limit
 * and the secret used to derive session-bound CSRF tokens.
 */

import crypto from 'crypto';

export interface ProfileConfig {
  rateLimitMaxRequests: number;
  rateLimitWindowSeconds: number;
  /** Never log or expose this value. */
  csrfSecret: string;
}

function parsePositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`Configuration error: ${envKey} must be a positive integer, got '${raw}'.`);
  }
  return parsed;
}

function loadCsrfSecret(): string {
  const raw = process.env.PROFILE_CSRF_SECRET?.trim();
  if (raw) {
    return raw;
  }
  // Per-process fallback: tokens stay valid only for the lifetime of this
  // process (fine for a single replica; set PROFILE_CSRF_SECRET when scaling out).
  if (process.env.NODE_ENV === 'production') {
    console.warn('[ProfileConfig] PROFILE_CSRF_SECRET is not set; using a per-process random secret.');
  }
  return crypto.randomBytes(32).toString('hex');
}

export const profileConfig: ProfileConfig = Object.freeze({
  rateLimitMaxRequests: parsePositiveInt('PROFILE_RATE_LIMIT_MAX_REQUESTS', 60),
  rateLimitWindowSeconds: parsePositiveInt('PROFILE_RATE_LIMIT_WINDOW_SECONDS', 60),
  csrfSecret: loadCsrfSecret(),
});
