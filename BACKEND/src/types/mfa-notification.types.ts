/**
 * mfa-notification.types.ts
 *
 * Domain types for the `mfa_change_notification_records` table.
 */

export type MfaState = 'enabled' | 'disabled';

export type MfaNotificationDeliveryStatus = 'queued' | 'sent' | 'failed';

export interface MfaChangeNotificationRecord {
  recordId: string;                               // UUID v4
  userId: string;                                 // FK → users(id)
  recipientAddress: string;
  mfaOldState: MfaState;
  mfaNewState: MfaState;
  changeTimestamp: Date;                          // when the MFA state changed
  dispatchTimestamp: Date;                        // when the record was queued
  deliveryStatus: MfaNotificationDeliveryStatus;
  retryCount: number;                             // default 0
}

export interface NewMfaChangeNotificationRecord {
  userId: string;
  recipientAddress: string;
  mfaOldState: MfaState;
  mfaNewState: MfaState;
  changeTimestamp: Date;
}
