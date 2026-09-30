'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../../domain/entities/User');
const Otp = require('../../domain/entities/Otp');
const config = require('../../infrastructure/config');

/**
 * Use-case: Register a new user and send an email-verification OTP.
 *
 * @param {object} deps
 * @param {import('../../domain/ports/UserRepository')} deps.userRepository
 * @param {import('../../domain/ports/OtpRepository')}  deps.otpRepository
 * @param {import('../../domain/ports/EmailService')}   deps.emailService
 */
function makeRegisterUser({ userRepository, otpRepository, emailService }) {
  /**
   * @param {{ email: string, password: string }} input
   * @returns {Promise<{ user: object }>}
   */
  return async function registerUser({ email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing && !existing.isDeleted()) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const user = await userRepository.create(
      new User({
        id: uuidv4(),
        email: email.toLowerCase().trim(),
        passwordHash,
        isVerified: false,
        createdAt: now,
        updatedAt: now,
      })
    );

    // Generate OTP
    const code = generateOtpCode(config.otp.length);
    const expiresAt = new Date(Date.now() + config.otp.expiresMinutes * 60 * 1000);

    await otpRepository.create(
      new Otp({ id: uuidv4(), userId: user.id, code, expiresAt, used: false, createdAt: now })
    );

    await emailService.sendVerificationOtp(user.email, code);

    return { user: user.toPublic() };
  };
}

/** @param {number} length @returns {string} */
function generateOtpCode(length) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

module.exports = makeRegisterUser;
