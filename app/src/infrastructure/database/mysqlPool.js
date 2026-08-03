'use strict';

const mysql = require('mysql2/promise');
const config = require('../../../config');
const logger = require('../../logger');

let pool = null;

/**
 * Returns the singleton MySQL connection pool.
 *
 * @returns {import('mysql2/promise').Pool}
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      connectionLimit: config.db.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
    });
    logger.info('MySQL connection pool created');
  }
  return pool;
}

/**
 * Closes the pool (useful for graceful shutdown / tests).
 *
 * @returns {Promise<void>}
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('MySQL connection pool closed');
  }
}

module.exports = { getPool, closePool };
