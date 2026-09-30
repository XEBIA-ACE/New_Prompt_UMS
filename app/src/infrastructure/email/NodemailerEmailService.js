'use strict';

const nodemailer = require('nodemailer');
const EmailService = require('../../domain/ports/EmailService');
const logger = require('../logger');

/**
 * Nodemailer adapter for the EmailService port.
 */
class NodemailerEmailService extends EmailService {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  /**
   * @param {string} to
   * @param {string} otp
   * @returns {Promise<void>}
   */
  async sendVerificationOtp(to, otp) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@example.com',
      to,
      subject: 'Verify your email address',
      text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:4px">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info('Verification OTP sent', { to });
  }
}

module.exports = NodemailerEmailService;
