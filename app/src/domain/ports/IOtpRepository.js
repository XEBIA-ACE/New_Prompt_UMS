'use strict';

/**
 * IOtpRepository — port for OTP persistence.
 */
class IOtpRepository {
  /**
   * @param {import('../entities/Otp')} otp
   * @returns {Promise<import('../entities/Otp')>}
   */
  // eslint-disable-next-line no-unused-vars
  async save(otp) {
    throw new Error('IOtpRepository.save() not implemented');
  }

  /**
   * @param {string} userId
   * @param {string} code
   * @param {string} type
   * @returns {Promise<import('../entities/Otp')|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async findByUserAndCode(userId, code, type) {
    throw new Error('IOtpRepository.findByUserAndCode() not implemented');
  }

  /**
   * @param {import('../entities/Otp')} otp
   * @returns {Promise<import('../entities/Otp')>}
   */
  // eslint-disable-next-line no-unused-vars
  async update(otp) {
    throw new Error('IOtpRepository.update() not implemented');
  }

  /**
   * Remove all OTPs for a given user.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteByUserId(userId) {
    throw new Error('IOtpRepository.deleteByUserId() not implemented');
  }
}

module.exports = IOtpRepository;
