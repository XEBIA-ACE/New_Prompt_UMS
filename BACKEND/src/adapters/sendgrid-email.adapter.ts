/**
 * sendgrid-email.adapter.ts
 *
 * Concrete implementation of EmailDeliveryPort that wraps @sendgrid/mail.
 *
 * Design rules:
 *  - NEVER throws — all SendGrid errors are caught and returned as
 *    { success: false, error: <message> }
 *  - sendgridApiKey is sourced from appConfig and is NEVER logged
 *
 *  - MFA setting-change notifications always use the dedicated
 *    EmailTemplate.MfaSettingChange template ID resolved once at
 *    construction; a missing ID is a logged configuration error, never a
 *    fallback to another template.
 *
 * Requirements: US-073 FR-004–005, FR-012
 *               b4b3c394 FR-S4-AC2-001, FR-S4-AC2-002, FR-S4-AC5-001, FR-S4-AC5-002
 */

import sgMail from '@sendgrid/mail';
import { EmailTemplate, MfaNotificationEmailPort } from './email-delivery.port';
import { DeliveryResult, EmailRecipient } from '../types/registration.types';
import { appConfig } from '../config/app.config';
import {
  EmailTemplateConfig,
  MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY,
  emailTemplateConfig,
} from '../config/email-template.config';

export const MFA_TEMPLATE_NOT_CONFIGURED_ERROR = 'MFA_SETTING_CHANGE_TEMPLATE_NOT_CONFIGURED';

export class SendGridEmailAdapter implements MfaNotificationEmailPort {
  constructor(private readonly templateConfig: EmailTemplateConfig = emailTemplateConfig) {
    // Configure SendGrid client once at construction time.
    // The key is read from appConfig — never logged or exposed.
    sgMail.setApiKey(appConfig.sendgridApiKey);
  }

  async sendTransactional(
    recipient: EmailRecipient,
    subject: string,
    templateId: string,
    templateVars: Record<string, string>,
  ): Promise<DeliveryResult> {
    try {
      const [response] = await sgMail.send({
        to: { email: recipient.address, name: recipient.name },
        from: { email: appConfig.fromEmail, name: appConfig.fromName },
        subject,
        templateId,
        dynamicTemplateData: templateVars,
      });

      // SendGrid returns 202 Accepted on success
      const messageId = (response.headers['x-message-id'] as string | undefined) ?? undefined;
      return { success: true, messageId };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown SendGrid error';
      // Log a structured error — but NEVER log the API key
      console.error('[SendGridEmailAdapter] Delivery failed:', {
        recipient: recipient.address,
        templateId,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }

  async sendMfaSettingChangeNotification(
    recipient: EmailRecipient,
    subject: string,
    templateVars: Record<string, string>,
  ): Promise<DeliveryResult> {
    const templateId = this.templateConfig.templateIds[EmailTemplate.MfaSettingChange];
    if (templateId === null) {
      console.error(
        `[SendGridEmailAdapter] MFA setting-change notification not sent: '${MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY}' is not configured.`,
        { recipient: recipient.address },
      );
      return { success: false, error: MFA_TEMPLATE_NOT_CONFIGURED_ERROR };
    }
    return this.sendTransactional(recipient, subject, templateId, templateVars);
  }
}
