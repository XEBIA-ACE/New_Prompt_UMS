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
process.env.PROFILE_RATE_LIMIT_MAX_REQUESTS = '1000';

import request from 'supertest';
import type { Database } from 'better-sqlite3';
import { Redis } from 'ioredis';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import { EmailDeliveryPort } from '../adapters/email-delivery.port';
import { DeliveryResult } from '../types/registration.types';
import { createTestDb, clearAllTables, closeTestDb, TestDb } from './test-db';

const TEST_PASSWORD = 'Passw0rd!';

class RecordingOtpDeliveryPort implements OtpDeliveryPort {
  public dispatched: Array<{ destination: string; code: string }> = [];
  async dispatch(destination: string, code: string): Promise<boolean> {
    this.dispatched.push({ destination, code });
    return true;
  }
  codeFor(destination: string): string {
    const match = [...this.dispatched].reverse().find((entry) => entry.destination === destination);
    if (!match) throw new Error(`No OTP was dispatched to ${destination}`);
    return match.code;
  }
}

class NoopEmailDeliveryPort implements EmailDeliveryPort {
  async sendTransactional(): Promise<DeliveryResult> {
    return { success: true };
  }
}

let app: any;
let testDb: TestDb;
let db: Database;
let redis: Redis;
let otpDeliveryPort: RecordingOtpDeliveryPort;

const suffix = () => Math.random().toString(36).slice(2, 10);

async function registerActivateAndLogin(): Promise<{ userId: string; email: string; username: string; token: string }> {
  const username = `user-${suffix()}`;
  const email = `${username}@example.test`;
  const registered = await request(app)
    .post('/api/v1/users/register')
    .send({ username, emailAddress: email, password: TEST_PASSWORD, passwordConfirmation: TEST_PASSWORD })
    .expect(201);
  const userId = registered.body.userId;
  await request(app)
    .post('/api/v1/otp/verify')
    .send({ userId, passcode: otpDeliveryPort.codeFor(email) })
    .expect(200);
  const login = await request(app).post('/api/v1/auth/login').send({ email, password: TEST_PASSWORD }).expect(200);
  return { userId, email, username, token: login.body.token };
}

beforeAll(async () => {
  testDb = createTestDb();
  db = testDb.db;
  redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  otpDeliveryPort = new RecordingOtpDeliveryPort();
  const appModule = await import('../app');
  app = appModule.createApp(db, redis, otpDeliveryPort, new NoopEmailDeliveryPort());
});

afterEach(() => {
  otpDeliveryPort.dispatched = [];
  clearAllTables(db);
});

afterAll(async () => {
  closeTestDb(testDb);
  await redis.quit();
});

describe('Integration | GET /api/user/profile', () => {
  test('[US-004-AC12] [US-004-AC2] [US-004-AC14] authenticated user sees their current profile', async () => {
    const user = await registerActivateAndLogin();
    const res = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${user.token}`).expect(200);

    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toMatchObject({
      username: user.username,
      email: user.email,
      displayName: null,
      phoneNumber: null,
      status: 'active',
      version: 1,
      profileUpdatedAt: null,
    });
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body).not.toHaveProperty('passwordHash');

    const audit = db.prepare('SELECT action FROM user_profile_audit_log WHERE user_id = ?').all(user.userId);
    expect(audit).toEqual([{ action: 'profile.viewed' }]);
  });

  test('[US-004-AC21] [US-004-AC64] unauthenticated request -> 401', async () => {
    await request(app).get('/api/user/profile').expect(401);
    await request(app).get('/api/user/profile').set('Authorization', 'Bearer not-a-session').expect(401);
  });
});

describe('Integration | PUT /api/user/profile', () => {
  async function loadProfile(token: string) {
    return (await request(app).get('/api/user/profile').set('Authorization', `Bearer ${token}`).expect(200)).body;
  }

  test('[US-004-AC13] [US-004-AC15] [US-004-AC7] update is saved and returned, and GET reflects it', async () => {
    const user = await registerActivateAndLogin();
    const before = await loadProfile(user.token);

    const put = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${user.token}`)
      .set('X-CSRF-Token', before.csrfToken)
      .send({ displayName: 'Jane Doe', email: user.email, phoneNumber: '+15550102000', version: before.version })
      .expect(200);
    expect(put.body).toMatchObject({ displayName: 'Jane Doe', phoneNumber: '+15550102000', version: 2 });
    expect(put.body.profileUpdatedAt).not.toBeNull();

    const after = await loadProfile(user.token);
    expect(after).toMatchObject({ displayName: 'Jane Doe', phoneNumber: '+15550102000', version: 2 });

    const events = db.prepare('SELECT topic, payload FROM domain_event_outbox').all() as Array<{ topic: string; payload: string }>;
    expect(events).toHaveLength(1);
    expect(events[0].topic).toBe('user.profile.updated');
    expect(JSON.parse(events[0].payload)).toMatchObject({ userId: user.userId, changedFields: ['displayName', 'phoneNumber'] });
  });

  test('[US-004-AC13] changed email is used for subsequent logins', async () => {
    const user = await registerActivateAndLogin();
    const before = await loadProfile(user.token);
    const newEmail = `renamed-${suffix()}@example.test`;
    await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${user.token}`)
      .set('X-CSRF-Token', before.csrfToken)
      .send({ displayName: null, email: newEmail, phoneNumber: null, version: before.version })
      .expect(200);
    await request(app).post('/api/v1/auth/login').send({ email: newEmail, password: TEST_PASSWORD }).expect(200);
  });

  test('[US-004-AC8] [US-004-AC27] missing or foreign CSRF token -> 403', async () => {
    const alice = await registerActivateAndLogin();
    const bob = await registerActivateAndLogin();
    const bobProfile = await loadProfile(bob.token);
    const body = { displayName: 'X', email: alice.email, phoneNumber: null, version: 1 };

    await request(app).put('/api/user/profile').set('Authorization', `Bearer ${alice.token}`).send(body).expect(403);
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${alice.token}`)
      .set('X-CSRF-Token', bobProfile.csrfToken)
      .send(body)
      .expect(403);
    expect(res.body.error_code).toBe('CSRF_TOKEN_INVALID');
  });

  test('[US-004-AC21] unauthenticated PUT -> 401', async () => {
    await request(app).put('/api/user/profile').send({ email: 'a@b.co', version: 1 }).expect(401);
  });

  test('[US-004-AC6] [US-004-AC39] invalid data -> 422 with per-field errors, nothing saved', async () => {
    const user = await registerActivateAndLogin();
    const before = await loadProfile(user.token);
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${user.token}`)
      .set('X-CSRF-Token', before.csrfToken)
      .send({ displayName: '<b>x</b>', email: 'nope', phoneNumber: '12', version: before.version })
      .expect(422);
    expect(res.body.error_code).toBe('PROFILE_VALIDATION_FAILED');
    expect(Object.keys(res.body.fieldErrors).sort()).toEqual(['displayName', 'email', 'phoneNumber']);
    expect((await loadProfile(user.token)).version).toBe(1);
  });

  test('[US-004-AC3] [US-004-AC19] [US-004-AC22] [US-004-AC65] a user cannot edit another user via userId in body', async () => {
    const alice = await registerActivateAndLogin();
    const bob = await registerActivateAndLogin();
    const aliceProfile = await loadProfile(alice.token);
    await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${alice.token}`)
      .set('X-CSRF-Token', aliceProfile.csrfToken)
      .send({ userId: bob.userId, displayName: 'Hacked', email: bob.email, phoneNumber: null, version: 1 })
      .expect(422);
    expect((await loadProfile(bob.token)).displayName).toBeNull();
  });

  test('email already used by another account -> 409 EMAIL_ALREADY_IN_USE', async () => {
    const alice = await registerActivateAndLogin();
    const bob = await registerActivateAndLogin();
    const aliceProfile = await loadProfile(alice.token);
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${alice.token}`)
      .set('X-CSRF-Token', aliceProfile.csrfToken)
      .send({ displayName: null, email: bob.email, phoneNumber: null, version: 1 })
      .expect(409);
    expect(res.body.error_code).toBe('EMAIL_ALREADY_IN_USE');
  });

  test('[US-004-AC40] concurrent update with stale version -> 409 PROFILE_VERSION_CONFLICT', async () => {
    const user = await registerActivateAndLogin();
    const before = await loadProfile(user.token);
    const send = (displayName: string) =>
      request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${user.token}`)
        .set('X-CSRF-Token', before.csrfToken)
        .send({ displayName, email: user.email, phoneNumber: null, version: before.version });

    await send('First tab').expect(200);
    const res = await send('Second tab').expect(409);
    expect(res.body).toMatchObject({ error_code: 'PROFILE_VERSION_CONFLICT', currentVersion: 2 });
    expect((await loadProfile(user.token)).displayName).toBe('First tab');
  });
});
