# Testing Patterns

**Analysis Date:** 2026-07-10

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `jest.config.ts`
- TypeScript support: `ts-jest` preset

**Assertion Library:**
- Jest built-in matchers (expect, toHaveBeenCalled, toEqual, toMatch, etc.)

**Run Commands:**
```bash
npm test                  # Run all tests (unit + integration, parallel by default)
npm run test:unit        # Run unit tests only (excludes integration/)
npm run test:integration # Run integration tests only (--runInBand to avoid concurrency issues)
```

**Coverage:**
- Config enables coverage collection: `collectCoverageFrom` in jest.config.ts
- Excluded from coverage: test files, server.ts entry point
- Coverage report path: `coverage/` (not committed)
- Coverage threshold: Not enforced in jest.config.ts

## Test File Organization

**Location:**
- Unit tests: Co-located with source files, naming pattern `*.test.ts`
- Integration tests: In `src/integration/` directory, naming pattern `*.spec.ts`
- Example structure:
  - `src/controllers/auth.controller.ts` → `src/controllers/auth.controller.test.ts`
  - `src/services/otp.service.ts` → `src/services/otp.service.test.ts`
  - `src/integration/registration.integration.spec.ts` (end-to-end registration flow)

**Naming:**
- Unit tests: `*.test.ts`
- Integration tests: `*.spec.ts` (cohabits with `.test.ts` — Jest matches both)
- Test suites: `describe()`
- Individual tests: `test()` or `it()` (both work in Jest)

**Structure:**
```
src/
├── controllers/
│   ├── registration.controller.ts
│   ├── auth.controller.test.ts     # Unit test, co-located
│   └── password.controller.test.ts
├── services/
│   ├── otp.service.ts
│   └── otp.service.test.ts        # Unit test, co-located
└── integration/
    ├── registration.integration.spec.ts  # Integration test
    ├── otp.integration.spec.ts
    └── test-db.ts                  # Shared test utilities
```

## Test Structure

**Suite Organization:**
```typescript
describe('DefaultOtpService', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let otpRequestRepository: jest.Mocked<IOtpRequestRepository>;
  let rateLimitGuard: jest.Mocked<RateLimitGuard>;
  let service: DefaultOtpService;

  beforeEach(() => {
    // Reset all mocks
    userRepository = { /* mock methods */ };
    otpRequestRepository = { /* mock methods */ };
    rateLimitGuard = { /* mock methods */ };
    service = new DefaultOtpService(/* injected mocks */);
  });

  describe('sendOtp', () => {
    test('generates a 6-digit numeric OTP', async () => {
      userRepository.findById.mockResolvedValue(buildUser());
      await service.sendOtp('user-1');
      const [, code] = otpDeliveryPort.dispatch.mock.calls[0];
      expect(code).toMatch(/^\d{6}$/);
    });

    test('rejects suspended accounts with OtpForbiddenError', async () => {
      userRepository.findById.mockResolvedValue(buildUser({ status: 'suspended' }));
      await expect(service.sendOtp('user-1')).rejects.toBeInstanceOf(OtpForbiddenError);
    });
  });
});
```

**Patterns:**
- Setup: `beforeEach()` resets mocks and recreates service with fresh mocks
- Teardown: Not used (mocks are immutable fixtures)
- Assertions: One assertion per test (or grouped logically, e.g., verifying call order + result)
- Async handling: Use `async`/`await` directly in test bodies

## Mocking

**Framework:** Jest's built-in mock functions (`jest.fn()`, `jest.Mocked<T>`)

**Patterns:**
```typescript
// Mock a method's return value
userRepository.findById.mockResolvedValue(buildUser());

// Mock a method to throw
authService.login.mockRejectedValue(new InvalidCredentialsException());

// Assert the mock was called with specific args
expect(sessionService.createSession).toHaveBeenCalledWith('user-1');

// Assert call order
expect(invalidateCall.invocationCallOrder[0]).toBeLessThan(createCall.invocationCallOrder[0]);

// Get call arguments for inspection
const [, code] = otpDeliveryPort.dispatch.mock.calls[0];
```

**What to Mock:**
- Database/repository layer (all persistence operations)
- External services (email delivery, OTP dispatch)
- Rate limiters and time-based guards
- Crypto operations (for deterministic test inputs)

**What NOT to Mock:**
- Pure validators (they're free of side effects; call the real implementation)
- In-memory helpers (test via mock inspection, not by calling)
- Express Request/Response objects (build lightweight test doubles with `buildRequest()`/`buildResponse()`)

## Fixtures and Factories

**Test Data:**
```typescript
function buildRequest(overrides: { body?: unknown; authorization?: string } = {}): Request {
  return {
    body: overrides.body ?? {},
    header: jest.fn((name: string) => {
      if (name.toLowerCase() === 'authorization') return overrides.authorization;
      return undefined;
    }),
  } as unknown as Request;
}

function buildResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    username: 'jdoe',
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

function buildOtpRequest(overrides: Partial<OtpRequestEntity> = {}): OtpRequestEntity {
  const createdAt = new Date();
  return {
    id: 'otp-1',
    userId: 'user-1',
    emailAddress: 'jdoe@example.test',
    codeHash: crypto.createHmac(otpConfig.otpHashAlgorithm, otpConfig.otpHashSecret)
      .update('654321')
      .digest('hex'),
    status: 'delivered',
    createdAt,
    expiresAt: new Date(createdAt.getTime() + otpConfig.otpTtlMinutes * 60 * 1000),
    invalidatedAt: null,
    attemptSequence: 1,
    ...overrides,
  };
}
```

**Location:**
- Factories: Defined inside test files (private to suite)
- Shared fixtures: In `src/integration/test-db.ts` (e.g., `createTestDb()`, `clearAllTables()`)
- Environment setup: Use `process.env.*` assignments at test file top (see `otp.service.test.ts` lines 1–2)

## Coverage

**Requirements:** No enforced threshold in jest.config.ts

**View Coverage:**
```bash
npm test -- --coverage
```

**Generated reports:**
- Terminal: % coverage by file
- HTML: `coverage/lcov-report/index.html` (if HTML reporter is used)
- LCOV: `coverage/lcov.info` (machine-readable)

## Test Types

**Unit Tests:**
- Scope: Single service, controller, validator, or repository method
- Approach: Mock all external dependencies; assert behavior via mock inspection
- File pattern: `*.test.ts`
- Examples:
  - `src/controllers/auth.controller.test.ts` — tests controller logic with mocked services
  - `src/services/otp.service.test.ts` — tests OTP generation, hashing, validation logic
  - `src/repositories/user.repository.test.ts` — tests SQL construction and row mapping (with mock DB)

**Integration Tests:**
- Scope: Full request-to-response flow with real database and wire-up
- Approach: Create test database, instantiate real app via `createApp()`, use `supertest` for HTTP
- File pattern: `*.spec.ts` in `src/integration/`
- Examples:
  - `src/integration/registration.integration.spec.ts` — tests POST /api/v1/users/register + OTP activation flow
  - `src/integration/otp.integration.spec.ts` — tests OTP dispatch, verify, resend workflows
  - `src/integration/deletion.integration.spec.ts` — tests account deletion request-confirm-cancel flow
- Setup/teardown: `beforeAll()` creates test DB and app; `afterEach()` clears tables; `afterAll()` closes connections

**E2E Tests:**
- Framework: Not currently in use
- Future: Could add Cypress/Playwright tests against deployed frontend + backend

## Common Patterns

**Async Testing:**
```typescript
test('happy path -> 200 with token and expires_at', async () => {
  authService.login.mockResolvedValue({
    token: 'raw-token-value',
    expiresAt: new Date('2026-01-01T01:00:00.000Z'),
  });
  const req = buildRequest({ body: { email: 'jdoe@example.test', password: 'correct-password' } });
  const res = buildResponse();

  await controller.login(req, res);  // await the async method

  expect(authService.login).toHaveBeenCalledWith('jdoe@example.test', 'correct-password');
  expect(res.status).toHaveBeenCalledWith(200);
});
```

**Error Testing:**
```typescript
test('InvalidCredentialsException -> 401 AUTH_INVALID_CREDENTIALS', async () => {
  authService.login.mockRejectedValue(new InvalidCredentialsException());
  const req = buildRequest({ body: { email: 'jdoe@example.test', password: 'wrong' } });
  const res = buildResponse();

  await controller.login(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ error_code: 'AUTH_INVALID_CREDENTIALS' }),
  );
});

// For thrown errors in services:
test('throws OtpNotFoundError when no active OTP exists', async () => {
  userRepository.findById.mockResolvedValue(buildUser({ status: 'pending' }));
  otpRequestRepository.findActiveByUserId.mockResolvedValue(null);

  await expect(service.verifyOtp('user-1', '654321')).rejects.toBeInstanceOf(OtpNotFoundError);
  expect(mockDb.transaction).not.toHaveBeenCalled();
});
```

**Transaction Testing:**
```typescript
test('activates the account and consumes the OTP on a correct code', async () => {
  userRepository.findById.mockResolvedValue(buildUser({ status: 'pending' }));
  otpRequestRepository.findActiveByUserId.mockResolvedValue(buildOtpRequest());

  const result = await service.verifyOtp('user-1', '654321');

  expect(mockDb.transaction).toHaveBeenCalled();  // Transaction was initiated
  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("SET status = 'active'"));
  expect(mockDb.run).toHaveBeenCalledWith(result.activatedAt.toISOString(), 'user-1');
});
```

**Recording/Capturing Behavior (Integration Tests):**
```typescript
class RecordingOtpDeliveryPort implements OtpDeliveryPort {
  public dispatched: Array<{ destination: string; code: string }> = [];

  async dispatch(destination: string, code: string): Promise<boolean> {
    this.dispatched.push({ destination, code });
    return true;
  }

  codeFor(destination: string): string {
    const match = [...this.dispatched].reverse().find((entry) => entry.destination === destination);
    if (!match) {
      throw new Error(`No OTP was dispatched to ${destination}`);
    }
    return match.code;
  }
}

// In test:
const otpDeliveryPort = new RecordingOtpDeliveryPort();
// ... after registration ...
const code = otpDeliveryPort.codeFor('user@example.test');
await request(app).post('/api/v1/otp/verify').send({ userId: 'user-1', code });
```

---

*Testing analysis: 2026-07-10*
