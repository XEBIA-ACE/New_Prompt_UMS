'use strict';

const jwt = require('jsonwebtoken');
const ITokenService = require('../../../domain/ports/ITokenService');

/**
 * JwtTokenService — concrete JWT adapter.
 */
class JwtTokenService extends ITokenService {
  constructor() {
    super();
    this.secret = process.env.JWT_SECRET || 'change-me-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  /**
   * @param {Object} payload
   * @returns {string}
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   * @param {string} token
   * @returns {Object}
   */
  verifyAccessToken(token) {
    return jwt.verify(token, this.secret);
  }
}

module.exports = JwtTokenService;
