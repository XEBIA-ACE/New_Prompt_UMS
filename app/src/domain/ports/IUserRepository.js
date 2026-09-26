'use strict';

/**
 * Port: IUserRepository
 *
 * Defines the contract that any user persistence adapter must fulfil.
 * Concrete implementations live in src/infrastructure/repositories/.
 *
 * @interface
 */
class IUserRepository {
  /**
   * Persist a new User entity.
   * @param {import('../entities/User').User} user
   * @returns {Promise<import('../entities/User').User>}
   */
  // eslint-disable-next-line no-unused-vars
  async save(user) {
    throw new Error('IUserRepository.save() not implemented');
  }

  /**
   * Find a user by their unique identifier.
   * @param {string} id
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findById(id) {
    throw new Error('IUserRepository.findById() not implemented');
  }

  /**
   * Find a user by email address.
   * @param {string} email
   * @returns {Promise<import('../entities/User').User|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) {
    throw new Error('IUserRepository.findByEmail() not implemented');
  }

  /**
   * Persist changes to an existing User entity.
   * @param {import('../entities/User').User} user
   * @returns {Promise<import('../entities/User').User>}
   */
  // eslint-disable-next-line no-unused-vars
  async update(user) {
    throw new Error('IUserRepository.update() not implemented');
  }

  /**
   * Permanently remove a user record.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(id) {
    throw new Error('IUserRepository.delete() not implemented');
  }
}

module.exports = { IUserRepository };
