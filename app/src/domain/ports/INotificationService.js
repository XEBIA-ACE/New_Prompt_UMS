'use strict';

/**
 * Port: INotificationService
 *
 * Defines the contract for sending notifications (e.g. OTP emails).
 *
 * @interface
 */
class INotificationService {
  /**
   * Send an OTP code to the user.
   * @param {string} email
   * @param {string} code
   * @param {'email_verification'|'password_reset'} purpose
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendOtp(email, code, purpose) {
    throw new Error('INotificationService.sendOtp() not implemented');
  }
}

module.exports = { INotificationService };
