import request from 'supertest';
import { createApp } from './app';

describe('GET /health (AC-1)', () => {
  it('responds 200 with database up', async () => {
    const app = createApp({ checkDatabase: async () => true });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'account-management-service',
      database: 'up',
    });
  });

  it('still responds 200 and reports database down when unreachable', async () => {
    const app = createApp({
      checkDatabase: async () => {
        throw new Error('connect ECONNREFUSED postgres://user:secret@host');
      },
    });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('down');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('returns 404 JSON for unknown routes', async () => {
    const app = createApp({ checkDatabase: async () => true });
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
