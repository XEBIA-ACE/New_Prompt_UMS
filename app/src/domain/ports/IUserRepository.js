'use strict';

/**
 * Port (interface) — User repository.
 * Concrete implementations live in adapters/outbound/.
 *
 * All methods return Promises.
 */
class IUserRepository {
  /**
   * Persist a new user.
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async create(user) { throw new Error('Not implemented'); }

  /**
   * Find a user by their UUID.
   * @param {string} id
   * @returns {Promise<import('../entities/User')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) { throw new Error('Not implemented'); }

  /**
   * Find a user by email address.
   * @param {string} email
   * @returns {Promise<import('../entities/User')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) { throw new Error('Not implemented'); }

  /**
   * Update mutable fields of an existing user.
   * @param {string} id
   * @param {Partial<import('../entities/User')>} updates
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async update(id, updates) { throw new Error('Not implemented'); }

  /**
   * Soft-delete (deactivate) a user.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(id) { throw new Error('Not implemented'); }
}

module.exports = IUserRepository;
