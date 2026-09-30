'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const validate = require('../middleware/validate');

const router = Router();

/**
 * POST /api/v1/auth/register
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
  ],
  validate,
  AuthController.register,
);

/**
 * POST /api/v1/auth/verify-email
 */
router.post(
  '/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  validate,
  AuthController.verifyEmail,
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
  AuthController.login,
);

module.exports = router;
