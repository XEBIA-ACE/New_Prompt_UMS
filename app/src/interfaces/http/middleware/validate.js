'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../../../domain/errors/AppError');

/**
 * Middleware — run after express-validator chains.
 * Collects validation errors and short-circuits with a 422 response.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 422));
  }
  next();
}

module.exports = validate;
