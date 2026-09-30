'use strict';

/**
 * OTP domain entity.
 */
class Otp {
  /**
   * @param {object} props
   * @param {string} props.id
   * @param {string} props.userId
   * @param {string} props.code
   * @param {Date}   props.expiresAt
   * @param {boolean} props.used
   * @param {Date}   props.createdAt
   */
  constructor({ id, userId, code, expiresAt, used, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.code = code;
    this.expiresAt = expiresAt;
    this.used = used;
    this.createdAt = createdAt;
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
