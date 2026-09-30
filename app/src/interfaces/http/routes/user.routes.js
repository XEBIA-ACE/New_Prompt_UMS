'use strict';

const express = require('express');

const UserController = require('../controllers/UserController');
const authenticate = require('../middleware/authenticate');
const container = require('../../../infrastructure/container');

const router = express.Router();
const userController = new UserController(container.userService);

// All user routes require a valid JWT
router.use(authenticate);

/**
 * GET /api/v1/users/me
 */
router.get('/me', (req, res, next) => userController.getProfile(req, res, next));

/**
 * DELETE /api/v1/users/me
 */
router.delete('/me', (req, res, next) => userController.deleteAccount(req, res, next));

module.exports = router;
