'use strict';

const makeLoginUser = require('../../src/application/use-cases/loginUser');
const bcrypt = require('bcryptjs');

describe('loginUser use-case', () => {
  let passwordHash;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('correctPassword1!', 12);
  });

  const buildRepo = (overrides = {}) => ({
    findByEmail: jest.fn().mockResolvedValue({
      id: 'user-uuid',
      email: 'carol@example.com',
      passwordHash,
      isVerified: true,
      isDeleted: () => false,
      toPublic: () => ({ id: 'user-uuid', email: 'carol@example.com' }),
      ...overrides,
    }),
  });

  it('returns a JWT token on valid credentials', async () => {
    const loginUser = makeLoginUser({ userRepository: buildRepo() });
    const result = await loginUser({ email: 'carol@example.com', password: 'correctPassword1!' });

    expect(result).toHaveProperty('token');
    expect(typeof result.token).toBe('string');
    expect(result).toHaveProperty('user');
  });

  it('throws 401 on wrong password', async () => {
    const loginUser = makeLoginUser({ userRepository: buildRepo() });
    await expect(loginUser({ email: 'carol@example.com', password: 'wrongPassword' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 403 when email is not verified', async () => {
    const repo = buildRepo({ isVerified: false });
    const loginUser = makeLoginUser({ userRepository: repo });
    await expect(loginUser({ email: 'carol@example.com', password: 'correctPassword1!' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 401 when user does not exist', async () => {
    const repo = { findByEmail: jest.fn().mockResolvedValue(null) };
    const loginUser = makeLoginUser({ userRepository: repo });
    await expect(loginUser({ email: 'nobody@example.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });
});
