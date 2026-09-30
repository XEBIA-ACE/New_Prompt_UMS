'use strict';

/**
 * @typedef {Object} UserProps
 * @property {string} id
 * @property {string} email
 * @property {string} passwordHash
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {boolean} isVerified
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

class User {
  /**
   * @param {UserProps} props
   */
  constructor(props) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName || null;
    this.lastName = props.lastName || null;
    this.isVerified = props.isVerified || false;
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * Mark the user's email as verified.
   * @returns {void}
   */
  verify() {
    this.isVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * Soft-delete the user account.
   * @returns {void}
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Return a plain object safe for external serialisation (no password hash).
   * @returns {Object}
   */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isVerified: this.isVerified,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
