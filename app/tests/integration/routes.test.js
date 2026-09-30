'use strict';

const request = require('supertest');
const app = require('../../src/adapters/http/app');

describe('Auth routes — input validation', () => {
  describe('POST /api/v1/auth/register', () => {
    it('returns 422 for missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: 'securePass1!' });
      expect(res.status).toBe(422);
    });

    it('returns 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'securePass1!' });
      expect(res.status).toBe(422);
    });

    it('returns 422 for short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'short' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 422 for missing credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('returns 422 for invalid userId', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ userId: 'not-a-uuid', code: '123456' });
      expect(res.status).toBe(422);
    });
  });
});

describe('DELETE /api/v1/users/me — authentication guard', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).delete('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
  });
});
