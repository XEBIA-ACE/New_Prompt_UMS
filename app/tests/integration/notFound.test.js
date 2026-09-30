'use strict';

const request = require('supertest');
const app = require('../../src/app');

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
