'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const AppError = require('../../shared/errors/AppError');

/**
 * Use-case: Authenticate a user and return a JWT.
 */
class LoginUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository')} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * @param {{ email: string, password: string }} dto
   * @returns {Promise<{ token: string, user: import('../../domain/entities/User') }>}
   */
  async execute(dto) {
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, user };
  }
}

module.exports = LoginUserUseCase;
