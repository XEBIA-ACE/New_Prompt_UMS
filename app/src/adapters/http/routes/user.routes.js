'use strict';

const { Router } = require('express');
const UserController = require('../controllers/UserController');
const authenticate = require('../middleware/authenticate');

const router = Router();

// All user routes require a valid JWT
router.use(authenticate);

/**
 * GET /api/v1/users/me
 */
router.get('/me', UserController.getMe);

/**
 * DELETE /api/v1/users/me
 */
router.delete('/me', UserController.deleteMe);

module.exports = router;
