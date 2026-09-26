'use strict';

const AppError = require('../errors/AppError');

class DeleteUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository').IUserRepository} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Soft-delete (deactivate) a user account.
   * @param {{ requesterId: string, targetUserId: string }} dto
   * @returns {Promise<void>}
   */
  async execute({ requesterId, targetUserId }) {
    if (requesterId !== targetUserId) {
      throw new AppError('Forbidden: cannot delete another user\'s account', 403);
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.deactivate();
    await this.userRepository.update(user);
  }
}

module.exports = { DeleteUserUseCase };
