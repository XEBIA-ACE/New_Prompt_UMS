'use strict';

const { makeLoginUser } = require('../../src/application/usecases/loginUser');
const { UnauthorizedError } = require('../../src/domain/errors');
const bcrypt = require('bcryptjs');

// ── Helpers ────────────────────────────────────────────────────────────────────

async function buildUserFixture(email = 'carol@example.com', password = 'Password1!') {
  const passwordHash = await bcrypt.hash(password, 1); // low rounds for speed in tests
  return {
    id: 'test-uuid-1234',
    email,
    passwordHash,
    firstName: 'Carol',
    lastName: 'White',
    isVerified: true,
    verificationToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeInMemoryUserRepository(users = []) {
  return {
    async findByEmail(email) {
      return users.find((u) => u.email === email.toLowerCase().trim()) || null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) || null;
    },
    async findByVerificationToken() { return null; },
    async save(u) { users.push(u); return u; },
    async update(u) { return u; },
    async deleteById() {},
  };
}

function makeTokenServiceStub() {
  return {
    generateAccessToken: () => 'access-token-stub',
    generateRefreshToken: () => 'refresh-token-stub',
    verifyAccessToken: () => ({}),
    verifyRefreshToken: () => ({}),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('loginUser use-case', () => {
  it('returns tokens and user info on valid credentials', async () => {
    const user = await buildUserFixture();
    const repo = makeInMemoryUserRepository([user]);
    const tokenService = makeTokenServiceStub();
    const loginUser = makeLoginUser(repo, tokenService);

    const result = await loginUser({ email: 'carol@example.com', password: 'Password1!' });

    expect(result.accessToken).toBe('access-token-stub');
    expect(result.refreshToken).toBe('refresh-token-stub');
    expect(result.user.email).toBe('carol@example.com');
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('throws UnauthorizedError for unknown email', async () => {
    const repo = makeInMemoryUserRepository([]);
    const tokenService = makeTokenServiceStub();
    const loginUser = makeLoginUser(repo, tokenService);

    await expect(loginUser({ email: 'nobody@example.com', password: 'Password1!' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('throws UnauthorizedError for wrong password', async () => {
    const user = await buildUserFixture();
    const repo = makeInMemoryUserRepository([user]);
    const tokenService = makeTokenServiceStub();
    const loginUser = makeLoginUser(repo, tokenService);

    await expect(loginUser({ email: 'carol@example.com', password: 'WrongPass!' })).rejects.toThrow(
      UnauthorizedError
    );
  });
});
