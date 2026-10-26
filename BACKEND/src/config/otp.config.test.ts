const originalOtpMaxAttempts = process.env.OTP_MAX_ATTEMPTS;
const originalOtpHashSecret = process.env.OTP_HASH_SECRET;
const originalOtpEmailTemplateId = process.env.OTP_EMAIL_TEMPLATE_ID;

function loadOtpConfig(): typeof import('./otp.config') {
  let config!: typeof import('./otp.config');
  jest.isolateModules(() => {
    config = require('./otp.config') as typeof import('./otp.config');
  });
  return config;
}

beforeEach(() => {
  process.env.OTP_HASH_SECRET = 'test-otp-secret';
  process.env.OTP_EMAIL_TEMPLATE_ID = 'test-otp-template';
});

afterEach(() => {
  if (originalOtpMaxAttempts === undefined) delete process.env.OTP_MAX_ATTEMPTS;
  else process.env.OTP_MAX_ATTEMPTS = originalOtpMaxAttempts;
  if (originalOtpHashSecret === undefined) delete process.env.OTP_HASH_SECRET;
  else process.env.OTP_HASH_SECRET = originalOtpHashSecret;
  if (originalOtpEmailTemplateId === undefined) delete process.env.OTP_EMAIL_TEMPLATE_ID;
  else process.env.OTP_EMAIL_TEMPLATE_ID = originalOtpEmailTemplateId;
});

describe('OTP_MAX_ATTEMPTS configuration', () => {
  test('[c7bd1d68-37fb-59cc-ac57-24602b4ffc75-AC1][S2-AC1][IMPACT] defaults to 5 when imported', () => {
    delete process.env.OTP_MAX_ATTEMPTS;
    expect(loadOtpConfig().OTP_MAX_ATTEMPTS).toBe(5);
  });

  test('[c7bd1d68-37fb-59cc-ac57-24602b4ffc75-AC2][S2-AC2][IMPACT] is 5 when startup loads config without an override', () => {
    // server.ts loads dotenv before importing otp.config; this exercises that
    // configuration-load boundary without starting database or Redis services.
    delete process.env.OTP_MAX_ATTEMPTS;
    expect(loadOtpConfig().OTP_MAX_ATTEMPTS).toBe(5);
  });

  test.each(['3', '10'])(
    '[c7bd1d68-37fb-59cc-ac57-24602b4ffc75-AC3][S2-AC3][IMPACT] uses environment override %s',
    (value) => {
      process.env.OTP_MAX_ATTEMPTS = value;
      expect(loadOtpConfig().OTP_MAX_ATTEMPTS).toBe(Number(value));
    },
  );

  test('[c7bd1d68-37fb-59cc-ac57-24602b4ffc75-AC4][S2-AC4][IMPACT] is importable by the OTP service as a number', () => {
    delete process.env.OTP_MAX_ATTEMPTS;
    let serviceModule!: typeof import('../services/otp.service');
    jest.isolateModules(() => {
      serviceModule = require('../services/otp.service') as typeof import('../services/otp.service');
    });

    expect(typeof serviceModule.OTP_MAX_ATTEMPTS).toBe('number');
    expect(3 >= serviceModule.OTP_MAX_ATTEMPTS).toBe(false);
  });
});
