'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const healthRouter = require('./adapters/inbound/http/routes/health');
const authRouter = require('./adapters/inbound/http/routes/auth');
const errorHandler = require('./adapters/inbound/http/middleware/errorHandler');
const logger = require('./infrastructure/logger');

/**
 * Creates and configures the Express application.
 * Pure factory — no side-effects (no listen, no DB connections).
 *
 * @returns {import('express').Application}
 */
function createApp() {
  const app = express();

  // ── Security & parsing middleware ──────────────────────────────────────────
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // ── HTTP request logging ───────────────────────────────────────────────────
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);

  // ── 404 handler ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
  });

  // ── Global error handler ───────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
