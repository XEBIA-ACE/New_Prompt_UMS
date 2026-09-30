'use strict';

const nodemailer = require('nodemailer');
const IEmailService = require('../../../domain/ports/IEmailService');
const logger = require('../../infrastructure/logger');

/**
 * NodemailerEmailService — concrete email adapter using Nodemailer.
 */
class NodemailerEmailService extends IEmailService {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.from = process.env.EMAIL_FROM || 'no-reply@example.com';
  }

  /**
   * @param {string} to
   * @param {string} otp
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(to, otp) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Verify your email address',
        text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
      logger.info('Verification email sent', { to });
    } catch (err) {
      logger.error('Failed to send verification email', { to, error: err.message });
      throw err;
    }
  }

  /**
   * @param {string} to
   * @param {string} firstName
   * @returns {Promise<void>}
   */
  async sendWelcomeEmail(to, firstName) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Welcome!',
        text: `Hi ${firstName || 'there'}, welcome to the platform!`,
        html: `<p>Hi ${firstName || 'there'}, welcome to the platform!</p>`,
      });
      logger.info('Welcome email sent', { to });
    } catch (err) {
      logger.error('Failed to send welcome email', { to, error: err.message });
      throw err;
    }
  }
}

module.exports = NodemailerEmailService;
