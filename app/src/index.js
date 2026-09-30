'use strict';

require('dotenv').config();

const app = require('./app');
const logger = require('./infrastructure/logger');
const { connectDB } = require('./infrastructure/database/postgres');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectDB();
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`User Management Service running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start service', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
