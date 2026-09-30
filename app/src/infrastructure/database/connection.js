'use strict';

const { Pool } = require('pg');
const logger = require('../logger');

let pool;

/**
 * Initialise (or return the existing) connection pool.
 * @returns {Pool}
 */
function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'user_management',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err.message });
    });
  }
  return pool;
}

/**
 * Verify the database connection is reachable.
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  const client = await getPool().connect();
  client.release();
}

/**
 * Close all pool connections (useful for graceful shutdown / tests).
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, connectDatabase, closeDatabase };
