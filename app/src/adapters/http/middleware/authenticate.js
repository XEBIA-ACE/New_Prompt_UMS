'use strict';

const container = require('../../../infrastructure/container');
const { DomainError } = require('../../../domain/errors');

/**
 * JWT authentication middleware.
 * Attaches decoded payload to req.user on success.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = container.tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof DomainError) return next(err);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
