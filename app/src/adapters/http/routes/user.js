'use strict';

const { Router } = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

const router = Router();

/**
 * DELETE /api/v1/users/me
 * Requires a valid JWT.
 */
router.delete('/me', authenticate, userController.deleteAccount);

module.exports = router;
