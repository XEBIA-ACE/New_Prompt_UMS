'use strict';

/**
 * User registration and OTP verification integration-style tests.
 * All infrastructure dependencies are mocked — no real DB required.
 */

jest.mock('../src/infrastructure/database/connection', () => ({
  getPool: jest.fn(),
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const { createApp } = require('../src/app');

// ── Shared mock repositories ──────────────────────────────────────────────────

const mockUserRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockOtpRepo = {
  save: jest.fn(),
  findLatest: jest.fn(),
  markUsed: jest.fn(),
};

const mockNotification = {
  sendOtp: jest.fn().mockResolvedValue(undefined),
};

// Inject mocks via module factory overrides
jest.mock('../src/infrastructure/repositories/PgUserRepository', () => ({
  PgUserRepository: jest.fn().mockImplementation(() => mockUserRepo),
}));

jest.mock('../src/infrastructure/repositories/PgOtpRepository', () => ({
  PgOtpRepository: jest.fn().mockImplementation(() => mockOtpRepo),
}));

jest.mock('../src/infrastructure/notifications/StubNotificationService', () => ({
  StubNotificationService: jest.fn().mockImplementation(() => mockNotification),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/users/register', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 422 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ password: 'password123' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(422);
  });

  it('returns 201 on successful registration', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.save.mockImplementation(async (u) => u);
    mockOtpRepo.save.mockImplementation(async (o) => o);

    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('returns 409 when email is already in use', async () => {
    const { User } = require('../src/domain/entities/User');
    mockUserRepo.findByEmail.mockResolvedValue(
      new User({ email: 'alice@example.com', passwordHash: 'hash' })
    );

    const res = await request(app)
      .post('/api/v1/users/register')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});
