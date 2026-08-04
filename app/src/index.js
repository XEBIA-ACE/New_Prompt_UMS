'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('./config');
const logger = require('./infrastructure/logger');

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`User Management Service listening on port ${PORT} [${config.nodeEnv}]`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server; // exported for testing
