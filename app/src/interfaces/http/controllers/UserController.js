'use strict';

class UserController {
  /**
   * @param {import('../../../application/services/UserService')} userService
   */
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * GET /api/v1/users/me
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getProfile(req, res, next) {
    try {
      const profile = await this.userService.getProfile(req.user.id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/users/me
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async deleteAccount(req, res, next) {
    try {
      const result = await this.userService.deleteAccount(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
