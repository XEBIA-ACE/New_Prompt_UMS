// IMPACT regression (T017): POST /api/v1/auth/password-recovery and
// POST /api/v1/otp/send must keep sending via sendTransactional with their
// own templates while the MFA template ID is absent (FR-S4-AC5-003).
process.env.ADMIN_BEARER_TOKEN = 'test-admin-token';
process.env.SENDGRID_API_KEY = 'SG.test-key';
process.env.SENDGRID_TEMPLATE_ID = 'd-test-template';
process.env.ACTIVATION_BASE_URL = 'https://example.test';
process.env.FROM_EMAIL = 'no-reply@example.test';
process.env.PASSWORD_RECOVERY_BASE_URL = 'https://example.test';
process.env.PASSWORD_RECOVERY_EMAIL_TEMPLATE_ID = 'd-test-recovery-template';
process.env.OTP_HASH_SECRET = 'test-otp-secret';
process.env.OTP_EMAIL_TEMPLATE_ID = 'd-test-otp-template';
process.env.ACCOUNT_DELETION_REQUEST_EMAIL_TEMPLATE_ID = 'd-test-deletion-request-template';
process.env.ACCOUNT_DELETION_NOTICE_EMAIL_TEMPLATE_ID = 'd-test-deletion-notice-template';
delete process.env.MFA_SETTING_CHANGE_EMAIL_TEMPLATE_ID;
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.REDIS_URL = REDIS_URL;

import request from 'supertest';
import type { Express } from 'express';
import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { EmailDeliveryPort, EmailTemplate } from '../adapters/email-delivery.port';
import { EmailOtpDeliveryAdapter } from '../adapters/email-otp-delivery.adapter';
import { DeliveryResult, EmailRecipient } from '../types/registration.types';
import { createTestDb, closeTestDb, TestDb } from './test-db';

class RecordingEmailDeliveryPort implements EmailDeliveryPort {
  public sent: Array<{ recipient: EmailRecipient; templateId: string; templateVars: Record<string, string> }> = [];

  async sendTransactional(
    recipient: EmailRecipient,
    _subject: string,
    templateId: string,
    templateVars: Record<string, string>,
  ): Promise<DeliveryResult> {
    this.sent.push({ recipient, templateId, templateVars });
    return { success: true };
  }
}

let app: Express;
let testDb: TestDb;
let db: Database;
let redis: Redis;
let emailPort: RecordingEmailDeliveryPort;
let consoleError: jest.SpyInstance;
let mfaTemplateId: string | null;

function insertActiveUser(): { id: string; email: string } {
  const suffix = Math.random().toString(36).slice(2, 10);
  const id = uuidv4();
  const email = `${suffix}@example.test`;
  db.prepare(
    `INSERT INTO users (id, username, username_normalised, email, password_hash, status, registration_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, `user-${suffix}`, `user-${suffix}`, email, 'irrelevant-hash', 'active', new Date().toISOString());
  return { id, email };
}

beforeAll(async () => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  // Initialize the email layer exactly as server.ts does, with no MFA template configured.
  const { emailTemplateConfig } = await import('../config/email-template.config');
  mfaTemplateId = emailTemplateConfig.templateIds[EmailTemplate.MfaSettingChange];

  testDb = createTestDb();
  db = testDb.db;
  redis = new Redis(REDIS_URL);
  emailPort = new RecordingEmailDeliveryPort();
  const { createApp } = await import('../app');
  app = createApp(db, redis, new EmailOtpDeliveryAdapter(emailPort), emailPort) as unknown as Express;
});

afterEach(() => {
  emailPort.sent = [];
});

afterAll(async () => {
  consoleError.mockRestore();
  closeTestDb(testDb);
  await redis.quit();
});

describe('Integration | IMPACT regression with MFA template unconfigured', () => {
  // [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] S4-AC5 / T016 — FR-S4-AC5-001
  test('[S4-AC5] email layer initialization surfaces the missing MFA template without crashing', () => {
    expect(mfaTemplateId).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('MFA_SETTING_CHANGE_EMAIL_TEMPLATE_ID'));
  });

  // IMPACT / T017 — [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] FR-S4-AC5-003
  test('[IMPACT] POST /api/v1/auth/password-recovery still sends with the password-recovery template', async () => {
    const user = insertActiveUser();

    await request(app).post('/api/v1/auth/password-recovery').send({ email: user.email }).expect(202);

    expect(emailPort.sent).toHaveLength(1);
    expect(emailPort.sent[0].recipient.address).toBe(user.email);
    expect(emailPort.sent[0].templateId).toBe('d-test-recovery-template');
    expect(emailPort.sent[0].templateVars.recoveryLink).toContain('https://example.test/reset-password?token=');
  });

  // IMPACT / T017 — [b4b3c394-8366-5e90-b9d0-ab78e8cb980a-AC5] FR-S4-AC5-003
  test('[IMPACT] POST /api/v1/otp/send still sends with the OTP template', async () => {
    const user = insertActiveUser();

    const response = await request(app).post('/api/v1/otp/send').send({ userId: user.id }).expect(202);

    expect(response.body).toEqual({ status: 'accepted' });
    expect(emailPort.sent).toHaveLength(1);
    expect(emailPort.sent[0].recipient.address).toBe(user.email);
    expect(emailPort.sent[0].templateId).toBe('d-test-otp-template');
    expect(emailPort.sent[0].templateVars.otp).toMatch(/^\d{6}$/);

    await redis.del(`otp:rl:${user.id}`);
  });
});
