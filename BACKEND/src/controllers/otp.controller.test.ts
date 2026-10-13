import { Request, Response } from 'express';
import { OtpController } from './otp.controller';
import { OtpService } from '../services/otp.service';
import {
  OtpInvalidError,
  OtpLockedError,
  OtpAccountStateInvalidError,
  OtpNotFoundError,
  OtpExpiredError,
} from '../errors/otp.errors';

function buildRequest(body?: unknown): Request {
  return { body } as unknown as Request;
}

function buildResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function sentStatus(res: Response): number {
  return (res.status as jest.Mock).mock.calls[0][0];
}

function sentBody(res: Response): Record<string, unknown> {
  return (res.json as jest.Mock).mock.calls[0][0];
}

describe('OtpController.verifyOtp — response contract (story 560cb07c)', () => {
  let otpService: jest.Mocked<OtpService>;
  let controller: OtpController;

  beforeEach(() => {
    otpService = {
      sendOtp: jest.fn(),
      resendOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };
    controller = new OtpController(otpService);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function verify(body: unknown): Promise<Response> {
    const res = buildResponse();
    await controller.verifyOtp(buildRequest(body), res);
    return res;
  }

  describe('S3-AC1 / FR-001: missing user_id or passcode -> 400 MISSING_REQUIRED_FIELD', () => {
    test.each([
      ['missing userId', { passcode: '123456' }],
      ['missing passcode', { userId: 'user-1' }],
      ['empty userId', { userId: '  ', passcode: '123456' }],
      ['empty passcode', { userId: 'user-1', passcode: '' }],
      ['non-string userId', { userId: 42, passcode: '123456' }],
      ['empty body', {}],
      ['undefined body', undefined],
    ])('%s', async (_label, body) => {
      const res = await verify(body);

      expect(sentStatus(res)).toBe(400);
      expect(sentBody(res)).toMatchObject({ outcome: 'failure', error_code: 'MISSING_REQUIRED_FIELD' });
      expect(otpService.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe('S3-AC2 / FR-002: passcode not a 4-8 digit string -> 400 MISSING_REQUIRED_FIELD', () => {
    test.each([
      ['too short', '123'],
      ['too long', '123456789'],
      ['non-digit', '12ab56'],
      ['non-string number', 123456],
    ])('%s', async (_label, passcode) => {
      const res = await verify({ userId: 'user-1', passcode });

      expect(sentStatus(res)).toBe(400);
      expect(sentBody(res)).toMatchObject({ outcome: 'failure', error_code: 'MISSING_REQUIRED_FIELD' });
      expect(otpService.verifyOtp).not.toHaveBeenCalled();
    });

    test.each(['1234', '12345678'])('accepts boundary length passcode %s', async (passcode) => {
      otpService.verifyOtp.mockResolvedValue({ userId: 'user-1', activatedAt: new Date() });

      const res = await verify({ userId: 'user-1', passcode });

      expect(sentStatus(res)).toBe(200);
      expect(otpService.verifyOtp).toHaveBeenCalledWith('user-1', passcode);
    });
  });

  test('S3-AC3 / FR-003: incorrect passcode -> 422 INVALID_PASSCODE', async () => {
    otpService.verifyOtp.mockRejectedValue(new OtpInvalidError('user-1'));

    const res = await verify({ userId: 'user-1', passcode: '000000' });

    expect(sentStatus(res)).toBe(422);
    expect(sentBody(res)).toMatchObject({ outcome: 'failure', error_code: 'INVALID_PASSCODE' });
  });

  test('S3-AC4 / FR-004: OTP locked after OTP_MAX_ATTEMPTS -> 409 OTP_LOCKED', async () => {
    otpService.verifyOtp.mockRejectedValue(new OtpLockedError('user-1'));

    const res = await verify({ userId: 'user-1', passcode: '123456' });

    expect(sentStatus(res)).toBe(409);
    expect(sentBody(res)).toMatchObject({ outcome: 'failure', error_code: 'OTP_LOCKED' });
  });

  test.each(['locked', 'deleted'])(
    'S3-AC5 / FR-005: %s account -> 422 ACCOUNT_STATE_INVALID',
    async (state) => {
      otpService.verifyOtp.mockRejectedValue(new OtpAccountStateInvalidError('user-1', state));

      const res = await verify({ userId: 'user-1', passcode: '123456' });

      expect(sentStatus(res)).toBe(422);
      expect(sentBody(res)).toMatchObject({ outcome: 'failure', error_code: 'ACCOUNT_STATE_INVALID' });
    },
  );

  test('S3-AC6 / FR-006: success -> 200 outcome=success, error_code null', async () => {
    const activatedAt = new Date();
    otpService.verifyOtp.mockResolvedValue({ userId: 'user-1', activatedAt });

    const res = await verify({ userId: 'user-1', passcode: '654321' });

    expect(sentStatus(res)).toBe(200);
    expect(sentBody(res)).toEqual({
      outcome: 'success',
      error_code: null,
      message: 'Account activated successfully.',
      userId: 'user-1',
      activatedAt,
    });
  });

  describe('S3-AC7 / FR-007: every response carries outcome and error_code', () => {
    const scenarios: Array<[string, unknown, (() => void) | null]> = [
      ['missing field', { userId: 'user-1' }, null],
      ['bad passcode format', { userId: 'user-1', passcode: 'abc' }, null],
      ['invalid passcode', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockRejectedValue(new OtpInvalidError('user-1'));
      }],
      ['locked', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockRejectedValue(new OtpLockedError('user-1'));
      }],
      ['account state', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockRejectedValue(new OtpAccountStateInvalidError('user-1', 'deleted'));
      }],
      ['not found', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockRejectedValue(new OtpNotFoundError('user-1'));
      }],
      ['expired', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockRejectedValue(new OtpExpiredError('user-1'));
      }],
      ['unexpected', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockRejectedValue(new Error('boom'));
      }],
      ['success', { userId: 'user-1', passcode: '000000' }, () => {
        otpService.verifyOtp.mockResolvedValue({ userId: 'user-1', activatedAt: new Date() });
      }],
    ];

    test.each(scenarios)('%s', async (_label, body, arrange) => {
      arrange?.();

      const res = await verify(body);
      const responseBody = sentBody(res);

      expect(responseBody).toHaveProperty('outcome');
      expect(responseBody).toHaveProperty('error_code');
      expect(typeof responseBody.outcome).toBe('string');
      expect(responseBody).not.toHaveProperty('error');
      expect(responseBody).not.toHaveProperty('errorCode');

      if (responseBody.outcome === 'success') {
        expect(sentStatus(res)).toBe(200);
        expect(responseBody.error_code).toBeNull();
      } else {
        expect(responseBody.outcome).toBe('failure');
        expect(typeof responseBody.error_code).toBe('string');
      }
    });

    test('unexpected errors -> 500 INTERNAL_ERROR without leaking details', async () => {
      otpService.verifyOtp.mockRejectedValue(new Error('db exploded'));

      const res = await verify({ userId: 'user-1', passcode: '123456' });

      expect(sentStatus(res)).toBe(500);
      expect(sentBody(res)).toMatchObject({ outcome: 'failure', error_code: 'INTERNAL_ERROR' });
      expect(JSON.stringify(sentBody(res))).not.toContain('db exploded');
    });
  });
});
