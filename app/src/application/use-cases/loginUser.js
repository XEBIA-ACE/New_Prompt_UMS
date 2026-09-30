'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../infrastructure/config');

/**
 * Use-case: Authenticate a user and return a signed JWT.
 *
 * @param {object} deps
 * @param {import('../../domain/ports/UserRepository')} deps.userRepository
 */
function makeLoginUser({ userRepository }) {
  /**
   * @param {{ email: string, password: string }} input
   * @returns {Promise<{ token: string, user: object }>}
   */
  return async function loginUser({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.isDeleted()) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isVerified) {
      const err = new Error('Email not verified');
      err.statusCode = 403;
      throw err;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return { token, user: user.toPublic() };
  };
}

module.exports = makeLoginUser;
