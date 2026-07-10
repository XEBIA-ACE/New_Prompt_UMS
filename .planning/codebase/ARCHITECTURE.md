<!-- refreshed: 2026-07-10 -->
# Architecture

**Analysis Date:** 2026-07-10

## System Overview

The User Management System (UMS) is a two-tier application consisting of an Express/TypeScript backend API and a Vite/React frontend UI. The backend is a feature-based REST API that persists to SQLite and uses Redis for OTP rate-limiting. The frontend is a client-side React application that communicates with the backend via HTTP/CORS.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                        │
│                  `FRONTEND/src/app/components/`                      │
│  ┌──────────────────┬──────────────────┬─────────────────────────┐  │
│  │   Landing Page   │   Registration   │   Auth & Dashboard      │  │
│  │   (routes)       │   & OTP Flow     │   (protected routes)    │  │
│  └──────────────────┴──────────────────┴─────────────────────────┘  │
│                           ▼                                          │
│            ┌─────────────────────────────────┐                       │
│            │   API Client (fetch)            │                       │
│            │  `api-client.ts`                │                       │
│            └─────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
                             │ HTTP/CORS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express/TypeScript)                      │
│                         `BACKEND/src/`                               │
├──────────────────────────────────────────────────────────────────────┤
│                     Routes & Controllers                             │
│  `/api/v1/users`, `/api/v1/auth`, `/api/v1/admin`, `/api-docs`     │
│                    `src/routes/` (9 routers)                         │
│                  `src/controllers/` (13 controllers)                  │
├──────────────────────────────────────────────────────────────────────┤
│                     Services & Validators                            │
│     Registration, OTP, Auth, Password, Session, Account Deletion    │
│           `src/services/` (9 services with tests)                    │
│           `src/validators/` (5 validators)                            │
├──────────────────────────────────────────────────────────────────────┤
│                     Repositories & Database                          │
│           SQLite3 (better-sqlite3) + automatic migrations            │
│           `src/repositories/` (8 repositories)                        │
│           `src/db/` (connection, migration runner, transactions)     │
├──────────────────────────────────────────────────────────────────────┤
│                  Ports, Adapters & External Services                │
│  SendGrid Email (EmailDeliveryPort), OTP Delivery via Redis         │
│           `src/adapters/` (interfaces + implementations)             │
│           `src/integration/` (SendGrid client integration)           │
├──────────────────────────────────────────────────────────────────────┤
│                     Background Workers & Middleware                  │
│  OutboxWorker (async email), AccountDeletionWorker, Error Handler   │
│         `src/workers/` (2 workers), `src/middleware/` (2)            │
│         `src/errors/` (domain-specific error types)                   │
└─────────────────────────────────────────────────────────────────────┘
             │                              │
             ▼                              ▼
    ┌──────────────────┐           ┌──────────────────┐
    │   SQLite Database│           │  Redis (ioredis) │
    │  `data/app.db`   │           │   OTP Rate Limit │
    │  (auto-migrated) │           │  & Cache Storage │
    └──────────────────┘           └──────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Routes | HTTP endpoint registration and router composition | `src/routes/*.routes.ts` (9 files) |
| Controllers | HTTP request handling, validation orchestration, response formatting | `src/controllers/*.controller.ts` (13 files) |
| Services | Domain business logic — registration, OTP, auth, password recovery, deletion | `src/services/*.service.ts` (9 files) |
| Validators | Input validation rules — registration fields, email format, password policy, username uniqueness | `src/validators/*.validator.ts` (5 files) |
| Repositories | SQLite data access and persistence — user, session, token, OTP request, deletion request | `src/repositories/*.repository.ts` (8 files) |
| Adapters | External service integrations — SendGrid email, OTP delivery | `src/adapters/*.adapter.ts` (2 implementations + 2 ports) |
| Middleware | Cross-cutting concerns — session validation, admin auth, error handling | `src/middleware/*.middleware.ts` (2 files) |
| Workers | Background async processes — outbox email queue, deletion notification queue | `src/workers/*.worker.ts` (2 files) |
| Database | SQLite connection, migration runner, transaction helpers | `src/db/` (3 files) |
| Errors | Domain-specific exception types for registration, login, deletion | `src/errors/*.errors.ts` (3 files) |
| Config | Environment variable loading and validation | `src/config/` (9 files) |
| Types | Shared TypeScript interfaces — DTOs, entities, API contracts | `src/types/*.types.ts` (5 files) |

## Pattern Overview

**Overall:** Clean Architecture (Hexagonal Architecture) with feature-based directory organization and dependency injection.

**Key Characteristics:**
- **Layered design** — Controllers (HTTP boundary) → Services (business logic) → Repositories (data access) → Database
- **Ports & Adapters** — External services (SendGrid, Redis) decoupled via abstract ports
- **Domain-driven errors** — Feature-specific exception types caught at the global error handler
- **Transactional outbox pattern** — Async email delivery via worker polling, ensuring reliable delivery
- **Database migrations** — SQL-based, tracked in `schema_migrations` table, idempotent
- **Dependency injection** — Services and repositories instantiated in `server.ts`, passed to controllers and routes
- **Background workers** — Polling-based, start/stop coordinated with server lifecycle

## Layers

**HTTP Layer (Controllers & Routes):**
- Purpose: Parse HTTP requests, call validators, invoke services, format responses
- Location: `src/routes/`, `src/controllers/`
- Contains: Express router setup, request/response handling, status code mapping
- Depends on: Validators, Services, Error types
- Used by: Express app (`app.ts`)

**Service Layer (Business Logic):**
- Purpose: Core domain logic — user registration, OTP generation/verification, session management, password recovery, account deletion
- Location: `src/services/`
- Contains: Stateless business operations, validation delegation, repository coordination
- Depends on: Repositories, Validators, Config, External adapters, Domain types
- Used by: Controllers

**Validator Layer (Input Rules):**
- Purpose: Encapsulate validation rules — field presence, format (email, password policy), uniqueness checks
- Location: `src/validators/`
- Contains: Validation logic organized by domain (RegistrationValidator, EmailValidator, PasswordPolicyEvaluator, etc.)
- Depends on: Config, Types, custom error types
- Used by: Controllers, Services

**Repository Layer (Data Access):**
- Purpose: Abstract SQLite access behind a repository interface — CRUD operations on users, sessions, OTP requests, tokens, deletion requests
- Location: `src/repositories/`
- Contains: Prepared statements, row mapping, transaction helpers
- Depends on: Database connection, Types, Transaction helpers
- Used by: Services

**Database Layer:**
- Purpose: SQLite connection management, schema migrations, transaction coordination
- Location: `src/db/`
- Contains: Connection factory, migration runner, transaction wrapper
- Depends on: `better-sqlite3`, SQL migration files
- Used by: Repositories, `server.ts`

**Adapter/Integration Layer:**
- Purpose: External service integrations — SendGrid email, OTP via Redis
- Location: `src/adapters/`, `src/integration/`
- Contains: Port interfaces (abstract contracts), concrete implementations
- Depends on: `@sendgrid/mail`, `ioredis`, external API clients
- Used by: Services, Workers

**Middleware Layer:**
- Purpose: Cross-cutting HTTP concerns — session validation, admin auth, error handling
- Location: `src/middleware/`
- Contains: Express middleware functions, session validation logic
- Depends on: SessionService, Types
- Used by: `app.ts` at app or router level

**Worker Layer (Background Jobs):**
- Purpose: Async processing — email outbox (F-01), deletion notification queue (F-04)
- Location: `src/workers/`
- Contains: Polling timers (30s interval), repository access, adapter calls
- Depends on: Repositories, Adapters
- Used by: `server.ts` startup/shutdown

**Configuration Layer:**
- Purpose: Environment variable loading, validation, immutable config objects
- Location: `src/config/`
- Contains: `app.config`, `otp.config`, `password-policy.config`, etc.
- Depends on: `dotenv`, TypeScript for type safety
- Used by: `server.ts`, Services, Validators

## Data Flow

### Primary Request Path: User Registration (F-01)

1. **HTTP Entry** — POST `/api/v1/users/register` hits `RegistrationController.registerUser()` (`src/controllers/registration.controller.ts`)
2. **Validation Pipeline** (5 stages, all errors collected before returning):
   - Mandatory fields check (presence, email format, password confirmation match)
   - Email format validation (regex)
   - Password policy evaluation (complexity rules from `password-policy.config.ts`)
   - Username uniqueness check (DB query via `UsernameUniquenessValidator`)
3. **Service** — `RegistrationService.register()` (`src/services/registration.service.ts`):
   - Hash plaintext password with bcrypt (cost factor ≥12)
   - Normalize username (lowercase, trim)
   - Insert user row to SQLite (UUID, username, email, passwordHash, status='pending')
   - Return `UserCreatedResult { userId, message }`
4. **OTP Dispatch** — `OtpService.sendOtp(userId)` (`src/services/otp.service.ts`):
   - Generate OTP code (6 digits)
   - Store OTP request in `otp_requests` table (Redis key for rate-limit, expires 10m)
   - Create email record in `registration_email_records` (dispatch queue)
   - OutboxWorker picks this up asynchronously (30s polling interval)
5. **Response** — 201 Created with `{ userId, message }`

### Secondary Flow: OTP Verification (F-01)

1. **HTTP** — POST `/api/v1/otp/verify` hits `OtpController.verifyOtp()` with `{ userId, code }`
2. **Service** — `OtpService.verifyOtp()`:
   - Look up OTP request from `otp_requests` table
   - Check expiry (10m window)
   - Validate code matches
   - Mark as consumed
3. **Activation** — `ActivationService.activate()` (`src/services/activation.service.ts`):
   - Update user status from 'pending' → 'active'
   - Set `activated_at` timestamp
4. **Response** — 200 OK

### Authentication Flow: User Login (F-03)

1. **HTTP** — POST `/api/v1/auth/login` hits `AuthController.login()` with `{ username, password }`
2. **Credential Validation** — `AuthService.authenticate()` (`src/services/auth.service.ts`):
   - Look up user by username (case-insensitive via `username_normalised`)
   - Compare plaintext password against bcrypt hash
   - Check user status (must be 'active', not 'suspended' or 'deleted')
   - Check account lockout (after 3 failed attempts, lock for 15 minutes)
3. **Session Creation** — `SessionService.createSession()` (`src/services/session.service.ts`):
   - Generate session token (secure random)
   - Persist to `sessions` table with expiry (24h by default)
   - Return token
4. **Response** — 200 OK with `{ token }`
5. **Subsequent Requests** — `SessionValidationMiddleware` (`src/middleware/session-validation.middleware.ts`):
   - Extract Bearer token from `Authorization` header
   - Validate token exists in `sessions` table, not expired, not invalidated
   - Populate `req.userId` for use by route handlers
   - On failure, return 401 (Unauthorized)

### Password Recovery Flow (F-03)

1. **HTTP** — POST `/api/v1/auth/password-recovery` with `{ emailAddress }` (no auth required)
2. **Service** — `PasswordRecoveryService.initiateRecovery()` (`src/services/password-recovery.service.ts`):
   - Look up user by email
   - If not found, silently succeed (prevent email enumeration)
   - Generate recovery token (128-char base64url, 24h expiry)
   - Store in `password_recovery_requests` table
   - Create email record with recovery link
3. **User Clicks Link** — POST `/api/v1/auth/password-reset` with `{ recoveryToken, newPassword }`
4. **Service** — `PasswordRecoveryService.resetPassword()`:
   - Validate token (exists, not expired)
   - Hash new password
   - Update user's `password_hash`
   - Invalidate all existing sessions (user must log in with new password)
   - Delete the recovery token (one-time use)
5. **Response** — 200 OK

### Account Deletion Flow (F-04)

1. **HTTP (authenticated)** — POST `/api/v1/users/{userId}/deletion-request` hits `DeletionController.requestDeletion()`
   - SessionValidationMiddleware verifies Bearer token first
2. **Service** — `AccountDeletionService.requestDeletion()` (`src/services/account-deletion.service.ts`):
   - Check if deletion already pending (prevent duplicates)
   - Generate deletion OTP (6 digits, 10m expiry, stored in Redis)
   - Create deletion request record (status='pending_confirmation')
   - Create email record for OTP notification
3. **User Confirms** — POST `/api/v1/users/{userId}/deletion-request/confirm` with `{ otpCode }`
4. **Service** — `AccountDeletionService.confirmDeletion()`:
   - Validate deletion OTP from Redis
   - Update deletion request (status='confirmed')
   - Update user record (status='deleted', set `deleted_at` timestamp)
   - Invalidate all user sessions
   - AccountDeletionNotificationWorker picks up async confirmation email
5. **Response** — 200 OK

### Worker: Outbox Email Queue (30s polling)

**OutboxWorker** (`src/workers/outbox.worker.ts`):
1. Every 30 seconds, query `registration_email_records` where `delivery_status='queued'`
2. For each record:
   - Call `EmailDeliveryPort.sendTransactional()` (SendGrid adapter)
   - On success: update `delivery_status='sent'`
   - On failure: increment `retry_count`, re-queue if < max retries, else mark 'failed'
3. Idempotent design — if a record was already sent, SendGrid returns success via message ID tracking

**AccountDeletionNotificationWorker** (`src/workers/account-deletion-notification.worker.ts`):
1. Every 30 seconds, query `account_deletion_notification_records` where `delivery_status='queued'`
2. Same send-and-mark pattern as outbox

**State Management:**
- Email records persists in SQLite (transactional outbox pattern)
- OTP requests stored in both Redis (rate-limiting) and SQLite (audit/verification)
- Session tokens stored in SQLite with expiry timestamps (not Redis, to survive server restart)

## Key Abstractions

**OtpDeliveryPort:**
- Purpose: Abstract OTP delivery mechanism (email vs. SMS, SendGrid vs. Twilio)
- Examples: `src/adapters/otp-delivery.port.ts`, `EmailOtpDeliveryAdapter`, `src/adapters/email-otp-delivery.adapter.ts`
- Pattern: Interface + adapter implementation, injected into services

**EmailDeliveryPort:**
- Purpose: Abstract email sending (SendGrid, AWS SES, etc.)
- Examples: `src/adapters/email-delivery.port.ts`, `SendGridEmailAdapter`, `src/adapters/sendgrid-email.adapter.ts`
- Pattern: Port interface defines contract, adapter wraps external SDK

**RegistrationService Interface:**
- Purpose: Contract for user registration business logic
- Examples: `DefaultRegistrationService` implementation
- Pattern: Dependency inversion — controllers depend on interface, not concrete class

**ValidationError Hierarchy:**
- Purpose: Domain-specific exceptions caught at app error handler
- Examples: `ValidationError`, `UsernameConflictError`, `TokenNotFoundException`, `AccountNotPendingException` (F-01)
- Pattern: Custom error classes with meaningful error codes (400, 409, 404, 410, etc.)

## Entry Points

**Backend:**

- **`src/server.ts`** — Application bootstrap
  - Triggers: `npm start` / Node process launch
  - Responsibilities:
    - Load `.env` via `dotenv`
    - Initialize SQLite database, run migrations
    - Initialize Redis client for OTP rate-limiting
    - Build dependency tree (repositories, services, adapters)
    - Create Express app (`createApp()`)
    - Start background workers (OutboxWorker, AccountDeletionNotificationWorker)
    - Listen on `PORT` (default 3000)
    - Handle graceful shutdown on SIGINT/SIGTERM

- **`src/app.ts`** — Express application factory
  - Triggers: Called by `server.ts`
  - Responsibilities:
    - Mount all routers (`registration.routes`, `activation.routes`, `auth.routes`, etc.)
    - Register CORS middleware
    - Register JSON parsing middleware
    - Register global error handler (catches all thrown exceptions, translates to HTTP responses)
    - Serve Swagger UI from `/api-docs`

**Frontend:**

- **`src/main.tsx`** — React application bootstrap
  - Triggers: Browser loads HTML, Vite bundler executes
  - Responsibilities:
    - Import `App.tsx` and styles
    - Call `ReactDOM.createRoot()` and render

- **`src/app/App.tsx`** — App routing root
  - Triggers: React mounts
  - Responsibilities:
    - Render `RouterProvider` from react-router
    - Compose all routes (landing, register, verify-otp, login, protected dashboard routes)

- **`src/app/routes.ts`** — Route definitions
  - Purpose: Centralized route registration
  - Routes:
    - `/` → `LandingTemplate` (unauthenticated)
    - `/register` → `RegistrationTemplate`
    - `/verify-otp` → `OtpVerificationTemplate`
    - `/login` → `LoginTemplate`
    - `/dashboard`, `/account-dashboard`, `/delete-account` → Protected (require `RequireAuth`)

- **`src/app/components/RequireAuth.tsx`** — Authentication guard
  - Purpose: Protect routes that require valid session
  - Logic: Check localStorage for auth token, redirect to `/login` if missing, otherwise render protected children

## Architectural Constraints

- **Synchronous HTTP, Async Email** — All HTTP endpoints return immediately; email is delivered asynchronously via workers (eventual consistency)
- **Single SQLite Database** — No sharding or clustering; SQLite's WAL mode allows concurrent reads + writes
- **Redis Dependency** — OTP rate-limiting is Redis-based (no in-process memory store); app will fail OTP requests if Redis is down
- **Global State** — Express app instance created once in `server.ts`, passed to all routers (no circular imports by design)
- **No WebSockets** — All frontend-backend communication is request-response HTTP/REST, no real-time updates
- **Bearer Token Auth** — Tokens are opaque strings stored in SQLite, validated on each request (no JWT parsing on backend)
- **No Transaction Deadlocks** — SQLite in WAL mode doesn't support true ACID transactions across multiple statements; `withTransaction()` helper manages single-statement atomicity
- **Frontend as SPA** — React Router client-side navigation; backend doesn't serve HTML (frontend is Vite-built SPA at `FRONTEND/dist/`)

## Anti-Patterns

### Plaintext Passwords in Logs

**What happens:** If a developer logs `req.body` or error messages during registration, plaintext passwords could leak to logs.
**Why it's wrong:** Password is sensitive credential; plaintext must never be logged, persisted, or returned.
**Do this instead:** 
- Only hash plaintext via bcrypt immediately in `RegistrationService.register()` (line 57 of `src/services/registration.service.ts`)
- Never assign `req.body.password` to a DTO that later gets logged
- Controllers strip plaintext before passing to services

### Missing Email Validation Before Dispatch

**What happens:** If OTP service doesn't validate email format before creating a row in `registration_email_records`, OutboxWorker will try to send to malformed addresses, failing silently.
**Why it's wrong:** Invalid email goes to the queue, wastes worker cycles, delays valid emails, no user feedback.
**Do this instead:**
- `EmailValidator.validateFormat()` runs in RegistrationController stage 2 (line 59 of `src/controllers/registration.controller.ts`)
- All email fields rejected at controller boundary before service layer

### Hardcoded External Service Credentials

**What happens:** SendGrid API key or Redis URL hardcoded in source code gets committed to git.
**Why it's wrong:** Credentials leak to version control, anyone with repo access can impersonate the service, no environment-specific deployment.
**Do this instead:**
- Load all secrets from `.env` file via `dotenv` (never committed)
- Config files (`src/config/`) read from `process.env`, throw if missing
- CI/CD injects secrets at deploy time

### Missing CORS Configuration

**What happens:** Frontend on `localhost:5173` can't call backend on `localhost:3000` because of browser Same-Origin Policy.
**Why it's wrong:** Frontend users get CORS errors, feature is broken in frontend environment.
**Do this instead:**
- `app.ts` line 178 sets `cors({ origin: process.env.FRONTEND_ORIGIN?.trim() || true })`
- During development, allow any origin (`true`) or set `FRONTEND_ORIGIN=http://localhost:5173` in `.env`
- In production, lock to exact deployment URL

### Blocking Password Comparison

**What happens:** `bcrypt.compare()` is CPU-intensive; if called on request thread, it blocks other requests.
**Why it's wrong:** Login endpoint hangs while hashing (bcrypt is intentionally slow), reduces throughput.
**Do this instead:**
- All password operations are `async` (use `await bcrypt.compare()`)
- Node.js event loop handles blocking via worker threads internally
- Controllers use `async registerUser()`, services use `async register()`

### Missing Database Constraint Validation

**What happens:** Repository inserts `(username, email)` without checking uniqueness; two concurrent registrations both pass validation, both fail at DB with generic SQLite error.
**Why it's wrong:** Errors are not user-friendly, validation and persistence don't align.
**Do this instead:**
- `UsernameUniquenessValidator.checkUniqueness()` runs DB lookup **before** insert in controller (stage 4)
- Unique constraints on `users.username_normalised` and `users.email` in schema (`db/migrations/001_create_users.sql`) catch race conditions
- If constraint violation occurs, it's caught and re-thrown as `UsernameConflictError` by repository

## Error Handling

**Strategy:** Domain-driven errors at service layer, caught and translated to HTTP status codes at controller or global error handler.

**Patterns:**
- Services throw domain-specific custom errors (e.g., `UsernameConflictError` in `registration.service.ts` line 81)
- Controllers catch known errors and map to HTTP status codes (e.g., 409 Conflict for username conflict)
- Unknown errors propagate to global error handler in `app.ts` (line 47–164), which catches by type and returns appropriate status
- All validation errors use 422 Unprocessable Entity
- Authentication errors use 401 Unauthorized
- Authorization errors use 403 Forbidden
- Rate limits use 429 Too Many Requests (via rate-limit guard in middleware)

## Cross-Cutting Concerns

**Logging:** 
- Console-based (no structured logging library)
- Errors logged at service/worker level with context
- No sensitive data (passwords, tokens) logged

**Validation:**
- Validators are separate classes in `src/validators/`, invoked in specific order by controllers
- Multi-stage validation in registration (5 stages, all errors collected)
- Password policy config loaded from environment variables

**Authentication:**
- Bearer token validation via `SessionValidationMiddleware`
- Session lookup in SQLite, expiry checked on each request
- Admin routes require `X-Admin-Key` header (checked by `AdminAuthMiddleware`)

---

*Architecture analysis: 2026-07-10*
