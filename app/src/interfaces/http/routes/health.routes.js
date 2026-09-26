'use strict';

const { Router } = require('express');

const router = Router();

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
