'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../../domain/entities/User');
const AppError = require('../../shared/errors/AppError');

/**
 * Use-case: Register a new user.
 */
class RegisterUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {{ email: string, password: string, firstName?: string, lastName?: string }} dto
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async execute(dto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = new User({
      id: uuidv4(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.userRepository.create(user);
  }
}

module.exports = RegisterUserUseCase;
