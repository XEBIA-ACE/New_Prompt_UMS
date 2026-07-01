'use strict';

const { Pool } = require('pg');
const config = require('../../../config/env');
const logger = require('../../../shared/logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  min: config.db.poolMin,
  max: config.db.poolMax,
});

pool.on('error', (err) => {
  logger.error(`Unexpected PostgreSQL pool error: ${err.message}`);
});

module.exports = { pool };
