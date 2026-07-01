'use strict';

const GetUserUseCase = require('../../../application/usecases/GetUserUseCase');
const DeleteUserUseCase = require('../../../application/usecases/DeleteUserUseCase');
const GenerateOtpUseCase = require('../../../application/usecases/GenerateOtpUseCase');
const VerifyOtpUseCase = require('../../../application/usecases/VerifyOtpUseCase');
const PostgresUserRepository = require('../../outbound/postgres/PostgresUserRepository');
const PostgresOtpRepository = require('../../outbound/postgres/PostgresOtpRepository');

const userRepository = new PostgresUserRepository();
const otpRepository = new PostgresOtpRepository();

const getUser = new GetUserUseCase(userRepository);
const deleteUser = new DeleteUserUseCase(userRepository, otpRepository);
const generateOtp = new GenerateOtpUseCase(userRepository, otpRepository);
const verifyOtp = new VerifyOtpUseCase(userRepository, otpRepository);

const UserController = {
  /**
   * GET /api/v1/users/:id
   */
  async getUser(req, res, next) {
    try {
      const user = await getUser.execute({ id: req.params.id });
      return res.status(200).json({
        status: 'success',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      await deleteUser.execute({
        requesterId: req.user.sub,
        targetUserId: req.params.id,
      });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/users/:id/otp/generate
   */
  async generateOtp(req, res, next) {
    try {
      const otp = await generateOtp.execute({ userId: req.params.id });
      return res.status(201).json({
        status: 'success',
        data: {
          // NOTE: In production, deliver the code via email/SMS — never expose it in the response.
          // Returned here for development/testing convenience only.
          code: otp.code,
          expiresAt: otp.expiresAt,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/users/:id/otp/verify
   */
  async verifyOtp(req, res, next) {
    try {
      const user = await verifyOtp.execute({
        userId: req.params.id,
        code: req.body.code,
      });
      return res.status(200).json({
        status: 'success',
        data: { isVerified: user.isVerified },
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = UserController;
