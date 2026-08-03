'use strict';

const { validationResult } = require('express-validator');
const { ValidationError } = require('../../../../domain/errors');

/**
 * Express middleware that checks express-validator results and throws
 * a ValidationError if any field failed validation.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('; ');
    return next(new ValidationError(messages));
  }
  next();
}

module.exports = validateRequest;
