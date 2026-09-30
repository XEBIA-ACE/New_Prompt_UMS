'use strict';

const { Router } = require('express');

const router = Router();

/**
 * GET /health
 * Returns service liveness status.
 *
 * @returns {{ status: string, service: string, timestamp: string }}
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'user-management-service',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
