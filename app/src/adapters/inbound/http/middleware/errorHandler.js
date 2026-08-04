'use strict';

const { AppError } = require('../../../../domain/errors');
const logger = require('../../../../infrastructure/logger');

/**
 * Global Express error handler.
 * Must be registered LAST in the middleware chain (4-argument signature).
 *
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
  }

  // Unexpected / unhandled errors
  logger.error('Unhandled error', { error: err });
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
