'use strict';

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} passwordHash
 * @property {string} firstName
 * @property {string} lastName
 * @property {boolean} isVerified
 * @property {string|null} otpCode
 * @property {Date|null} otpExpiresAt
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

class User {
  /**
   * @param {Object} props
   * @param {string} props.id
   * @param {string} props.email
   * @param {string} props.passwordHash
   * @param {string} props.firstName
   * @param {string} props.lastName
   * @param {boolean} [props.isVerified]
   * @param {string|null} [props.otpCode]
   * @param {Date|null} [props.otpExpiresAt]
   * @param {Date} [props.createdAt]
   * @param {Date} [props.updatedAt]
   */
  constructor({
    id,
    email,
    passwordHash,
    firstName,
    lastName,
    isVerified = false,
    otpCode = null,
    otpExpiresAt = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isVerified = isVerified;
    this.otpCode = otpCode;
    this.otpExpiresAt = otpExpiresAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check whether the OTP is still valid.
   * @returns {boolean}
   */
  isOtpValid() {
    if (!this.otpCode || !this.otpExpiresAt) return false;
    return new Date() < new Date(this.otpExpiresAt);
  }

  /**
   * Return a safe public representation (no secrets).
   * @returns {Object}
   */
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
