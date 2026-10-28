/**
 * user-mfa-flag.integration.spec.ts
 *
 * Story effa3c4f-4382-54b5-beb0-fad608d1cb94 — MFA setting flag on the user
 * domain model (`UserEntity.mfaEnabled`) and the `users.mfa_enabled` column.
 * Runs against real SQLite databases built from db/migrations/.
 *
 * [S1-AC5] is covered by the full pre-existing unit + integration suites
 * continuing to pass unchanged alongside this spec.
 */

process.env.ADMIN_BEARER_TOKEN = 'test-admin-token';
process.env.SENDGRID_API_KEY = 'SG.test-key';
process.env.SENDGRID_TEMPLATE_ID = 'd-test-template';
process.env.ACTIVATION_BASE_URL = 'https://example.test';
process.env.FROM_EMAIL = 'no-reply@example.test';
process.env.PASSWORD_RECOVERY_BASE_URL = 'https://example.test';
process.env.PASSWORD_RECOVERY_EMAIL_TEMPLATE_ID = 'd-test-recovery-template';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import Database from 'better-sqlite3';
import { runMigrations } from '../db/migrate';
import { UserRepository, NewUserEntity } from '../repositories/user.repository';
import { createTestDb, clearAllTables, closeTestDb, TestDb } from './test-db';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'db', 'migrations');
const MFA_MIGRATION = '009_add_users_mfa_enabled.sql';

type RawRow = Record<string, unknown>;

function readUserRow(db: Database.Database, id: string): RawRow {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as RawRow;
}

function withoutMfa(row: RawRow): RawRow {
  const rest = { ...row };
  delete rest.mfa_enabled;
  return rest;
}

function newUser(overrides: Partial<NewUserEntity> = {}): NewUserEntity {
  const suffix = Math.random().toString(36).slice(2, 10);
  return {
    username: `User-${suffix}`,
    usernameNormalised: `user-${suffix}`,
    email: `user-${suffix}@example.test`,
    passwordHash: '$2b$12$fixturehashfixturehashfixturehashfixturehashfixtureha',
    status: 'active',
    registrationTimestamp: new Date('2026-01-01T00:00:00.000Z'),
    activatedAt: new Date('2026-01-01T00:05:00.000Z'),
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    deletedAt: null,
    ...overrides,
  };
}

/** Populate security/session-related columns so the "unchanged" checks are meaningful. */
function seedSecurityState(db: Database.Database, userId: string): void {
  db.prepare(
    `UPDATE users
     SET failed_login_count = 2, locked_until = ?, last_login_at = ?
     WHERE id = ?`,
  ).run('2026-02-01T00:00:00.000Z', '2026-01-15T12:00:00.000Z', userId);
  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    `session-${userId}`,
    userId,
    `token-hash-${userId}`,
    '2026-01-15T12:00:00.000Z',
    '2026-01-15T13:00:00.000Z',
  );
}

function readSessions(db: Database.Database, userId: string): RawRow[] {
  return db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY id').all(userId) as RawRow[];
}

describe('Integration | User MFA setting flag', () => {
  describe('[S1-AC1] existing users without an MFA value', () => {
    let filePath: string;
    let db: Database.Database;

    beforeEach(() => {
      filePath = path.join(
        os.tmpdir(),
        `ums-mfa-legacy-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
      );
      db = new Database(filePath);
      db.pragma('foreign_keys = ON');
    });

    afterEach(() => {
      db.close();
      for (const suffix of ['', '-wal', '-shm']) {
        if (fs.existsSync(`${filePath}${suffix}`)) fs.unlinkSync(`${filePath}${suffix}`);
      }
    });

    /** Builds a database at the pre-story schema (001–008 applied and recorded). */
    function applyPreMfaSchema(): void {
      runMigrations(db);
      db.exec('ALTER TABLE users DROP COLUMN mfa_enabled');
      db.prepare('DELETE FROM schema_migrations WHERE filename = ?').run(MFA_MIGRATION);
    }

    test('[S1-AC1] schema update backfills a deterministic MFA-disabled default and preserves other fields', async () => {
      applyPreMfaSchema();
      const columnsBefore = (db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>).map((c) => c.name);
      expect(columnsBefore).not.toContain('mfa_enabled');

      db.prepare(
        `INSERT INTO users
           (id, username, username_normalised, email, password_hash, status,
            registration_timestamp, activated_at, failed_login_count, locked_until, last_login_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 3, ?, ?)`,
      ).run(
        'legacy-user-1',
        'Legacy',
        'legacy',
        'legacy@example.test',
        'legacy-password-hash',
        '2025-06-01T00:00:00.000Z',
        '2025-06-01T00:10:00.000Z',
        '2025-07-01T00:00:00.000Z',
        '2025-06-30T00:00:00.000Z',
      );
      const before = readUserRow(db, 'legacy-user-1');

      runMigrations(db);

      const after = readUserRow(db, 'legacy-user-1');
      expect(after.mfa_enabled).toBe(0);
      expect(withoutMfa(after)).toEqual(before);

      const user = await new UserRepository(db).findById('legacy-user-1');
      expect(user).not.toBeNull();
      expect(user!.mfaEnabled).toBe(false);
      expect(user).toMatchObject({
        username: 'Legacy',
        email: 'legacy@example.test',
        passwordHash: 'legacy-password-hash',
        status: 'active',
        failedLoginCount: 3,
        lockedUntil: new Date('2025-07-01T00:00:00.000Z'),
        lastLoginAt: new Date('2025-06-30T00:00:00.000Z'),
      });
    });

    test('[S1-AC1] rollback script removes the column without touching other user data', () => {
      runMigrations(db);
      db.prepare(
        `INSERT INTO users (id, username, username_normalised, email, password_hash, status, registration_timestamp)
         VALUES ('rb-user', 'Rb', 'rb', 'rb@example.test', 'rb-hash', 'active', '2026-01-01T00:00:00.000Z')`,
      ).run();
      const before = withoutMfa(readUserRow(db, 'rb-user'));

      db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, '009_add_users_mfa_enabled.down.sql'), 'utf8'));

      const after = readUserRow(db, 'rb-user');
      expect(after).not.toHaveProperty('mfa_enabled');
      expect(after).toEqual(before);
    });
  });

  describe('with the current schema', () => {
    let testDb: TestDb;
    let db: Database.Database;
    let repository: UserRepository;

    beforeAll(() => {
      testDb = createTestDb();
      db = testDb.db;
      repository = new UserRepository(db);
    });

    afterEach(() => {
      clearAllTables(db);
    });

    afterAll(() => {
      closeTestDb(testDb);
    });

    test('[S1-AC2] the mfa_enabled column rejects NULL and non-boolean values', () => {
      const insert = (value: unknown) =>
        db
          .prepare(
            `INSERT INTO users (id, username, username_normalised, email, password_hash, status, registration_timestamp, mfa_enabled)
             VALUES (?, ?, ?, ?, 'h', 'active', '2026-01-01T00:00:00.000Z', ?)`,
          )
          .run(`id-${String(value)}`, `u-${String(value)}`, `u-${String(value)}`, `u-${String(value)}@example.test`, value);

      expect(() => insert(null)).toThrow(/NOT NULL/);
      expect(() => insert(2)).toThrow(/CHECK/);
    });

    test('[S1-AC2] UserRepository.insert stores an explicit MFA-disabled default when no value is provided', async () => {
      const created = await repository.insert(newUser());

      expect(created.mfaEnabled).toBe(false);
      expect(readUserRow(db, created.id).mfa_enabled).toBe(0);
      expect((await repository.findById(created.id))!.mfaEnabled).toBe(false);
    });

    test('[S1-AC2] UserRepository.insert stores an explicitly provided MFA value', async () => {
      const created = await repository.insert(newUser({ mfaEnabled: true }));

      expect(created.mfaEnabled).toBe(true);
      expect(readUserRow(db, created.id).mfa_enabled).toBe(1);
      expect((await repository.findById(created.id))!.mfaEnabled).toBe(true);
    });

    test('[S1-AC2] the registration flow persists an explicit, non-NULL MFA flag', async () => {
      const { DefaultRegistrationService } = await import('../services/registration.service');
      const { userId } = await new DefaultRegistrationService(db).register({
        username: 'MfaRegistrant',
        emailAddress: 'mfa-registrant@example.test',
        password: 'Passw0rd!',
        passwordConfirmation: 'Passw0rd!',
      });

      const row = readUserRow(db, userId);
      expect(row.mfa_enabled).not.toBeNull();
      expect(row.mfa_enabled).toBe(0);
      expect((await repository.findById(userId))!.mfaEnabled).toBe(false);
    });

    test('[S1-AC3] enabling MFA round-trips and leaves all other user attributes unchanged', async () => {
      const created = await repository.insert(newUser());
      seedSecurityState(db, created.id);
      const rowBefore = readUserRow(db, created.id);
      const sessionsBefore = readSessions(db, created.id);
      expect(rowBefore.mfa_enabled).toBe(0);

      await repository.updateMfaEnabled(created.id, true);

      const rowAfter = readUserRow(db, created.id);
      expect(rowAfter.mfa_enabled).toBe(1);
      expect(withoutMfa(rowAfter)).toEqual(withoutMfa(rowBefore));
      expect(readSessions(db, created.id)).toEqual(sessionsBefore);
      expect((await repository.findById(created.id))!.mfaEnabled).toBe(true);
    });

    test('[S1-AC4] disabling MFA round-trips and leaves email, password hash and session data intact', async () => {
      const created = await repository.insert(newUser({ mfaEnabled: true }));
      seedSecurityState(db, created.id);
      const rowBefore = readUserRow(db, created.id);
      const sessionsBefore = readSessions(db, created.id);
      expect(rowBefore.mfa_enabled).toBe(1);

      await repository.updateMfaEnabled(created.id, false);

      const rowAfter = readUserRow(db, created.id);
      expect(rowAfter.mfa_enabled).toBe(0);
      expect(withoutMfa(rowAfter)).toEqual(withoutMfa(rowBefore));
      expect(rowAfter.email).toBe(created.email);
      expect(rowAfter.password_hash).toBe(created.passwordHash);
      expect(readSessions(db, created.id)).toEqual(sessionsBefore);
      expect((await repository.findById(created.id))!.mfaEnabled).toBe(false);
    });

    test('[S1-AC3][S1-AC4] updating one user\'s MFA flag does not affect other users', async () => {
      const target = await repository.insert(newUser());
      const other = await repository.insert(newUser());
      const otherBefore = readUserRow(db, other.id);

      await repository.updateMfaEnabled(target.id, true);

      expect(readUserRow(db, other.id)).toEqual(otherBefore);
    });
  });
});
