process.env.OTP_HASH_SECRET = 'test-secret';
process.env.OTP_EMAIL_TEMPLATE_ID = 'test-template';
process.env.OTP_MAX_ATTEMPTS_PER_WINDOW = '5';

import express from 'express';
import request from 'supertest';
import { Redis } from 'ioredis';
import { createOtpRouter } from '../routes/otp.routes';
import { OtpRequestRepository } from '../repositories/otp-request.repository';
import { createTestDb, closeTestDb, TestDb } from './test-db';

describe('IMPACT | createOtpRouter -> OtpController -> service -> repository', () => {
  let fixture: TestDb;
  let app: express.Express;
  let code: string;
  let count: number;
  beforeEach(() => {
    fixture = createTestDb();
    fixture.db.prepare(`INSERT INTO users
      (id, username, username_normalised, email, password_hash, status, registration_timestamp)
      VALUES ('user', 'user', 'user', 'user@example.test', 'hash', 'pending', '2026-01-01')`).run();
    count = 0;
    const redis = {
      incr: jest.fn(async () => ++count), expire: jest.fn(async () => 1),
    } as unknown as Redis;
    app = express();
    app.use(express.json());
    app.use('/api/v1/otp', createOtpRouter(fixture.db, redis, {
      dispatch: async (_destination, value) => { code = value; return true; },
    }));
  });
  afterEach(() => { jest.restoreAllMocks(); closeTestDb(fixture); });
  const send = () => request(app).post('/api/v1/otp/send').send({ userId: 'user' });
  const verify = (passcode: string) => request(app).post('/api/v1/otp/verify')
    .send({ userId: 'user', passcode });

  test('IMPACT S3-AC2 S3-AC4 tracks failures and persists successful verification', async () => {
    await send().expect(202);
    await verify(code === '000000' ? '111111' : '000000').expect(422);
    expect(fixture.db.prepare('SELECT attempt_count, verified FROM otp_requests').get())
      .toEqual({ attempt_count: 1, verified: 0 });
    const response = await verify(code).expect(200);
    expect(fixture.db.prepare('SELECT verified, verified_at, invalidated_at FROM otp_requests').get())
      .toEqual({ verified: 1, verified_at: response.body.activatedAt,
        invalidated_at: response.body.activatedAt });
    await verify(code).expect(404);
  });

  test('IMPACT preserves the existing send/resend lockout and route error contract', async () => {
    for (let i = 0; i < 5; i++) await send().expect(202);
    const response = await request(app).post('/api/v1/otp/resend').send({ userId: 'user' }).expect(429);
    expect(response.body.errorCode).toBe('OTP_RATE_LIMIT_EXCEEDED');
    expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM otp_requests').get()).toEqual({ count: 5 });
  });

  test.each(['getAttemptCount', 'getVerified', 'incrementAttemptCount', 'setVerified'] as const)(
    'IMPACT S3-AC5 maps a missing row from %s to the existing 404', async (method) => {
      await send().expect(202);
      jest.spyOn(OtpRequestRepository.prototype, method).mockReturnValue(null);
      const response = await verify(method === 'incrementAttemptCount' ? 'invalid' : code).expect(404);
      expect(response.body.errorCode).toBe('OTP_NOT_FOUND');
      expect(fixture.db.prepare('SELECT status FROM users').get()).toEqual({ status: 'pending' });
    },
  );

  test('IMPACT S3-AC4 rolls verification back if account activation fails', async () => {
    await send().expect(202);
    fixture.db.exec(`CREATE TRIGGER reject_activation BEFORE UPDATE ON users
      BEGIN SELECT RAISE(ABORT, 'test failure'); END;`);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await verify(code).expect(500);
    expect(fixture.db.prepare('SELECT verified, verified_at FROM otp_requests').get())
      .toEqual({ verified: 0, verified_at: null });
  });
});
