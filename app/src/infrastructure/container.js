'use strict';

const PostgresUserRepository = require('./repositories/PostgresUserRepository');
const NodemailerEmailService = require('./email/NodemailerEmailService');
const AuthService = require('../application/services/AuthService');
const UserService = require('../application/services/UserService');

// Adapters
const userRepository = new PostgresUserRepository();
const emailService = new NodemailerEmailService();

// Application services (use-case layer)
const authService = new AuthService(userRepository, emailService);
const userService = new UserService(userRepository);

module.exports = { userRepository, emailService, authService, userService };
