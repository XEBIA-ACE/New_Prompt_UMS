'use strict';

const AppError = require('../../domain/errors/AppError');

class UserService {
  /**
   * @param {import('../ports/UserRepository')} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Retrieve a user's public profile.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getProfile(id) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user.toPublic();
  }

  /**
   * Permanently delete a user account and all associated data.
   * @param {string} id
   * @returns {Promise<{ message: string }>}
   */
  async deleteAccount(id) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    await this.userRepository.delete(id);
    return { message: 'Account deleted successfully' };
  }
}

module.exports = UserService;
