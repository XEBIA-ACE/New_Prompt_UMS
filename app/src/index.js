'use strict';

require('dotenv').config();

const app = require('./app');
const logger = require('./infrastructure/logger');
const { connectDatabase } = require('./infrastructure/database/connection');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectDatabase();
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`User Management Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
