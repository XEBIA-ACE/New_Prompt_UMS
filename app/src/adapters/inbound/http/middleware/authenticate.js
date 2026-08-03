'use strict';

const { JwtTokenService } = require('../../../../infrastructure/services/jwtTokenService');
const { UnauthorizedError } = require('../../../../domain/errors');

const tokenService = new JwtTokenService();

/**
 * Express middleware that validates the Bearer token in the Authorization header.
 * Attaches the decoded payload to req.user on success.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);
  try {
    req.user = tokenService.verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
