'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const AppError = require('../errors/AppError');

/**
 * Express middleware that validates a Bearer JWT and attaches
 * the decoded payload to `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid Authorization header', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = authenticate;
