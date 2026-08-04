'use strict';

const { Router } = require('express');
const { body } = require('express-validator');

const AuthController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const authenticate = require('../middleware/authenticate');

const router = Router();
const controller = new AuthController();

// POST /api/v1/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
  ],
  validateRequest,
  (req, res, next) => controller.register(req, res, next)
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  (req, res, next) => controller.login(req, res, next)
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  authenticate,
  (req, res, next) => controller.logout(req, res, next)
);

// GET /api/v1/auth/verify-email
router.get(
  '/verify-email',
  (req, res, next) => controller.verifyEmail(req, res, next)
);

module.exports = router;
