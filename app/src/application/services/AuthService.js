'use strict';

const { v4: uuidv4 } = require('uuid');
const User = require('../../domain/entities/User');
const { generateOtp, hashPassword, comparePassword } = require('../../domain/utils/crypto');
const { generateToken } = require('../../domain/utils/jwt');
const AppError = require('../../domain/errors/AppError');

const OTP_TTL_MINUTES = 10;
const SALT_ROUNDS = 12;

class AuthService {
  /**
   * @param {import('../ports/UserRepository')} userRepository
   * @param {import('../ports/EmailService')} emailService
   */
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  /**
   * Register a new user and send a verification OTP.
   * @param {{ email: string, password: string, firstName: string, lastName: string }} dto
   * @returns {Promise<{ user: Object }>}
   */
  async register({ email, password, firstName, lastName }) {
    const existing = await this.userRepository.findByEmail(email.toLowerCase());
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const passwordHash = await hashPassword(password, SALT_ROUNDS);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const user = new User({
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      isVerified: false,
      otpCode: otp,
      otpExpiresAt,
    });

    const saved = await this.userRepository.create(user);
    await this.emailService.sendVerificationOtp(saved.email, otp);

    return { user: saved.toPublic() };
  }

  /**
   * Verify a user's email with the OTP they received.
   * @param {{ email: string, otp: string }} dto
   * @returns {Promise<{ message: string }>}
   */
  async verifyEmail({ email, otp }) {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('Email already verified', 400);
    if (!user.isOtpValid()) throw new AppError('OTP has expired', 400);
    if (user.otpCode !== otp) throw new AppError('Invalid OTP', 400);

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.updatedAt = new Date();

    await this.userRepository.update(user);
    return { message: 'Email verified successfully' };
  }

  /**
   * Authenticate a user and return a signed JWT.
   * @param {{ email: string, password: string }} dto
   * @returns {Promise<{ token: string, user: Object }>}
   */
  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    if (!user.isVerified) throw new AppError('Email not verified', 403);

    const token = generateToken({ sub: user.id, email: user.email });
    return { token, user: user.toPublic() };
  }
}

module.exports = AuthService;
