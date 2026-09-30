'use strict';

/**
 * IEmailService — port for sending transactional emails.
 */
class IEmailService {
  /**
   * Send an OTP verification email.
   * @param {string} to       - recipient email address
   * @param {string} otp      - one-time password code
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendVerificationEmail(to, otp) {
    throw new Error('IEmailService.sendVerificationEmail() not implemented');
  }

  /**
   * Send a welcome email after successful verification.
   * @param {string} to
   * @param {string} firstName
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sendWelcomeEmail(to, firstName) {
    throw new Error('IEmailService.sendWelcomeEmail() not implemented');
  }
}

module.exports = IEmailService;
