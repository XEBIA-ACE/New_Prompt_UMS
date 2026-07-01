'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('./config/env');
const logger = require('./shared/logger');
const { pool } = require('./adapters/outbound/postgres/db');

const PORT = config.port;

async function start() {
  try {
    // Verify DB connectivity on startup
    await pool.query('SELECT 1');
    logger.info('Database connection established');
  } catch (err) {
    logger.warn(`Database not reachable at startup: ${err.message}`);
  }

  const server = app.listen(PORT, () => {
    logger.info(`User Management Service listening on port ${PORT} [${config.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await pool.end();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
