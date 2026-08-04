'use strict';

const { Router } = require('express');

const router = Router();

/**
 * GET /health
 * Returns service liveness status.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'user-management-service',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
