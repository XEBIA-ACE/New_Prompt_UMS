'use strict';

/**
 * Health endpoint tests
 *
 * These tests use supertest against the Express app factory so no real
 * database connection is required.
 */

// Stub out the DB connection so app.js can be imported without Postgres
jest.mock('../src/infrastructure/database/connection', () => ({
  getPool: jest.fn(),
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /health', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('returns HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns JSON content-type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns status "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('ok');
  });

  it('returns the service name', async () => {
    const res = await request(app).get('/health');
    expect(res.body.service).toBe('user-management-service');
  });

  it('returns a timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeDefined();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});

describe('404 handler', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
  });

  it('returns JSON error body for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.statusCode).toBe(404);
  });
});
