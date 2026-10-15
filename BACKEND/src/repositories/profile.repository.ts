/**
 * profile.repository.ts
 *
 * US-004 persistence for the `users` profile columns, the
 * `user_profile_audit_log` table and the `domain_event_outbox` table.
 *
 * Methods are synchronous (better-sqlite3) so ProfileService can compose them
 * inside a single `withTransaction` callback. Parameterised queries only.
 */

import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  EditableProfileField,
  EditableProfileFields,
  ProfileAuditAction,
  ProfileDetails,
} from '../types/profile.types';

interface ProfileRow {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  phone_number: string | null;
  status: ProfileDetails['status'];
  registration_timestamp: string;
  last_login_at: string | null;
  profile_updated_at: string | null;
  profile_version: number;
}

function rowToProfile(row: ProfileRow): ProfileDetails {
  return {
    userId: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    phoneNumber: row.phone_number,
    status: row.status,
    registrationTimestamp: new Date(row.registration_timestamp),
    lastLoginAt: row.last_login_at === null ? null : new Date(row.last_login_at),
    profileUpdatedAt: row.profile_updated_at === null ? null : new Date(row.profile_updated_at),
    version: row.profile_version,
  };
}

export interface IProfileRepository {
  findById(userId: string): ProfileDetails | null;
  isEmailUsedByAnotherUser(email: string, userId: string): boolean;
  /** Returns false when `expectedVersion` no longer matches (lost the race). */
  updateIfVersionMatches(
    userId: string,
    fields: EditableProfileFields,
    expectedVersion: number,
    updatedAt: Date,
  ): boolean;
  insertAuditEntry(
    userId: string,
    action: ProfileAuditAction,
    profileVersion: number,
    occurredAt: Date,
    changedFields?: EditableProfileField[],
  ): void;
  insertOutboxEvent(id: string, topic: string, aggregateId: string, payload: unknown, createdAt: Date): void;
}

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly db: Database) {}

  findById(userId: string): ProfileDetails | null {
    const row = this.db
      .prepare(
        `SELECT id, username, email, display_name, phone_number, status,
                registration_timestamp, last_login_at, profile_updated_at, profile_version
         FROM users WHERE id = ? LIMIT 1`,
      )
      .get(userId) as ProfileRow | undefined;
    return row === undefined ? null : rowToProfile(row);
  }

  isEmailUsedByAnotherUser(email: string, userId: string): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM users WHERE email = ? AND id <> ? LIMIT 1')
      .get(email, userId);
    return row !== undefined;
  }

  updateIfVersionMatches(
    userId: string,
    fields: EditableProfileFields,
    expectedVersion: number,
    updatedAt: Date,
  ): boolean {
    const result = this.db
      .prepare(
        `UPDATE users
         SET display_name = ?, email = ?, phone_number = ?,
             profile_version = profile_version + 1, profile_updated_at = ?
         WHERE id = ? AND profile_version = ?`,
      )
      .run(
        fields.displayName,
        fields.email,
        fields.phoneNumber,
        updatedAt.toISOString(),
        userId,
        expectedVersion,
      );
    return result.changes === 1;
  }

  insertAuditEntry(
    userId: string,
    action: ProfileAuditAction,
    profileVersion: number,
    occurredAt: Date,
    changedFields?: EditableProfileField[],
  ): void {
    this.db
      .prepare(
        `INSERT INTO user_profile_audit_log
           (id, user_id, action, changed_fields, profile_version, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        uuidv4(),
        userId,
        action,
        changedFields === undefined ? null : JSON.stringify(changedFields),
        profileVersion,
        occurredAt.toISOString(),
      );
  }

  insertOutboxEvent(id: string, topic: string, aggregateId: string, payload: unknown, createdAt: Date): void {
    this.db
      .prepare(
        `INSERT INTO domain_event_outbox (id, topic, aggregate_id, payload, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, topic, aggregateId, JSON.stringify(payload), createdAt.toISOString());
  }
}
