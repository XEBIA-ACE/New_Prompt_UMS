/**
 * Characterization tests for story 558d2e95-ac9c-5952-a63b-fb615a91b801
 * (S1: investigate migration number and PATCH/PUT profile endpoint).
 *
 * They pin the repository facts recorded in
 * DOCS/investigations/S1-558d2e95-migration-and-profile-endpoint-findings.md
 * so the findings fail loudly if the codebase drifts before S2/S4 start.
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { Redis } from 'ioredis';
import type { Express } from 'express';
import request from 'supertest';
import { runMigrations } from '../db/migrate';
import { UserProfileController } from '../controllers/user-profile.controller';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import { EmailDeliveryPort } from '../adapters/email-delivery.port';

// app.ts pulls in config modules that fail fast on missing env vars at
// import time, so placeholders are set before it is loaded dynamically.
const PLACEHOLDER_ENV = [
  'ACCOUNT_DELETION_NOTICE_EMAIL_TEMPLATE_ID',
  'ACCOUNT_DELETION_REQUEST_EMAIL_TEMPLATE_ID',
  'ACTIVATION_BASE_URL',
  'ADMIN_BEARER_TOKEN',
  'FROM_EMAIL',
  'OTP_EMAIL_TEMPLATE_ID',
  'OTP_HASH_SECRET',
  'PASSWORD_RECOVERY_BASE_URL',
  'PASSWORD_RECOVERY_EMAIL_TEMPLATE_ID',
  'SENDGRID_API_KEY',
  'SENDGRID_TEMPLATE_ID',
];

const BACKEND_DIR = path.resolve(__dirname, '..', '..');
const MIGRATIONS_DIR = path.join(BACKEND_DIR, 'db', 'migrations');
const SRC_DIR = path.join(BACKEND_DIR, 'src');
const FINDINGS_DOC = path.resolve(
  BACKEND_DIR,
  '..',
  'DOCS',
  'investigations',
  'S1-558d2e95-migration-and-profile-endpoint-findings.md',
);

function migrationNumbers(): number[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .map((f) => parseInt(f.slice(0, 3), 10))
    .sort((a, b) => a - b);
}

function registeredMigrationFiles(file: string): string[] {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/'(\d{3}_[^']+\.sql)'/g)].map((m) => m[1]);
}

function readFindings(): string {
  return fs.readFileSync(FINDINGS_DOC, 'utf8');
}

describe('S1 characterization — migration numbering', () => {
  // [S1-AC1]
  test('[S1-AC1] highest migration on main is 008 and next free number is 009', () => {
    const numbers = migrationNumbers();

    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(Math.max(...numbers)).toBe(8);
    expect(numbers).not.toContain(9);
  });

  // [S1-AC1] [IMPACT T007]
  test('[S1-AC1] recommended S2 number 010 does not collide with any existing migration file', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);

    expect(files.some((f) => f.startsWith('009_'))).toBe(false);
    expect(files.some((f) => f.startsWith('010_'))).toBe(false);
  });

  // [S1-AC1] both runMigrations candidates (CAST 2385 / 2406) register the same files
  test('[S1-AC1] both runMigrations entry points list exactly the files on disk, in order', () => {
    const onDisk = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => /^\d{3}_.+\.sql$/.test(f))
      .sort();
    const cli = registeredMigrationFiles(path.join(MIGRATIONS_DIR, 'run-migrations.ts'));
    const startup = registeredMigrationFiles(path.join(SRC_DIR, 'db', 'migrate.ts'));

    expect(cli).toEqual(onDisk);
    expect(startup).toEqual(onDisk);
  });

  // [S1-AC1]
  test('[S1-AC1] findings record highest=008, next free=009, 009 claimed by US-005, S2 uses 010', () => {
    const doc = readFindings();

    expect(doc).toContain('Highest migration number on `main`: `008`');
    expect(doc).toContain('Next free number on `main`: `009`');
    expect(doc).toMatch(/Is 009 already claimed by US-005\?[\s\S]*\*\*Yes\.\*\*/);
    expect(doc).toContain('Next free migration number for S2: `010`');
  });
});

describe('S1 characterization — PATCH/PUT /api/v1/users/me', () => {
  const routeSources = fs
    .readdirSync(path.join(SRC_DIR, 'routes'))
    .filter((f) => f.endsWith('.routes.ts'))
    .map((f) => fs.readFileSync(path.join(SRC_DIR, 'routes', f), 'utf8'));

  // [S1-AC2] [IMPACT T008]
  test('[S1-AC2] no router file registers a PATCH or PUT handler', () => {
    for (const source of routeSources) {
      expect(source).not.toMatch(/\.(patch|put)\s*\(/);
    }
  });

  // [S1-AC2] [IMPACT T008]
  test('[S1-AC2] user-profile router only registers GET /me', () => {
    const source = fs.readFileSync(path.join(SRC_DIR, 'routes', 'user-profile.routes.ts'), 'utf8');
    const routes = [...source.matchAll(/router\.(\w+)\(\s*'([^']+)'/g)].map((m) => `${m[1]} ${m[2]}`);

    expect(routes).toEqual(['get /me']);
  });

  // [S1-AC2] [IMPACT T008]
  test('[S1-AC2] UserProfileController exposes only getMe (no update handler)', () => {
    const methods = Object.getOwnPropertyNames(UserProfileController.prototype).filter(
      (m) => m !== 'constructor',
    );

    expect(methods).toEqual(['getMe']);
  });

  describe('[S1-AC2] runtime behaviour of app.ts', () => {
    let db: Database.Database;
    let redis: Redis;
    let app: Express;

    beforeAll(async () => {
      for (const key of PLACEHOLDER_ENV) {
        process.env[key] ||= `s1-characterization-${key.toLowerCase()}`;
      }
      const { createApp } = await import('../app');
      db = new Database(':memory:');
      runMigrations(db);
      redis = new Redis({ lazyConnect: true });
      app = createApp(db, redis, {} as OtpDeliveryPort, {} as EmailDeliveryPort);
    });

    afterAll(() => {
      redis.disconnect();
      db.close();
    });

    test('[S1-AC2] GET /api/v1/users/me exists (reaches session guard)', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
    });

    test.each(['patch', 'put'] as const)(
      '[S1-AC2] %s /api/v1/users/me is not routed (falls through to 404)',
      async (method) => {
        const res = await request(app)[method]('/api/v1/users/me').send({});

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Not found.' });
      },
    );
  });

  // [S1-AC2]
  test('[S1-AC2] findings state an explicit "not found" conclusion', () => {
    const doc = readFindings();

    expect(doc).toMatch(/Finding 2[\s\S]*\*\*Not found\.\*\*/);
    expect(doc).not.toMatch(/\bunknown\b[^\n]*PATCH/i);
  });
});

describe('S1 characterization — shared artifact', () => {
  // [S1-AC3]
  test('[S1-AC3] a single shared artifact records both findings and names S2 and S4 as consumers', () => {
    const doc = readFindings();

    expect(doc).toContain('Finding 1');
    expect(doc).toContain('Finding 2');
    expect(doc).toMatch(/S2[\s\S]*S4/);
  });

  // [S1-AC3] security obligation: no sensitive schema details in a public location
  test('[S1-AC3] artifact contains no raw SQL or credentials', () => {
    const doc = readFindings();

    expect(doc).not.toMatch(/\b(CREATE|ALTER|DROP)\s+TABLE\b/i);
    expect(doc).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(doc).not.toMatch(/password\s*[:=]/i);
  });
});
