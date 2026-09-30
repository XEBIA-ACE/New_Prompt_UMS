'use strict';

const makeRegisterUser = require('../../src/application/use-cases/registerUser');

describe('registerUser use-case', () => {
  const mockUser = {
    id: 'user-uuid',
    email: 'bob@example.com',
    isVerified: false,
    createdAt: new Date(),
    isDeleted: () => false,
    toPublic: () => ({ id: 'user-uuid', email: 'bob@example.com', isVerified: false }),
  };

  const userRepository = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockUser),
  };

  const otpRepository = {
    create: jest.fn().mockResolvedValue({}),
  };

  const emailService = {
    sendVerificationOtp: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates a user and sends a verification email', async () => {
    const registerUser = makeRegisterUser({ userRepository, otpRepository, emailService });
    const result = await registerUser({ email: 'bob@example.com', password: 'securePass1!' });

    expect(userRepository.create).toHaveBeenCalledTimes(1);
    expect(otpRepository.create).toHaveBeenCalledTimes(1);
    expect(emailService.sendVerificationOtp).toHaveBeenCalledWith('bob@example.com', expect.any(String));
    expect(result.user).toHaveProperty('id');
  });

  it('throws 409 when email is already registered', async () => {
    userRepository.findByEmail.mockResolvedValueOnce({
      isDeleted: () => false,
    });

    const registerUser = makeRegisterUser({ userRepository, otpRepository, emailService });

    await expect(registerUser({ email: 'bob@example.com', password: 'securePass1!' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
