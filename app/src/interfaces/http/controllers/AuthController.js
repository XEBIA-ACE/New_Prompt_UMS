'use strict';

const { LoginUserUseCase } = require('../../../application/use-cases/LoginUserUseCase');
const { PgUserRepository } = require('../../../infrastructure/repositories/PgUserRepository');

class AuthController {
  constructor() {
    const userRepo = new PgUserRepository();
    this.loginUseCase = new LoginUserUseCase(userRepo);
  }

  /**
   * POST /api/v1/auth/login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async login(req, res, next) {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
