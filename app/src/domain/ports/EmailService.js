'use strict';

/**
 * Port: EmailService
 */
class EmailService {
  /**
   * Send an OTP verification email.
   * @param {string} to    - Recipient email address
   * @param {string} otp   - One-time password code
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendVerificationOtp(to, otp) { throw new Error('Not implemented'); }
}

module.exports = EmailService;
