'use strict';

const { INotificationService } = require('../../domain/ports/INotificationService');
const logger = require('../logger');

/**
 * Stub notification adapter — logs OTPs instead of sending real emails.
 * Replace with a real email/SMS provider in production.
 */
class StubNotificationService extends INotificationService {
  /**
   * @param {string} email
   * @param {string} code
   * @param {'email_verification'|'password_reset'} purpose
   * @returns {Promise<void>}
   */
  async sendOtp(email, code, purpose) {
    logger.info(`[StubNotification] OTP for ${purpose} sent to ${email}: ${code}`);
  }
}

module.exports = { StubNotificationService };
