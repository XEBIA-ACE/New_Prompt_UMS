'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../../domain/entities/User');
const { Otp } = require('../../domain/entities/Otp');
const AppError = require('../errors/AppError');

const SALT_ROUNDS = 10;

class RegisterUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository').IUserRepository} userRepository
   * @param {import('../../domain/ports/IOtpRepository').IOtpRepository} otpRepository
   * @param {import('../../domain/ports/INotificationService').INotificationService} notificationService
   */
  constructor(userRepository, otpRepository, notificationService) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
    this.notificationService = notificationService;
  }

  /**
   * Register a new user and dispatch a verification OTP.
   * @param {{ email: string, password: string, firstName?: string, lastName?: string }} dto
   * @returns {Promise<{ user: Object }>}
   */
  async execute({ email, password, firstName, lastName }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ email, passwordHash, firstName, lastName });
    await this.userRepository.save(user);

    const otp = Otp.generate(user.id, 'email_verification');
    await this.otpRepository.save(otp);
    await this.notificationService.sendOtp(email, otp.code, 'email_verification');

    return { user: user.toPublic() };
  }
}

module.exports = { RegisterUserUseCase };
