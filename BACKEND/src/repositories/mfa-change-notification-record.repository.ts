/**
 * mfa-change-notification-record.repository.ts
 *
 * Repository for the `mfa_change_notification_records` table (transactional
 * outbox for MFA change notifications). Same shape as
 * DeletionNotificationRecordRepository. All queries use parameterised `?`
 * placeholders — no string interpolation.
 */

import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  MfaChangeNotificationRecord,
  MfaNotificationDeliveryStatus,
  MfaState,
  NewMfaChangeNotificationRecord,
} from '../types/mfa-notification.types';

export interface IMfaChangeNotificationRecordRepository {
  insert(record: NewMfaChangeNotificationRecord): Promise<MfaChangeNotificationRecord>;
  findById(recordId: string): Promise<MfaChangeNotificationRecord | null>;
  findByUserId(userId: string): Promise<MfaChangeNotificationRecord[]>;
  findByStatus(status: MfaNotificationDeliveryStatus): Promise<MfaChangeNotificationRecord[]>;
  updateStatus(recordId: string, status: 'sent' | 'failed'): Promise<void>;
  incrementRetryCount(recordId: string): Promise<void>;
}

interface MfaChangeNotificationRecordRow {
  record_id: string;
  user_id: string;
  recipient_address: string;
  mfa_old_state: MfaState;
  mfa_new_state: MfaState;
  change_timestamp: string;
  dispatch_timestamp: string;
  delivery_status: MfaNotificationDeliveryStatus;
  retry_count: number;
}

function rowToEntity(row: MfaChangeNotificationRecordRow): MfaChangeNotificationRecord {
  return {
    recordId: row.record_id,
    userId: row.user_id,
    recipientAddress: row.recipient_address,
    mfaOldState: row.mfa_old_state,
    mfaNewState: row.mfa_new_state,
    changeTimestamp: new Date(row.change_timestamp),
    dispatchTimestamp: new Date(row.dispatch_timestamp),
    deliveryStatus: row.delivery_status,
    retryCount: row.retry_count,
  };
}

export class MfaChangeNotificationRecordRepository
  implements IMfaChangeNotificationRecordRepository
{
  constructor(private readonly db: Database) {}

  /**
   * Insert a new outbox record (deliveryStatus starts 'queued') and return the
   * persisted entity.
   */
  async insert(record: NewMfaChangeNotificationRecord): Promise<MfaChangeNotificationRecord> {
    const recordId = uuidv4();
    this.db
      .prepare(
        `INSERT INTO mfa_change_notification_records
          (record_id, user_id, recipient_address, mfa_old_state, mfa_new_state,
           change_timestamp, dispatch_timestamp, delivery_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'queued')`,
      )
      .run(
        recordId,
        record.userId,
        record.recipientAddress,
        record.mfaOldState,
        record.mfaNewState,
        record.changeTimestamp.toISOString(),
        new Date().toISOString(),
      );

    return (await this.findById(recordId)) as MfaChangeNotificationRecord;
  }

  async findById(recordId: string): Promise<MfaChangeNotificationRecord | null> {
    const row = this.db
      .prepare('SELECT * FROM mfa_change_notification_records WHERE record_id = ?')
      .get(recordId) as MfaChangeNotificationRecordRow | undefined;
    return row ? rowToEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<MfaChangeNotificationRecord[]> {
    const rows = this.db
      .prepare(
        'SELECT * FROM mfa_change_notification_records WHERE user_id = ? ORDER BY dispatch_timestamp ASC',
      )
      .all(userId) as MfaChangeNotificationRecordRow[];
    return rows.map(rowToEntity);
  }

  async findByStatus(status: MfaNotificationDeliveryStatus): Promise<MfaChangeNotificationRecord[]> {
    const rows = this.db
      .prepare(
        'SELECT * FROM mfa_change_notification_records WHERE delivery_status = ? ORDER BY dispatch_timestamp ASC',
      )
      .all(status) as MfaChangeNotificationRecordRow[];
    return rows.map(rowToEntity);
  }

  async updateStatus(recordId: string, status: 'sent' | 'failed'): Promise<void> {
    this.db
      .prepare('UPDATE mfa_change_notification_records SET delivery_status = ? WHERE record_id = ?')
      .run(status, recordId);
  }

  async incrementRetryCount(recordId: string): Promise<void> {
    this.db
      .prepare(
        'UPDATE mfa_change_notification_records SET retry_count = retry_count + 1 WHERE record_id = ?',
      )
      .run(recordId);
  }
}
