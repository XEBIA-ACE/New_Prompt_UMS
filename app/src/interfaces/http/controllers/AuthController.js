'use strict';

class AuthController {
  /**
   * @param {import('../../../application/services/AuthService')} authService
   */
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * POST /api/v1/auth/register
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const result = await this.authService.register({ email, password, firstName, lastName });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await this.authService.verifyEmail({ email, otp });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
