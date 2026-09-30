'use strict';

const express = require('express');

const router = express.Router();

/**
 * GET /health
 * Returns service liveness status.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'user-management-service',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
