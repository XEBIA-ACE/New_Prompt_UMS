'use strict';

/**
 * Otp domain entity unit tests
 */

const { Otp } = require('../../src/domain/entities/Otp');

describe('Otp entity', () => {
  it('generate() creates a 6-digit numeric code', () => {
    const otp = Otp.generate('user-id', 'email_verification');
    expect(otp.code).toMatch(/^\d{6}$/);
  });

  it('generate() sets expiresAt in the future', () => {
    const otp = Otp.generate('user-id', 'email_verification', 10);
    expect(otp.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('isValid() returns true for a fresh OTP', () => {
    const otp = Otp.generate('user-id', 'email_verification');
    expect(otp.isValid()).toBe(true);
  });

  it('isValid() returns false after consume()', () => {
    const otp = Otp.generate('user-id', 'email_verification');
    otp.consume();
    expect(otp.isValid()).toBe(false);
  });

  it('isValid() returns false for an expired OTP', () => {
    const otp = new Otp({
      userId: 'user-id',
      code: '123456',
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() - 1000), // already expired
    });
    expect(otp.isValid()).toBe(false);
  });
});
