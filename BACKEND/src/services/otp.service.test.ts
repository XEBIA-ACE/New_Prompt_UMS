process.env.OTP_EMAIL_TEMPLATE_ID = 'd-test-otp-template';

// Mock bcrypt before importing the service — native module can't compile in this env.
jest.mock('bcrypt', () => ({
  hash: jest.fn((value: string) => Promise.resolve(`$2b$10$mocked_hash_for_${value}`)),
  compare: jest.fn((_value: string, hash: string) =>
    Promise.resolve(hash.startsWith('$2b$10$mocked_hash_for_')),
  ),
}));

// Mock withTransaction so tests can control persistence behaviour.
jest.mock('../db/with-transaction', () => ({
  withTransaction: jest.fn((_db: unknown, fn: () => unknown) => fn()),
}));

import bcrypt from 'bcrypt';
import { withTransaction } from '../db/with-transaction';
import { DefaultOtpService } from './otp.service';
import { IUserRepository } from '../repositories/user.repository';
import { IOtpRequestRepository } from '../repositories/otp-request.repository';
import { OtpDeliveryPort } from '../adapters/otp-delivery.port';
import {
  OtpUserNotFoundError,
  OtpAccountIneligibleError,
  OtpPersistenceError,
} from '../errors/otp.errors';
import { UserEntity } from '../types/registration.types';

function buildMockDb() {
  const run = jest.fn();
  const prepare = jest.fn().mockReturnValue({ run, get: jest.fn(), all: jest.fn() });
  const db = { prepare } as unknown as ConstructorParameters<
    typeof import('../repositories/otp-request.repository').OtpRequestRepository
  >[0];
  return { db, prepare, run };
}

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    username: 'jdoe',
    usernameNormalised: 'jdoe',
    email: 'jdoe@example.test',
    passwordHash: 'irrelevant-hash',
    status: 'active',
    registrationTimestamp: new Date(),
    activatedAt: new Date(),
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe('DefaultOtpService', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let otpRequestRepository: jest.Mocked<IOtpRequestRepository>;
  let otpDeliveryPort: jest.Mocked<OtpDeliveryPort>;
  let mockDb: ReturnType<typeof buildMockDb>;
  let service: DefaultOtpService;

  function buildService() {
    userRepository = {
      insert: jest.fn(),
      findByNormalisedUsername: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findByEmail: jest.fn(),
      incrementFailedLoginCount: jest.fn(),
      resetFailedLoginCount: jest.fn(),
      lockAccount: jest.fn(),
      updateLastLoginAt: jest.fn(),
      updatePasswordHash: jest.fn(),
      anonymizeAndMarkDeleted: jest.fn(),
    };
    otpRequestRepository = {
      create: jest.fn(async (record) => ({ id: 'otp-1', ...record })),
      findActiveByUserAndPurpose: jest.fn(),
      expireActiveByUserAndPurpose: jest.fn(),
    };
    otpDeliveryPort = { dispatch: jest.fn().mockResolvedValue(true) };
    mockDb = buildMockDb();

    service = new DefaultOtpService(
      userRepository,
      otpRequestRepository,
      otpDeliveryPort,
      mockDb.db,
    );
  }

  beforeEach(() => {
    buildService();
    jest.clearAllMocks();
  });

  test('generates a 6-digit numeric OTP', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await service.generateAndSend('user-1', 'ACTIVATION');

    const [, code] = otpDeliveryPort.dispatch.mock.calls[0];
    expect(code).toMatch(/^\d{6}$/);
  });

  test('stores the OTP as a bcrypt hash, never plaintext', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await service.generateAndSend('user-1', 'ACTIVATION');

    const [, code] = otpDeliveryPort.dispatch.mock.calls[0];
    expect(bcrypt.hash).toHaveBeenCalledWith(code, expect.any(Number));
  });

  test('sets expiry to OTP_EXPIRY_SECONDS after creation', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await service.generateAndSend('user-1', 'ACTIVATION');

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('expires_at'));
  });

  test('expires any existing ACTIVE OTP before issuing a new one', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await service.generateAndSend('user-1', 'ACTIVATION');

    expect(otpRequestRepository.expireActiveByUserAndPurpose).toHaveBeenCalledWith('user-1', 'ACTIVATION');
    expect(otpRequestRepository.expireActiveByUserAndPurpose.mock.invocationCallOrder[0]).toBeLessThan(
      mockDb.prepare.mock.invocationCallOrder[0],
    );
  });

  test.each(['suspended', 'deleted'] as const)(
    'rejects %s accounts with OtpAccountIneligibleError',
    async (status) => {
      userRepository.findById.mockResolvedValue(buildUser({ status }));

      await expect(service.generateAndSend('user-1', 'ACTIVATION')).rejects.toBeInstanceOf(
        OtpAccountIneligibleError,
      );
    },
  );

  test('rejects non-existent user with OtpUserNotFoundError', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(service.generateAndSend('user-1', 'ACTIVATION')).rejects.toBeInstanceOf(
      OtpUserNotFoundError,
    );
  });

  test('returns delivered status when dispatch succeeds', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    const result = await service.generateAndSend('user-1', 'ACTIVATION');

    expect(result).toEqual({ accepted: true, status: 'delivered' });
  });

  test('returns failed status when dispatch fails, but still reports accepted', async () => {
    userRepository.findById.mockResolvedValue(buildUser());
    otpDeliveryPort.dispatch.mockResolvedValue(false);

    const result = await service.generateAndSend('user-1', 'ACTIVATION');

    expect(result).toEqual({ accepted: true, status: 'failed' });
  });

  test('does not dispatch when persistence fails (FR-012)', async () => {
    (withTransaction as jest.Mock).mockImplementationOnce((_db: unknown, _fn: () => unknown) => {
      throw new Error('disk full');
    });
    userRepository.findById.mockResolvedValue(buildUser());

    await expect(service.generateAndSend('user-1', 'ACTIVATION')).rejects.toBeInstanceOf(
      OtpPersistenceError,
    );
    expect(otpDeliveryPort.dispatch).not.toHaveBeenCalled();
  });

  test('associates OTP with the correct purpose', async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    await service.generateAndSend('user-1', 'PASSWORD_RECOVERY');

    // The run() call captures the INSERT parameters — purpose is 6th arg
    const runCall = mockDb.run.mock.calls[0];
    expect(runCall[5]).toBe('PASSWORD_RECOVERY');
  });

  test('allows active accounts to receive an OTP', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ status: 'active' }));

    const result = await service.generateAndSend('user-1', 'LOGIN');

    expect(result).toEqual({ accepted: true, status: 'delivered' });
    expect(otpRequestRepository.expireActiveByUserAndPurpose).toHaveBeenCalledWith('user-1', 'LOGIN');
  });
});
