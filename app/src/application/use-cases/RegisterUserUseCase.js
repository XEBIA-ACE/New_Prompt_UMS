'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const User = require('../../domain/entities/User');
const Otp = require('../../domain/entities/Otp');
const { UserAlreadyExistsError } = require('../../domain/errors');

const OTP_EXPIRY_MINUTES = 10;
const SALT_ROUNDS = 12;

/**
 * RegisterUserUseCase — handles new user registration and OTP dispatch.
 */
class RegisterUserUseCase {
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
   * @param {{ email: string, password: string, firstName?: string, lastName?: string }} dto
   * @returns {Promise<{ user: import('../../domain/entities/User') }>}
   */
  async execute(dto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new UserAlreadyExistsError(dto.email);
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = new User({
      id: uuidv4(),
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isVerified: false,
      isActive: true,
    });

    await this.userRepository.save(user);

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const otp = new Otp({
      id: uuidv4(),
      userId: user.id,
      code,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    await this.otpRepository.save(otp);
    await this.emailService.sendVerificationEmail(user.email, code);

    return { user };
  }
}

module.exports = RegisterUserUseCase;
