'use strict';

/**
 * Use-case: Soft-delete a user account and clean up associated data.
 *
 * @param {object} deps
 * @param {import('../../domain/ports/UserRepository')} deps.userRepository
 * @param {import('../../domain/ports/OtpRepository')}  deps.otpRepository
 */
function makeDeleteAccount({ userRepository, otpRepository }) {
  /**
   * @param {{ userId: string }} input
   * @returns {Promise<void>}
   */
  return async function deleteAccount({ userId }) {
    const user = await userRepository.findById(userId);
    if (!user || user.isDeleted()) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    await otpRepository.deleteByUserId(userId);
    await userRepository.softDelete(userId);
  };
}

module.exports = makeDeleteAccount;
