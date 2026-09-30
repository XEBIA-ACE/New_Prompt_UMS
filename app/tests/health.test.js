'use strict';

const request = require('supertest');

// Stub out the DB connection so tests don't need a real Postgres instance
jest.mock('../src/infrastructure/database/postgres', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  getPool: jest.fn(),
}));

// Stub the DI container so HTTP tests don't need real adapters
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

describe('Health endpoint', () => {
  it('GET /health → 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'user-management-service',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /health → response contains a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    const ts = new Date(res.body.timestamp);
    expect(ts.toString()).not.toBe('Invalid Date');
  });
});

describe('404 handler', () => {
  it('unknown route → 404', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
  });
});
