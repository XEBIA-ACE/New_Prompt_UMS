'use strict';

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../logger');

/** @type {Pool} */
let pool;

/**
 * Initialise and verify the PostgreSQL connection pool.
 * @returns {Promise<void>}
 */
async function connectDB() {
  pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    min: config.db.poolMin,
    max: config.db.poolMax,
  });

  // Verify connectivity
  const client = await pool.connect();
  client.release();
  logger.info('PostgreSQL pool ready');
}

/**
 * Execute a parameterised query.
 * @param {string} text  - SQL statement
 * @param {Array}  params - Bound parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  if (!pool) throw new Error('Database pool not initialised. Call connectDB() first.');
  return pool.query(text, params);
}

/**
 * Acquire a client for transaction use.
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  if (!pool) throw new Error('Database pool not initialised. Call connectDB() first.');
  return pool.connect();
}

/**
 * Gracefully close the pool (used in tests / shutdown hooks).
 * @returns {Promise<void>}
 */
async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { connectDB, query, getClient, closeDB };
