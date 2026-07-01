'use strict';

const RegisterUserUseCase = require('../../src/application/usecases/RegisterUserUseCase');
const LoginUserUseCase = require('../../src/application/usecases/LoginUserUseCase');
const User = require('../../src/domain/entities/User');
const AppError = require('../../src/shared/errors/AppError');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserRepo(overrides = {}) {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

// ── RegisterUserUseCase ───────────────────────────────────────────────────────

describe('RegisterUserUseCase', () => {
  it('creates a user when email is not taken', async () => {
    const repo = makeUserRepo({
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    });

    const useCase = new RegisterUserUseCase(repo);
    const user = await useCase.execute({
      email: 'alice@example.com',
      password: 'password123',
      firstName: 'Alice',
    });

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(user.email).toBe('alice@example.com');
    expect(user.passwordHash).not.toBe('password123'); // must be hashed
  });

  it('throws 409 when email is already registered', async () => {
    const existing = new User({ id: '1', email: 'alice@example.com', passwordHash: 'h' });
    const repo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(existing) });

    const useCase = new RegisterUserUseCase(repo);
    await expect(useCase.execute({ email: 'alice@example.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

// ── LoginUserUseCase ──────────────────────────────────────────────────────────

describe('LoginUserUseCase', () => {
  it('throws 401 when user does not exist', async () => {
    const repo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(null) });
    const useCase = new LoginUserUseCase(repo);
    await expect(useCase.execute({ email: 'x@x.com', password: 'pass' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when password is wrong', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correct', 12);
    const user = new User({ id: '1', email: 'a@b.com', passwordHash: hash, isActive: true });
    const repo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(user) });

    const useCase = new LoginUserUseCase(repo);
    await expect(useCase.execute({ email: 'a@b.com', password: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns token and user on valid credentials', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('secret123', 12);
    const user = new User({ id: '1', email: 'a@b.com', passwordHash: hash, isActive: true });
    const repo = makeUserRepo({ findByEmail: jest.fn().mockResolvedValue(user) });

    const useCase = new LoginUserUseCase(repo);
    const result = await useCase.execute({ email: 'a@b.com', password: 'secret123' });

    expect(result.token).toBeDefined();
    expect(result.user.id).toBe('1');
  });
});
