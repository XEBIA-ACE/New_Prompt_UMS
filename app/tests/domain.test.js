'use strict';

const User = require('../../src/domain/entities/User');
const Otp = require('../../src/domain/entities/Otp');

describe('User entity', () => {
  it('sets default values when not provided', () => {
    const user = new User({ id: '1', email: 'a@b.com', passwordHash: 'hash' });
    expect(user.isVerified).toBe(false);
    expect(user.isActive).toBe(true);
    expect(user.firstName).toBeNull();
    expect(user.lastName).toBeNull();
  });

  it('stores provided values', () => {
    const user = new User({
      id: '1',
      email: 'a@b.com',
      passwordHash: 'hash',
      firstName: 'Alice',
      lastName: 'Smith',
      isVerified: true,
      isActive: false,
    });
    expect(user.firstName).toBe('Alice');
    expect(user.lastName).toBe('Smith');
    expect(user.isVerified).toBe(true);
    expect(user.isActive).toBe(false);
  });
});

describe('Otp entity', () => {
  it('isExpired returns true for past expiry', () => {
    const otp = new Otp({
      id: '1',
      userId: 'u1',
      code: '123456',
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(otp.isExpired()).toBe(true);
    expect(otp.isValid()).toBe(false);
  });

  it('isExpired returns false for future expiry', () => {
    const otp = new Otp({
      id: '1',
      userId: 'u1',
      code: '123456',
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(otp.isExpired()).toBe(false);
    expect(otp.isValid()).toBe(true);
  });

  it('isValid returns false when used', () => {
    const otp = new Otp({
      id: '1',
      userId: 'u1',
      code: '123456',
      expiresAt: new Date(Date.now() + 60_000),
      used: true,
    });
    expect(otp.isValid()).toBe(false);
  });
});
