import { Request, Response } from 'express';
import { OtpController } from './otp.controller';
import { OtpService } from '../services/otp.service';
import {
  OtpAccountStateInvalidError,
  OtpExpiredError,
  OtpInvalidError,
  OtpNotFoundError,
} from '../errors/otp.errors';

const USER_ID = '3f2b6c1e-8d4a-4c3b-9a7e-1b2c3d4e5f60';

function buildRequest(body: unknown): Request {
  return { body } as unknown as Request;
}

function buildResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('OtpController.verifyOtp', () => {
  let otpService: jest.Mocked<OtpService>;
  let controller: OtpController;

  beforeEach(() => {
    otpService = {
      sendOtp: jest.fn(),
      resendOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };
    controller = new OtpController(otpService);
  });

  // S5-AC1 (locked = 'suspended'), S5-AC2 (deleted)
  test.each(['suspended', 'deleted'])(
    'OtpAccountStateInvalidError (%s) -> 422 ACCOUNT_STATE_INVALID with outcome',
    async (status) => {
      otpService.verifyOtp.mockRejectedValue(new OtpAccountStateInvalidError(USER_ID, status));
      const res = buildResponse();

      await controller.verifyOtp(buildRequest({ userId: USER_ID, passcode: '654321' }), res);

      expect(otpService.verifyOtp).toHaveBeenCalledWith(USER_ID, '654321');
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        errorCode: 'ACCOUNT_STATE_INVALID',
        outcome: 'account_state_invalid',
        message: expect.any(String),
      });
      expect(JSON.stringify((res.json as jest.Mock).mock.calls[0][0])).not.toContain(status);
    },
  );

  // S5-AC3 (active), S5-AC4 (pending/unverified)
  test('successful verification -> 200 with userId and activatedAt', async () => {
    const activatedAt = new Date('2026-01-01T00:00:00.000Z');
    otpService.verifyOtp.mockResolvedValue({ userId: USER_ID, activatedAt });
    const res = buildResponse();

    await controller.verifyOtp(buildRequest({ userId: USER_ID, passcode: '654321' }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Account activated successfully.',
      userId: USER_ID,
      activatedAt,
    });
  });

  test.each([
    [new OtpNotFoundError(USER_ID), 404, 'OTP_NOT_FOUND'],
    [new OtpExpiredError(USER_ID), 410, 'OTP_EXPIRED'],
    [new OtpInvalidError(USER_ID), 422, 'OTP_INVALID'],
  ])('%p -> %i %s', async (error, status, errorCode) => {
    otpService.verifyOtp.mockRejectedValue(error);
    const res = buildResponse();

    await controller.verifyOtp(buildRequest({ userId: USER_ID, passcode: '654321' }), res);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode }));
  });

  test('missing passcode -> 400 without calling the service', async () => {
    const res = buildResponse();

    await controller.verifyOtp(buildRequest({ userId: USER_ID }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(otpService.verifyOtp).not.toHaveBeenCalled();
  });
});
