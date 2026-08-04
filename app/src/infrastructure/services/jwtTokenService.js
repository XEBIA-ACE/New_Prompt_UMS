'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../../config');
const { UnauthorizedError } = require('../../../domain/errors');

/**
 * JWT implementation of the TokenService port.
 *
 * @implements {import('../../../domain/ports/tokenService').TokenService}
 */
class JwtTokenService {
  /**
   * @param {Object} payload
   * @returns {string}
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * @param {Object} payload
   * @returns {string}
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  /**
   * @param {string} token
   * @returns {Object}
   * @throws {UnauthorizedError}
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  /**
   * @param {string} token
   * @returns {Object}
   * @throws {UnauthorizedError}
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}

module.exports = { JwtTokenService };
