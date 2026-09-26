'use strict';

const { v4: uuidv4 } = require('uuid');

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
    this.id = props.id || uuidv4();
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
   * Returns a safe public representation (no password hash).
   * @returns {Object}
   */
  toPublic() {
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

  /**
   * Marks the user as verified.
   */
  verify() {
    this.isVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * Soft-deletes the user.
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}

module.exports = { User };
