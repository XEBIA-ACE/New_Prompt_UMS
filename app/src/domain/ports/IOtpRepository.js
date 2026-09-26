'use strict';

/**
 * Port: IOtpRepository
 *
 * Defines the contract that any OTP persistence adapter must fulfil.
 *
 * @interface
 */
class IOtpRepository {
  /**
   * Persist a new OTP entity.
   * @param {import('../entities/Otp').Otp} otp
   * @returns {Promise<import('../entities/Otp').Otp>}
   */
  // eslint-disable-next-line no-unused-vars
  async save(otp) {
    throw new Error('IOtpRepository.save() not implemented');
  }

  /**
   * Find the latest unused OTP for a user and purpose.
   * @param {string} userId
   * @param {'email_verification'|'password_reset'} purpose
   * @returns {Promise<import('../entities/Otp').Otp|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findLatest(userId, purpose) {
    throw new Error('IOtpRepository.findLatest() not implemented');
  }

  /**
   * Mark an OTP as used.
   * @param {string} id
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async markUsed(id) {
    throw new Error('IOtpRepository.markUsed() not implemented');
  }
}

module.exports = { IOtpRepository };
