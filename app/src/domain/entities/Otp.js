'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} OtpProps
 * @property {string} id
 * @property {string} userId
 * @property {string} code
 * @property {'email_verification'|'password_reset'} purpose
 * @property {Date} expiresAt
 * @property {boolean} used
 * @property {Date} createdAt
 */

class Otp {
  /**
   * @param {OtpProps} props
   */
  constructor(props) {
    this.id = props.id || uuidv4();
    this.userId = props.userId;
    this.code = props.code;
    this.purpose = props.purpose;
    this.expiresAt = props.expiresAt;
    this.used = props.used || false;
    this.createdAt = props.createdAt || new Date();
  }

  /**
   * Checks whether the OTP is still valid.
   * @returns {boolean}
   */
  isValid() {
    return !this.used && new Date() < this.expiresAt;
  }

  /**
   * Marks the OTP as consumed.
   */
  consume() {
    this.used = true;
  }

  /**
   * Factory: generate a new numeric OTP.
   * @param {string} userId
   * @param {'email_verification'|'password_reset'} purpose
   * @param {number} [ttlMinutes=10]
   * @returns {Otp}
   */
  static generate(userId, purpose, ttlMinutes = 10) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    return new Otp({ userId, code, purpose, expiresAt });
  }
}

module.exports = { Otp };
