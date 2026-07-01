'use strict';

const AppError = require('../../shared/errors/AppError');

/**
 * Use-case: Soft-delete (deactivate) a user account.
 */
class DeleteUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IOtpRepository')} otpRepository
   */
  constructor(userRepository, otpRepository) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
  }

  /**
   * @param {{ requesterId: string, targetUserId: string }} dto
   * @returns {Promise<void>}
   */
  async execute(dto) {
    // Users may only delete their own account (extend for admin roles as needed)
    if (dto.requesterId !== dto.targetUserId) {
      throw new AppError('Forbidden', 403);
    }

    const user = await this.userRepository.findById(dto.targetUserId);
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }

    await this.otpRepository.deleteByUserId(dto.targetUserId);
    await this.userRepository.delete(dto.targetUserId);
  }
}

module.exports = DeleteUserUseCase;
