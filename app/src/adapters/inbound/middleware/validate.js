'use strict';

const { validationResult } = require('express-validator');

/**
 * Express middleware that checks express-validator results and
 * returns 422 if any validation errors are present.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  return next();
}

module.exports = validate;
