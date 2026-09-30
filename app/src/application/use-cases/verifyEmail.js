'use strict';

/**
 * Use-case: Verify a user's email address using an OTP.
 *
 * @param {object} deps
 * @param {import('../../domain/ports/UserRepository')} deps.userRepository
 * @param {import('../../domain/ports/OtpRepository')}  deps.otpRepository
 */
function makeVerifyEmail({ userRepository, otpRepository }) {
  /**
   * @param {{ userId: string, code: string }} input
   * @returns {Promise<{ user: object }>}
   */
  return async function verifyEmail({ userId, code }) {
    const user = await userRepository.findById(userId);
    if (!user || user.isDeleted()) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.isVerified) {
      const err = new Error('Email already verified');
      err.statusCode = 409;
      throw err;
    }

    const otp = await otpRepository.findValidByUserAndCode(userId, code);
    if (!otp || !otp.isValid()) {
      const err = new Error('Invalid or expired OTP');
      err.statusCode = 400;
      throw err;
    }

    await otpRepository.markUsed(otp.id);
    const updated = await userRepository.markVerified(userId);

    return { user: updated.toPublic() };
  };
}

module.exports = makeVerifyEmail;
