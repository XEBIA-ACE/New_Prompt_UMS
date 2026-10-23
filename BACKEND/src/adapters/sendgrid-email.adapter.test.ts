process.env.ACTIVATION_BASE_URL = 'https://example.test';
process.env.ADMIN_BEARER_TOKEN = 'test-admin-token';
process.env.SENDGRID_API_KEY = 'SG.test-key';
process.env.SENDGRID_TEMPLATE_ID = 'd-test-activation-template';
process.env.FROM_EMAIL = 'no-reply@example.test';
process.env.PASSWORD_RECOVERY_BASE_URL = 'https://example.test';
process.env.PASSWORD_RECOVERY_EMAIL_TEMPLATE_ID = 'd-test-recovery-template';
process.env.OTP_HASH_SECRET = 'test-otp-secret';
process.env.OTP_EMAIL_TEMPLATE_ID = 'd-test-otp-template';
process.env.ACCOUNT_DELETION_REQUEST_EMAIL_TEMPLATE_ID = 'd-test-deletion-request-template';
process.env.ACCOUNT_DELETION_NOTICE_EMAIL_TEMPLATE_ID = 'd-test-deletion-notice-template';
process.env.MFA_SETTING_CHANGE_EMAIL_TEMPLATE_ID = 'd-test-mfa-template';

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: { setApiKey: jest.fn(), send: jest.fn() },
}));

import sgMail from '@sendgrid/mail';
import { MFA_TEMPLATE_NOT_CONFIGURED_ERROR, SendGridEmailAdapter } from './sendgrid-email.adapter';
import { EmailTemplate } from './email-delivery.port';
import { MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY, loadEmailTemplateConfig } from '../config/email-template.config';

const send = sgMail.send as unknown as jest.Mock;
const recipient = { address: 'user@example.test', name: 'User' };

describe('SendGridEmailAdapter', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue([{ statusCode: 202, headers: { 'x-message-id': 'msg-1' } }, {}]);
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC4] S4-AC4 — FR-S4-AC4-001
  test('[S4-AC4] configures SendGrid with the API key sourced from the environment', () => {
    new SendGridEmailAdapter();
    expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test-key');
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC2] S4-AC2 / T013 — FR-S4-AC2-001
  test('[S4-AC2] MFA setting-change notifications use the dedicated MFA template ID', async () => {
    const adapter = new SendGridEmailAdapter();

    const result = await adapter.sendMfaSettingChangeNotification(recipient, 'Your MFA settings changed', {
      displayName: 'User',
    });

    expect(result).toEqual({ success: true, messageId: 'msg-1' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        templateId: 'd-test-mfa-template',
        subject: 'Your MFA settings changed',
        dynamicTemplateData: { displayName: 'User' },
        to: { email: recipient.address, name: recipient.name },
      }),
    );
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC2] S4-AC2 / T013 — FR-S4-AC2-002
  test('[S4-AC2] never reuses the registration or account-deletion templates for MFA notifications', async () => {
    const config = loadEmailTemplateConfig(
      { [MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY]: 'd-injected-mfa-template' },
      { error: jest.fn() },
    );
    const adapter = new SendGridEmailAdapter(config);

    await adapter.sendMfaSettingChangeNotification(recipient, 'subject', {});

    const { templateId } = send.mock.calls[0][0];
    expect(templateId).toBe('d-injected-mfa-template');
    expect(templateId).not.toBe(config.templateIds[EmailTemplate.Activation]);
    expect(templateId).not.toBe(config.templateIds[EmailTemplate.AccountDeletionRequest]);
    expect(templateId).not.toBe(config.templateIds[EmailTemplate.AccountDeletionNotice]);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC2-002, FR-S4-AC5-001, FR-S4-AC5-002
  test('[S4-AC5] a missing MFA template fails the MFA send in a controlled way with no fallback template', async () => {
    const config = loadEmailTemplateConfig({}, { error: jest.fn() });
    const adapter = new SendGridEmailAdapter(config);

    const result = await adapter.sendMfaSettingChangeNotification(recipient, 'subject', {});

    expect(result).toEqual({ success: false, error: MFA_TEMPLATE_NOT_CONFIGURED_ERROR });
    expect(send).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY),
      expect.objectContaining({ recipient: recipient.address }),
    );
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC5-002
  test('[S4-AC5] provider failures on MFA sends are returned, not thrown', async () => {
    send.mockRejectedValue(new Error('provider down'));
    const adapter = new SendGridEmailAdapter();

    await expect(adapter.sendMfaSettingChangeNotification(recipient, 'subject', {})).resolves.toEqual({
      success: false,
      error: 'provider down',
    });
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC5-003
  test('[S4-AC5] non-MFA sends (OTP, password recovery) still work when the MFA template is missing', async () => {
    const adapter = new SendGridEmailAdapter(loadEmailTemplateConfig({}, { error: jest.fn() }));

    const otp = await adapter.sendTransactional(recipient, 'Your code', 'd-test-otp-template', { otp: '123456' });
    const recovery = await adapter.sendTransactional(recipient, 'Reset your password', 'd-test-recovery-template', {
      recoveryLink: 'https://example.test/reset',
    });

    expect(otp.success).toBe(true);
    expect(recovery.success).toBe(true);
    expect(send.mock.calls.map((call) => call[0].templateId)).toEqual([
      'd-test-otp-template',
      'd-test-recovery-template',
    ]);
  });
});
