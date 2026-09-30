'use strict';

const express = require('express');
const { body } = require('express-validator');

const AuthController = require('../controllers/AuthController');
const validate = require('../middleware/validate');
const container = require('../../../infrastructure/container');

const router = express.Router();
const authController = new AuthController(
  container.authService,
);

/**
 * POST /api/v1/auth/register
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  validate,
  (req, res, next) => authController.register(req, res, next)
);

/**
 * POST /api/v1/auth/verify-email
 */
router.post(
  '/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
  ],
  validate,
  (req, res, next) => authController.verifyEmail(req, res, next)
);

/**
 * POST /api/v1/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  (req, res, next) => authController.login(req, res, next)
);

module.exports = router;
