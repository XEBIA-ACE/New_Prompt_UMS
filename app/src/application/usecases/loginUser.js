'use strict';

const bcrypt = require('bcryptjs');
const { UnauthorizedError, ValidationError } = require('../../domain/errors');

/**
 * LoginUser use-case.
 *
 * @param {import('../../domain/ports/userRepository').UserRepository} userRepository
 * @param {import('../../domain/ports/tokenService').TokenService} tokenService
 * @returns {function(LoginUserInput): Promise<LoginUserOutput>}
 */
function makeLoginUser(userRepository, tokenService) {
  /**
   * @typedef {Object} LoginUserInput
   * @property {string} email
   * @property {string} password
   */

  /**
   * @typedef {Object} LoginUserOutput
   * @property {string} accessToken
   * @property {string} refreshToken
   * @property {Object} user
   */

  /**
   * @param {LoginUserInput} input
   * @returns {Promise<LoginUserOutput>}
   */
  return async function loginUser({ email, password }) {
    if (!email || !password) {
      throw new ValidationError('email and password are required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = tokenService.generateAccessToken(payload);
    const refreshToken = tokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
    };
  };
}

module.exports = { makeLoginUser };
