'use strict';

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Otp = require('../../domain/entities/Otp');
const AppError = require('../../shared/errors/AppError');
const config = require('../../config/env');

/**
 * Use-case: Generate and store an OTP for a user.
 */
class GenerateOtpUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   * @param {import('../../domain/ports/IOtpRepository')} otpRepository
   */
  constructor(userRepository, otpRepository) {
    this.userRepository = userRepository;
    this.otpRepository = otpRepository;
  }

  /**
   * @param {{ userId: string }} dto
   * @returns {Promise<import('../../domain/entities/Otp')>}
   */
  async execute(dto) {
    const user = await this.userRepository.findById(dto.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404);
    }

    // Invalidate previous OTPs
    await this.otpRepository.deleteByUserId(dto.userId);

    const code = crypto
      .randomInt(0, Math.pow(10, config.otp.length))
      .toString()
      .padStart(config.otp.length, '0');

    const expiresAt = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

    const otp = new Otp({ id: uuidv4(), userId: dto.userId, code, expiresAt });
    return this.otpRepository.create(otp);
  }
}

module.exports = GenerateOtpUseCase;
