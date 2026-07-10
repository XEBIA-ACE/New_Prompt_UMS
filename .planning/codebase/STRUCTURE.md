# Codebase Structure

**Analysis Date:** 2026-07-10

## Directory Layout

```
New_Prompt_UMS/
├── BACKEND/                          # Express.js User Management Service API
│   ├── src/
│   │   ├── app.ts                    # Express app factory (routers, error handler)
│   │   ├── server.ts                 # Bootstrap (DB, Redis, workers, startup)
│   │   ├── adapters/                 # External service ports + implementations
│   │   │   ├── email-delivery.port.ts           # Abstract email sending interface
│   │   │   ├── otp-delivery.port.ts             # Abstract OTP delivery interface
│   │   │   ├── sendgrid-email.adapter.ts        # SendGrid implementation
│   │   │   ├── email-otp-delivery.adapter.ts    # Email-based OTP adapter
│   │   │   └── *.test.ts
│   │   ├── config/                   # Environment variable loading & app config
│   │   │   ├── app.config.ts
│   │   │   ├── otp.config.ts
│   │   │   ├── password-policy.config.ts
│   │   │   ├── session.config.ts
│   │   │   ├── email.config.ts
│   │   │   └── ...
│   │   ├── controllers/              # HTTP request handlers (13 files)
│   │   │   ├── registration.controller.ts       # POST /register
│   │   │   ├── activation.controller.ts         # POST /activate
│   │   │   ├── auth.controller.ts               # POST /login, /logout
│   │   │   ├── password.controller.ts           # POST /password-recovery, /password-reset
│   │   │   ├── otp.controller.ts                # POST /verify, /resend
│   │   │   ├── deletion.controller.ts           # POST /deletion-request, /confirm, /cancel
│   │   │   ├── user-profile.controller.ts       # GET /me (user's own profile)
│   │   │   ├── admin.controller.ts              # GET /users (admin listing)
│   │   │   ├── health.controller.ts             # GET /health
│   │   │   └── *.test.ts
│   │   ├── db/                       # Database connection & migrations
│   │   │   ├── connection.ts         # SQLite setup (WAL mode, foreign keys)
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   └── with-transaction.ts   # Transaction wrapper
│   │   ├── errors/                   # Domain-specific exception types
│   │   │   ├── registration.errors.ts   # UsernameConflictError, ValidationError, etc.
│   │   │   ├── login.errors.ts          # InvalidCredentialsException, AccountLockedException, etc.
│   │   │   └── account-deletion.errors.ts
│   │   ├── integration/              # External service client wrappers
│   │   │   └── sendgrid.integration.ts
│   │   ├── middleware/               # Express middleware (2 files)
│   │   │   ├── session-validation.middleware.ts # Bearer token auth guard
│   │   │   └── admin-auth.middleware.ts         # X-Admin-Key header check
│   │   ├── repositories/             # Data access layer (8 files)
│   │   │   ├── user.repository.ts               # users table CRUD
│   │   │   ├── session.repository.ts            # sessions table CRUD
│   │   │   ├── email-record.repository.ts       # registration_email_records queue
│   │   │   ├── otp-request.repository.ts        # otp_requests table CRUD
│   │   │   ├── token.repository.ts              # activation_tokens table CRUD
│   │   │   ├── deletion-request.repository.ts   # account_deletion_requests table CRUD
│   │   │   ├── deletion-notification-record.repository.ts # async deletion email queue
│   │   │   ├── password-recovery-request.repository.ts # password recovery tokens
│   │   │   └── *.test.ts
│   │   ├── routes/                   # Express router composition (9 files)
│   │   │   ├── registration.routes.ts # POST /users/register, GET /users (admin)
│   │   │   ├── activation.routes.ts   # POST /users/activate
│   │   │   ├── auth.routes.ts         # POST /auth/login, /logout
│   │   │   ├── password.routes.ts     # POST /auth/password-recovery, /password-reset
│   │   │   ├── otp.routes.ts          # POST /otp/verify, /resend
│   │   │   ├── deletion.routes.ts     # POST /users/{id}/deletion-request, /confirm, /cancel
│   │   │   ├── user-profile.routes.ts # GET /users/me
│   │   │   ├── admin.routes.ts        # Admin endpoints
│   │   │   └── health.routes.ts       # GET /health
│   │   ├── services/                 # Business logic (9 services + tests)
│   │   │   ├── registration.service.ts          # User registration (hash password, insert)
│   │   │   ├── activation.service.ts            # Account activation (update status)
│   │   │   ├── auth.service.ts                  # Login credential validation
│   │   │   ├── otp.service.ts                   # OTP generation, verification, dispatch
│   │   │   ├── session.service.ts               # Session create, validate, invalidate
│   │   │   ├── password-recovery.service.ts     # Password reset flow
│   │   │   ├── account-deletion.service.ts      # Deletion request & confirmation
│   │   │   ├── email-dispatch.service.ts        # Email sending coordination
│   │   │   ├── user-profile.service.ts          # User profile retrieval
│   │   │   ├── login-guard.ts                   # Lockout logic (3 failed attempts)
│   │   │   ├── rate-limit.guard.ts              # Redis-backed rate limiting
│   │   │   ├── password-hasher.ts               # bcrypt wrapper
│   │   │   └── *.test.ts, *.property.test.ts
│   │   ├── types/                    # TypeScript interfaces & DTOs
│   │   │   ├── registration.types.ts  # RegistrationRequestDto, UserEntity, etc.
│   │   │   ├── login.types.ts         # LoginRequest, SessionToken, etc.
│   │   │   ├── otp.types.ts           # OtpRequest, VerifyOtpRequest, etc.
│   │   │   ├── account-deletion.types.ts # DeletionRequest, DeletionEntity, etc.
│   │   │   └── user-profile.types.ts  # ProfileResponse
│   │   ├── validators/               # Input validation rules (5 files)
│   │   │   ├── registration.validator.ts         # Mandatory fields (presence, format)
│   │   │   ├── email.validator.ts                # Email format regex
│   │   │   ├── password-policy.evaluator.ts      # Complexity rules
│   │   │   ├── username-uniqueness.validator.ts  # DB lookup
│   │   │   └── *.test.ts
│   │   └── workers/                  # Background async processing (2 files)
│   │       ├── outbox.worker.ts          # Email queue poller (30s interval)
│   │       └── account-deletion-notification.worker.ts # Deletion email queue
│   ├── db/
│   │   └── migrations/               # SQL schema migrations
│   │       ├── 001_create_users.sql
│   │       ├── 002_create_activation_tokens.sql
│   │       ├── 003_create_registration_email_records.sql
│   │       ├── 004_create_otp_requests.sql
│   │       ├── 005_create_sessions.sql
│   │       ├── 006_create_password_recovery_requests.sql
│   │       ├── 007_create_account_deletion_requests.sql
│   │       ├── 008_create_account_deletion_notification_records.sql
│   │       └── run-migrations.ts
│   ├── tests/                        # Integration & E2E tests
│   │   └── api.http                  # Manual API requests (ready-to-run)
│   ├── data/                         # SQLite database file (auto-created)
│   │   └── app.db
│   ├── dist/                         # Compiled JavaScript (from tsc)
│   ├── package.json                  # Dependencies, npm scripts
│   ├── tsconfig.json                 # TypeScript compiler config
│   ├── jest.config.ts                # Jest test config
│   ├── .eslintrc.json                # ESLint rules
│   └── .env.example                  # Environment variable template
│
├── FRONTEND/                         # Vite/React UI Application
│   ├── src/
│   │   ├── main.tsx                  # React app bootstrap (entry point)
│   │   ├── app/
│   │   │   ├── App.tsx               # RouterProvider root
│   │   │   ├── routes.ts             # Route definitions (7 routes)
│   │   │   ├── lib/
│   │   │   │   └── api-client.ts     # Fetch-based HTTP client (typed API results)
│   │   │   ├── types/                # Frontend TypeScript interfaces
│   │   │   │   ├── registration.types.ts
│   │   │   │   ├── login.types.ts
│   │   │   │   ├── otp.types.ts
│   │   │   │   ├── deletion.types.ts
│   │   │   │   ├── profile.types.ts
│   │   │   │   └── *.ts
│   │   │   ├── components/
│   │   │   │   ├── RequireAuth.tsx            # Protected route wrapper
│   │   │   │   ├── atoms/                     # Base UI components
│   │   │   │   │   └── *.tsx
│   │   │   │   ├── molecules/                 # Composed components
│   │   │   │   │   ├── FormField.tsx
│   │   │   │   │   ├── PasswordInput.tsx
│   │   │   │   │   ├── OtpInputGroup.tsx
│   │   │   │   │   ├── PasswordStrengthBar.tsx
│   │   │   │   │   ├── CountdownResend.tsx
│   │   │   │   │   ├── MobileMenu.tsx
│   │   │   │   │   ├── WarningBanner.tsx
│   │   │   │   │   ├── FeatureCard.tsx
│   │   │   │   │   └── StatWidget.tsx
│   │   │   │   ├── organisms/                 # Full-featured components
│   │   │   │   │   └── *.tsx
│   │   │   │   ├── templates/                 # Page-level components (7 files)
│   │   │   │   │   ├── LandingTemplate.tsx            # Landing page
│   │   │   │   │   ├── RegistrationTemplate.tsx       # /register
│   │   │   │   │   ├── OtpVerificationTemplate.tsx    # /verify-otp
│   │   │   │   │   ├── LoginTemplate.tsx              # /login
│   │   │   │   │   ├── DashboardTemplate.tsx          # /dashboard (protected)
│   │   │   │   │   ├── AccountDashboardTemplate.tsx   # /account-dashboard (protected)
│   │   │   │   │   └── AccountDeletionTemplate.tsx    # /delete-account (protected)
│   │   │   │   ├── ui/                       # shadcn/ui + Radix UI primitives
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── label.tsx
│   │   │   │   │   ├── input-otp.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── alert-dialog.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── sheet.tsx
│   │   │   │   │   ├── accordion.tsx
│   │   │   │   │   └── ... (30+ UI primitives from Radix)
│   │   │   │   └── figma/                    # Figma-sourced components
│   │   ├── imports/
│   │   │   └── pasted_text/           # Generated/imported content
│   │   └── styles/
│   │       └── index.css               # Tailwind CSS + custom styles
│   ├── dist/                           # Built SPA (from vite build)
│   ├── .vite/                          # Vite internal cache
│   ├── guidelines/                     # Design/code guidelines
│   ├── package.json                    # Dependencies (React, React Router, MUI, Radix)
│   ├── tsconfig.json                   # TypeScript config
│   ├── vite.config.ts                  # Vite bundler config
│   ├── tailwind.config.ts              # Tailwind CSS config
│   └── .env.example                    # Environment variable template
│
├── DOCS/                               # Project documentation
│   ├── README.md                       # Project overview
│   ├── API_REFERENCE.md                # REST API endpoint documentation
│   ├── FRONTEND_INTEGRATION_GUIDE.md   # Frontend developer guide
│   ├── openapi.yaml                    # OpenAPI 3.0 spec (Swagger)
│   ├── postman/
│   │   └── UMS.postman_collection.json # Postman request collection
│   └── ...
│
├── docker-compose.yml                  # Local dev services (Redis)
├── README.md                            # Root README
└── .planning/                           # GSD planning directory
    └── codebase/                        # Codebase analysis documents
        ├── ARCHITECTURE.md              # System design & layers
        └── STRUCTURE.md                 # This file
```

## Directory Purposes

**BACKEND/src/:**
- Purpose: Express.js API source code
- Contains: Controllers, services, repositories, database access, middleware, error handling
- Key files: `server.ts` (entry point), `app.ts` (router setup)

**BACKEND/src/adapters/:**
- Purpose: Ports & adapters for external services (SendGrid email, Redis OTP)
- Contains: Port interfaces + concrete implementations
- Key files: `email-delivery.port.ts`, `sendgrid-email.adapter.ts`

**BACKEND/src/config/:**
- Purpose: Environment variable loading and validation
- Contains: Config objects for app, OTP, password policy, session, email, etc.
- Key files: Load from `.env`, throw if missing, immutable at runtime

**BACKEND/src/controllers/:**
- Purpose: HTTP request handlers, route orchestration
- Contains: One controller per feature (registration, auth, deletion, etc.)
- Key files: Each file has one `Controller` class with handler methods

**BACKEND/src/db/:**
- Purpose: Database connection, migrations, transaction helpers
- Contains: SQLite setup, migration runner, transaction wrapper
- Key files: `connection.ts`, `migrate.ts`

**BACKEND/src/errors/:**
- Purpose: Domain-specific exception types
- Contains: Custom Error subclasses for feature-specific errors
- Key files: `registration.errors.ts`, `login.errors.ts`, `account-deletion.errors.ts`

**BACKEND/src/middleware/:**
- Purpose: Cross-cutting HTTP concerns
- Contains: Session validation, admin auth, error handling
- Key files: `session-validation.middleware.ts`, `admin-auth.middleware.ts`

**BACKEND/src/repositories/:**
- Purpose: Data access abstraction
- Contains: SQL query builders, row mappers, CRUD operations
- Key files: One repository per domain entity (user, session, OTP, token, deletion request)

**BACKEND/src/routes/:**
- Purpose: Express router composition
- Contains: Router factory functions that compose controllers with middleware
- Key files: One router per feature (`registration.routes.ts`, `auth.routes.ts`, etc.)

**BACKEND/src/services/:**
- Purpose: Domain business logic
- Contains: Registration, OTP, auth, password recovery, deletion, profiling
- Key files: One service per feature, implements interface, dependencies injected

**BACKEND/src/types/:**
- Purpose: Shared TypeScript interfaces
- Contains: DTOs (request/response), entities, domain types
- Key files: Organized by feature (registration, login, OTP, deletion, profile)

**BACKEND/src/validators/:**
- Purpose: Input validation rules
- Contains: Field validators, format checkers, uniqueness checks
- Key files: One validator per rule class (registration, email, password policy, username)

**BACKEND/src/workers/:**
- Purpose: Background async processing
- Contains: Polling-based workers for email delivery and deletion notification
- Key files: `outbox.worker.ts` (30s email queue), `account-deletion-notification.worker.ts`

**BACKEND/db/migrations/:**
- Purpose: SQL schema definitions
- Contains: Numbered SQL files for schema versioning
- Key files: `001_create_users.sql` through `008_create_account_deletion_notification_records.sql`

**FRONTEND/src/app/components/:**
- Purpose: React component hierarchy (atomic design)
- Contains: UI primitives (atoms), composed components (molecules), full-page layouts (templates)
- Key files: Templates are entry points for each route

**FRONTEND/src/app/lib/:**
- Purpose: Shared utilities and API client
- Contains: HTTP client factory, fetch wrappers
- Key files: `api-client.ts` (typed API calls)

**FRONTEND/src/app/types/:**
- Purpose: Frontend TypeScript interfaces
- Contains: API request/response types, form data types
- Key files: One file per feature (registration, login, OTP, deletion, profile)

**DOCS/:**
- Purpose: API documentation and guides
- Contains: README, API reference, OpenAPI spec, Postman collection
- Key files: `openapi.yaml` (Swagger), `API_REFERENCE.md`

## Key File Locations

**Entry Points:**
- `BACKEND/src/server.ts` — Backend HTTP server bootstrap (load .env, DB, Redis, start app)
- `BACKEND/src/app.ts` — Express app factory (routers, middleware, error handler)
- `FRONTEND/src/main.tsx` — React app bootstrap (render App component)
- `FRONTEND/src/app/App.tsx` — Router root (route setup)

**Configuration:**
- `BACKEND/.env.example` — Template for backend secrets (copy to `.env`)
- `BACKEND/src/config/app.config.ts` — App config (bcrypt cost, session expiry, etc.)
- `BACKEND/src/config/otp.config.ts` — OTP config (expiry, Redis URL, etc.)
- `BACKEND/src/config/password-policy.config.ts` — Password complexity rules
- `FRONTEND/.env.example` — Template for frontend API base URL

**Core Logic:**
- `BACKEND/src/services/registration.service.ts` — User registration
- `BACKEND/src/services/otp.service.ts` — OTP generation and verification
- `BACKEND/src/services/auth.service.ts` — Login credential validation
- `BACKEND/src/services/session.service.ts` — Session management
- `BACKEND/src/services/password-recovery.service.ts` — Password reset
- `BACKEND/src/services/account-deletion.service.ts` — Account deletion flow

**Database:**
- `BACKEND/db/migrations/001_create_users.sql` — Users table schema
- `BACKEND/db/migrations/004_create_otp_requests.sql` — OTP requests table
- `BACKEND/db/migrations/005_create_sessions.sql` — Session table

**Testing:**
- `BACKEND/tests/api.http` — Manual API requests (VS Code REST Client format)
- `BACKEND/src/services/*.test.ts` — Unit tests for services
- `BACKEND/src/services/*.property.test.ts` — Property-based tests (fast-check)
- `BACKEND/src/controllers/*.test.ts` — Controller integration tests
- `DOCS/postman/UMS.postman_collection.json` — Postman API requests

**API Documentation:**
- `DOCS/openapi.yaml` — Swagger/OpenAPI 3.0 specification
- `DOCS/API_REFERENCE.md` — Human-readable endpoint guide
- `DOCS/FRONTEND_INTEGRATION_GUIDE.md` — Integration setup for frontend developers

## Naming Conventions

**Files:**
- Controllers: `[feature].controller.ts` (e.g., `registration.controller.ts`, `auth.controller.ts`)
- Services: `[feature].service.ts` (e.g., `registration.service.ts`, `otp.service.ts`)
- Repositories: `[entity].repository.ts` (e.g., `user.repository.ts`, `session.repository.ts`)
- Routes: `[feature].routes.ts` (e.g., `registration.routes.ts`, `auth.routes.ts`)
- Validators: `[rule].validator.ts` or `[rule].evaluator.ts` (e.g., `email.validator.ts`, `password-policy.evaluator.ts`)
- Tests: `[file].test.ts` (unit), `[file].property.test.ts` (property-based)
- Adapters: `[service].adapter.ts` (e.g., `sendgrid-email.adapter.ts`, `email-otp-delivery.adapter.ts`)
- Migrations: `[order]_[description].sql` (e.g., `001_create_users.sql`, `004_create_otp_requests.sql`)
- React Components: PascalCase `.tsx` (e.g., `RegistrationTemplate.tsx`, `FormField.tsx`)

**Directories:**
- Lowercase, plural for collections (e.g., `controllers/`, `services/`, `repositories/`)
- Feature-specific prefixes discouraged (organization by type, not feature, at file level)
- Top-level grouping by layer: `adapters`, `config`, `controllers`, `db`, `errors`, `middleware`, `repositories`, `routes`, `services`, `types`, `validators`, `workers`

**Classes & Interfaces:**
- Service interfaces: `[Feature]Service` (e.g., `RegistrationService`)
- Service implementations: `Default[Feature]Service` (e.g., `DefaultRegistrationService`)
- Error classes: `[ErrorName]Exception` or `[ErrorName]Error` (e.g., `UsernameConflictError`, `SessionExpiredException`)
- Repository classes: `[Entity]Repository` (e.g., `UserRepository`, `SessionRepository`)

**Functions:**
- Middleware factories: `create[Name]Middleware` (e.g., `createSessionValidationMiddleware`)
- Router factories: `create[Feature]Router` (e.g., `createRegistrationRouter`)
- Service factories: Constructor-based, no factory function pattern in this codebase

## Where to Add New Code

**New Feature (e.g., audit logging, two-factor auth):**
1. Create new controller: `src/controllers/[feature].controller.ts`
2. Create service(s): `src/services/[feature].service.ts`
3. Create route: `src/routes/[feature].routes.ts`
4. Create types: `src/types/[feature].types.ts`
5. Create validators if needed: `src/validators/[feature].validator.ts`
6. Add database migrations if needed: `db/migrations/[next_number]_[description].sql`
7. Register route in `app.ts` (line 181+, add `app.use('/api/v1/[feature]', create[Feature]Router(...))`
8. Add tests: `src/controllers/[feature].controller.test.ts`, `src/services/[feature].service.test.ts`

**New Component (React):**
1. **Atomic level** — Single, reusable UI element:
   - Location: `FRONTEND/src/app/components/atoms/`
   - Example: Button, Input, Badge
2. **Molecular level** — Composed of atoms, represents a UI pattern:
   - Location: `FRONTEND/src/app/components/molecules/`
   - Example: `FormField.tsx` (Label + Input), `PasswordInput.tsx` (Input + visibility toggle)
3. **Organismic level** — Complex interactions, but not a full page:
   - Location: `FRONTEND/src/app/components/organisms/`
   - Example: Form section, header, sidebar
4. **Template level** — Full page/route:
   - Location: `FRONTEND/src/app/components/templates/`
   - Example: `RegistrationTemplate.tsx`, `DashboardTemplate.tsx`
   - Register in `FRONTEND/src/app/routes.ts` (add route definition)

**New Database Table:**
1. Create migration: `BACKEND/db/migrations/[next_number]_[description].sql`
2. Create repository: `BACKEND/src/repositories/[entity].repository.ts`
3. Create types: Add entity interface to `BACKEND/src/types/[feature].types.ts`
4. Migrations run automatically on server startup via `runMigrations()` in `server.ts`

**New Service Integration (e.g., Twilio SMS, AWS Lambda):**
1. Create port interface: `src/adapters/[service]-[feature].port.ts` (defines contract)
2. Create adapter implementation: `src/adapters/[service]-[feature].adapter.ts` (wraps SDK)
3. Create integration wrapper if needed: `src/integration/[service].integration.ts`
4. Inject in `server.ts` (instantiate and pass to services)
5. Add config in `src/config/` if external secrets needed

**Tests:**
- Unit tests for services: `src/services/[feature].service.test.ts` (mock repositories)
- Property-based tests: `src/services/[feature].service.property.test.ts` (use fast-check)
- Integration tests for controllers: `src/controllers/[feature].controller.test.ts` (real DB, mocked adapters)
- Middleware tests: `src/middleware/[feature].middleware.test.ts`

## Special Directories

**BACKEND/data/:**
- Purpose: SQLite database file storage
- Generated: Yes (auto-created by `createDb()` in `src/db/connection.ts`)
- Committed: No (in `.gitignore`)
- Contents: `app.db` (or custom path via `DATABASE_PATH` env var)

**BACKEND/dist/:**
- Purpose: Compiled JavaScript output from TypeScript
- Generated: Yes (`npm run build` → `tsc`)
- Committed: No (in `.gitignore`)
- Executed by: `npm start` → `node dist/server.js`

**FRONTEND/dist/:**
- Purpose: Built production SPA bundle
- Generated: Yes (`npm run build` → Vite)
- Committed: No (in `.gitignore`)
- Served by: Production web server (nginx, CDN, etc.)

**BACKEND/db/migrations/:**
- Purpose: Versioned SQL schema definitions
- Generated: No (hand-written SQL)
- Committed: Yes (source control)
- Execution: Automatic via `runMigrations()` in `server.ts` at startup
- Tracking: `schema_migrations` table records applied migration filenames

**DOCS/:**
- Purpose: API documentation, guides, specifications
- Generated: OpenAPI spec is generated from route code, other files hand-written
- Committed: Yes
- Key files: `openapi.yaml` (Swagger), `API_REFERENCE.md`, `FRONTEND_INTEGRATION_GUIDE.md`

**FRONTEND/.vite/:**
- Purpose: Vite internal dependency cache
- Generated: Yes (Vite build system)
- Committed: No (in `.gitignore`)
- Managed by: Vite bundler automatically

---

*Structure analysis: 2026-07-10*
