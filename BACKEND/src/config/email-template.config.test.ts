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

import fs from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import ts from 'typescript';
import { EmailTemplate } from '../adapters/email-delivery.port';
import {
  MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY,
  emailTemplateConfig,
  loadEmailTemplateConfig,
} from './email-template.config';

function silentLogger(): { error: jest.Mock } {
  return { error: jest.fn() };
}

describe('EmailTemplateConfig', () => {
  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC1] S4-AC1 / T012 — FR-S4-AC1-001
  test('[S4-AC1] loads the MFA setting-change template ID from a dotenv-populated environment', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mfa-env-'));
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, `${MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY}=d-dotenv-mfa-template\n`);
    const env: NodeJS.ProcessEnv = {};
    dotenv.config({ path: envFile, processEnv: env, quiet: true });
    fs.rmSync(dir, { recursive: true, force: true });

    const logger = silentLogger();
    const config = loadEmailTemplateConfig(env, logger);

    expect(config.templateIds[EmailTemplate.MfaSettingChange]).toBe('d-dotenv-mfa-template');
    expect(logger.error).not.toHaveBeenCalled();
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC1] S4-AC1 / T012 — FR-S4-AC1-002
  test('[S4-AC1] exposes the module-level config loaded at initialization without re-reading the environment', () => {
    expect(emailTemplateConfig.templateIds[EmailTemplate.MfaSettingChange]).toBe('d-test-mfa-template');

    const env: NodeJS.ProcessEnv = { [MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY]: 'd-initial' };
    const config = loadEmailTemplateConfig(env, silentLogger());
    env[MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY] = 'd-changed-after-init';

    expect(config.templateIds[EmailTemplate.MfaSettingChange]).toBe('d-initial');
    expect(Object.isFrozen(config.templateIds)).toBe(true);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC2] S4-AC2 — FR-S4-AC2-002 (distinct from other templates)
  test('[S4-AC2] keeps the MFA template distinct from the registration and account-deletion templates', () => {
    const { templateIds } = emailTemplateConfig;
    expect(templateIds[EmailTemplate.MfaSettingChange]).not.toBe(templateIds[EmailTemplate.Activation]);
    expect(templateIds[EmailTemplate.MfaSettingChange]).not.toBe(templateIds[EmailTemplate.AccountDeletionRequest]);
    expect(templateIds[EmailTemplate.MfaSettingChange]).not.toBe(templateIds[EmailTemplate.AccountDeletionNotice]);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC3] S4-AC3 / T014 — FR-S4-AC3-001
  test('[S4-AC3] represents the MFA setting-change template as a distinct EmailTemplate member with a config entry', () => {
    expect(Object.values(EmailTemplate)).toContain(EmailTemplate.MfaSettingChange);
    expect(Object.keys(emailTemplateConfig.templateIds).sort()).toEqual(Object.values(EmailTemplate).sort());

    const ids = emailTemplateConfig.templateIds;
    // @ts-expect-error — 'mfaTemplate' is not an EmailTemplate key (FR-S4-AC3-002)
    void ids['mfaTemplate'];
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC3] S4-AC3 / T014 — FR-S4-AC3-002
  test('[S4-AC3] the TypeScript compiler rejects unknown email template keys', () => {
    const portPath = path.resolve(__dirname, '../adapters/email-delivery.port.ts');
    const snippetPath = path.resolve(__dirname, '__s4ac3_snippet__.ts');
    const importPath = './' + path.relative(path.dirname(snippetPath), portPath).replace(/\\/g, '/').replace(/\.ts$/, '');
    const source = (body: string): string =>
      `import { EmailTemplate, EmailTemplateIdMap } from '${importPath}';\n` +
      `declare const ids: EmailTemplateIdMap;\n` +
      `function use(t: EmailTemplate): string | null { return ids[t]; }\n${body}\n`;

    const diagnosticsFor = (body: string): readonly ts.Diagnostic[] => {
      const options: ts.CompilerOptions = { strict: true, noEmit: true, skipLibCheck: true, types: [] };
      const host = ts.createCompilerHost(options);
      const originalGetSourceFile = host.getSourceFile.bind(host);
      host.getSourceFile = (fileName, languageVersion, ...rest) =>
        path.resolve(fileName) === snippetPath
          ? ts.createSourceFile(fileName, source(body), languageVersion)
          : originalGetSourceFile(fileName, languageVersion, ...rest);
      const originalFileExists = host.fileExists.bind(host);
      host.fileExists = (fileName) => path.resolve(fileName) === snippetPath || originalFileExists(fileName);
      const program = ts.createProgram([snippetPath], options, host);
      return ts.getPreEmitDiagnostics(program, program.getSourceFile(snippetPath));
    };

    expect(diagnosticsFor('use(EmailTemplate.MfaSettingChange); void ids[EmailTemplate.MfaSettingChange];')).toHaveLength(0);
    expect(diagnosticsFor('use(EmailTemplate.MfaTemplate);').length).toBeGreaterThan(0);
    expect(diagnosticsFor("use('mfaSettingChange');").length).toBeGreaterThan(0);
    expect(diagnosticsFor("void ids['notATemplate'];").length).toBeGreaterThan(0);
  }, 30_000);

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC5-001
  test('[S4-AC5] logs a clear configuration error and resolves null when the MFA template ID is absent', () => {
    const logger = silentLogger();

    const config = loadEmailTemplateConfig({}, logger);

    expect(config.templateIds[EmailTemplate.MfaSettingChange]).toBeNull();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toContain(MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY);
    expect(logger.error.mock.calls[0][0]).toMatch(/Configuration error/);
  });

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC5-001, FR-S4-AC5-002
  test.each(['', '   ', 'not-a-template', '83aefc9fa47b42b09f7a5156a4699c09'])(
    '[S4-AC5] treats MFA template ID %p as a configuration error without throwing',
    (value) => {
      const logger = silentLogger();

      const config = loadEmailTemplateConfig({ [MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY]: value }, logger);

      expect(config.templateIds[EmailTemplate.MfaSettingChange]).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(MFA_SETTING_CHANGE_TEMPLATE_ENV_KEY));
    },
  );

  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC5-003
  test('[S4-AC5] a missing MFA template ID leaves every non-MFA template resolved', () => {
    const config = loadEmailTemplateConfig({}, silentLogger());

    expect(config.templateIds[EmailTemplate.Activation]).toBe('d-test-activation-template');
    expect(config.templateIds[EmailTemplate.Otp]).toBe('d-test-otp-template');
    expect(config.templateIds[EmailTemplate.PasswordRecovery]).toBe('d-test-recovery-template');
    expect(config.templateIds[EmailTemplate.AccountDeletionRequest]).toBe('d-test-deletion-request-template');
    expect(config.templateIds[EmailTemplate.AccountDeletionNotice]).toBe('d-test-deletion-notice-template');
  });
});
