'use strict';

const Otp = require('../../src/domain/entities/Otp');

describe('Otp entity', () => {
  it('isExpired() returns false for a future expiry', () => {
    const otp = new Otp({
      id: 'otp-1',
      userId: 'user-1',
      code: '123456',
      expiresAt: new Date(Date.now() + 60_000),
      used: false,
      createdAt: new Date(),
    });
    expect(otp.isExpired()).toBe(false);
  });

  it('isExpired() returns true for a past expiry', () => {
    const otp = new Otp({
      id: 'otp-2',
      userId: 'user-1',
      code: '123456',
      expiresAt: new Date(Date.now() - 1),
      used: false,
      createdAt: new Date(),
    });
    expect(otp.isExpired()).toBe(true);
  });

  it('isValid() returns false when already used', () => {
    const otp = new Otp({
      id: 'otp-3',
      userId: 'user-1',
      code: '123456',
      expiresAt: new Date(Date.now() + 60_000),
      used: true,
      createdAt: new Date(),
    });
    expect(otp.isValid()).toBe(false);
  });

  it('isValid() returns true when not used and not expired', () => {
    const otp = new Otp({
      id: 'otp-4',
      userId: 'user-1',
      code: '123456',
      expiresAt: new Date(Date.now() + 60_000),
      used: false,
      createdAt: new Date(),
    });
    expect(otp.isValid()).toBe(true);
  });
});
