'use strict';

const { Pool } = require('pg');
const logger = require('../logger');

let pool;

/**
 * Returns the singleton pg Pool instance.
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
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle pg client', { error: err.message });
    });
  }
  return pool;
}

/**
 * Verify the database connection is reachable.
 * @returns {Promise<void>}
 */
async function connectDB() {
  const client = await getPool().connect();
  client.release();
}

module.exports = { getPool, connectDB };
