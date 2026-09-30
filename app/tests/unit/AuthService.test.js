'use strict';

const AuthService = require('../../src/application/services/AuthService');
const AppError = require('../../src/domain/errors/AppError');

// ── helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  const { v4: uuidv4 } = require('uuid');
  const User = require('../../src/domain/entities/User');
  const { hashPassword } = require('../../src/domain/utils/crypto');

  return {
    id: uuidv4(),
    email: 'alice@example.com',
    passwordHash: null, // filled in async tests
    firstName: 'Alice',
    lastName: 'Smith',
    isVerified: false,
    otpCode: '123456',
    otpExpiresAt: new Date(Date.now() + 600_000),
    isOtpValid: () => true,
    toPublic: () => ({ id: 'test-id', email: 'alice@example.com' }),
    ...overrides,
  };
}

function makeRepo(overrides = {}) {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(async (u) => u),
    update: jest.fn().mockImplementation(async (u) => u),
    findById: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeEmailService() {
  return { sendVerificationOtp: jest.fn().mockResolvedValue(undefined) };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  describe('register()', () => {
    it('throws 409 when email already exists', async () => {
      const repo = makeRepo({ findByEmail: jest.fn().mockResolvedValue(makeUser()) });
      const svc = new AuthService(repo, makeEmailService());

      await expect(
        svc.register({ email: 'alice@example.com', password: 'secret123', firstName: 'A', lastName: 'B' })
      ).rejects.toThrow(AppError);
    });

    it('creates a user and sends OTP on success', async () => {
      const repo = makeRepo();
      const email = makeEmailService();
      const svc = new AuthService(repo, email);

      await svc.register({ email: 'new@example.com', password: 'secret123', firstName: 'A', lastName: 'B' });

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(email.sendVerificationOtp).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyEmail()', () => {
    it('throws 404 when user not found', async () => {
      const svc = new AuthService(makeRepo(), makeEmailService());
      await expect(svc.verifyEmail({ email: 'x@x.com', otp: '000000' })).rejects.toThrow(AppError);
    });

    it('throws 400 when OTP is invalid', async () => {
      const user = makeUser({ otpCode: '111111' });
      const repo = makeRepo({ findByEmail: jest.fn().mockResolvedValue(user) });
      const svc = new AuthService(repo, makeEmailService());

      await expect(svc.verifyEmail({ email: user.email, otp: '999999' })).rejects.toThrow(AppError);
    });

    it('marks user as verified on correct OTP', async () => {
      const user = makeUser({ otpCode: '123456', isVerified: false });
      const repo = makeRepo({ findByEmail: jest.fn().mockResolvedValue(user) });
      const svc = new AuthService(repo, makeEmailService());

      const result = await svc.verifyEmail({ email: user.email, otp: '123456' });
      expect(result.message).toMatch(/verified/i);
      expect(repo.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('login()', () => {
    it('throws 401 when user not found', async () => {
      const svc = new AuthService(makeRepo(), makeEmailService());
      await expect(svc.login({ email: 'ghost@x.com', password: 'pw' })).rejects.toThrow(AppError);
    });

    it('throws 403 when email is not verified', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('secret123', 1);
      const user = makeUser({ passwordHash: hash, isVerified: false });
      const repo = makeRepo({ findByEmail: jest.fn().mockResolvedValue(user) });
      const svc = new AuthService(repo, makeEmailService());

      await expect(svc.login({ email: user.email, password: 'secret123' })).rejects.toThrow(AppError);
    });

    it('returns a token for valid verified credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('secret123', 1);
      const user = makeUser({ passwordHash: hash, isVerified: true });
      const repo = makeRepo({ findByEmail: jest.fn().mockResolvedValue(user) });
      const svc = new AuthService(repo, makeEmailService());

      const result = await svc.login({ email: user.email, password: 'secret123' });
      expect(typeof result.token).toBe('string');
    });
  });
});
