'use strict';

const AppError = require('../errors/AppError');

class VerifyOtpUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository').IUserRepository} userRepository
   * @param {import('../../domain/ports/IOtpRepository').IOtpRepository} otpRepository
   */
  constructor(userRepository, otpRepository) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
  }

  /**
   * Verify an OTP code for a given user and purpose.
   * @param {{ userId: string, code: string, purpose: 'email_verification'|'password_reset' }} dto
   * @returns {Promise<{ user: Object }>}
   */
  async execute({ userId, code, purpose }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const otp = await this.otpRepository.findLatest(userId, purpose);
    if (!otp || !otp.isValid() || otp.code !== code) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    otp.consume();
    await this.otpRepository.markUsed(otp.id);

    if (purpose === 'email_verification') {
      user.verify();
      await this.userRepository.update(user);
    }

    return { user: user.toPublic() };
  }
}

module.exports = { VerifyOtpUseCase };
