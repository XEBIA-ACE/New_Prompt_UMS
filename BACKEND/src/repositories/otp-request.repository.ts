/**
 * otp-request.repository.ts
 *
 * Repository for the `otp_requests` table.  All queries use parameterised
 * `?` placeholders — no string interpolation.
 *
 * Requirements: US-001 FR-003, FR-004, FR-005
 */

import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { OtpRequestEntity } from '../types/otp.types';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IOtpRequestRepository {
  /**
   * Insert a new OTP request row and return the persisted entity (with
   * generated id).
   */
  create(record: Omit<OtpRequestEntity, 'id'>): Promise<OtpRequestEntity>;

  /**
   * Look up the current active OTP request for a specific user and purpose.
   * Returns null if there is none (partial unique index enforces at most one).
   */
  findActiveByUserAndPurpose(
    userId: string,
    purpose: string,
  ): Promise<OtpRequestEntity | null>;

  /**
   * Mark any currently active OTP request(s) for a user and purpose as EXPIRED.
   * Called before persisting a new OTP to enforce FR-004.
   */
  expireActiveByUserAndPurpose(userId: string, purpose: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Row type returned by better-sqlite3
// ---------------------------------------------------------------------------

interface OtpRequestRow {
  id: string;
  user_id: string;
  email_address: string;
  code_hash: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CONSUMED';
  purpose: string;
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
    purpose: row.purpose as OtpRequestEntity['purpose'],
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class OtpRequestRepository implements IOtpRequestRepository {
  constructor(private readonly db: Database) {}

  async create(record: Omit<OtpRequestEntity, 'id'>): Promise<OtpRequestEntity> {
    const id = uuidv4();
    this.db
      .prepare(
        `INSERT INTO otp_requests
          (id, user_id, email_address, code_hash, status, purpose,
           created_at, expires_at, attempt_sequence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        record.userId,
        record.emailAddress,
        record.codeHash,
        record.status,
        record.purpose,
        record.createdAt.toISOString(),
        record.expiresAt.toISOString(),
        0,
      );

    const row = this.db
      .prepare('SELECT * FROM otp_requests WHERE id = ?')
      .get(id) as OtpRequestRow;
    return rowToEntity(row);
  }

  async findActiveByUserAndPurpose(
    userId: string,
    purpose: string,
  ): Promise<OtpRequestEntity | null> {
    const row = this.db
      .prepare(
        'SELECT * FROM otp_requests WHERE user_id = ? AND purpose = ? AND status = ? LIMIT 1',
      )
      .get(userId, purpose, 'ACTIVE') as OtpRequestRow | undefined;

    return row === undefined ? null : rowToEntity(row);
  }

  async expireActiveByUserAndPurpose(userId: string, purpose: string): Promise<void> {
    this.db
      .prepare(
        "UPDATE otp_requests SET status = 'EXPIRED' WHERE user_id = ? AND purpose = ? AND status = 'ACTIVE'",
      )
      .run(userId, purpose);
  }
}
