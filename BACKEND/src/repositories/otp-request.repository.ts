/**
 * otp-request.repository.ts
 *
 * Repository for the `otp_requests` table.  All queries use parameterised
 * `?` placeholders — no string interpolation.
 *
 * Requirements: US-002 FR-003, FR-006, FR-009
 */

import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { OtpRequestEntity } from '../types/otp.types';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IOtpRequestRepository {
  // FR-S3-AC5 / S3-AC5: all four methods return null for a missing row.
  // Synchronous SQLite access keeps writes inside the service transaction.
  getAttemptCount(otpRequestId: string): number | null;
  incrementAttemptCount(otpRequestId: string): number | null;
  getVerified(otpRequestId: string): boolean | null;
  setVerified(otpRequestId: string, timestamp: string): boolean | null;
  create(record: Omit<OtpRequestEntity, 'id'>): Promise<OtpRequestEntity>;
  findActiveByUserId(userId: string): Promise<OtpRequestEntity | null>;
  invalidateActiveByUserId(userId: string): Promise<void>;
  markDelivered(id: string): Promise<void>;
  markFailed(id: string): Promise<void>;
  findById(id: string): Promise<OtpRequestEntity | null>;
  getNextAttemptSequence(userId: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Row type returned by better-sqlite3
// ---------------------------------------------------------------------------

interface OtpRequestRow {
  id: string;
  user_id: string;
  email_address: string;
  code_hash: string;
  status: 'pending' | 'delivered' | 'failed';
  created_at: string;
  expires_at: string;
  invalidated_at: string | null;
  attempt_sequence: number;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function rowToEntity(row: OtpRequestRow): OtpRequestEntity {
  return {
    id: row.id,
    userId: row.user_id,
    emailAddress: row.email_address,
    codeHash: row.code_hash,
    status: row.status,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    invalidatedAt: row.invalidated_at === null ? null : new Date(row.invalidated_at),
    attemptSequence: row.attempt_sequence,
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class OtpRequestRepository implements IOtpRequestRepository {
  constructor(private readonly db: Database) {}

  /** FR-S3-AC1 / S3-AC1; FR-S3-AC6: bind the request id. */
  getAttemptCount(otpRequestId: string): number | null {
    const row = this.db.prepare('SELECT attempt_count FROM otp_requests WHERE id = ?')
      .get(otpRequestId) as { attempt_count: number } | undefined;
    return row === undefined ? null : row.attempt_count;
  }

  /** FR-S3-AC2 / S3-AC2: atomic increment and return, without a read/write race. */
  incrementAttemptCount(otpRequestId: string): number | null {
    const row = this.db.prepare(
      'UPDATE otp_requests SET attempt_count = attempt_count + 1 WHERE id = ? RETURNING attempt_count',
    ).get(otpRequestId) as { attempt_count: number } | undefined;
    return row === undefined ? null : row.attempt_count;
  }

  /** FR-S3-AC3 / S3-AC3: SQLite stores booleans as integers. */
  getVerified(otpRequestId: string): boolean | null {
    const row = this.db.prepare('SELECT verified FROM otp_requests WHERE id = ?')
      .get(otpRequestId) as { verified: number } | undefined;
    return row === undefined ? null : row.verified === 1;
  }

  /**
   * FR-S3-AC4 / S3-AC4, FR-S3-AC6 / S3-AC6: timestamp is a caller-provided
   * ISO 8601 value, bound verbatim. Returns true on update, null if missing.
   * Repeated writes retain the first verification timestamp (minimal assumption).
   */
  setVerified(otpRequestId: string, timestamp: string): boolean | null {
    const row = this.db.prepare(
      `UPDATE otp_requests SET verified_at = CASE WHEN verified = 0 THEN ? ELSE verified_at END,
       verified = 1 WHERE id = ? RETURNING verified`,
    ).get(timestamp, otpRequestId) as { verified: number } | undefined;
    return row === undefined ? null : row.verified === 1;
  }

  /**
   * Insert a new OTP request row and return the persisted entity (with
   * generated id).
   */
  async create(record: Omit<OtpRequestEntity, 'id'>): Promise<OtpRequestEntity> {
    const id = uuidv4();
    this.db
      .prepare(
        `INSERT INTO otp_requests
          (id, user_id, email_address, code_hash, status, created_at, expires_at,
           invalidated_at, attempt_sequence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        record.userId,
        record.emailAddress,
        record.codeHash,
        record.status,
        record.createdAt.toISOString(),
        record.expiresAt.toISOString(),
        record.invalidatedAt === null ? null : record.invalidatedAt.toISOString(),
        record.attemptSequence,
      );

    const row = this.db.prepare('SELECT * FROM otp_requests WHERE id = ?').get(id) as OtpRequestRow;
    return rowToEntity(row);
  }

  /**
   * Look up the current active (non-invalidated) OTP request for a user.
   * Returns null if there is none (partial unique index enforces at most one).
   */
  async findActiveByUserId(userId: string): Promise<OtpRequestEntity | null> {
    const row = this.db
      .prepare('SELECT * FROM otp_requests WHERE user_id = ? AND invalidated_at IS NULL LIMIT 1')
      .get(userId) as OtpRequestRow | undefined;

    return row === undefined ? null : rowToEntity(row);
  }

  /**
   * Mark any currently active OTP request(s) for a user as invalidated.
   */
  async invalidateActiveByUserId(userId: string): Promise<void> {
    this.db
      .prepare('UPDATE otp_requests SET invalidated_at = ? WHERE user_id = ? AND invalidated_at IS NULL')
      .run(new Date().toISOString(), userId);
  }

  /**
   * Mark an OTP request as successfully delivered.
   */
  async markDelivered(id: string): Promise<void> {
    this.db.prepare("UPDATE otp_requests SET status = 'delivered' WHERE id = ?").run(id);
  }

  /**
   * Mark an OTP request as failed to deliver.
   */
  async markFailed(id: string): Promise<void> {
    this.db.prepare("UPDATE otp_requests SET status = 'failed' WHERE id = ?").run(id);
  }

  /**
   * Look up an OTP request by its primary key UUID.
   * Returns null if no match is found.
   */
  async findById(id: string): Promise<OtpRequestEntity | null> {
    const row = this.db.prepare('SELECT * FROM otp_requests WHERE id = ? LIMIT 1').get(id) as
      | OtpRequestRow
      | undefined;

    return row === undefined ? null : rowToEntity(row);
  }

  /**
   * Compute the next monotonically increasing attempt_sequence value for a
   * user, based on how many OTP requests have previously been issued to them.
   */
  async getNextAttemptSequence(userId: string): Promise<number> {
    const row = this.db
      .prepare(
        'SELECT COALESCE(MAX(attempt_sequence), 0) + 1 AS next_sequence FROM otp_requests WHERE user_id = ?',
      )
      .get(userId) as { next_sequence: number };

    return row.next_sequence;
  }
}
