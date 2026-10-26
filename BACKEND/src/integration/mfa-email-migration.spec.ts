import * as fs from 'fs';
import * as path from 'path';
import { createDb } from '../db/connection';
import { runMigrations } from '../db/migrate';
import { EmailRecordRepository } from '../repositories/email-record.repository';
import { DeletionNotificationRecordRepository } from '../repositories/deletion-notification-record.repository';

const migrationDir = path.join(__dirname, '../../db/migrations');
const migrationName = '009_create_mfa_setting_change_email_records.sql';
const migration = fs.readFileSync(path.join(migrationDir, migrationName), 'utf8');
const table = 'mfa_setting_change_email_records';
const timestamp = '2026-10-01T12:00:00.000Z';

describe('MFA setting-change email migration', () => {
  let db: ReturnType<typeof createDb>;

  beforeEach(() => { db = createDb(':memory:'); });
  afterEach(() => { db.close(); });

  function seedUser(id = 'user-1'): void {
    db.prepare(`INSERT INTO users
      (id, username, username_normalised, email, password_hash, registration_timestamp)
      VALUES (?, ?, ?, ?, ?, ?)`).run(id, id, id, `${id}@example.com`, 'test-hash', timestamp);
  }

  function insertMfa(): void {
    db.prepare(`INSERT INTO ${table}
      (record_id, user_id, recipient_address, change_type, change_timestamp, dispatch_timestamp)
      VALUES (?, ?, ?, ?, ?, ?)`).run('mfa-1', 'user-1', 'user-1@example.com', 'enabled', timestamp, timestamp);
  }

  // S3-AC1, FR-001–FR-002
  it('[892632f7-2cac-55dd-9b97-581327068c35-AC1] creates the table with existing outbox column conventions', () => {
    runMigrations(db);
    type Column = { name: string; type: string; notnull: number; dflt_value: unknown; pk: number };
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Column[];
    for (const existing of ['registration_email_records', 'account_deletion_notification_records']) {
      const reference = db.prepare(`PRAGMA table_info(${existing})`).all() as Column[];
      for (const name of ['record_id', 'user_id', 'recipient_address', 'dispatch_timestamp', 'delivery_status', 'retry_count']) {
        const expected = reference.find(c => c.name === name)!;
        expect(columns.find(c => c.name === name)).toMatchObject({
          name, type: expected.type, notnull: expected.notnull,
          dflt_value: expected.dflt_value, pk: expected.pk,
        });
      }
    }
    for (const name of ['change_type', 'change_timestamp']) {
      expect(columns.find(c => c.name === name)).toMatchObject({ type: 'TEXT', notnull: 1 });
    }
    expect(db.prepare(`PRAGMA index_list(${table})`).all()).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'idx_mfa_setting_change_email_status' }),
    ]));
  });

  // S3-AC2, FR-003–FR-004
  it('[892632f7-2cac-55dd-9b97-581327068c35-AC2] preserves schema and records on suite and direct SQL reruns', () => {
    runMigrations(db);
    seedUser();
    insertMfa();
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    const schema = db.prepare('SELECT * FROM sqlite_master WHERE tbl_name = ?').all(table);
    runMigrations(db);
    db.exec(migration);
    // Also covers an existing table whose migration has not yet been recorded.
    db.prepare('DELETE FROM schema_migrations WHERE filename = ?').run(migrationName);
    runMigrations(db);
    expect(db.prepare(`SELECT * FROM ${table}`).all()).toEqual(rows);
    expect(db.prepare('SELECT * FROM sqlite_master WHERE tbl_name = ?').all(table)).toEqual(schema);
  });

  // S3-AC3, FR-005
  it('[892632f7-2cac-55dd-9b97-581327068c35-AC3] inserts and selects on the shared application connection', () => {
    runMigrations(db);
    seedUser();
    insertMfa();
    expect(db.prepare(`SELECT * FROM ${table} WHERE record_id = ?`).get('mfa-1')).toMatchObject({
      user_id: 'user-1', change_type: 'enabled', change_timestamp: timestamp,
      dispatch_timestamp: timestamp, delivery_status: 'queued', retry_count: 0,
    });
    expect(() => db.prepare(`UPDATE ${table} SET delivery_status = ?`).run('invalid')).toThrow();
  });

  // S3-AC4, FR-006–FR-007
  it('[892632f7-2cac-55dd-9b97-581327068c35-AC4] preserves populated outboxes and their repository operations', async () => {
    db.exec('CREATE TABLE schema_migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
    for (const file of fs.readdirSync(migrationDir).filter(f => /^00[1-8]_.*\.sql$/.test(f)).sort()) {
      db.exec(fs.readFileSync(path.join(migrationDir, file), 'utf8'));
      db.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run(file, timestamp);
    }
    seedUser();
    db.prepare(`INSERT INTO activation_tokens (id, user_id, token_value, issued_at, expires_at)
      VALUES (?, ?, ?, ?, ?)`).run('token-1', 'user-1', 'test-token', timestamp, timestamp);
    const registration = new EmailRecordRepository(db);
    const deletion = new DeletionNotificationRecordRepository(db);
    const record = await registration.insert({ userId: 'user-1', recipientAddress: 'user-1@example.com',
      dispatchTimestamp: new Date(timestamp), deliveryStatus: 'queued', retryCount: 0, activationTokenId: 'token-1' });
    const deleted = await deletion.insert('deleted-user', 'deleted@example.com', new Date(timestamp));
    const tables = ['registration_email_records', 'account_deletion_notification_records'];
    const snapshot = () => tables.map(name => ({
      schema: db.prepare('SELECT * FROM sqlite_master WHERE tbl_name = ?').all(name),
      rows: db.prepare(`SELECT * FROM ${name}`).all(),
    }));
    const before = snapshot();
    runMigrations(db);
    expect(snapshot()).toEqual(before);
    expect(await registration.findByStatus('queued')).toEqual([record]);
    expect(await deletion.findByStatus('queued')).toEqual([deleted]);
    for (const [repository, id] of [[registration, record.recordId], [deletion, deleted.recordId]] as const) {
      await repository.incrementRetryCount(id);
      await repository.updateStatus(id, 'sent');
      expect(await repository.findByStatus('sent')).toEqual([expect.objectContaining({ recordId: id, retryCount: 1 })]);
    }
    await deletion.insert('another-deleted-user', 'another@example.com', new Date(timestamp));
    expect(await deletion.findByStatus('queued')).toHaveLength(1);
  });
});
