'use strict';

const {
  UserNotFoundError,
  AccountInactiveError,
} = require('../../domain/errors');

/**
 * DeleteAccountUseCase — deactivates and removes a user account.
 */
class DeleteAccountUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IOtpRepository')}  otpRepository
   */
  constructor(userRepository, otpRepository) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
  }

  /**
   * @param {{ userId: string }} dto
   * @returns {Promise<void>}
   */
  async execute(dto) {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) throw new UserNotFoundError(dto.userId);
    if (!user.isActive) throw new AccountInactiveError();

    // Clean up associated OTPs first
    await this.otpRepository.deleteByUserId(user.id);

    // Hard-delete the user record
    await this.userRepository.delete(user.id);
  }
}

module.exports = DeleteAccountUseCase;
