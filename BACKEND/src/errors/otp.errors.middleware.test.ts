import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { createAppErrorHandler } from '../app';
import {
  AccountStateInvalidError,
  InvalidPasscodeError,
  OtpLockedError,
} from './otp.errors';

function createOtpErrorTestApp(error: Error) {
  const app = express();
  app.get('/error', (_req: Request, _res: Response, next: NextFunction) => next(error));
  app.use(createAppErrorHandler);
  return app;
}

describe('central OTP error handling', () => {
  test('[33ed04fe-9173-58a5-8117-8bebd609b9e2-AC1] INVALID_PASSCODE maps to 422', async () => {
    const response = await request(createOtpErrorTestApp(new InvalidPasscodeError('user-1')))
      .get('/error')
      .expect(422);

    expect(response.body.error_code).toBe('INVALID_PASSCODE');
  });

  test('[33ed04fe-9173-58a5-8117-8bebd609b9e2-AC2] OTP_LOCKED maps to 409', async () => {
    const response = await request(createOtpErrorTestApp(new OtpLockedError()))
      .get('/error')
      .expect(409);

    expect(response.body.error_code).toBe('OTP_LOCKED');
  });

  test('[33ed04fe-9173-58a5-8117-8bebd609b9e2-AC3] ACCOUNT_STATE_INVALID maps to 422', async () => {
    const response = await request(createOtpErrorTestApp(new AccountStateInvalidError()))
      .get('/error')
      .expect(422);

    expect(response.body.error_code).toBe('ACCOUNT_STATE_INVALID');
  });

  test('[33ed04fe-9173-58a5-8117-8bebd609b9e2-AC4] OTP error bodies include outcome and error_code', async () => {
    for (const [error, expectedCode] of [
      [new InvalidPasscodeError('user-1'), 'INVALID_PASSCODE'],
      [new OtpLockedError(), 'OTP_LOCKED'],
      [new AccountStateInvalidError(), 'ACCOUNT_STATE_INVALID'],
    ] as const) {
      const response = await request(createOtpErrorTestApp(error)).get('/error');
      expect(response.body).toMatchObject({ outcome: 'error', error_code: expectedCode });
    }
  });

  test('[33ed04fe-9173-58a5-8117-8bebd609b9e2-AC5] thrown OTP errors use centralized mapping', async () => {
    const app = createOtpErrorTestApp(new InvalidPasscodeError('user-1'));
    const response = await request(app).get('/error').expect(422);

    expect(response.body).toEqual({ outcome: 'error', error_code: 'INVALID_PASSCODE' });
  });
});
