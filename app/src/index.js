'use strict';

require('dotenv').config();

const app = require('./adapters/http/app');
const { connectDB } = require('./infrastructure/db/pool');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');

const PORT = config.port;

(async () => {
  try {
    await connectDB();
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`User Management Service listening on port ${PORT} [${config.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to start service', { error: err.message });
    process.exit(1);
  }
})();
