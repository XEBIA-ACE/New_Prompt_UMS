process.env.OTP_HASH_SECRET = 'test-otp-secret';
process.env.OTP_EMAIL_TEMPLATE_ID = 'd-test-otp-template';
process.env.OTP_MAX_ATTEMPTS_PER_WINDOW = '5';
process.env.OTP_RATE_LIMIT_WINDOW_MINUTES = '15';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.REDIS_URL = REDIS_URL;

// Mock bcrypt — native module can't compile in this env.
jest.mock('bcrypt', () => ({
  hash: jest.fn((value: string) => Promise.resolve(`$2b$10$mocked_hash_for_${value}`)),
}));

import request from 'supertest';
import express, { Express } from 'express';
import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { createOtpRouter } from '../routes/otp.routes';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import { createTestDb, closeTestDb, TestDb } from './test-db';

let app: Express;
let testDb: TestDb;
let db: Database;
let redis: Redis;
let deliveryPort: RecordingDeliveryPort;

/**
 * Captures every dispatched OTP code instead of calling a real email
 * provider, so tests can assert on delivery behaviour and on what a
 * response never leaks.
 */
class RecordingDeliveryPort implements OtpDeliveryPort {
  public dispatched: Array<{ destination: string; code: string }> = [];
  public nextResult = true;

  async dispatch(destination: string, code: string): Promise<boolean> {
    this.dispatched.push({ destination, code });
    return this.nextResult;
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

function insertUser(status: 'pending' | 'active' | 'suspended' | 'deleted'): { id: string; email: string } {
  const suffix = randomSuffix();
  const email = `${suffix}@example.test`;
  const id = uuidv4();
  db.prepare(
    `INSERT INTO users (id, username, username_normalised, email, password_hash, status, registration_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, `user-${suffix}`, `user-${suffix}`, email, 'irrelevant-hash', status, new Date().toISOString());
  return { id, email };
}

beforeAll(async () => {
  testDb = createTestDb();
  db = testDb.db;
  redis = new Redis(REDIS_URL);

  deliveryPort = new RecordingDeliveryPort();

  app = express();
  app.use(express.json());
  app.use('/api/v1/otp', createOtpRouter(db, redis, deliveryPort));
});

afterEach(() => {
  deliveryPort.dispatched = [];
  deliveryPort.nextResult = true;
});

afterAll(async () => {
  closeTestDb(testDb);
  await redis.quit();
});

describe('Integration | OTP send', () => {
  test('POST /api/v1/otp/send happy path accepts and delivers to an active user', async () => {
    const user = await insertUser('active');

    const response = await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(202);

    expect(response.body).toMatchObject({ status: 'accepted' });
    expect(deliveryPort.dispatched).toHaveLength(1);
    expect(deliveryPort.dispatched[0].destination).toBe(user.email);

    const dispatchedCode = deliveryPort.dispatched[0].code;
    expect(dispatchedCode).toMatch(/^\d{6}$/);
    expect(JSON.stringify(response.body)).not.toContain(dispatchedCode);

    const otpRow = db
      .prepare('SELECT status, email_address, purpose FROM otp_requests WHERE user_id = ?')
      .get(user.id) as { status: string; email_address: string; purpose: string };
    expect(otpRow.status).toBe('ACTIVE');
    expect(otpRow.email_address).toBe(user.email);
    expect(otpRow.purpose).toBe('ACTIVATION');
  });

  test('POST /api/v1/otp/send associates OTP with the correct purpose', async () => {
    const user = await insertUser('active');

    await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'PASSWORD_RECOVERY' })
      .expect(202);

    const otpRow = db
      .prepare('SELECT purpose FROM otp_requests WHERE user_id = ?')
      .get(user.id) as { purpose: string };
    expect(otpRow.purpose).toBe('PASSWORD_RECOVERY');
  });

  test('POST /api/v1/otp/send returns 404 for a non-existent user', async () => {
    const response = await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: uuidv4(), purpose: 'ACTIVATION' })
      .expect(404);

    expect(response.body.errorCode).toBe('OTP_USER_NOT_FOUND');
    expect(deliveryPort.dispatched).toHaveLength(0);
  });

  test('POST /api/v1/otp/send returns 422 for a suspended user', async () => {
    const user = await insertUser('suspended');

    const response = await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(422);

    expect(response.body.errorCode).toBe('OTP_ACCOUNT_INELIGIBLE');
    expect(deliveryPort.dispatched).toHaveLength(0);
  });

  test('POST /api/v1/otp/send returns 422 for a deleted user', async () => {
    const user = await insertUser('deleted');

    const response = await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(422);

    expect(response.body.errorCode).toBe('OTP_ACCOUNT_INELIGIBLE');
    expect(deliveryPort.dispatched).toHaveLength(0);
  });

  test('POST /api/v1/otp/send returns 202 for a pending user (post-registration activation)', async () => {
    const user = await insertUser('pending');

    const response = await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(202);

    expect(response.body).toMatchObject({ status: 'accepted' });
    expect(deliveryPort.dispatched).toHaveLength(1);
  });

  test('two sequential requests for same user+purpose leave exactly one ACTIVE row', async () => {
    const user = await insertUser('active');

    await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(202);

    await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(202);

    const rows = db
      .prepare("SELECT status FROM otp_requests WHERE user_id = ? AND purpose = 'ACTIVATION' ORDER BY created_at ASC")
      .all(user.id) as Array<{ status: string }>;
    expect(rows).toHaveLength(2);
    expect(rows[0].status).toBe('EXPIRED');
    expect(rows[1].status).toBe('ACTIVE');
  });

  test('separate purposes can each have an ACTIVE OTP', async () => {
    const user = await insertUser('active');

    await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(202);

    await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'PASSWORD_RECOVERY' })
      .expect(202);

    const activationRow = db
      .prepare("SELECT status FROM otp_requests WHERE user_id = ? AND purpose = 'ACTIVATION'")
      .get(user.id) as { status: string };
    const recoveryRow = db
      .prepare("SELECT status FROM otp_requests WHERE user_id = ? AND purpose = 'PASSWORD_RECOVERY'")
      .get(user.id) as { status: string };

    expect(activationRow.status).toBe('ACTIVE');
    expect(recoveryRow.status).toBe('ACTIVE');
  });

  test('never returns the plaintext OTP in the response body, even on dispatch failure', async () => {
    const user = await insertUser('active');
    deliveryPort.nextResult = false;

    const response = await request(app)
      .post('/api/v1/otp/send')
      .send({ userId: user.id, purpose: 'ACTIVATION' })
      .expect(202);

    expect(response.body).toMatchObject({ status: 'dispatch_failed' });
    const dispatchedCode = deliveryPort.dispatched[0].code;
    expect(JSON.stringify(response.body)).not.toContain(dispatchedCode);
  });
});
