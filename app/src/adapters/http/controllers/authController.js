'use strict';

const makeRegisterUser = require('../../../application/use-cases/registerUser');
const makeVerifyEmail = require('../../../application/use-cases/verifyEmail');
const makeLoginUser = require('../../../application/use-cases/loginUser');
const PgUserRepository = require('../../persistence/PgUserRepository');
const PgOtpRepository = require('../../persistence/PgOtpRepository');
const NodemailerEmailService = require('../../email/NodemailerEmailService');

// Compose dependencies (poor-man's DI container)
const userRepository = new PgUserRepository();
const otpRepository = new PgOtpRepository();
const emailService = new NodemailerEmailService();

const registerUser = makeRegisterUser({ userRepository, otpRepository, emailService });
const verifyEmail = makeVerifyEmail({ userRepository, otpRepository });
const loginUser = makeLoginUser({ userRepository });

/**
 * POST /api/v1/auth/register
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await registerUser({ email, password });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-email
 */
async function verifyEmailHandler(req, res, next) {
  try {
    const { userId, code } = req.body;
    const result = await verifyEmail({ userId, code });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, verifyEmail: verifyEmailHandler, login };
