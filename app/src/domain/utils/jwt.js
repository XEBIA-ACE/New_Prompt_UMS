'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Sign a JWT payload.
 * @param {Object} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {Object}
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };
