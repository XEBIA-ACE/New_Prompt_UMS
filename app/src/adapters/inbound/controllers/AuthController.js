'use strict';

const RegisterUserUseCase = require('../../../application/usecases/RegisterUserUseCase');
const LoginUserUseCase = require('../../../application/usecases/LoginUserUseCase');
const PostgresUserRepository = require('../../outbound/postgres/PostgresUserRepository');

const userRepository = new PostgresUserRepository();
const registerUser = new RegisterUserUseCase(userRepository);
const loginUser = new LoginUserUseCase(userRepository);

const AuthController = {
  /**
   * POST /api/v1/auth/register
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async register(req, res, next) {
    try {
      const user = await registerUser.execute(req.body);
      return res.status(201).json({
        status: 'success',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/auth/login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async login(req, res, next) {
    try {
      const { token, user } = await loginUser.execute(req.body);
      return res.status(200).json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = AuthController;
