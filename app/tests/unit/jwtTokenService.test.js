'use strict';

const { JwtTokenService } = require('../../src/infrastructure/services/jwtTokenService');
const { UnauthorizedError } = require('../../src/domain/errors');

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('JwtTokenService', () => {
  const service = new JwtTokenService();
  const payload = { sub: 'user-123', email: 'test@example.com' };

  it('generates and verifies an access token', () => {
    const token = service.generateAccessToken(payload);
    const decoded = service.verifyAccessToken(token);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.email).toBe('test@example.com');
  });

  it('generates and verifies a refresh token', () => {
    const token = service.generateRefreshToken(payload);
    const decoded = service.verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-123');
  });

  it('throws UnauthorizedError for an invalid access token', () => {
    expect(() => service.verifyAccessToken('invalid.token.here')).toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError for an invalid refresh token', () => {
    expect(() => service.verifyRefreshToken('bad-token')).toThrow(UnauthorizedError);
  });

  it('access token and refresh token are different strings', () => {
    const access = service.generateAccessToken(payload);
    const refresh = service.generateRefreshToken(payload);
    expect(access).not.toBe(refresh);
  });
});
