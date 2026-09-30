'use strict';

/**
 * Port: UserRepository
 *
 * Defines the contract that any persistence adapter must fulfil.
 * Concrete implementations live in src/adapters/persistence/.
 */
class UserRepository {
  /**
   * Persist a new user.
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async create(user) { throw new Error('Not implemented'); }

  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {Promise<import('../entities/User')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) { throw new Error('Not implemented'); }

  /**
   * Find a user by their ID.
   * @param {string} id
   * @returns {Promise<import('../entities/User')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) { throw new Error('Not implemented'); }

  /**
   * Mark a user as email-verified.
   * @param {string} id
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async markVerified(id) { throw new Error('Not implemented'); }

  /**
   * Soft-delete a user account.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async softDelete(id) { throw new Error('Not implemented'); }
}

module.exports = UserRepository;
