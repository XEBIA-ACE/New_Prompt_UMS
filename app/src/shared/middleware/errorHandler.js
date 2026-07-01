'use strict';

const logger = require('../logger');
const AppError = require('../errors/AppError');

/**
 * Global Express error handler.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Unexpected / programming errors
  logger.error(err);
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}

module.exports = errorHandler;
