'use strict';

const EmailService = require('../../domain/ports/EmailService');
const { sendMail } = require('../../infrastructure/email/mailer');

/**
 * Nodemailer implementation of EmailService.
 */
class NodemailerEmailService extends EmailService {
  /**
   * @param {string} to
   * @param {string} otp
   * @returns {Promise<void>}
   */
  async sendVerificationOtp(to, otp) {
    await sendMail({
      to,
      subject: 'Verify your email address',
      html: `
        <h2>Email Verification</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="letter-spacing:4px">${otp}</h1>
        <p>This code expires in 15 minutes. Do not share it with anyone.</p>
      `,
    });
  }
}

module.exports = NodemailerEmailService;
