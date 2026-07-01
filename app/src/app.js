'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/env');
const logger = require('./shared/logger');
const errorHandler = require('./shared/middleware/errorHandler');

const healthRoutes = require('./adapters/inbound/routes/healthRoutes');
const userRoutes = require('./adapters/inbound/routes/userRoutes');
const authRoutes = require('./adapters/inbound/routes/authRoutes');

/**
 * Creates and configures the Express application.
 * @returns {import('express').Application}
 */
function createApp() {
  const app = express();

  // ── Security & parsing ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── HTTP request logging ──────────────────────────────────────────────────
  if (config.nodeEnv !== 'test') {
    app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/health', healthRoutes);
  app.use(`${config.apiPrefix}/users`, userRoutes);
  app.use(`${config.apiPrefix}/auth`, authRoutes);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
