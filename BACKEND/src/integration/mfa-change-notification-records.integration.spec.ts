/**
 * Characterization tests for the mfa_change_notification_records table
 * (story 00e31335-9656-5ec1-9dd0-2c560db152a0).
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';
import { runMigrations } from '../db/migrate';
import { createHealthRouter } from '../routes/health.routes';
import { MfaChangeNotificationRecordRepository } from '../repositories/mfa-change-notification-record.repository';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'db', 'migrations');
const PRE_MFA_MIGRATIONS = [
  '001_create_users.sql',
  '002_create_activation_tokens.sql',
  '003_create_registration_email_records.sql',
  '004_create_otp_requests.sql',
  '005_create_sessions.sql',
  '006_create_password_recovery_requests.sql',
  '007_create_account_deletion_requests.sql',
  '008_create_account_deletion_notification_records.sql',
];
const MFA_COLUMNS = [
  'record_id',
  'user_id',
  'recipient_address',
  'mfa_old_state',
  'mfa_new_state',
  'change_timestamp',
  'dispatch_timestamp',
  'delivery_status',
  'retry_count',
];

let filePath: string;
let db: Database.Database;

function openFreshDb(): Database.Database {
  filePath = path.join(
    os.tmpdir(),
    `ums-mfa-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
  );
  const database = new Database(filePath);
  database.pragma('foreign_keys = ON');
  return database;
}

function tableExists(database: Database.Database, name: string): boolean {
  return !!database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name);
}

function insertUser(database: Database.Database, id: string, email: string): void {
  database
    .prepare(
      `INSERT INTO users (id, username, username_normalised, email, password_hash, status, registration_timestamp)
       VALUES (?, ?, ?, ?, 'hash', 'active', ?)`,
    )
    .run(id, id, id, email, new Date('2026-01-01T00:00:00.000Z').toISOString());
}

beforeEach(() => {
  db = openFreshDb();
});

afterEach(() => {
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    if (fs.existsSync(`${filePath}${suffix}`)) fs.unlinkSync(`${filePath}${suffix}`);
  }
});

describe('mfa_change_notification_records schema', () => {
  it('[00e31335-9656-5ec1-9dd0-2c560db152a0-AC1] fresh migration creates the MFA notification table alongside existing tables', () => {
    expect(() => runMigrations(db)).not.toThrow();

    for (const table of [
      'users',
      'registration_email_records',
      'account_deletion_notification_records',
      'mfa_change_notification_records',
    ]) {
      expect(tableExists(db, table)).toBe(true);
    }

    const columns = (db.prepare('PRAGMA table_info(mfa_change_notification_records)').all() as {
      name: string;
    }[]).map((c) => c.name);
    expect(columns).toEqual(MFA_COLUMNS);

    // Re-running startup migrations is a no-op.
    expect(() => runMigrations(db)).not.toThrow();
  });

  it('[00e31335-9656-5ec1-9dd0-2c560db152a0-AC2] insert via repository persists and select returns all stored fields', async () => {
    runMigrations(db);
    insertUser(db, 'user-1', 'user1@example.test');
    const repo = new MfaChangeNotificationRecordRepository(db);
    const changeTimestamp = new Date('2026-10-01T12:00:00.000Z');

    const inserted = await repo.insert({
      userId: 'user-1',
      recipientAddress: 'user1@example.test',
      mfaOldState: 'disabled',
      mfaNewState: 'enabled',
      changeTimestamp,
    });

    const byId = await repo.findById(inserted.recordId);
    expect(byId).toEqual(inserted);
    expect(byId).toMatchObject({
      userId: 'user-1',
      recipientAddress: 'user1@example.test',
      mfaOldState: 'disabled',
      mfaNewState: 'enabled',
      changeTimestamp,
      deliveryStatus: 'queued',
      retryCount: 0,
    });
    expect(byId!.dispatchTimestamp).toBeInstanceOf(Date);
    expect(Number.isNaN(byId!.dispatchTimestamp.getTime())).toBe(false);

    expect(await repo.findByUserId('user-1')).toEqual([inserted]);
    expect(await repo.findByStatus('queued')).toEqual([inserted]);

    await repo.updateStatus(inserted.recordId, 'sent');
    await repo.incrementRetryCount(inserted.recordId);
    expect(await repo.findById(inserted.recordId)).toMatchObject({
      deliveryStatus: 'sent',
      retryCount: 1,
    });
    expect(await repo.findById('missing')).toBeNull();
  });

  it('[00e31335-9656-5ec1-9dd0-2c560db152a0-AC2] rejects invalid MFA states and unknown users', async () => {
    runMigrations(db);
    const repo = new MfaChangeNotificationRecordRepository(db);
    await expect(
      repo.insert({
        userId: 'no-such-user',
        recipientAddress: 'x@example.test',
        mfaOldState: 'disabled',
        mfaNewState: 'enabled',
        changeTimestamp: new Date(),
      }),
    ).rejects.toThrow();

    insertUser(db, 'user-2', 'user2@example.test');
    await expect(
      repo.insert({
        userId: 'user-2',
        recipientAddress: 'user2@example.test',
        mfaOldState: 'disabled',
        mfaNewState: 'bogus' as never,
        changeTimestamp: new Date(),
      }),
    ).rejects.toThrow();
  });

  it('[00e31335-9656-5ec1-9dd0-2c560db152a0-AC3] migrating a populated pre-MFA database is non-destructive', () => {
    db.exec(
      'CREATE TABLE schema_migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
    );
    for (const file of PRE_MFA_MIGRATIONS) {
      db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
      db.prepare('INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)').run(
        file,
        new Date().toISOString(),
      );
    }
    expect(tableExists(db, 'mfa_change_notification_records')).toBe(false);

    insertUser(db, 'user-1', 'user1@example.test');
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO registration_email_records (record_id, user_id, recipient_address, dispatch_timestamp, delivery_status)
       VALUES ('reg-1', 'user-1', 'user1@example.test', ?, 'sent')`,
    ).run(now);
    db.prepare(
      `INSERT INTO account_deletion_notification_records
         (record_id, user_id, recipient_address, deletion_date, dispatch_timestamp, delivery_status)
       VALUES ('del-1', 'user-1', 'user1@example.test', ?, ?, 'queued')`,
    ).run(now, now);

    const snapshot = (table: string): unknown[] =>
      db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
    const schemaOf = (table: string): unknown =>
      db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
    const existing = ['users', 'registration_email_records', 'account_deletion_notification_records'];
    const before = existing.map((t) => ({ rows: snapshot(t), schema: schemaOf(t) }));

    runMigrations(db);

    expect(tableExists(db, 'mfa_change_notification_records')).toBe(true);
    expect(existing.map((t) => ({ rows: snapshot(t), schema: schemaOf(t) }))).toEqual(before);
  });

  it('[00e31335-9656-5ec1-9dd0-2c560db152a0-AC4] /health reports a reachable database after the schema change', async () => {
    runMigrations(db);
    const app = express();
    app.use(createHealthRouter(db));

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db_reachable: true });
    expect(() => db.prepare('SELECT COUNT(*) FROM mfa_change_notification_records').get()).not.toThrow();
  });
});
