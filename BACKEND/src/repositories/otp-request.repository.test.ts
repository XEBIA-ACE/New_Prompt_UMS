import { OtpRequestRepository } from './otp-request.repository';
import { createTestDb, closeTestDb, TestDb } from '../integration/test-db';

describe('OTP repository story 034ee440-8aef-5f2e-8765-468880e84a91', () => {
  let fixture: TestDb;
  let repo: OtpRequestRepository;
  beforeEach(() => {
    fixture = createTestDb();
    repo = new OtpRequestRepository(fixture.db);
    fixture.db.prepare(`INSERT INTO users
      (id, username, username_normalised, email, password_hash, status, registration_timestamp)
      VALUES ('user', 'user', 'user', 'user@example.test', 'hash', 'pending', '2026-01-01')`).run();
    fixture.db.prepare(`INSERT INTO otp_requests
      (id, user_id, email_address, code_hash, created_at, expires_at, attempt_sequence)
      VALUES ('otp', 'user', 'user@example.test', 'hash', '2026-01-01', '2027-01-01', 1)`).run();
  });
  afterEach(() => closeTestDb(fixture));

  // [034ee440-8aef-5f2e-8765-468880e84a91-AC1] FR-S3-AC1
  test('S3-AC1 returns a nonnegative integer, including zero', () => {
    expect(repo.getAttemptCount('otp')).toBe(0);
    fixture.db.prepare('UPDATE otp_requests SET attempt_count = 2').run();
    expect(repo.getAttemptCount('otp')).toBe(2);
  });
  // [034ee440-8aef-5f2e-8765-468880e84a91-AC2] FR-S3-AC2
  test('S3-AC2 persists and returns the increment from 2 to 3', () => {
    fixture.db.prepare('UPDATE otp_requests SET attempt_count = 2').run();
    expect(repo.incrementAttemptCount('otp')).toBe(3);
    expect(repo.getAttemptCount('otp')).toBe(3);
  });
  // [034ee440-8aef-5f2e-8765-468880e84a91-AC3] FR-S3-AC3
  test('S3-AC3 returns boolean false and true', () => {
    expect(repo.getVerified('otp')).toBe(false);
    fixture.db.prepare('UPDATE otp_requests SET verified = 1').run();
    expect(repo.getVerified('otp')).toBe(true);
  });
  // [034ee440-8aef-5f2e-8765-468880e84a91-AC4] FR-S3-AC4
  test('S3-AC4 persists verification and the supplied timestamp', () => {
    const timestamp = '2026-10-26T12:34:56.123+02:00';
    expect(repo.setVerified('otp', timestamp)).toBe(true);
    expect(fixture.db.prepare('SELECT verified, verified_at FROM otp_requests').get())
      .toEqual({ verified: 1, verified_at: timestamp });
    repo.setVerified('otp', '2026-10-27T00:00:00Z');
    expect(fixture.db.prepare('SELECT verified_at FROM otp_requests').get())
      .toEqual({ verified_at: timestamp });
  });
  // [034ee440-8aef-5f2e-8765-468880e84a91-AC5] FR-S3-AC5
  test('S3-AC5 consistently returns null for every missing-row operation', () => {
    expect(repo.getAttemptCount('missing')).toBeNull();
    expect(repo.incrementAttemptCount('missing')).toBeNull();
    expect(repo.getVerified('missing')).toBeNull();
    expect(repo.setVerified('missing', '2026-10-26T00:00:00Z')).toBeNull();
    expect(repo.getAttemptCount('otp')).toBe(0);
    expect(repo.getVerified('otp')).toBe(false);
  });
  // [034ee440-8aef-5f2e-8765-468880e84a91-AC6] FR-S3-AC6
  test('S3-AC6 binds hostile ids and timestamps as data in all four methods', () => {
    const id = "otp' OR 1=1 --";
    expect(repo.getAttemptCount(id)).toBeNull();
    expect(repo.incrementAttemptCount(id)).toBeNull();
    expect(repo.getVerified(id)).toBeNull();
    expect(repo.setVerified(id, '2026-01-01')).toBeNull();
    const timestamp = "2026-10-26T00:00:00Z'; DROP TABLE otp_requests; --";
    repo.setVerified('otp', timestamp);
    expect(fixture.db.prepare('SELECT verified_at FROM otp_requests WHERE id = ?').get('otp'))
      .toEqual({ verified_at: timestamp });
    expect(repo.getAttemptCount('otp')).toBe(0);
  });
});
