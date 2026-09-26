'use strict';

require('dotenv').config();

const { createApp } = require('./app');
const logger = require('./infrastructure/logger');
const { connectDB } = require('./infrastructure/database/connection');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    await connectDB();
    logger.info('Database connection established');

    const app = createApp();

    app.listen(PORT, HOST, () => {
      logger.info(`User Management Service running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

start();
