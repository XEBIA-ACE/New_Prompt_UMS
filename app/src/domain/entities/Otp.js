'use strict';

/**
 * @typedef {Object} OtpProps
 * @property {string} id
 * @property {string} userId
 * @property {string} code
 * @property {string} type  - 'email_verification' | 'password_reset'
 * @property {Date}   expiresAt
 * @property {boolean} used
 * @property {Date}   createdAt
 */

class Otp {
  /**
   * @param {OtpProps} props
   */
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.code = props.code;
    this.type = props.type;
    this.expiresAt = props.expiresAt;
    this.used = props.used || false;
    this.createdAt = props.createdAt || new Date();
  }

  /**
   * Check whether the OTP is still valid.
   * @returns {boolean}
   */
  isValid() {
    return !this.used && new Date() < this.expiresAt;
  }

  /**
   * Consume the OTP so it cannot be reused.
   * @returns {void}
   */
  consume() {
    this.used = true;
  }
}

module.exports = Otp;
