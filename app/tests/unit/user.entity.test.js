'use strict';

const User = require('../../src/domain/entities/User');

describe('User entity', () => {
  const baseProps = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'alice@example.com',
    passwordHash: '$2b$12$hashedpassword',
    isVerified: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
  };

  it('isDeleted() returns false when deletedAt is null', () => {
    const user = new User(baseProps);
    expect(user.isDeleted()).toBe(false);
  });

  it('isDeleted() returns true when deletedAt is set', () => {
    const user = new User({ ...baseProps, deletedAt: new Date() });
    expect(user.isDeleted()).toBe(true);
  });

  it('toPublic() omits passwordHash', () => {
    const user = new User(baseProps);
    const pub = user.toPublic();
    expect(pub).not.toHaveProperty('passwordHash');
    expect(pub).toHaveProperty('id');
    expect(pub).toHaveProperty('email');
    expect(pub).toHaveProperty('isVerified');
    expect(pub).toHaveProperty('createdAt');
  });
});
