'use strict';

const User = require('../../src/domain/entities/User');
const Otp = require('../../src/domain/entities/Otp');
const { v4: uuidv4 } = require('uuid');

describe('User entity', () => {
  function makeUser(overrides = {}) {
    return new User({
      id: uuidv4(),
      email: 'test@example.com',
      passwordHash: 'hash',
      isVerified: false,
      isActive: true,
      ...overrides,
    });
  }

  it('creates a user with default values', () => {
    const user = makeUser();
    expect(user.isVerified).toBe(false);
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('verify() sets isVerified to true', () => {
    const user = makeUser();
    user.verify();
    expect(user.isVerified).toBe(true);
  });

  it('deactivate() sets isActive to false', () => {
    const user = makeUser();
    user.deactivate();
    expect(user.isActive).toBe(false);
  });

  it('toPublicJSON() does not expose passwordHash', () => {
    const user = makeUser();
    const json = user.toPublicJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.email).toBe('test@example.com');
  });
});

describe('Otp entity', () => {
  function makeOtp(overrides = {}) {
    return new Otp({
      id: uuidv4(),
      userId: uuidv4(),
      code: '654321',
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
      ...overrides,
    });
  }

  it('isValid() returns true for a fresh OTP', () => {
    const otp = makeOtp();
    expect(otp.isValid()).toBe(true);
  });

  it('isValid() returns false for an expired OTP', () => {
    const otp = makeOtp({ expiresAt: new Date(Date.now() - 1000) });
    expect(otp.isValid()).toBe(false);
  });

  it('isValid() returns false after consume()', () => {
    const otp = makeOtp();
    otp.consume();
    expect(otp.isValid()).toBe(false);
  });

  it('consume() sets used to true', () => {
    const otp = makeOtp();
    otp.consume();
    expect(otp.used).toBe(true);
  });
});
