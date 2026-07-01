'use strict';

const request = require('supertest');
const app = require('../../src/app');

// Mock the pg pool so tests run without a real database
jest.mock('../../src/adapters/outbound/postgres/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  },
}));

describe('GET /health', () => {
  it('returns 200 with status ok when database is reachable', async () => {
    const { pool } = require('../../src/adapters/outbound/postgres/db');
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('user-management-service');
    expect(res.body.checks.database).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 503 with status degraded when database is unreachable', async () => {
    const { pool } = require('../../src/adapters/outbound/postgres/db');
    pool.query.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.database).toBe('unreachable');
  });

  it('response body contains required fields', async () => {
    const { pool } = require('../../src/adapters/outbound/postgres/db');
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/health');

    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('service');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('checks');
  });
});
