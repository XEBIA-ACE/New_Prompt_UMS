/**
 * email-otp-delivery.adapter.ts
 *
 * Concrete OtpDeliveryPort implementation that dispatches OTP codes via the
 * existing EmailDeliveryPort / SendGridEmailAdapter, reusing the same
 * transactional-email infrastructure as the registration feature.
 *
 * Delivery is via email rather than SMS for this deployment.
 *
 * Design rules:
 *  - NEVER throws — provider-level failures are converted to `false`.
 *  - Respects OTP_DELIVERY_ENABLED (env: SMS_PROVIDER_ENABLED) so local/dev
 *    environments can no-op dispatch without needing provider credentials.
 *
 * Requirements: US-001 FR-006, FR-007
 */

import { OtpDeliveryPort } from './otp-delivery.port';
import { EmailDeliveryPort } from './email-delivery.port';
import { otpConfig } from '../config/otp.config';
import { appConfig } from '../config/app.config';

export class EmailOtpDeliveryAdapter implements OtpDeliveryPort {
  constructor(private readonly emailDeliveryPort: EmailDeliveryPort) {}

  async dispatch(destination: string, code: string): Promise<boolean> {
    if (!otpConfig.otpDeliveryEnabled) {
      return false;
    }

    try {
      const result = await this.emailDeliveryPort.sendTransactional(
        { address: destination, name: destination },
        'Your one-time verification code',
        otpConfig.otpEmailTemplateId,
        {
          otp: code,
          expiry_seconds: String(otpConfig.otpExpirySeconds),
          app_name: appConfig.fromName,
        },
      );

      return result.success;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown delivery error';
      console.error('[EmailOtpDeliveryAdapter] Dispatch failed:', {
        destination,
        error: errorMessage,
      });
      return false;
    }
  }
}
