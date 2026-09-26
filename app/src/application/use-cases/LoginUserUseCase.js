'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');

class LoginUserUseCase {
  /**
   * @param {import('../../domain/ports/IUserRepository').IUserRepository} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Authenticate a user and return a signed JWT.
   * @param {{ email: string, password: string }} dto
   * @returns {Promise<{ token: string, user: Object }>}
   */
  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const secret = process.env.JWT_SECRET || 'changeme';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      secret,
      { expiresIn }
    );

    return { token, user: user.toPublic() };
  }
}

module.exports = { LoginUserUseCase };
