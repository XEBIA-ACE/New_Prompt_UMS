'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const { validate } = require('../middleware/validate');

const router = Router();
const controller = new AuthController();

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
  (req, res, next) => controller.login(req, res, next)
);

module.exports = router;
