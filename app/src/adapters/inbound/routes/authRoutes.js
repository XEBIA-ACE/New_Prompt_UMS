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
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
  ],
  validate,
  AuthController.register
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
  AuthController.login
);

module.exports = router;
