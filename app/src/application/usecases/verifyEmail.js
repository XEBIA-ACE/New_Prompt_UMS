'use strict';

const { NotFoundError, ValidationError } = require('../../domain/errors');

/**
 * VerifyEmail use-case.
 *
 * @param {import('../../domain/ports/userRepository').UserRepository} userRepository
 * @returns {function(VerifyEmailInput): Promise<void>}
 */
function makeVerifyEmail(userRepository) {
  /**
   * @typedef {Object} VerifyEmailInput
   * @property {string} token - The email verification token
   */

  /**
   * @param {VerifyEmailInput} input
   * @returns {Promise<void>}
   */
  return async function verifyEmail({ token }) {
    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    const user = await userRepository.findByVerificationToken(token);
    if (!user) {
      throw new NotFoundError('Invalid or expired verification token');
    }

    const updated = Object.freeze({
      ...user,
      isVerified: true,
      verificationToken: null,
      updatedAt: new Date(),
    });

    await userRepository.update(updated);
  };
}

module.exports = { makeVerifyEmail };
