'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../../../application/errors/AppError');

/**
 * Express middleware: checks express-validator results and short-circuits with 422 on failure.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return next(new AppError(`Validation failed: ${messages}`, 422));
  }
  next();
}

module.exports = { validate };
