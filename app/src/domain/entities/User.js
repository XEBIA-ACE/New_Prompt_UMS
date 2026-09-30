'use strict';

/**
 * User domain entity.
 * Plain data object — no framework dependencies.
 */
class User {
  /**
   * @param {object} props
   * @param {string} props.id
   * @param {string} props.email
   * @param {string} props.passwordHash
   * @param {boolean} props.isVerified
   * @param {Date}   props.createdAt
   * @param {Date}   props.updatedAt
   * @param {Date|null} props.deletedAt
   */
  constructor({ id, email, passwordHash, isVerified, createdAt, updatedAt, deletedAt = null }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.isVerified = isVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  /** @returns {boolean} */
  isDeleted() {
    return this.deletedAt !== null;
  }

  /** Safe public representation (no password hash). */
  toPublic() {
    return {
      id: this.id,
      email: this.email,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
    };
  }
}

module.exports = User;
