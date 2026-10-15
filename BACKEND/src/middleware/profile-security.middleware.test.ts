import { Request, Response, NextFunction } from 'express';
import type { Redis } from 'ioredis';
import {
  createCsrfProtectionMiddleware,
  createUserRateLimitMiddleware,
} from './profile-security.middleware';
import { HmacCsrfTokenService } from '../services/csrf-token.service';

function buildRequest(headers: Record<string, string>, userId = 'user-1'): Request {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { userId, header: (name: string) => lower[name.toLowerCase()] } as unknown as Request;
}

function buildResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

describe('createCsrfProtectionMiddleware', () => {
  const csrf = new HmacCsrfTokenService('test-secret');
  const middleware = createCsrfProtectionMiddleware(csrf);

  test('[US-004-AC8] [US-004-AC27] valid session-bound token passes', () => {
    const next: NextFunction = jest.fn();
    const token = csrf.issue('session-a');
    middleware(buildRequest({ Authorization: 'Bearer session-a', 'X-CSRF-Token': token }), buildResponse(), next);
    expect(next).toHaveBeenCalled();
  });

  test.each([
    ['missing token', {}],
    ['token from another session', { 'X-CSRF-Token': csrf.issue('session-b') }],
    ['garbage token', { 'X-CSRF-Token': 'nope' }],
  ])('[US-004-AC8] %s -> 403 CSRF_TOKEN_INVALID', (_label, extra) => {
    const next: NextFunction = jest.fn();
    const res = buildResponse();
    middleware(buildRequest({ Authorization: 'Bearer session-a', ...extra }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error_code: 'CSRF_TOKEN_INVALID' }));
  });
});

describe('createUserRateLimitMiddleware', () => {
  function fakeRedis(): jest.Mocked<Pick<Redis, 'incr' | 'expire'>> {
    const counts = new Map<string, number>();
    return {
      incr: jest.fn(async (key: string) => {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      }),
      expire: jest.fn(async () => 1),
    } as unknown as jest.Mocked<Pick<Redis, 'incr' | 'expire'>>;
  }

  test('[US-004-AC24] allows up to the limit then responds 429 with Retry-After', async () => {
    const redis = fakeRedis();
    const middleware = createUserRateLimitMiddleware(redis as unknown as Redis, 'profile:rl', 2, 60);
    const next: NextFunction = jest.fn();

    await middleware(buildRequest({}), buildResponse(), next);
    await middleware(buildRequest({}), buildResponse(), next);
    const res = buildResponse();
    await middleware(buildRequest({}), res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(redis.incr).toHaveBeenCalledWith('profile:rl:user-1');
    expect(redis.expire).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '60');
  });

  test('[US-004-AC24] counters are per user', async () => {
    const redis = fakeRedis();
    const middleware = createUserRateLimitMiddleware(redis as unknown as Redis, 'profile:rl', 1, 60);
    const next: NextFunction = jest.fn();
    await middleware(buildRequest({}, 'a'), buildResponse(), next);
    await middleware(buildRequest({}, 'b'), buildResponse(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('fails open when Redis is unavailable', async () => {
    const redis = { incr: jest.fn().mockRejectedValue(new Error('down')), expire: jest.fn() };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const middleware = createUserRateLimitMiddleware(redis as unknown as Redis, 'profile:rl', 1, 60);
    const next: NextFunction = jest.fn();
    await middleware(buildRequest({}), buildResponse(), next);
    expect(next).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
