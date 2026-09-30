'use strict';

const {
  UserNotFoundError,
  InvalidOtpError,
} = require('../../domain/errors');

/**
 * VerifyEmailUseCase — validates the OTP and marks the user as verified.
 */
class VerifyEmailUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IOtpRepository')}  otpRepository
   * @param {import('../../domain/ports/IEmailService')}   emailService
   */
  constructor(userRepository, otpRepository, emailService) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
    this.emailService = emailService;
  }

  /**
   * @param {{ email: string, code: string }} dto
   * @returns {Promise<{ user: import('../../domain/entities/User') }>}
   */
  async execute(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UserNotFoundError(dto.email);

    const otp = await this.otpRepository.findByUserAndCode(
      user.id,
      dto.code,
      'email_verification',
    );

    if (!otp || !otp.isValid()) throw new InvalidOtpError();

    otp.consume();
    await this.otpRepository.update(otp);

    user.verify();
    await this.userRepository.update(user);

    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return { user };
  }
}

module.exports = VerifyEmailUseCase;
