'use strict';

const { Router } = require('express');
const { pool } = require('../../outbound/postgres/db');

const router = Router();

/**
 * GET /health
 * Returns service liveness and database reachability.
 */
router.get('/', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'unreachable';
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  const httpStatus = status === 'ok' ? 200 : 503;

  return res.status(httpStatus).json({
    status,
    service: 'user-management-service',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
    },
  });
});

module.exports = router;
