'use strict';

/**
 * TokenService port — defines the interface for JWT operations.
 *
 * @typedef {Object} TokenService
 *
 * @property {function(Object): string} generateAccessToken
 *   Sign and return a short-lived access token.
 *
 * @property {function(Object): string} generateRefreshToken
 *   Sign and return a long-lived refresh token.
 *
 * @property {function(string): Object} verifyAccessToken
 *   Verify and decode an access token; throws on invalid/expired.
 *
 * @property {function(string): Object} verifyRefreshToken
 *   Verify and decode a refresh token; throws on invalid/expired.
 */

module.exports = {};
