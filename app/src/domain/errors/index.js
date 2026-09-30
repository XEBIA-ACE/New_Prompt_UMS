'use strict';

/**
 * Domain error base class.
 */
class DomainError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=400]
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class UserAlreadyExistsError extends DomainError {
  constructor(email) {
    super(`User with email '${email}' already exists.`, 409);
  }
}

class UserNotFoundError extends DomainError {
  constructor(identifier) {
    super(`User '${identifier}' not found.`, 404);
  }
}

class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password.', 401);
  }
}

class AccountNotVerifiedError extends DomainError {
  constructor() {
    super('Account email has not been verified.', 403);
  }
}

class AccountInactiveError extends DomainError {
  constructor() {
    super('Account is inactive or has been deleted.', 403);
  }
}

class InvalidOtpError extends DomainError {
  constructor() {
    super('OTP is invalid or has expired.', 400);
  }
}

module.exports = {
  DomainError,
  UserAlreadyExistsError,
  UserNotFoundError,
  InvalidCredentialsError,
  AccountNotVerifiedError,
  AccountInactiveError,
  InvalidOtpError,
};
