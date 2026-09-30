'use strict';

const DeleteAccountUseCase = require('../../../application/use-cases/DeleteAccountUseCase');
const container = require('../../../infrastructure/container');

const UserController = {
  /**
   * GET /api/v1/users/me
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getMe(req, res, next) {
    try {
      const user = await container.userRepository.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.status(200).json({ user: user.toPublicJSON() });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/users/me
   */
  async deleteMe(req, res, next) {
    try {
      const useCase = new DeleteAccountUseCase(
        container.userRepository,
        container.otpRepository,
      );
      await useCase.execute({ userId: req.user.sub });
      res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
