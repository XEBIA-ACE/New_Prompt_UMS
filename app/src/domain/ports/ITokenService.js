'use strict';

/**
 * ITokenService — port for JWT generation and verification.
 */
class ITokenService {
  /**
   * Generate an access token for the given payload.
   * @param {Object} payload
   * @returns {string}
   */
  // eslint-disable-next-line no-unused-vars
  generateAccessToken(payload) {
    throw new Error('ITokenService.generateAccessToken() not implemented');
  }

  /**
   * Verify and decode an access token.
   * @param {string} token
   * @returns {Object} decoded payload
   */
  // eslint-disable-next-line no-unused-vars
  verifyAccessToken(token) {
    throw new Error('ITokenService.verifyAccessToken() not implemented');
  }
}

module.exports = ITokenService;
