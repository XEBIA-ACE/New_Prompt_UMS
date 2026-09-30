'use strict';

const logger = require('../../../infrastructure/logger');
const { DomainError } = require('../../../domain/errors');

/**
 * Central error-handling middleware.
 *
 * @param {Error} err
 * @param {import('express').Request}  _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ message: 'Internal server error.' });
}

module.exports = errorHandler;
