'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const UserController = require('../controllers/UserController');
const authenticate = require('../../../shared/middleware/authenticate');
const validate = require('../middleware/validate');

const router = Router();

/**
 * GET /api/v1/users/:id
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  UserController.getUser
);

/**
 * DELETE /api/v1/users/:id
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  UserController.deleteUser
);

/**
 * POST /api/v1/users/:id/otp/generate
 */
router.post(
  '/:id/otp/generate',
  authenticate,
  [param('id').isUUID()],
  validate,
  UserController.generateOtp
);

/**
 * POST /api/v1/users/:id/otp/verify
 */
router.post(
  '/:id/otp/verify',
  authenticate,
  [
    param('id').isUUID(),
    body('code').notEmpty().isString(),
  ],
  validate,
  UserController.verifyOtp
);

module.exports = router;
