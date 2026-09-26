'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const healthRouter = require('./interfaces/http/routes/health.routes');
const userRouter = require('./interfaces/http/routes/user.routes');
const authRouter = require('./interfaces/http/routes/auth.routes');
const errorHandler = require('./interfaces/http/middleware/errorHandler');
const notFoundHandler = require('./interfaces/http/middleware/notFoundHandler');

/**
 * Creates and configures the Express application.
 * @returns {import('express').Application}
 */
function createApp() {
  const app = express();

  // Security & utility middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/auth', authRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
