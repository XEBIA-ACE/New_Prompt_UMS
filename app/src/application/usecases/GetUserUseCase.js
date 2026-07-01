'use strict';

const AppError = require('../../shared/errors/AppError');

/**
 * Use-case: Retrieve a user's profile.
 */
class GetUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {{ id: string }} dto
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async execute(dto) {
    const user = await this.userRepository.findById(dto.id);
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

module.exports = GetUserUseCase;
