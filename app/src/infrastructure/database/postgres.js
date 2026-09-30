'use strict';

const { Pool } = require('pg');
const logger = require('../logger');

let pool;

/**
 * Initialise and return the shared PostgreSQL connection pool.
 * @returns {Pool}
 */
function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'user_management',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: Number(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error', { error: err.message });
    });
  }
  return pool;
}

/**
 * Test the database connection.
 * @returns {Promise<void>}
 */
async function connectDB() {
  const client = await getPool().connect();
  client.release();
}

module.exports = { getPool, connectDB };
