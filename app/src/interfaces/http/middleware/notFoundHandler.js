'use strict';

const AppError = require('../../../application/errors/AppError');

/**
 * Catch-all 404 handler — must be registered after all routes.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404));
}

module.exports = notFoundHandler;
