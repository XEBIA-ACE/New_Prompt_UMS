# Coding Conventions

**Analysis Date:** 2026-07-10

## Naming Patterns

**Files:**
- Services: `*.service.ts` — e.g., `registration.service.ts`, `session.service.ts`
- Controllers: `*.controller.ts` — e.g., `registration.controller.ts`, `auth.controller.ts`
- Validators: `*.validator.ts` — e.g., `registration.validator.ts`, `email.validator.ts`
- Repositories: `*.repository.ts` — e.g., `user.repository.ts`, `session.repository.ts`
- Routes: `*.routes.ts` — e.g., `registration.routes.ts`, `auth.routes.ts`
- Middleware: `*.middleware.ts` — e.g., `session-validation.middleware.ts`
- Types: `*.types.ts` — e.g., `registration.types.ts`, `login.types.ts`
- Errors: `*.errors.ts` — e.g., `registration.errors.ts`, `login.errors.ts`
- Config: `*.config.ts` — e.g., `app.config.ts`, `password-policy.config.ts`
- Adapters/Ports: `*.port.ts`, `*-adapter.ts` — e.g., `otp-delivery.port.ts`, `sendgrid-email.adapter.ts`
- Test files: `*.test.ts` (unit), `*.spec.ts` (integration)

**Functions:**
- Async operations: Use `async`/`await` pattern; function names are verb-based
- Getters/lookups: `find*`, `get*`, `build*` — e.g., `findByEmail()`, `getSessionToken()`, `buildRequest()`
- Mutations: `create*`, `insert*`, `update*`, `mark*` — e.g., `createSession()`, `insert()`, `markDelivered()`
- Validators/checkers: `validate*`, `check*`, `evaluate*` — e.g., `validateFormat()`, `checkUniqueness()`, `evaluate()`
- Middleware: Noun prefixed with action — e.g., `sessionValidationMiddleware()`, `requireAdminBearerToken()`

**Variables:**
- Camel case: `userName`, `passwordHash`, `emailAddress`, `isValid`
- Constants (module-level): UPPER_SNAKE_CASE — e.g., `EMAIL_PATTERN`, `BEARER_PREFIX`
- Local objects: `req`, `res`, `next` (Express convention), `dto`, `payload`, `entity`
- Normalized/processed values: Suffix with form — e.g., `usernameNormalised`, `normalizedEmail`

**Types:**
- Interfaces: `I*` prefix for contracts, no prefix for domain types — e.g., `IUserRepository`, `UserEntity`
- DTOs (Request/Response): Suffix with `Dto`, `Request`, `Response` — e.g., `RegistrationRequestDto`, `UserProfileResponse`
- Error classes: Suffix with `Error` or `Exception` — e.g., `ValidationError`, `UsernameConflictError`, `AccountLockedException`
- Entity/Domain types: Base name — e.g., `UserEntity`, `SessionEntity`, `OtpRequestEntity`

## Code Style

**Formatting:**
- No Prettier config in BACKEND — linting rules are the only formatting guide
- 2-space indentation (default TypeScript)
- Line length: Not enforced; aim for readability

**Linting:**
- Tool: ESLint with TypeScript support (`typescript-eslint`)
- Config: `eslint.config.mjs`
- Enforced rules:
  - `@typescript-eslint/no-unused-vars`: warn
  - `@typescript-eslint/no-explicit-any`: warn
- Recommended TypeScript strict rules are enabled
- Ignores: `dist/`, `node_modules/`, `coverage/`

**TypeScript Compiler:**
- Target: ES2020
- Module: CommonJS
- Strict mode: Enabled (`strict: true`)
- Additional checks:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`
  - `forceConsistentCasingInFileNames: true`
- Source maps enabled for debugging

## Import Organization

**Order:**
1. Node.js built-in modules (e.g., `import crypto from 'crypto'`)
2. Third-party packages (e.g., `import express from 'express'`)
3. Type imports from third-party (e.g., `import type { Database } from 'better-sqlite3'`)
4. Local project imports (e.g., `import { UserRepository } from '../repositories/user.repository'`)
5. Type imports from local project (e.g., `import type { UserEntity } from '../types/registration.types'`)

**Path organization:**
- No path aliases in BACKEND
- Relative imports using `../` to traverse layer boundaries
- Flat module structure within each layer (e.g., all services in `src/services/`)

## Error Handling

**Patterns:**
- Custom error classes extend `Error` and explicitly restore prototype chain (required for ES5 targets) — see `registration.errors.ts` pattern
- Errors carry domain context (e.g., `UsernameConflictError.username`, `AccountLockedException.retryAfter`)
- Controllers catch specific errors by type (`instanceof`) and return appropriate HTTP status codes
- Uncaught errors propagate to Express global error handler (`createAppErrorHandler` in `app.ts`)
- Never log sensitive data (passwords, plaintext tokens); only log error names and messages

**Status codes:**
- 400: Missing/malformed request fields
- 401: Authentication failure (invalid credentials, missing token, expired token)
- 403: Insufficient permissions
- 404: Resource not found
- 409: Business logic conflict (duplicate username, request already pending)
- 410: Token consumed/expired (semantic distinction from 404)
- 422: Validation failure (structured field-level errors)
- 423: Temporary lockout (includes `retry_after` timestamp)
- 500: Unexpected server error

## Logging

**Framework:** `console` directly (console.error for errors)

**Patterns:**
- Log errors during failure paths: `console.error('[ComponentName] Context:', err)`
- Include class/component name in brackets for context: `[GlobalErrorHandler] Unhandled error:`
- Never log plaintext passwords, OTP codes, or raw tokens
- Log decision points in middleware: authentication success/failure, rate-limit decisions
- No request/response body logging (privacy)

## Comments

**When to Comment:**
- High-level architectural notes at file top (e.g., docstring comment at line 1–20)
- Defense-in-depth guards and exception handling chains (see `app.ts` lines 97–101)
- Non-obvious algorithmic choices (e.g., why HMAC-SHA256 is used for OTP hashing)
- Requirements traceability (requirements tagged at file top: e.g., "Requirements: US-062 FR-001–002")
- Temporal logic or state machines (explain transitions)

**JSDoc/TSDoc:**
- Used for public interfaces (service methods, repository methods, controller handlers)
- Document parameters, return types, and thrown exceptions
- Include requirement tags where applicable
- Example from `registration.service.ts`:
  ```typescript
  /**
   * Creates a new user in `pending` status...
   * @param dto - Validated registration payload...
   * @returns `UserCreatedResult` containing...
   * @throws Re-throws any SQLite / bcrypt errors...
   */
  async register(dto: RegistrationRequestDto): Promise<UserCreatedResult>
  ```

## Function Design

**Size:** 
- Most functions are 30–100 lines
- Complex pipelines (e.g., `RegistrationController.registerUser`) document each validation stage inline
- Single-responsibility principle observed: services own business logic, controllers own HTTP translation, validators own structural checks

**Parameters:**
- Functions accept DTOs or entities, not spread args
- Repository methods accept primitive types for filter/update (username, id, status)
- Service methods accept domain objects or DTOs, never raw HTTP context

**Return Values:**
- Async functions return `Promise<T>` where T is a domain object, result object, or void
- Null used for "not found" cases, never undefined
- Results are objects with named properties (e.g., `{ userId, message }`, `{ accepted: true, status: 'delivered' }`)
- Never return middleware functions directly; assign to variables first

## Module Design

**Exports:**
- Each module exports one primary class/interface (e.g., `DefaultRegistrationService`, `RegistrationValidator`)
- Supporting types/interfaces are co-exported from the same module
- No barrel files (`index.ts`); each consumer imports directly from source module
- Routes are factory functions (`createRegistrationRouter()`) that accept dependencies

**Barrel Files:**
- Not used in this codebase
- Each import is explicit: `import { UserRepository } from '../repositories/user.repository'`

**Dependency Injection:**
- Constructor-injected via parameters (see `AuthController` constructor in `auth.controller.test.ts` line 42)
- Repositories injected into services
- Services injected into controllers
- Routes are factory functions that accept all dependencies and return Express routers

---

*Convention analysis: 2026-07-10*
