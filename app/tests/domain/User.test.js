'use strict';

/**
 * User domain entity unit tests
 */

const { User } = require('../../src/domain/entities/User');

describe('User entity', () => {
  const baseProps = {
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
  };

  it('creates a user with default values', () => {
    const user = new User(baseProps);
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.isVerified).toBe(false);
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('toPublic() omits passwordHash', () => {
    const user = new User(baseProps);
    const pub = user.toPublic();
    expect(pub).not.toHaveProperty('passwordHash');
    expect(pub.email).toBe('test@example.com');
  });

  it('verify() sets isVerified to true', () => {
    const user = new User(baseProps);
    user.verify();
    expect(user.isVerified).toBe(true);
  });

  it('deactivate() sets isActive to false', () => {
    const user = new User(baseProps);
    user.deactivate();
    expect(user.isActive).toBe(false);
  });
});
