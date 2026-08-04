'use strict';

/**
 * User entity — pure value object, no I/O.
 *
 * @typedef {Object} User
 * @property {string} id          - UUID
 * @property {string} email       - Unique email address
 * @property {string} passwordHash - bcrypt hash
 * @property {string} firstName
 * @property {string} lastName
 * @property {boolean} isVerified  - Whether email has been verified
 * @property {string|null} verificationToken
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * Creates a new User entity object.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {boolean} [params.isVerified]
 * @param {string|null} [params.verificationToken]
 * @param {Date} [params.createdAt]
 * @param {Date} [params.updatedAt]
 * @returns {User}
 */
function createUser({
  id,
  email,
  passwordHash,
  firstName,
  lastName,
  isVerified = false,
  verificationToken = null,
  createdAt = new Date(),
  updatedAt = new Date(),
}) {
  if (!id) throw new Error('User id is required');
  if (!email) throw new Error('User email is required');
  if (!passwordHash) throw new Error('User passwordHash is required');

  return Object.freeze({
    id,
    email: email.toLowerCase().trim(),
    passwordHash,
    firstName,
    lastName,
    isVerified,
    verificationToken,
    createdAt,
    updatedAt,
  });
}

module.exports = { createUser };
