'use strict';

const User = require('../../src/domain/entities/User');

describe('User entity', () => {
  const baseProps = {
    id: 'test-id',
    email: 'alice@example.com',
    passwordHash: 'hashed',
    firstName: 'Alice',
    lastName: 'Smith',
  };

  describe('isOtpValid()', () => {
    it('returns false when no OTP is set', () => {
      const user = new User(baseProps);
      expect(user.isOtpValid()).toBe(false);
    });

    it('returns false when OTP has expired', () => {
      const user = new User({
        ...baseProps,
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() - 1000),
      });
      expect(user.isOtpValid()).toBe(false);
    });

    it('returns true when OTP is still valid', () => {
      const user = new User({
        ...baseProps,
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() + 60_000),
      });
      expect(user.isOtpValid()).toBe(true);
    });
  });

  describe('toPublic()', () => {
    it('does not expose passwordHash or otpCode', () => {
      const user = new User({ ...baseProps, otpCode: '999999' });
      const pub = user.toPublic();
      expect(pub.passwordHash).toBeUndefined();
      expect(pub.otpCode).toBeUndefined();
    });

    it('exposes expected public fields', () => {
      const user = new User(baseProps);
      const pub = user.toPublic();
      expect(pub).toMatchObject({
        id: 'test-id',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        isVerified: false,
      });
    });
  });
});
