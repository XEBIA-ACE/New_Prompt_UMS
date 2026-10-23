/**
 * email-delivery.port.ts
 *
 * Provider-agnostic interface for outbound transactional email.
 * Concrete adapters (e.g. SendGridEmailAdapter) implement this interface.
 *
 * Requirements: US-073 ADR-002, FR-004–005, FR-012
 *               b4b3c394 FR-S4-AC2-001, FR-S4-AC3-001, FR-S4-AC3-002
 */

import { DeliveryResult, EmailRecipient } from '../types/registration.types';

/**
 * Every email template the service sends. Template IDs are resolved from
 * environment configuration (see config/email-template.config.ts) — this
 * enum only names them, so an unknown key is a compile-time error.
 */
export enum EmailTemplate {
  Activation = 'activation',
  Otp = 'otp',
  PasswordRecovery = 'passwordRecovery',
  AccountDeletionRequest = 'accountDeletionRequest',
  AccountDeletionNotice = 'accountDeletionNotice',
  MfaSettingChange = 'mfaSettingChange',
}

/**
 * Provider template ID per EmailTemplate. `null` means the template is not
 * configured; only optional templates (MfaSettingChange) may be null.
 */
export type EmailTemplateIdMap = Readonly<Record<EmailTemplate, string | null>>;

export interface EmailDeliveryPort {
  /**
   * Send a transactional email using a provider template.
   *
   * NEVER throws — returns { success: false, error } on any provider failure.
   *
   * @param recipient    - Destination address and display name
   * @param subject      - Email subject line
   * @param templateId   - Provider-specific template identifier
   * @param templateVars - Dynamic template variable substitutions
   */
  sendTransactional(
    recipient: EmailRecipient,
    subject: string,
    templateId: string,
    templateVars: Record<string, string>,
  ): Promise<DeliveryResult>;
}

/**
 * EmailDeliveryPort extended with the MFA setting-change notification.
 * A separate interface keeps existing EmailDeliveryPort implementers and
 * callers unchanged.
 */
export interface MfaNotificationEmailPort extends EmailDeliveryPort {
  /**
   * Send an MFA setting-change notification using the dedicated
   * EmailTemplate.MfaSettingChange template — never another template.
   *
   * NEVER throws — returns { success: false, error } when the MFA template
   * is not configured or the provider fails.
   */
  sendMfaSettingChangeNotification(
    recipient: EmailRecipient,
    subject: string,
    templateVars: Record<string, string>,
  ): Promise<DeliveryResult>;
}
