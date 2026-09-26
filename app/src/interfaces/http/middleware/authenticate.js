'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('../../../application/errors/AppError');

/**
 * Express middleware: validates the Bearer JWT and attaches decoded payload to req.user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid Authorization header', 401));
  }

  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'changeme';
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    next(new AppError('Token is invalid or expired', 401));
  }
}

module.exports = { authenticate };
