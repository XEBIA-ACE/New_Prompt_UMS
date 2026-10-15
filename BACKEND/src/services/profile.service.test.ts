import type { Database } from 'better-sqlite3';
import { createTestDb, closeTestDb, clearAllTables, TestDb } from '../integration/test-db';
import { ProfileRepository } from '../repositories/profile.repository';
import { DefaultProfileService } from './profile.service';
import { UserNotFoundException } from '../errors/registration.errors';
import {
  ProfileEmailAlreadyInUseException,
  ProfileVersionConflictException,
} from '../errors/profile.errors';

const NOW = new Date('2026-10-15T10:00:00.000Z');

let testDb: TestDb;
let db: Database;
let service: DefaultProfileService;

function insertUser(id: string, email: string): void {
  db.prepare(
    `INSERT INTO users (id, username, username_normalised, email, password_hash, status, registration_timestamp)
     VALUES (?, ?, ?, ?, 'hash', 'active', '2026-01-01T00:00:00.000Z')`,
  ).run(id, `user-${id}`, `user-${id}`, email);
}

const auditRows = (userId: string) =>
  db.prepare('SELECT action, changed_fields, profile_version FROM user_profile_audit_log WHERE user_id = ? ORDER BY occurred_at, rowid').all(userId) as Array<{ action: string; changed_fields: string | null; profile_version: number }>;
const outboxRows = () =>
  db.prepare('SELECT topic, aggregate_id, payload FROM domain_event_outbox').all() as Array<{ topic: string; aggregate_id: string; payload: string }>;

beforeAll(() => {
  testDb = createTestDb();
  db = testDb.db;
  service = new DefaultProfileService(db, new ProfileRepository(db), () => NOW);
});

beforeEach(() => {
  clearAllTables(db);
  insertUser('u1', 'one@example.test');
  insertUser('u2', 'two@example.test');
});

afterAll(() => closeTestDb(testDb));

describe('DefaultProfileService', () => {
  test('[US-004-AC1] [US-004-AC17] getProfile returns the stored profile attributes', async () => {
    const profile = await service.getProfile('u1');
    expect(profile).toMatchObject({
      userId: 'u1',
      username: 'user-u1',
      email: 'one@example.test',
      displayName: null,
      phoneNumber: null,
      status: 'active',
      version: 1,
      profileUpdatedAt: null,
    });
  });

  test('[US-004-AC10] [US-004-AC25] getProfile records a profile.viewed audit entry', async () => {
    await service.getProfile('u1');
    expect(auditRows('u1')).toEqual([{ action: 'profile.viewed', changed_fields: null, profile_version: 1 }]);
  });

  test('getProfile for a missing user throws UserNotFoundException', async () => {
    await expect(service.getProfile('missing')).rejects.toBeInstanceOf(UserNotFoundException);
  });

  test('[US-004-AC5] [US-004-AC66] [US-004-AC7] updateProfile persists changes and bumps the version', async () => {
    const updated = await service.updateProfile('u1', {
      displayName: 'Jane',
      email: 'jane@example.test',
      phoneNumber: '+15550102000',
      version: 1,
    });
    expect(updated).toMatchObject({ displayName: 'Jane', email: 'jane@example.test', version: 2, profileUpdatedAt: NOW });
    expect(await service.getProfile('u1')).toMatchObject({ displayName: 'Jane', email: 'jane@example.test', phoneNumber: '+15550102000', version: 2 });
  });

  test('[US-004-AC18] [US-004-AC41] updateProfile writes an audit entry with changed field names only', async () => {
    await service.updateProfile('u1', { displayName: 'Jane', email: 'one@example.test', phoneNumber: null, version: 1 });
    expect(auditRows('u1')).toEqual([
      { action: 'profile.updated', changed_fields: '["displayName"]', profile_version: 2 },
    ]);
  });

  test('[US-004-AC11] [US-004-AC16] updateProfile enqueues a user.profile.updated event', async () => {
    await service.updateProfile('u1', { displayName: 'Jane', email: 'new@example.test', phoneNumber: null, version: 1 });
    const rows = outboxRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].topic).toBe('user.profile.updated');
    expect(rows[0].aggregate_id).toBe('u1');
    expect(JSON.parse(rows[0].payload)).toMatchObject({
      topic: 'user.profile.updated',
      userId: 'u1',
      profileVersion: 2,
      changedFields: ['displayName', 'email'],
      occurredAt: NOW.toISOString(),
    });
  });

  test('no-op submission does not bump the version, audit or publish', async () => {
    const result = await service.updateProfile('u1', { displayName: null, email: 'one@example.test', phoneNumber: null, version: 1 });
    expect(result.version).toBe(1);
    expect(auditRows('u1')).toEqual([]);
    expect(outboxRows()).toEqual([]);
  });

  test('[US-004-AC40] [US-004-AC52] stale version is rejected with ProfileVersionConflictException', async () => {
    await service.updateProfile('u1', { displayName: 'First', email: 'one@example.test', phoneNumber: null, version: 1 });
    await expect(
      service.updateProfile('u1', { displayName: 'Second', email: 'one@example.test', phoneNumber: null, version: 1 }),
    ).rejects.toMatchObject({ currentVersion: 2 });
    expect((await service.getProfile('u1')).displayName).toBe('First');
  });

  test('email already used by another account is rejected and nothing is written', async () => {
    await expect(
      service.updateProfile('u1', { displayName: 'Jane', email: 'two@example.test', phoneNumber: null, version: 1 }),
    ).rejects.toBeInstanceOf(ProfileEmailAlreadyInUseException);
    expect((await service.getProfile('u1')).displayName).toBeNull();
    expect(outboxRows()).toEqual([]);
  });

  test('[US-004-AC3] [US-004-AC22] updating one user never touches another user', async () => {
    await service.updateProfile('u1', { displayName: 'Jane', email: 'one@example.test', phoneNumber: null, version: 1 });
    expect(await service.getProfile('u2')).toMatchObject({ displayName: null, version: 1 });
  });

  test('ProfileVersionConflictException is the type thrown on conflict', async () => {
    await expect(
      service.updateProfile('u1', { displayName: 'x', email: 'one@example.test', phoneNumber: null, version: 5 }),
    ).rejects.toBeInstanceOf(ProfileVersionConflictException);
  });
});
