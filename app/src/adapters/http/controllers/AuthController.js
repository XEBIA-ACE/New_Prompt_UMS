'use strict';

const RegisterUserUseCase = require('../../../application/use-cases/RegisterUserUseCase');
const VerifyEmailUseCase = require('../../../application/use-cases/VerifyEmailUseCase');
const LoginUserUseCase = require('../../../application/use-cases/LoginUserUseCase');
const container = require('../../../infrastructure/container');

const AuthController = {
  /**
   * POST /api/v1/auth/register
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async register(req, res, next) {
    try {
      const useCase = new RegisterUserUseCase(
        container.userRepository,
        container.otpRepository,
        container.emailService,
      );
      const { user } = await useCase.execute(req.body);
      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: user.toPublicJSON(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(req, res, next) {
    try {
      const useCase = new VerifyEmailUseCase(
        container.userRepository,
        container.otpRepository,
        container.emailService,
      );
      const { user } = await useCase.execute(req.body);
      res.status(200).json({
        message: 'Email verified successfully.',
        user: user.toPublicJSON(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const useCase = new LoginUserUseCase(
        container.userRepository,
        container.tokenService,
      );
      const { accessToken, user } = await useCase.execute(req.body);
      res.status(200).json({
        accessToken,
        user: user.toPublicJSON(),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
