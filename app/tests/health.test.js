'use strict';

const request = require('supertest');
const app = require('../../src/app');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'user-management-service',
    });
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns a valid ISO 8601 timestamp', async () => {
    const res = await request(app).get('/health');
    const ts = new Date(res.body.timestamp);
    expect(ts.toString()).not.toBe('Invalid Date');
  });

  it('responds with Content-Type application/json', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ status: 'error' });
  });
});
