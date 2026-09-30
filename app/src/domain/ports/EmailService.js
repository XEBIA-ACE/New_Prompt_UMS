'use strict';

/**
 * Port — EmailService
 *
 * Defines the contract for sending transactional emails.
 * Concrete implementations live in src/infrastructure/email/.
 */
class EmailService {
  /**
   * Send an OTP verification email.
   * @param {string} to  - Recipient email address
   * @param {string} otp - One-time password
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendVerificationOtp(to, otp) {
    throw new Error('EmailService.sendVerificationOtp() not implemented');
  }
}

module.exports = EmailService;
