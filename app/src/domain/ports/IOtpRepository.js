'use strict';

/**
 * Port (interface) — OTP repository.
 */
class IOtpRepository {
  /**
   * @param {import('../entities/Otp')} otp
   * @returns {Promise<import('../entities/Otp')>}
   */
  // eslint-disable-next-line no-unused-vars
  async create(otp) { throw new Error('Not implemented'); }

  /**
   * @param {string} userId
   * @param {string} code
   * @returns {Promise<import('../entities/Otp')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByUserIdAndCode(userId, code) { throw new Error('Not implemented'); }

  /**
   * Mark an OTP as used.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async markUsed(id) { throw new Error('Not implemented'); }

  /**
   * Delete all OTPs for a user.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteByUserId(userId) { throw new Error('Not implemented'); }
}

module.exports = IOtpRepository;
