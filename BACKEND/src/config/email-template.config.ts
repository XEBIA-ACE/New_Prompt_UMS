/**
 * email-template.config.ts
 *
 * Builds the typed EmailTemplate → SendGrid template ID map once at module
 * load, from environment variables (populated by `dotenv/config` in
 * server.ts).
 *
 * The MFA setting-change template is optional at startup: a missing or
 * malformed MFA_SETTING_CHANGE_EMAIL_TEMPLATE_ID is logged as a
 * configuration error and resolves to `null`, so MFA notifications fail in a
 * controlled way while every other email and flow keeps working.
 *
 * Requirements: b4b3c394 FR-S4-AC1-001, FR-S4-AC1-002, FR-S4-AC4-001,
 *               FR-S4-AC5-001, FR-S4-AC5-003
 */

import { appConfig } from './app.config';
import { otpConfig } from './otp.config';
import { accountDeletionConfig } from './account-deletion.config';
import { EmailTemplate, EmailTemplateIdMap } from '../adapters/email-delivery.port';

export const MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY = 'MFA_SETTING_CHANGE_EMAIL_TEMPLATE_ID';

/** SendGrid dynamic template IDs are of the form `d-<id>`. */
const SENDGRID_DYNAMIC_TEMPLATE_ID_PATTERN = /^d-[A-Za-z0-9_-]+$/;

export interface EmailTemplateConfig {
  readonly templateIds: EmailTemplateIdMap;
}

export interface ConfigErrorLogger {
  error(message: string): void;
}

export function readMfaSettingChangeTemplateId(
  env: NodeJS.ProcessEnv,
  logger: ConfigErrorLogger,
): string | null {
  const raw = env[MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY]?.trim();
  if (!raw) {
    logger.error(
      `[EmailTemplateConfig] Configuration error: environment variable '${MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY}' is absent or empty. ` +
        'MFA setting-change notifications will not be sent until it is set; other emails are unaffected.',
    );
    return null;
  }
  if (!SENDGRID_DYNAMIC_TEMPLATE_ID_PATTERN.test(raw)) {
    logger.error(
      `[EmailTemplateConfig] Configuration error: environment variable '${MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY}' is not a valid SendGrid dynamic template ID (expected 'd-...'). ` +
        'MFA setting-change notifications will not be sent until it is fixed; other emails are unaffected.',
    );
    return null;
  }
  return raw;
}

export function loadEmailTemplateConfig(
  env: NodeJS.ProcessEnv = process.env,
  logger: ConfigErrorLogger = console,
): EmailTemplateConfig {
  const templateIds: EmailTemplateIdMap = Object.freeze({
    [EmailTemplate.Activation]: appConfig.sendgridTemplateId,
    [EmailTemplate.Otp]: otpConfig.otpEmailTemplateId,
    [EmailTemplate.PasswordRecovery]: appConfig.passwordRecoveryEmailTemplateId,
    [EmailTemplate.AccountDeletionRequest]: accountDeletionConfig.requestEmailTemplateId,
    [EmailTemplate.AccountDeletionNotice]: accountDeletionConfig.noticeEmailTemplateId,
    [EmailTemplate.MfaSettingChange]: readMfaSettingChangeTemplateId(env, logger),
  });
  return Object.freeze({ templateIds });
}

export const emailTemplateConfig: EmailTemplateConfig = loadEmailTemplateConfig();
