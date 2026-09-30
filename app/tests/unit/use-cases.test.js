'use strict';

const RegisterUserUseCase = require('../../src/application/use-cases/RegisterUserUseCase');
const LoginUserUseCase = require('../../src/application/use-cases/LoginUserUseCase');
const VerifyEmailUseCase = require('../../src/application/use-cases/VerifyEmailUseCase');
const DeleteAccountUseCase = require('../../src/application/use-cases/DeleteAccountUseCase');
const User = require('../../src/domain/entities/User');
const Otp = require('../../src/domain/entities/Otp');
const {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  AccountNotVerifiedError,
  AccountInactiveError,
  InvalidOtpError,
  UserNotFoundError,
} = require('../../src/domain/errors');
const { v4: uuidv4 } = require('uuid');

// ─── Factories ────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return new User({
    id: uuidv4(),
    email: 'alice@example.com',
    // bcrypt hash of "Str0ngP@ss"
    passwordHash: '$2a$12$KIXbFqMqFqMqFqMqFqMqFuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    firstName: 'Alice',
    isVerified: true,
    isActive: true,
    ...overrides,
  });
}

function makeOtp(userId, overrides = {}) {
  return new Otp({
    id: uuidv4(),
    userId,
    code: '123456',
    type: 'email_verification',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    used: false,
    ...overrides,
  });
}

// ─── RegisterUserUseCase ──────────────────────────────────────────────────────

describe('RegisterUserUseCase', () => {
  let userRepo, otpRepo, emailSvc;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (u) => u),
    };
    otpRepo = { save: jest.fn().mockImplementation(async (o) => o) };
    emailSvc = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };
  });

  it('saves a new user and sends a verification email', async () => {
    const useCase = new RegisterUserUseCase(userRepo, otpRepo, emailSvc);
    const { user } = await useCase.execute({
      email: 'new@example.com',
      password: 'Str0ngP@ss',
    });

    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(otpRepo.save).toHaveBeenCalledTimes(1);
    expect(emailSvc.sendVerificationEmail).toHaveBeenCalledWith('new@example.com', expect.any(String));
    expect(user.isVerified).toBe(false);
  });

  it('throws UserAlreadyExistsError when email is taken', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser());
    const useCase = new RegisterUserUseCase(userRepo, otpRepo, emailSvc);

    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'Str0ngP@ss' }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });
});

// ─── LoginUserUseCase ─────────────────────────────────────────────────────────

describe('LoginUserUseCase', () => {
  let userRepo, tokenSvc;

  beforeEach(() => {
    tokenSvc = { generateAccessToken: jest.fn().mockReturnValue('jwt-token') };
  });

  it('throws InvalidCredentialsError when user not found', async () => {
    userRepo = { findByEmail: jest.fn().mockResolvedValue(null) };
    const useCase = new LoginUserUseCase(userRepo, tokenSvc);

    await expect(
      useCase.execute({ email: 'ghost@example.com', password: 'pass' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws AccountNotVerifiedError when user is not verified', async () => {
    const user = makeUser({ isVerified: false });
    // Use a real bcrypt hash so password comparison passes
    const bcrypt = require('bcryptjs');
    user.passwordHash = await bcrypt.hash('Str0ngP@ss', 1);

    userRepo = { findByEmail: jest.fn().mockResolvedValue(user) };
    const useCase = new LoginUserUseCase(userRepo, tokenSvc);

    await expect(
      useCase.execute({ email: user.email, password: 'Str0ngP@ss' }),
    ).rejects.toThrow(AccountNotVerifiedError);
  });

  it('throws AccountInactiveError when account is deactivated', async () => {
    const user = makeUser({ isActive: false });
    const bcrypt = require('bcryptjs');
    user.passwordHash = await bcrypt.hash('Str0ngP@ss', 1);

    userRepo = { findByEmail: jest.fn().mockResolvedValue(user) };
    const useCase = new LoginUserUseCase(userRepo, tokenSvc);

    await expect(
      useCase.execute({ email: user.email, password: 'Str0ngP@ss' }),
    ).rejects.toThrow(AccountInactiveError);
  });
});

// ─── VerifyEmailUseCase ───────────────────────────────────────────────────────

describe('VerifyEmailUseCase', () => {
  let userRepo, otpRepo, emailSvc;

  beforeEach(() => {
    emailSvc = { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) };
  });

  it('verifies the user when OTP is valid', async () => {
    const user = makeUser({ isVerified: false });
    const otp = makeOtp(user.id);

    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockImplementation(async (u) => u),
    };
    otpRepo = {
      findByUserAndCode: jest.fn().mockResolvedValue(otp),
      update: jest.fn().mockImplementation(async (o) => o),
    };

    const useCase = new VerifyEmailUseCase(userRepo, otpRepo, emailSvc);
    const { user: verified } = await useCase.execute({ email: user.email, code: '123456' });

    expect(verified.isVerified).toBe(true);
    expect(otp.used).toBe(true);
  });

  it('throws InvalidOtpError when OTP is expired', async () => {
    const user = makeUser({ isVerified: false });
    const expiredOtp = makeOtp(user.id, { expiresAt: new Date(Date.now() - 1000) });

    userRepo = { findByEmail: jest.fn().mockResolvedValue(user) };
    otpRepo = { findByUserAndCode: jest.fn().mockResolvedValue(expiredOtp) };

    const useCase = new VerifyEmailUseCase(userRepo, otpRepo, emailSvc);

    await expect(
      useCase.execute({ email: user.email, code: '123456' }),
    ).rejects.toThrow(InvalidOtpError);
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    userRepo = { findByEmail: jest.fn().mockResolvedValue(null) };
    otpRepo = {};

    const useCase = new VerifyEmailUseCase(userRepo, otpRepo, emailSvc);

    await expect(
      useCase.execute({ email: 'ghost@example.com', code: '000000' }),
    ).rejects.toThrow(UserNotFoundError);
  });
});

// ─── DeleteAccountUseCase ─────────────────────────────────────────────────────

describe('DeleteAccountUseCase', () => {
  it('deletes user and cleans up OTPs', async () => {
    const user = makeUser();
    const userRepo = {
      findById: jest.fn().mockResolvedValue(user),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const otpRepo = { deleteByUserId: jest.fn().mockResolvedValue(undefined) };

    const useCase = new DeleteAccountUseCase(userRepo, otpRepo);
    await useCase.execute({ userId: user.id });

    expect(otpRepo.deleteByUserId).toHaveBeenCalledWith(user.id);
    expect(userRepo.delete).toHaveBeenCalledWith(user.id);
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    const userRepo = { findById: jest.fn().mockResolvedValue(null) };
    const otpRepo = {};

    const useCase = new DeleteAccountUseCase(userRepo, otpRepo);

    await expect(
      useCase.execute({ userId: 'non-existent-id' }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('throws AccountInactiveError when account is already inactive', async () => {
    const user = makeUser({ isActive: false });
    const userRepo = { findById: jest.fn().mockResolvedValue(user) };
    const otpRepo = {};

    const useCase = new DeleteAccountUseCase(userRepo, otpRepo);

    await expect(
      useCase.execute({ userId: user.id }),
    ).rejects.toThrow(AccountInactiveError);
  });
});
