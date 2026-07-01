'use strict';

/**
 * User domain entity.
 * Plain data object — no framework dependencies.
 *
 * @typedef {Object} User
 * @property {string} id          - UUID
 * @property {string} email       - Unique email address
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
   * @param {Partial<User>} data
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.isVerified = data.isVerified ?? false;
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

module.exports = User;
