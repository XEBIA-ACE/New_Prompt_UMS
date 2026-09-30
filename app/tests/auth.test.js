'use strict';

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

jest.mock('../src/infrastructure/database/postgres', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  getPool: jest.fn(),
}));

const container = require('../src/infrastructure/container');
jest.mock('../src/infrastructure/container', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  otpRepository: {
    save: jest.fn(),
    findByUserAndCode: jest.fn(),
    update: jest.fn(),
    deleteByUserId: jest.fn(),
  },
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  },
  tokenService: {
    generateAccessToken: jest.fn().mockReturnValue('mock.jwt.token'),
    verifyAccessToken: jest.fn().mockReturnValue({ sub: 'user-id-1', email: 'test@example.com' }),
  },
}));

const app = require('../src/app');
const User = require('../src/domain/entities/User');
const Otp = require('../src/domain/entities/Otp');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return new User({
    id: uuidv4(),
    email: 'alice@example.com',
    passwordHash: '$2a$12$hashedpassword',
    firstName: 'Alice',
    lastName: 'Smith',
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

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 when registration succeeds', async () => {
    container.userRepository.findByEmail.mockResolvedValue(null);
    container.userRepository.save.mockImplementation(async (u) => u);
    container.otpRepository.save.mockImplementation(async (o) => o);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'Str0ngP@ss' });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/verify your email/i);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(container.emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('returns 409 when email already exists', async () => {
    container.userRepository.findByEmail.mockResolvedValue(makeUser());

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'Str0ngP@ss' });

    expect(res.status).toBe(409);
  });

  it('returns 422 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'Str0ngP@ss' });

    expect(res.status).toBe(422);
  });

  it('returns 422 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.com', password: 'short' });

    expect(res.status).toBe(422);
  });
});

// ─── POST /api/v1/auth/verify-email ──────────────────────────────────────────

describe('POST /api/v1/auth/verify-email', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 when OTP is valid', async () => {
    const user = makeUser({ isVerified: false });
    const otp = makeOtp(user.id);

    container.userRepository.findByEmail.mockResolvedValue(user);
    container.otpRepository.findByUserAndCode.mockResolvedValue(otp);
    container.otpRepository.update.mockImplementation(async (o) => o);
    container.userRepository.update.mockImplementation(async (u) => u);

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: user.email, code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified/i);
  });

  it('returns 400 when OTP is expired', async () => {
    const user = makeUser({ isVerified: false });
    const expiredOtp = makeOtp(user.id, {
      expiresAt: new Date(Date.now() - 1000),
    });

    container.userRepository.findByEmail.mockResolvedValue(user);
    container.otpRepository.findByUserAndCode.mockResolvedValue(expiredOtp);

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: user.email, code: '123456' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when user does not exist', async () => {
    container.userRepository.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'ghost@example.com', code: '123456' });

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when user does not exist', async () => {
    container.userRepository.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password' });

    expect(res.status).toBe(401);
  });

  it('returns 422 when body is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(422);
  });
});
