'use strict';

const { makeRegisterUser } = require('../../src/application/usecases/registerUser');
const { ConflictError, ValidationError } = require('../../src/domain/errors');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeInMemoryUserRepository(initialUsers = []) {
  const store = [...initialUsers];
  return {
    async findByEmail(email) {
      return store.find((u) => u.email === email.toLowerCase().trim()) || null;
    },
    async findById(id) {
      return store.find((u) => u.id === id) || null;
    },
    async findByVerificationToken(token) {
      return store.find((u) => u.verificationToken === token) || null;
    },
    async save(user) {
      store.push(user);
      return user;
    },
    async update(user) {
      const idx = store.findIndex((u) => u.id === user.id);
      if (idx !== -1) store[idx] = user;
      return user;
    },
    async deleteById(id) {
      const idx = store.findIndex((u) => u.id === id);
      if (idx !== -1) store.splice(idx, 1);
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('registerUser use-case', () => {
  const validInput = {
    email: 'bob@example.com',
    password: 'SecurePass1!',
    firstName: 'Bob',
    lastName: 'Jones',
  };

  it('registers a new user and returns safe fields', async () => {
    const repo = makeInMemoryUserRepository();
    const registerUser = makeRegisterUser(repo);

    const result = await registerUser(validInput);

    expect(result).toMatchObject({
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Jones',
      isVerified: false,
    });
    expect(result.id).toBeDefined();
    expect(result.passwordHash).toBeUndefined(); // must not leak hash
  });

  it('throws ConflictError when email already exists', async () => {
    const repo = makeInMemoryUserRepository();
    const registerUser = makeRegisterUser(repo);

    await registerUser(validInput);
    await expect(registerUser(validInput)).rejects.toThrow(ConflictError);
  });

  it('throws ValidationError when required fields are missing', async () => {
    const repo = makeInMemoryUserRepository();
    const registerUser = makeRegisterUser(repo);

    await expect(registerUser({ email: '', password: '', firstName: '', lastName: '' })).rejects.toThrow(
      ValidationError
    );
  });
});
