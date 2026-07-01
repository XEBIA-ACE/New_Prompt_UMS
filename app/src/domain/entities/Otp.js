'use strict';

/**
 * OTP domain entity.
 *
 * @typedef {Object} Otp
 * @property {string} id
 * @property {string} userId
 * @property {string} code
 * @property {Date}   expiresAt
 * @property {boolean} used
 * @property {Date}   createdAt
 */

class Otp {
  /**
   * @param {Partial<Otp>} data
   */
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.code = data.code;
    this.expiresAt = data.expiresAt;
    this.used = data.used ?? false;
    this.createdAt = data.createdAt || new Date();
  }

  /** @returns {boolean} */
  isExpired() {
    return new Date() > this.expiresAt;
  }

  /** @returns {boolean} */
  isValid() {
    return !this.used && !this.isExpired();
  }
}

module.exports = Otp;
