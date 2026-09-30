'use strict';

/**
 * IUserRepository — port that the domain uses to persist / retrieve users.
 *
 * Concrete implementations live in src/adapters/repositories/.
 * All methods return Promises.
 */
class IUserRepository {
  /**
   * Persist a new User entity.
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async save(user) {
    throw new Error('IUserRepository.save() not implemented');
  }

  /**
   * Find a user by their unique id.
   * @param {string} id
   * @returns {Promise<import('../entities/User')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) {
    throw new Error('IUserRepository.findById() not implemented');
  }

  /**
   * Find a user by email address.
   * @param {string} email
   * @returns {Promise<import('../entities/User')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) {
    throw new Error('IUserRepository.findByEmail() not implemented');
  }

  /**
   * Persist changes to an existing user.
   * @param {import('../entities/User')} user
   * @returns {Promise<import('../entities/User')>}
   */
  // eslint-disable-next-line no-unused-vars
  async update(user) {
    throw new Error('IUserRepository.update() not implemented');
  }

  /**
   * Hard-delete a user record.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(id) {
    throw new Error('IUserRepository.delete() not implemented');
  }
}

module.exports = IUserRepository;
