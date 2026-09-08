/**
 * otp.config.ts
 *
 * Loads OTP-feature configuration from environment variables and exports a
 * strongly-typed `otpConfig` object.
 *
 * Requirements: US-001 FR-003, A-001
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OtpConfig {
  /** Fixed length of the numeric passcode (A-003, assumed 6). */
  otpLength: number;
  /** OTP validity window in seconds (A-001, not client-supplied). */
  otpExpirySeconds: number;
  /** OTP validity window in minutes — legacy alias for account-deletion.config.ts. */
  otpTtlMinutes: number;
  /** bcrypt work factor for hashing OTP codes. */
  bcryptWorkFactor: number;
  /** HMAC algorithm for legacy hashing (used by account-deletion.service.ts). */
  otpHashAlgorithm: string;
  /** HMAC secret for legacy hashing (used by account-deletion.service.ts). */
  otpHashSecret: string;
  /** Max OTP attempts per rate-limit window. */
  otpMaxAttemptsPerWindow: number;
  /** Rate-limit window in minutes. */
  otpRateLimitWindowMinutes: number;
  /** Gates whether OtpDeliveryPort actually dispatches (read from SMS_PROVIDER_ENABLED for continuity with task 1; delivery is via email). */
  otpDeliveryEnabled: boolean;
  redisUrl: string;
  otpEmailTemplateId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(
      `Configuration error: ${envKey} must be an integer, got '${raw}'.`,
    );
  }
  return parsed;
}

function parseBoolean(envKey: string, defaultValue: boolean): boolean {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  return raw.trim().toLowerCase() === 'true';
}

function requireEnvString(envKey: string): string {
  const value = process.env[envKey];
  if (!value || value.trim() === '') {
    throw new Error(
      `Configuration error: required environment variable '${envKey}' is absent or empty.`,
    );
  }
  return value.trim();
}

// ---------------------------------------------------------------------------
// Load values
// ---------------------------------------------------------------------------

const otpLength = parsePositiveInt('OTP_LENGTH', 6);
const otpExpirySeconds = parsePositiveInt('OTP_EXPIRY_SECONDS', 300);
const otpTtlMinutes = Math.max(1, Math.ceil(otpExpirySeconds / 60));
const bcryptWorkFactor = parsePositiveInt('OTP_BCRYPT_WORK_FACTOR', 10);
const otpHashAlgorithm = process.env.OTP_HASH_ALGORITHM?.trim() || 'sha256';
const otpHashSecret = process.env.OTP_HASH_SECRET || 'default-otp-secret';
const otpMaxAttemptsPerWindow = parsePositiveInt('OTP_MAX_ATTEMPTS_PER_WINDOW', 5);
const otpRateLimitWindowMinutes = parsePositiveInt('OTP_RATE_LIMIT_WINDOW_MINUTES', 15);
const otpDeliveryEnabled = parseBoolean('SMS_PROVIDER_ENABLED', true);
const redisUrl = process.env.REDIS_URL?.trim() || 'redis://localhost:6379';
const otpEmailTemplateId = requireEnvString('OTP_EMAIL_TEMPLATE_ID');

// ---------------------------------------------------------------------------
// Exported config object
// ---------------------------------------------------------------------------

export const otpConfig: OtpConfig = Object.freeze({
  otpLength,
  otpExpirySeconds,
  otpTtlMinutes,
  bcryptWorkFactor,
  otpHashAlgorithm,
  otpHashSecret,
  otpMaxAttemptsPerWindow,
  otpRateLimitWindowMinutes,
  otpDeliveryEnabled,
  redisUrl,
  otpEmailTemplateId,
});
