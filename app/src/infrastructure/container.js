'use strict';

/**
 * Dependency injection container.
 * Wires concrete adapters to the ports consumed by use-cases and controllers.
 */

const PostgresUserRepository = require('../adapters/repositories/PostgresUserRepository');
const PostgresOtpRepository = require('../adapters/repositories/PostgresOtpRepository');
const NodemailerEmailService = require('../adapters/services/NodemailerEmailService');
const JwtTokenService = require('../adapters/services/JwtTokenService');

const container = {
  userRepository: new PostgresUserRepository(),
  otpRepository: new PostgresOtpRepository(),
  emailService: new NodemailerEmailService(),
  tokenService: new JwtTokenService(),
};

module.exports = container;
