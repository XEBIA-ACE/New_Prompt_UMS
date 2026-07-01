'use strict';

const AppError = require('../../shared/errors/AppError');

/**
 * Use-case: Verify an OTP and mark the user as verified.
 */
class VerifyOtpUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IOtpRepository')} otpRepository
   */
  constructor(userRepository, otpRepository) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
  }

  /**
   * @param {{ userId: string, code: string }} dto
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async execute(dto) {
    const otp = await this.otpRepository.findByUserIdAndCode(dto.userId, dto.code);
    if (!otp || !otp.isValid()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    await this.otpRepository.markUsed(otp.id);
    return this.userRepository.update(dto.userId, { isVerified: true });
  }
}

module.exports = VerifyOtpUseCase;
