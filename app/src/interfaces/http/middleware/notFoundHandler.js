'use strict';

const AppError = require('../../../domain/errors/AppError');

/**
 * Catch-all for unmatched routes.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

module.exports = notFoundHandler;
