'use strict';

const makeDeleteAccount = require('../../../application/use-cases/deleteAccount');
const PgUserRepository = require('../../persistence/PgUserRepository');
const PgOtpRepository = require('../../persistence/PgOtpRepository');

const userRepository = new PgUserRepository();
const otpRepository = new PgOtpRepository();
const deleteAccount = makeDeleteAccount({ userRepository, otpRepository });

/**
 * DELETE /api/v1/users/me
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteAccountHandler(req, res, next) {
  try {
    await deleteAccount({ userId: req.user.sub });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { deleteAccount: deleteAccountHandler };
