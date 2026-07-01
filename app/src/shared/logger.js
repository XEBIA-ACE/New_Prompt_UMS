'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config/env');

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    config.nodeEnv === 'production'
      ? format.json()
      : format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, stack }) =>
            stack
              ? `${timestamp} [${level}]: ${message}\n${stack}`
              : `${timestamp} [${level}]: ${message}`
          )
        )
  ),
  transports: [new transports.Console()],
  silent: config.nodeEnv === 'test',
});

module.exports = logger;
