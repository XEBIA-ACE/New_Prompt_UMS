'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');

const router = Router();
const controller = new UserController();

/**
 * POST /api/v1/users/register
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
  (req, res, next) => controller.register(req, res, next)
);

/**
 * POST /api/v1/users/verify-otp
 */
router.post(
  '/verify-otp',
  [
    body('userId').isUUID(),
    body('code').isLength({ min: 6, max: 6 }),
    body('purpose').isIn(['email_verification', 'password_reset']),
  ],
  validate,
  (req, res, next) => controller.verifyOtp(req, res, next)
);

/**
 * DELETE /api/v1/users/:id
 */
router.delete(
  '/:id',
  authenticate,
  (req, res, next) => controller.deleteUser(req, res, next)
);

module.exports = router;
