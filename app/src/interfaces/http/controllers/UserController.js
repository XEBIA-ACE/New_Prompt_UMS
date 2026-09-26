'use strict';

const { RegisterUserUseCase } = require('../../../application/use-cases/RegisterUserUseCase');
const { VerifyOtpUseCase } = require('../../../application/use-cases/VerifyOtpUseCase');
const { DeleteUserUseCase } = require('../../../application/use-cases/DeleteUserUseCase');
const { PgUserRepository } = require('../../../infrastructure/repositories/PgUserRepository');
const { PgOtpRepository } = require('../../../infrastructure/repositories/PgOtpRepository');
const { StubNotificationService } = require('../../../infrastructure/notifications/StubNotificationService');

class UserController {
  constructor() {
    const userRepo = new PgUserRepository();
    const otpRepo = new PgOtpRepository();
    const notificationSvc = new StubNotificationService();

    this.registerUseCase = new RegisterUserUseCase(userRepo, otpRepo, notificationSvc);
    this.verifyOtpUseCase = new VerifyOtpUseCase(userRepo, otpRepo);
    this.deleteUserUseCase = new DeleteUserUseCase(userRepo);
  }

  /**
   * POST /api/v1/users/register
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async register(req, res, next) {
    try {
      const result = await this.registerUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/users/verify-otp
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyOtp(req, res, next) {
    try {
      const result = await this.verifyOtpUseCase.execute(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteUser(req, res, next) {
    try {
      await this.deleteUserUseCase.execute({
        requesterId: req.user.sub,
        targetUserId: req.params.id,
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
