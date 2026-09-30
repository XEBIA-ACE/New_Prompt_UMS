'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a 6-digit numeric OTP.
 * @returns {string}
 */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Hash a plain-text password.
 * @param {string} password
 * @param {number} saltRounds
 * @returns {Promise<string>}
 */
async function hashPassword(password, saltRounds = 12) {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { generateOtp, hashPassword, comparePassword };
