'use strict';

const { createUser } = require('../../src/domain/entities/user');

describe('User entity', () => {
  const validParams = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'Alice@Example.com',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'Alice',
    lastName: 'Smith',
  };

  it('creates a frozen user object with normalised email', () => {
    const user = createUser(validParams);
    expect(user.email).toBe('alice@example.com');
    expect(Object.isFrozen(user)).toBe(true);
  });

  it('defaults isVerified to false', () => {
    const user = createUser(validParams);
    expect(user.isVerified).toBe(false);
  });

  it('defaults verificationToken to null', () => {
    const user = createUser(validParams);
    expect(user.verificationToken).toBeNull();
  });

  it('throws when id is missing', () => {
    expect(() => createUser({ ...validParams, id: undefined })).toThrow('User id is required');
  });

  it('throws when email is missing', () => {
    expect(() => createUser({ ...validParams, email: '' })).toThrow('User email is required');
  });

  it('throws when passwordHash is missing', () => {
    expect(() => createUser({ ...validParams, passwordHash: '' })).toThrow(
      'User passwordHash is required'
    );
  });
});
