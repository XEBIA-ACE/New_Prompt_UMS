'use strict';

const { makeRegisterUser } = require('../../../../application/usecases/registerUser');
const { makeLoginUser } = require('../../../../application/usecases/loginUser');
const { makeLogoutUser } = require('../../../../application/usecases/logoutUser');
const { makeVerifyEmail } = require('../../../../application/usecases/verifyEmail');
const { MysqlUserRepository } = require('../../../../infrastructure/repositories/mysqlUserRepository');
const { JwtTokenService } = require('../../../../infrastructure/services/jwtTokenService');

/**
 * AuthController — inbound HTTP adapter for authentication endpoints.
 * Wires use-cases with their concrete infrastructure dependencies.
 */
class AuthController {
  constructor() {
    const userRepository = new MysqlUserRepository();
    const tokenService = new JwtTokenService();

    this._registerUser = makeRegisterUser(userRepository);
    this._loginUser = makeLoginUser(userRepository, tokenService);
    this._logoutUser = makeLogoutUser();
    this._verifyEmail = makeVerifyEmail(userRepository);
  }

  /**
   * POST /api/v1/auth/register
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async register(req, res, next) {
    try {
      const result = await this._registerUser(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async login(req, res, next) {
    try {
      const result = await this._loginUser(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async logout(req, res, next) {
    try {
      await this._logoutUser();
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/verify-email?token=<token>
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      await this._verifyEmail({ token });
      res.status(200).json({ status: 'success', message: 'Email verified successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
