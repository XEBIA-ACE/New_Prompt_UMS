'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { createUser } = require('../../domain/entities/user');
const { ConflictError, ValidationError } = require('../../domain/errors');
const config = require('../../config');

/**
 * RegisterUser use-case.
 *
 * @param {import('../../domain/ports/userRepository').UserRepository} userRepository
 * @returns {function(RegisterUserInput): Promise<RegisterUserOutput>}
 */
function makeRegisterUser(userRepository) {
  /**
   * @typedef {Object} RegisterUserInput
   * @property {string} email
   * @property {string} password
   * @property {string} firstName
   * @property {string} lastName
   */

  /**
   * @typedef {Object} RegisterUserOutput
   * @property {string} id
   * @property {string} email
   * @property {string} firstName
   * @property {string} lastName
   * @property {boolean} isVerified
   * @property {Date} createdAt
   */

  /**
   * @param {RegisterUserInput} input
   * @returns {Promise<RegisterUserOutput>}
   */
  return async function registerUser({ email, password, firstName, lastName }) {
    if (!email || !password || !firstName || !lastName) {
      throw new ValidationError('email, password, firstName, and lastName are required');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const verificationToken = uuidv4();

    const user = createUser({
      id: uuidv4(),
      email,
      passwordHash,
      firstName,
      lastName,
      isVerified: false,
      verificationToken,
    });

    const saved = await userRepository.save(user);

    // TODO: dispatch email verification event / send verification email

    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      isVerified: saved.isVerified,
      createdAt: saved.createdAt,
    };
  };
}

module.exports = { makeRegisterUser };
